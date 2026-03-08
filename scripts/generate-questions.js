#!/usr/bin/env node

import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get command line arguments
const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const flag = arg.slice(2);
    if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
      flags[flag] = args[i + 1];
      i++;
    } else {
      flags[flag] = true;
    }
  }
}

// Validate required arguments
const requiredArgs = ['level', 'topic', 'subtopic', 'difficulty', 'count'];
for (const arg of requiredArgs) {
  if (!flags[arg]) {
    console.error(`❌ Missing required argument: --${arg}`);
    console.error('Usage: node scripts/generate-questions.js --level gcse-maths --topic algebra --subtopic "Simultaneous Equations" --difficulty 2 --count 10');
    process.exit(1);
  }
}

const { level, topic, subtopic, difficulty, count } = flags;

// Check API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not found in .env file');
  console.error('Please add your API key to .env file');
  process.exit(1);
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Generate ID prefix based on level and topic
const getPrefix = (level, topic) => {
  const prefixes = {
    'gcse-maths': {
      'number': 'gcse-num',
      'algebra': 'gcse-alg',
      'geometry': 'gcse-geo',
      'statistics': 'gcse-sta'
    },
    'alevel-maths': {
      'pure': 'alev-pur',
      'statistics': 'alev-sta',
      'mechanics': 'alev-mec'
    },
    'ib-maths': {
      'algebra': 'ib-alg',
      'functions': 'ib-fun',
      'trigonometry': 'ib-tri',
      'calculus': 'ib-cal',
      'statistics': 'ib-sta'
    }
  };
  return prefixes[level]?.[topic] || `${level}-${topic}`;
};

// Example question schema for Claude
const exampleQuestion = {
  "id": "gcse-alg-004",
  "level": "gcse-maths",
  "topic": "algebra",
  "subtopic": "Simultaneous Equations",
  "difficulty": 2,
  "question": "Solve simultaneously:\n2x + y = 7\nx − y = 2",
  "answer": "3, 1",
  "answerLabel": "x = 3, y = 1",
  "acceptedAnswers": ["3,1", "3, 1", "x=3 y=1", "x=3, y=1"],
  "answerParts": [
    { "patterns": ["x=3", "x = 3"] },
    { "patterns": ["y=1", "y = 1"] }
  ],
  "hints": [
    "Add the two equations — what happens to y?",
    "3x = 9, so x = 3",
    "Sub into x − y = 2: y = 1"
  ]
};

// Construct the prompt for Claude
const prompt = `Generate ${count} maths questions for ${level} - ${topic} - ${subtopic} at difficulty ${difficulty} (scale 1-3, where 1=easy, 2=medium, 3=hard).

Requirements:
- Use British English and British currency (£) where relevant
- Follow the exact JSON schema from this example:
${JSON.stringify(exampleQuestion, null, 2)}

For each question:
1. Create unique IDs following pattern: ${getPrefix(level, topic)}-{3-digit-number} (e.g., ${getPrefix(level, topic)}-001, ${getPrefix(level, topic)}-002)
2. Include 3-tier hints:
   - Tier 1: Gentle nudge toward the method/concept
   - Tier 2: First few steps worked out
   - Tier 3: Full worked solution
3. Provide multiple acceptedAnswers for common formatting variations (with/without spaces, symbols, variable names like "x=3" vs "3")
4. For multi-part answers, use answerParts with patterns array
5. Ensure mathematical accuracy and appropriate difficulty for ${level}

Output ONLY a valid JSON array. No markdown fencing, no preamble, no explanations.`;

// Create output directory if it doesn't exist
const outputDir = join(fileURLToPath(import.meta.url), '..', 'scripts', 'output');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

console.log(`🤖 Generating ${count} questions for ${level} - ${topic} - ${subtopic}...`);

async function generateQuestions() {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0].text;
    
    // Parse JSON response
    let questions;
    try {
      questions = JSON.parse(content);
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response as JSON');
      console.error('Raw response:', content);
      process.exit(1);
    }

    // Validate questions
    const validatedQuestions = [];
    let skippedCount = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // Required fields validation
      const requiredFields = ['id', 'level', 'topic', 'subtopic', 'difficulty', 'question', 'answer', 'answerLabel', 'acceptedAnswers', 'hints'];
      const missingFields = requiredFields.filter(field => !q[field]);
      
      if (missingFields.length > 0) {
        console.warn(`⚠️  Question ${i + 1} (${q.id || 'unknown'}) missing fields: ${missingFields.join(', ')} - skipping`);
        skippedCount++;
        continue;
      }
      
      // Hints validation
      if (!Array.isArray(q.hints) || q.hints.length !== 3) {
        console.warn(`⚠️  Question ${i + 1} (${q.id}) must have exactly 3 hints - skipping`);
        skippedCount++;
        continue;
      }
      
      // Difficulty validation
      if (typeof q.difficulty !== 'number' || q.difficulty < 1 || q.difficulty > 3) {
        console.warn(`⚠️  Question ${i + 1} (${q.id}) has invalid difficulty (${q.difficulty}) - skipping`);
        skippedCount++;
        continue;
      }
      
      validatedQuestions.push(q);
    }

    // Generate output filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `generated-${level}-${subtopic.replace(/\s+/g, '-')}-${timestamp}.json`;
    const filepath = join(outputDir, filename);
    
    // Save to file
    writeFileSync(filepath, JSON.stringify(validatedQuestions, null, 2));
    
    // Print summary
    console.log(`\n✅ Generation complete!`);
    console.log(`📊 Summary:`);
    console.log(`   • Total requested: ${count}`);
    console.log(`   • Generated: ${questions.length}`);
    console.log(`   • Validated: ${validatedQuestions.length}`);
    console.log(`   • Skipped: ${skippedCount}`);
    console.log(`📁 Saved to: ${filepath}`);
    console.log(`\n📝 Review these questions, then merge into src/data/questions.json`);
    
    if (skippedCount > 0) {
      console.log(`\n⚠️  Some questions were skipped due to validation errors. Check the warnings above.`);
    }

  } catch (error) {
    console.error('❌ Error calling Anthropic API:', error.message);
    if (error.status === 401) {
      console.error('❌ Invalid API key. Please check your ANTHROPIC_API_KEY');
    } else if (error.status === 429) {
      console.error('❌ Rate limit exceeded. Please try again later.');
    }
    process.exit(1);
  }
}

// Run the generation
generateQuestions();
