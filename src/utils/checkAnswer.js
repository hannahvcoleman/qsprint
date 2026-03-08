import * as math from "mathjs";

export function checkAnswer(userAnswer, question) {
  const clean = (string) => {
    let result = string.toString().toLowerCase().replace(/\s+/g, "").replace(/−/g, "-").replace(/dy\/dx=/g, "").replace(/^y=/, "").replace(/^x=/, "");
    const superscripts = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
    result = result.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (match) => "^" + superscripts[match]).replace(/\^+/g, "^");
    return result;
  };
  
  const userClean = clean(userAnswer);
  const answerClean = clean(question.answer);
  
  if (userClean === answerClean) return true;
  if (question.acceptedAnswers?.some(x => clean(x) === userClean)) return true;
  
  try {
    if (math.simplify(userClean).equals(math.simplify(answerClean))) return true;
  } catch (error) {
    // Ignore math errors
  }
  
  if (question.answerParts) {
    return question.answerParts.every(part => part.patterns.some(pattern => userClean.includes(clean(pattern))));
  }
  
  return false;
}
