import { useState, useEffect, useCallback, useRef } from "react";
import { checkAnswer } from './utils/checkAnswer.js';
import questions from './data/questions.json';
import topicTrees from './data/topics.json';

const SCREENS = { WELCOME: "welcome", SETUP: "setup", READY: "ready", SPRINT: "sprint", FEEDBACK: "feedback", SPRINT_REVIEW: "sprint_review", BREAK: "break", SESSION_SUMMARY: "session_summary" };

// ─── LocalStorage Utility ───
const loadState = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

// ─── Atlantic Tutoring Design Tokens ───
const T = { cream: "#f5f0e8", creamLt: "#faf7f2", blue: "#3430d4", navy: "#1e1b4b", terra: "#c8553d", text: "#3d3552", textLt: "#6b6580", textMut: "#9992a8", bdr: "#d8d0c4", white: "#fffefb", okGreen: "#2d7a4f", okBg: "#edf7f0", okBdr: "#c2e6cc", errRed: "#b91c1c", errBg: "#fef2f2", errBdr: "#fecaca", hintBg: "#fefce8", hintBdr: "#fde68a", hintTxt: "#92400e" };

// ─── Diagrams ───
const dSvg = { width: "100%", maxWidth: 300, height: "auto", margin: "16px auto", display: "block", backgroundColor: T.creamLt, borderRadius: 10, border: `1.5px solid ${T.bdr}`, padding: 10 };
const dLbl = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fill: T.text, fontWeight: 500 };

function DiagramRenderer({ diagram }) { if (!diagram) return null; switch (diagram.type) { case "right-triangle": return <RT {...diagram} />; case "right-triangle-trig": return <RTT {...diagram} />; case "trapezium": return <TZ {...diagram} />; default: return null; } }
function RT({ labelA, labelB, labelC }) { return (<svg viewBox="0 0 280 200" style={dSvg}><polygon points="40,170 240,170 40,40" fill={T.creamLt} stroke={T.blue} strokeWidth="2" strokeLinejoin="round" /><polyline points="40,148 62,148 62,170" fill="none" stroke={T.textMut} strokeWidth="1.5" /><text x="140" y="192" textAnchor="middle" style={dLbl}>{labelB}</text><text x="22" y="110" textAnchor="middle" style={dLbl}>{labelA}</text><text x="152" y="98" textAnchor="middle" style={{ ...dLbl, fill: T.terra, fontWeight: 600 }}>{labelC}</text></svg>); }
function RTT({ labelOpp, labelHyp, labelAngle }) { return (<svg viewBox="0 0 280 210" style={dSvg}><polygon points="40,180 240,180 240,40" fill={T.creamLt} stroke={T.blue} strokeWidth="2" strokeLinejoin="round" /><polyline points="218,180 218,158 240,158" fill="none" stroke={T.textMut} strokeWidth="1.5" /><path d="M 70,180 A 30,30 0 0,0 56,162" fill="none" stroke={T.terra} strokeWidth="2" /><text x="78" y="174" style={{ ...dLbl, fill: T.terra, fontWeight: 600 }}>{labelAngle}</text><text x="256" y="115" textAnchor="middle" style={dLbl}>{labelOpp}</text><text x="128" y="100" textAnchor="middle" style={{ ...dLbl, fontWeight: 600 }}>{labelHyp}</text></svg>); }
function TZ({ labelTop, labelBottom, labelHeight }) { return (<svg viewBox="0 0 300 180" style={dSvg}><polygon points="80,30 200,30 260,150 20,150" fill={T.creamLt} stroke={T.blue} strokeWidth="2" strokeLinejoin="round" /><line x1="140" y1="30" x2="140" y2="150" stroke={T.terra} strokeWidth="1.5" strokeDasharray="5,4" /><text x="140" y="22" textAnchor="middle" style={dLbl}>{labelTop}</text><text x="140" y="172" textAnchor="middle" style={dLbl}>{labelBottom}</text><text x="158" y="96" style={{ ...dLbl, fill: T.terra }}>{labelHeight}</text></svg>); }

// ─── Scallop Wave ───
function Wave({ color = T.blue, h = 28 }) { return (<svg viewBox="0 0 400 32" preserveAspectRatio="none" style={{ width: "100%", height: h, display: "block" }}><path d="M0 32 C20 0,40 0,50 16 C60 32,80 32,100 16 C110 0,130 0,150 16 C160 32,180 32,200 16 C210 0,230 0,250 16 C260 32,280 32,300 16 C310 0,330 0,350 16 C360 32,380 32,400 16 L400 32Z" fill={color}/></svg>); }

// ─── Milk Glass Timer ───
function MilkGlass({ fill = 1, time, size = "small", warning = false }) {
  const lg = size === "large";
  const w = lg ? 120 : 54;
  const h = lg ? 160 : 70;
  const vw = 100, vh = 140;
  const gT = 8, gB = 128, gH = 120;
  const tL = 12, tR = 88, bL = 24, bR = 76;
  const mTop = gB - (gH * Math.max(0, Math.min(1, fill)));
  const fr = (mTop - gT) / gH;
  const mL = tL + (bL - tL) * fr;
  const mR = tR + (bR - tR) * fr;
  const mc = warning ? "#f5e6dc" : "#fff";
  const me = warning ? "#e8c9b8" : "#e8e2d8";
  return (
    <div style={{ position: "relative", width: w, height: h, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox={`0 0 ${vw} ${vh}`} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
        <defs>
          <clipPath id={`gc-${size}`}><path d={`M${tL},${gT} L${tR},${gT} L${bR},${gB} L${bL},${gB} Z`}/></clipPath>
          <linearGradient id={`mg-${size}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={mc} stopOpacity="0.92"/><stop offset="50%" stopColor={mc} stopOpacity="1"/><stop offset="100%" stopColor={me} stopOpacity="0.85"/></linearGradient>
        </defs>
        <g clipPath={`url(#gc-${size})`}>
          <rect x="0" y={mTop} width={vw} height={gB - mTop + 2} fill={`url(#mg-${size})`}/>
          {fill > 0.02 && fill < 0.98 && <ellipse cx="50" cy={mTop} rx={(mR - mL) / 2} ry={lg ? 4 : 2.5} fill={me} opacity="0.5"/>}
          {fill > 0.08 && lg && <><circle cx="36" cy={mTop + 9} r="2" fill="#fff" opacity="0.55"/><circle cx="60" cy={mTop + 6} r="1.5" fill="#fff" opacity="0.45"/><circle cx="48" cy={mTop + 14} r="1.2" fill="#fff" opacity="0.35"/></>}
        </g>
        <path d={`M${tL},${gT} L${tR},${gT} L${bR},${gB} L${bL},${gB} Z`} fill="none" stroke={T.blue} strokeWidth={lg ? 2.5 : 2} strokeLinejoin="round"/>
        <line x1={tL - 2} y1={gT} x2={tR + 2} y2={gT} stroke={T.blue} strokeWidth={lg ? 3.5 : 2.5} strokeLinecap="round"/>
        <path d={`M${tL + 3},${gT + 4} L${bL + 2},${gB - 4}`} stroke="white" strokeWidth={lg ? 4 : 2.5} opacity="0.18" strokeLinecap="round"/>
        <line x1={bL - 5} y1={gB} x2={bR + 5} y2={gB} stroke={T.blue} strokeWidth={lg ? 3 : 2} strokeLinecap="round"/>
      </svg>
      <span style={{ position: "relative", zIndex: 2, fontFamily: "'IBM Plex Mono',monospace", fontSize: lg ? 24 : 12, fontWeight: 600, color: warning ? T.errRed : T.navy, textShadow: fill > 0.3 ? "0 0 8px rgba(255,255,255,0.9)" : "none", marginTop: lg ? 10 : 4, letterSpacing: "-0.02em" }}>{time}</span>
    </div>
  );
}

// ─── Utility ───
const fmt = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;
const ChkIco = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>);
const XIco = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);

// ─── Main App ───
export default function QSprint() {
  const [screen, setScreen] = useState(SCREENS.WELCOME);
  const [subject, setSubject] = useState("gcse-maths");
  const [confidence, setConfidence] = useState(null);
  const [dur, setDur] = useState(15);
  const [studentName, setStudentName] = useState(() => loadState("qs_name", ""));
  const [masteryMap, setMasteryMap] = useState(() => loadState("qs_mastery", {}));
  const [repQueue, setRepQueue] = useState(() => loadState("qs_queue", []));
  const [used, setUsed] = useState(new Set());
  const [timer, setTimer] = useState(0);
  const [brkTimer, setBrkTimer] = useState(0);
  const [curQ, setCurQ] = useState(null);
  const [ans, setAns] = useState("");
  const [hints, setHints] = useState(0);
  const [qStart, setQStart] = useState(null);
  const [worked, setWorked] = useState(false);
  const [lastOk, setLastOk] = useState(null);
  const [exitModal, setExitModal] = useState(false);
  const [results, setResults] = useState([]);
  const [allRes, setAllRes] = useState([]);
  const [sprints, setSprints] = useState(0);
  const tr = useRef(null);

  // Persist state to localStorage
  useEffect(() => { localStorage.setItem("qs_name", JSON.stringify(studentName)); }, [studentName]);
  useEffect(() => { localStorage.setItem("qs_mastery", JSON.stringify(masteryMap)); }, [masteryMap]);
  useEffect(() => { localStorage.setItem("qs_queue", JSON.stringify(repQueue)); }, [repQueue]);

  useEffect(() => { if (screen===SCREENS.SPRINT&&timer>0&&!exitModal) { tr.current=setInterval(()=>{setTimer(p=>{if(p<=1){clearInterval(tr.current);setTimeout(()=>setScreen(SCREENS.SPRINT_REVIEW),100);return 0;}return p-1;});},1000); return ()=>clearInterval(tr.current);} }, [screen,timer,exitModal]);
  useEffect(() => { if (screen===SCREENS.BREAK&&brkTimer>0) { tr.current=setInterval(()=>{setBrkTimer(p=>{if(p<=1){clearInterval(tr.current);return 0;}return p-1;});},1000); return ()=>clearInterval(tr.current);} }, [screen,brkTimer]);

  const pickQ = useCallback(() => {
    if (repQueue.length>0) { const id=repQueue[0]; setRepQueue(p=>p.slice(1)); return questions.find(q=>q.id===id)||questions[0]; }
    const lq=questions.filter(q=>q.level===subject); const av=lq.filter(q=>!used.has(q.id));
    if (!av.length) { setUsed(new Set()); return lq[Math.floor(Math.random()*lq.length)]; }
    const sc=av.map(q=>{const m=masteryMap[q.subtopic]?.score??0.5;return{...q,pri:(Math.random()<0.7?1-m:m)+Math.random()*0.3};});
    sc.sort((a,b)=>b.pri-a.pri); return sc[0];
  }, [used,masteryMap,subject,repQueue]);

  const loadQ = () => { const q=pickQ(); setCurQ(q); setUsed(p=>new Set([...p,q.id])); setAns(""); setHints(0); setWorked(false); setQStart(Date.now()); setLastOk(null); };
  const go = () => { setTimer(dur*60); setResults([]); setExitModal(false); loadQ(); setScreen(SCREENS.SPRINT); };
  const submit = () => { const ok=checkAnswer(ans,curQ); setLastOk(ok); if(ok) rec(true,"correct"); setScreen(SCREENS.FEEDBACK); };

  const rec = (ok,cls) => {
    setResults(p=>[...p,{question:curQ,correct:ok,classification:cls,hintsUsed:hints,timeSpent:Math.round((Date.now()-qStart)/1000)}]);
    const st=curQ.subtopic; setMasteryMap(p=>{const c=p[st]||{score:0.5,attempts:0,correct:0};const nc=c.correct+(ok?1:0);const na=c.attempts+1;return{...p,[st]:{score:nc/na,attempts:na,correct:nc}};});
    if(cls==="need_practice") setRepQueue(p=>[curQ.id,...p]); else if(cls==="slip_up") setRepQueue(p=>[...p,curQ.id]);
  };

  const classify = (cls) => { if(!lastOk) rec(false,cls); if(timer>0){loadQ();setScreen(SCREENS.SPRINT);}else setScreen(SCREENS.SPRINT_REVIEW); };
  const brk = () => { setAllRes(p=>[...p,...results]); setSprints(p=>p+1); setBrkTimer(300); setScreen(SCREENS.BREAK); };
  const reset = () => { setScreen(SCREENS.WELCOME); setResults([]); setAllRes([]); setSprints(0); setUsed(new Set()); };

  const prog = dur*60>0?1-timer/(dur*60):0;
  const qCnt = questions.filter(q=>q.level===subject).length;
  const tCnt = Object.keys(topicTrees[subject]||{}).length;

  return (
    <div style={S.shell}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.fade-in{animation:fadeIn .4s ease-out forwards}.slide-up{animation:slideUp .5s ease-out forwards}input:focus{outline:none;border-color:${T.blue}!important}button{cursor:pointer;border:none;font-family:'IBM Plex Sans',sans-serif;transition:all .15s}button:active{transform:scale(.97)}.hint-content{white-space:pre-line}body{background-color:${T.cream};margin:0;padding:0}@media (max-width: 480px){.frame{width:100vw;height:100vh;border-radius:0;box-shadow:none;background:${T.white}}@media (min-width: 481px) and (max-width: 768px){.frame{aspect-ratio:4/5;max-width:95vw}}@media (min-width: 769px){.frame{aspect-ratio:3/5;max-height:95vh}}`}</style>
      <script>{`document.body.style.backgroundColor = '${T.cream}';`}</script>

      <div style={S.frame} className="frame">

      {screen===SCREENS.WELCOME&&(<div style={S.ctr} className="fade-in"><div style={S.welc}>
        <div style={S.logoRow}><svg width="36" height="24" viewBox="0 0 60 40" fill="none"><path d="M5 35 L20 10 L30 22 L40 8 L55 35" stroke={T.blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg><span style={S.logoTxt}>Q-Sprint</span></div>
        <Wave h={24}/><div style={{padding:"0 8px"}}><h1 style={S.hero}>Focused maths practice,<br/>one question at a time.</h1><p style={S.heroSub}>Timed sprints with pen-and-paper working, tiered hints, and adaptive question selection that focuses on what you need most.</p><div style={{marginBottom:4}}><label style={S.lbl}>What should I call you?</label><input type="text" value={studentName} onChange={e=>setStudentName(e.target.value)} placeholder="Your first name" style={S.inp}/></div><button style={{...S.bp,opacity:studentName.trim()?1:0.5}} onClick={()=>studentName.trim()&&setScreen(SCREENS.SETUP)}>Let's go →</button><p style={S.wNote}>Grab a pen and paper — you'll need them.</p></div>
      </div></div>)}

      {screen===SCREENS.SETUP&&(<div style={S.ctr} className="fade-in"><div style={S.card}>
        <div style={S.cHead}><p style={S.greet}>Hey {studentName} 👋</p><h2 style={S.cTitle}>Set up your session</h2></div><Wave h={18}/>
        <div style={S.cBody}>
          <div style={S.sec}><label style={S.lbl}>Subject & Level</label><div style={S.chips}>{[{id:"gcse-maths",l:"GCSE Maths"},{id:"alevel-maths",l:"A-Level Maths"},{id:"ib-maths",l:"IB Maths"}].map(o=>(<button key={o.id} style={{...S.chip,...(subject===o.id?S.chipAct:{})}} onClick={()=>setSubject(o.id)}>{o.l}</button>))}</div><p style={S.ht}>{qCnt} questions · {tCnt} topic areas</p></div>
          <div style={S.sec}><label style={S.lbl}>How confident are you feeling?</label><div style={S.confR}>{[{id:"low",l:"I struggle",d:"Getting the basics down",c:T.terra},{id:"mid",l:"Getting there",d:"Okay but not confident",c:"#d4882a"},{id:"high",l:"Fairly solid",d:"Ready to be challenged",c:T.blue}].map(o=>(<button key={o.id} style={{...S.confC,...(confidence===o.id?{borderColor:o.c,backgroundColor:o.c+"10",boxShadow:`0 0 0 1px ${o.c}30`}:{})}} onClick={()=>setConfidence(o.id)}><span style={{...S.confL,color:confidence===o.id?o.c:T.text}}>{o.l}</span><span style={S.confD}>{o.d}</span></button>))}</div></div>
          <div style={S.sec}><label style={S.lbl}>Sprint duration</label><div style={S.chips}>{[10,15,20,25].map(d=>(<button key={d} style={{...S.durC,...(dur===d?S.durCA:{})}} onClick={()=>setDur(d)}>{d} min</button>))}</div></div>
          <button style={{...S.bp,opacity:confidence?1:0.5,marginTop:20}} onClick={()=>confidence&&setScreen(SCREENS.READY)}>Start session →</button>
        </div>
      </div></div>)}

      {screen===SCREENS.READY&&(<div style={S.ctr} className="fade-in"><div style={S.card}>
        <div style={{...S.cHead,textAlign:"center"}}><div style={{fontSize:40,marginBottom:4}}>📝</div><h2 style={{...S.cTitle,textAlign:"center"}}>Ready?</h2></div><Wave h={18}/>
        <div style={{...S.cBody,textAlign:"center"}}><p style={{fontSize:16,color:T.text,lineHeight:1.5,marginBottom:20}}>You've got <strong>{dur} minutes</strong> of focused practice ahead.</p><div style={{display:"inline-block",textAlign:"left"}}><div style={S.chkI}>✓ Pen and paper to hand</div><div style={S.chkI}>✓ Calculator nearby</div><div style={S.chkI}>✓ Distractions put away</div></div><button style={{...S.bt,marginTop:20,padding:"16px 48px",fontSize:17}} onClick={go}>Begin sprint</button></div>
      </div></div>)}

      {screen===SCREENS.SPRINT&&curQ&&(<div style={S.sprint} className="fade-in">
        {exitModal&&(<div style={S.ov}><div style={S.mod}><h3 style={S.modT}>End Sprint Early?</h3><p style={S.modP}>You have {Math.ceil(timer/60)} min left.</p><button style={S.bp} onClick={()=>{setExitModal(false);setAllRes(p=>[...p,...results]);setSprints(p=>p+1);setScreen(SCREENS.SESSION_SUMMARY)}}>Save & End</button><button style={S.bd} onClick={()=>{setExitModal(false);setResults([]);setScreen(SCREENS.READY)}}>Discard</button><button style={S.bs} onClick={()=>setExitModal(false)}>Resume</button></div></div>)}
        <div style={S.topB}><MilkGlass fill={1-prog} time={fmt(timer)} size="small" warning={timer<60}/><div style={S.pBar}><div style={{...S.pFill,width:`${prog*100}%`}}/></div><button style={S.exitB} onClick={()=>setExitModal(true)}>Exit</button></div>
        <div style={S.qA} className="slide-up"><div style={S.tTag}>{curQ.topic} · {curQ.subtopic}</div><div style={S.qTxt}>{curQ.question.split("\n").map((l,i)=>(<div key={i} style={i>0?{marginTop:8}:{}}>{l}</div>))}</div>{curQ.diagram&&<DiagramRenderer diagram={curQ.diagram}/>}{hints>0&&(<div style={S.hBox}><div style={S.hHead}>{hints===1?"💡 Hint":hints===2?"📖 First steps":"✅ Full solution"}</div><div className="hint-content" style={S.hCont}>{curQ.hints[hints-1]}</div></div>)}{!worked&&(<div style={S.wGate}><p style={S.wPrm}>Work this out on paper first.</p><button style={S.bp} onClick={()=>setWorked(true)}>I've worked it out</button><button style={S.bg} onClick={()=>setHints(p=>Math.min(p+1,3))}>{hints===0?"I'm stuck — give me a hint":"Show more steps"}</button></div>)}{worked&&(<div style={S.aArea} className="slide-up"><label style={S.lbl}>Your answer</label><div style={S.aRow}><input type="text" value={ans} onChange={e=>setAns(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ans.trim()&&submit()} placeholder="Type your answer..." style={S.aInp} autoFocus/><button style={{...S.bt,opacity:ans.trim()?1:0.4,flexShrink:0}} onClick={()=>ans.trim()&&submit()}>Check</button></div>{hints<3&&<button style={S.bgSm} onClick={()=>setHints(p=>Math.min(p+1,3))}>Need a hint?</button>}</div>)}</div>
      </div>)}

      {screen===SCREENS.FEEDBACK&&(<div style={S.sprint} className="fade-in">
        <div style={S.topB}><MilkGlass fill={1-prog} time={fmt(timer)} size="small" warning={timer<60}/><div style={S.pBar}><div style={{...S.pFill,width:`${prog*100}%`}}/></div></div>
        <div style={S.fbA} className="slide-up">{lastOk?(<><div style={S.fbOk}><div style={S.fbIcOk}><ChkIco/></div><h3 style={S.fbTOk}>Correct!</h3><p style={S.fbAns}>{curQ.answerLabel}</p></div><button style={S.bp} onClick={()=>classify("correct")}>Next question →</button></>):(<><div style={S.fbBad}><div style={S.fbIcBad}><XIco/></div><h3 style={S.fbTBad}>Not quite</h3><p style={S.fbYou}>You answered: {ans}</p><p style={S.fbCorr}>Correct answer: {curQ.answerLabel}</p></div><div style={S.solB}><div style={S.solH}>Worked solution</div><div className="hint-content" style={S.solC}>{curQ.hints[2]}</div></div><p style={S.clsPrm}>What happened?</p><div style={S.clsR}><button style={S.clsBtn} onClick={()=>classify("slip_up")}>💡 Slip-up / I understand</button><button style={S.clsBtnF} onClick={()=>classify("need_practice")}>🏳️ Need more practice</button></div></>)}</div>
      </div>)}

      {screen===SCREENS.SPRINT_REVIEW&&(<div style={S.ctr} className="fade-in"><div style={S.card}><div style={{...S.cHead,textAlign:"center"}}><h2 style={{...S.cTitle,textAlign:"center"}}>Sprint complete! 🎉</h2></div><Wave h={18}/><div style={S.cBody}><div style={S.rvSt}><div style={S.rvS}><div style={S.rvN}>{results.filter(r=>r.correct).length}</div><div style={S.rvL}>Correct</div></div><div style={S.rvD}/><div style={S.rvS}><div style={S.rvN}>{results.filter(r=>r.classification==="slip_up").length}</div><div style={S.rvL}>Slip-ups</div></div><div style={S.rvD}/><div style={S.rvS}><div style={S.rvN}>{results.filter(r=>r.classification==="need_practice").length}</div><div style={S.rvL}>To revisit</div></div></div><button style={S.bp} onClick={brk}>Take a 5-minute break</button><button style={S.bs} onClick={()=>{setAllRes(p=>[...p,...results]);setSprints(p=>p+1);setScreen(SCREENS.SESSION_SUMMARY)}}>End session</button></div></div></div>)}

      {screen===SCREENS.BREAK&&(<div style={S.brkScr} className="fade-in"><div style={S.brkC}><h2 style={S.brkT}>Break time</h2><p style={S.brkSub}>Step away. Stretch. Get water.</p><div style={{display:"flex",justifyContent:"center",marginBottom:28}}><MilkGlass fill={brkTimer/300} time={fmt(brkTimer)} size="large" warning={brkTimer<30}/></div><button style={S.bp} onClick={()=>setScreen(SCREENS.READY)}>Start next sprint</button><button style={{...S.bs,marginTop:8}} onClick={()=>setScreen(SCREENS.SESSION_SUMMARY)}>End session</button></div></div>)}

      {screen===SCREENS.SESSION_SUMMARY&&(<div style={S.ctr} className="fade-in"><div style={S.sumCard}><div style={S.sumBnr}><Wave color="#fff" h={14}/></div><div style={S.sumIn}><h1 style={S.sumTi}>Session Facts</h1><div style={S.sumTk}/><div style={S.sumRw}><span style={S.sumBd}>Sprints Completed</span><span style={S.sumBd}>{sprints}</span></div><div style={S.sumRw}><span style={S.sumBd}>Focus Time</span><span style={S.sumBd}>{sprints*dur} min</span></div><div style={S.sumMd}/><div style={{textAlign:"right",padding:"2px 0"}}><span style={S.sumSB}>Accuracy</span></div><div style={S.sumTn}/>{Object.entries(masteryMap).map(([t,d])=>(<div key={t}><div style={S.sumRw}><span style={S.sumTx}>{t} <span style={S.sumSm}>({d.attempts} Qs)</span></span><span style={S.sumBd}>{Math.round(d.score*100)}%</span></div><div style={S.sumTn}/></div>))}<div style={S.sumTk}/><p style={S.sumDis}>Next session will prioritise weaker areas while maintaining strengths.</p><button style={{...S.bt,width:"100%",marginTop:16}} onClick={reset}>Finish & Close</button></div></div></div>)}
      </div>
    </div>
  );
}

// ─── Styles ───
const S = {
  shell:{width:"100vw",height:"100vh",background:T.cream,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",fontFamily:"'IBM Plex Sans',sans-serif",color:T.text},
  frame:{background:T.white,borderRadius:"20px",boxShadow:"0 8px 40px rgba(30,27,75,0.10)",overflowY:"auto",overflowX:"hidden",scrollbarWidth:"none","&::-webkit-scrollbar":{display:"none"},"-webkit-overflow-scrolling":"touch"},
  ctr:{width:"100%",padding:"20px",display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100%"},
  welc:{width:"100%",maxWidth:480,overflow:"hidden"},
  logoRow:{display:"flex",alignItems:"center",gap:10,marginBottom:20,padding:"0 8px"},
  logoTxt:{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:T.blue,letterSpacing:"-0.02em"},
  hero:{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:32,fontWeight:900,color:T.navy,lineHeight:1.2,marginTop:28,marginBottom:16,letterSpacing:"-0.02em"},
  heroSub:{fontSize:15,color:T.textLt,lineHeight:1.6,marginBottom:28},
  wNote:{marginTop:16,fontSize:13,color:T.textMut,textAlign:"center"},
  card:{width:"100%",maxWidth:520,backgroundColor:T.white,borderRadius:14,overflow:"hidden",boxShadow:"0 2px 20px rgba(30,27,75,0.06)"},
  cHead:{padding:"28px 28px 16px"},
  cBody:{padding:"20px 28px 28px"},
  cTitle:{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:26,fontWeight:700,color:T.navy,letterSpacing:"-0.01em"},
  greet:{fontSize:14,color:T.textLt,marginBottom:4},
  lbl:{display:"block",fontSize:12,fontWeight:600,color:T.blue,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8},
  inp:{width:"100%",padding:"13px 16px",fontSize:17,fontFamily:"'IBM Plex Sans',sans-serif",border:`2px solid ${T.bdr}`,borderRadius:8,backgroundColor:T.white,color:T.navy},
  ht:{fontSize:13,color:T.textMut,marginTop:8},
  sec:{marginBottom:22},
  bp:{display:"block",width:"100%",maxWidth:400,margin:"0 auto",padding:"14px 24px",fontSize:16,fontWeight:600,color:"#fff",backgroundColor:T.blue,borderRadius:8},
  bt:{display:"inline-block",padding:"14px 28px",fontSize:16,fontWeight:600,color:"#fff",backgroundColor:T.terra,borderRadius:8},
  bs:{display:"block",width:"100%",maxWidth:400,margin:"0 auto",padding:"12px 24px",fontSize:15,fontWeight:500,color:T.textLt,backgroundColor:"transparent",borderRadius:8,border:`1.5px solid ${T.bdr}`,marginTop:8},
  bd:{display:"block",width:"100%",maxWidth:400,margin:"0 auto",padding:"12px",marginTop:10,backgroundColor:T.errBg,color:T.errRed,border:`1px solid ${T.errBdr}`,borderRadius:8,fontWeight:600},
  bg:{padding:"10px 20px",fontSize:14,fontWeight:500,color:T.textMut,backgroundColor:"transparent",border:`1px solid ${T.bdr}`,borderRadius:8},
  bgSm:{display:"inline-block",marginTop:8,padding:"4px 10px",fontSize:12,color:T.textMut,backgroundColor:"transparent",border:"none"},
  chips:{display:"flex",gap:8,flexWrap:"wrap"},
  chip:{padding:"9px 16px",fontSize:14,fontWeight:500,borderRadius:6,border:`2px solid ${T.bdr}`,backgroundColor:"transparent",color:T.text},
  chipAct:{borderColor:T.blue,backgroundColor:T.blue+"0c",color:T.blue,boxShadow:`0 0 0 1px ${T.blue}25`},
  confR:{display:"flex",gap:8,flexWrap:"wrap"},
  confC:{flex:"1 1 140px",padding:"12px 14px",borderRadius:8,border:`2px solid ${T.bdr}`,backgroundColor:"transparent",textAlign:"left",display:"flex",flexDirection:"column",gap:2},
  confL:{fontSize:14,fontWeight:600},
  confD:{fontSize:11,color:T.textMut},
  durC:{padding:"10px 18px",fontSize:14,fontWeight:600,borderRadius:6,border:`2px solid ${T.bdr}`,backgroundColor:"transparent",color:T.text,fontFamily:"'IBM Plex Mono',monospace"},
  durCA:{borderColor:T.blue,backgroundColor:T.blue+"0c",color:T.blue},
  chkI:{fontSize:15,color:T.textLt,padding:"3px 0"},
  sprint:{width:"100%",display:"flex",flexDirection:"column",minHeight:"100%"},
  topB:{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 0 10px",position:"sticky",top:0,zIndex:10,backgroundColor:T.white},
  pBar:{flex:1,height:3,backgroundColor:T.bdr,borderRadius:2,overflow:"hidden"},
  pFill:{height:"100%",backgroundColor:T.blue,borderRadius:2,transition:"width 1s linear"},
  exitB:{background:"none",border:"none",color:T.textMut,fontWeight:600,fontSize:13},
  qA:{width:"100%",flex:1,display:"flex",flexDirection:"column",maxWidth:680,margin:"0 auto",paddingTop:16},
  tTag:{fontSize:11,fontWeight:600,color:T.blue,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14},
  qTxt:{fontFamily:"'Playfair Display',serif",fontSize:24,lineHeight:1.35,color:T.navy,marginBottom:20,fontWeight:700},
  hBox:{backgroundColor:T.hintBg,border:`1px solid ${T.hintBdr}`,borderRadius:8,padding:"12px 16px",marginBottom:16},
  hHead:{fontSize:12,fontWeight:600,color:T.hintTxt,marginBottom:5},
  hCont:{fontSize:13,color:"#78350f",lineHeight:1.6,fontFamily:"'IBM Plex Mono',monospace"},
  wGate:{marginTop:"auto",paddingTop:20,display:"flex",flexDirection:"column",gap:10,alignItems:"center"},
  wPrm:{fontSize:14,color:T.textMut,textAlign:"center",fontStyle:"italic",marginBottom:2},
  aArea:{marginTop:"auto",paddingTop:20},
  aRow:{display:"flex",gap:8},
  aInp:{flex:1,padding:"13px 14px",fontSize:17,fontFamily:"'IBM Plex Mono',monospace",border:`2px solid ${T.bdr}`,borderRadius:8,backgroundColor:T.white,color:T.navy},
  fbA:{width:"100%",flex:1,display:"flex",flexDirection:"column",maxWidth:680,margin:"0 auto",paddingTop:32,gap:14},
  fbOk:{textAlign:"center",padding:"28px 20px",backgroundColor:T.okBg,borderRadius:12,border:`1px solid ${T.okBdr}`},
  fbIcOk:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:44,height:44,borderRadius:"50%",backgroundColor:T.okGreen,color:"#fff",marginBottom:10},
  fbTOk:{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:26,color:T.okGreen,marginBottom:4},
  fbAns:{fontFamily:"'IBM Plex Mono',monospace",fontSize:17,color:T.okGreen},
  fbBad:{textAlign:"center",padding:"24px 20px",backgroundColor:T.errBg,borderRadius:12,border:`1px solid ${T.errBdr}`},
  fbIcBad:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:44,height:44,borderRadius:"50%",backgroundColor:"#ef4444",color:"#fff",marginBottom:10},
  fbTBad:{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:26,color:T.errRed,marginBottom:6},
  fbYou:{fontSize:14,color:"#dc2626",marginBottom:3},
  fbCorr:{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,color:T.navy,fontWeight:500},
  solB:{backgroundColor:T.creamLt,border:`1px solid ${T.bdr}`,borderRadius:8,padding:"12px 16px"},
  solH:{fontSize:11,fontWeight:600,color:T.blue,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6},
  solC:{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:T.text,lineHeight:1.7,whiteSpace:"pre-line"},
  clsPrm:{fontSize:14,fontWeight:600,color:T.text,textAlign:"center"},
  clsR:{display:"flex",flexDirection:"column",gap:6},
  clsBtn:{padding:"13px 16px",fontSize:14,fontWeight:500,color:T.text,backgroundColor:T.white,borderRadius:8,border:`2px solid ${T.bdr}`,textAlign:"left"},
  clsBtnF:{padding:"13px 16px",fontSize:14,fontWeight:500,color:T.errRed,backgroundColor:T.errBg,borderRadius:8,border:`2px solid ${T.errBdr}`,textAlign:"left"},
  rvSt:{display:"flex",justifyContent:"center",alignItems:"center",gap:20,marginBottom:20,padding:"16px 0"},
  rvS:{textAlign:"center"},
  rvN:{fontFamily:"'Playfair Display',serif",fontSize:34,color:T.navy,fontWeight:700},
  rvL:{fontSize:11,color:T.textMut,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2},
  rvD:{width:1,height:36,backgroundColor:T.bdr},
  brkScr:{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px",background:`linear-gradient(180deg,${T.white} 0%,${T.creamLt} 100%)`,minHeight:"100%"},
  brkC:{textAlign:"center",maxWidth:380,width:"100%"},
  brkT:{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:34,color:T.navy,marginBottom:6},
  brkSub:{fontSize:15,color:T.textLt,marginBottom:24},
  ov:{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(30,27,75,0.7)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center"},
  mod:{backgroundColor:T.white,padding:28,borderRadius:12,maxWidth:380,width:"90%",textAlign:"center"},
  modT:{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:22,color:T.navy,marginBottom:10},
  modP:{color:T.textLt,marginBottom:20,fontSize:14},
  sumCard:{width:"100%",maxWidth:400,backgroundColor:T.white,border:`3px solid ${T.navy}`,overflow:"hidden"},
  sumBnr:{backgroundColor:T.blue,padding:"12px 0 0"},
  sumIn:{padding:20},
  sumTi:{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,color:T.navy,letterSpacing:"-1px"},
  sumTk:{borderBottom:`10px solid ${T.navy}`,margin:"8px 0"},
  sumMd:{borderBottom:`3px solid ${T.navy}`,margin:"4px 0"},
  sumTn:{borderBottom:`1px solid ${T.navy}`,margin:"4px 0"},
  sumRw:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"2px 0"},
  sumBd:{fontSize:15,fontWeight:800,color:T.navy},
  sumTx:{fontSize:15,fontWeight:500,color:T.text},
  sumSB:{fontSize:11,fontWeight:700,color:T.navy},
  sumSm:{fontSize:11,fontWeight:400,color:T.textMut},
  sumDis:{fontSize:11,lineHeight:1.3,marginTop:8,color:T.textMut},
};
