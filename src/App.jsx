import { useState, useEffect, useCallback } from "react";

// ── YOUR 7 CLAUDE PROJECT CHATS ───────────────────────────────────────────────
const DEPTS = [
  { id:"hq",       name:"HQ",             notionName:"HQ",             icon:"🏛️", color:"#4FC3F7" },
  { id:"coo",      name:"NOVI COO",        notionName:"COO",            icon:"👔", color:"#00E5AA" },
  { id:"cfo",      name:"NOVI CFO",        notionName:"CFO",            icon:"💰", color:"#FFD166" },
  { id:"cmo",      name:"NOVI CMO",        notionName:"CMO",            icon:"📣", color:"#FF6B9D" },
  { id:"clo",      name:"NOVI CLO",        notionName:"CLO",            icon:"⚖️",  color:"#FF8C42" },
  { id:"form",     name:"NOVI Formulations",notionName:"Formulations",  icon:"🧪", color:"#CE93D8" },
  { id:"mkt",      name:"NOVI Market Strategy",notionName:"Market Strategy",icon:"🎯",color:"#69F0AE"},
  { id:"ops",      name:"Operations",      notionName:"Operations",     icon:"⚙️",  color:"#38BDF8" },
  { id:"vendors",  name:"Vendors",         notionName:"Vendors",        icon:"🤝", color:"#FB923C" },
  { id:"comply",   name:"Compliance",      notionName:"Compliance",     icon:"📋", color:"#FBBF24" },
];

// ── PRIORITY / STATUS ─────────────────────────────────────────────────────────
const PRIORITY = ["Low","Medium","High","Critical"];
const DEPT_STATUS = ["Planned","In Progress","Blocked","Completed","On Hold"];
const TASK_STATUS = ["Not Started","In Progress","Blocked","Completed","Deferred"];
const EOD_STATUS  = ["On Track","Delayed","Critical","Blocked"];
const APPROVAL    = ["Approved","Pending","Rejected","Deferred"];

const pCol = p => ({ Critical:"#FF4444", High:"#FF8C00", Medium:"#FFD166", Low:"#888" }[p] || "#888");
const sCol = s => ({
  "Not Started":"#FFD166","In Progress":"#4FC3F7",
  "Completed":"#00E5AA","Blocked":"#FF4444","Deferred":"#888",
  "Planned":"#4FC3F7","On Hold":"#888",
}[s] || "#888");
const aCol = a => ({ Approved:"#00E5AA", Pending:"#FFD166", Rejected:"#FF4444", Deferred:"#888" }[a] || "#888");

// ── API ────────────────────────────────────────────────────────────────────────
const notionApi = async (action, payload = null) => {
  try {
    const r = await fetch("/api/notion", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action, payload }),
    });
    return r.json();
  } catch { return { ok:false, error:"Network error" }; }
};

// ── ICONS ──────────────────────────────────────────────────────────────────────
const Ic = ({ n, s=15 }) => {
  const m = {
    dash  :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    sync  :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    task  :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    decide:<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    eod   :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    dept  :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    menu  :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    plus  :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    ext   :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
    check :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    notion:<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M4 2h11l5 5v15H4V2zm0 0v20m11-20v5h5"/></svg>,
  };
  return m[n] || null;
};

// ── FORM HELPERS ──────────────────────────────────────────────────────────────
const Label = ({children}) => <div style={{fontSize:9,color:"#555",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>{children}</div>;
const Input = ({value,onChange,placeholder,style={}}) => (
  <input value={value} onChange={onChange} placeholder={placeholder}
    style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,padding:"8px 11px",color:"#E0E0F0",fontSize:11,fontFamily:"inherit",...style}} />
);
const Textarea = ({value,onChange,placeholder,rows=4}) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,padding:"8px 11px",color:"#E0E0F0",fontSize:11,fontFamily:"inherit",resize:"vertical"}} />
);
const Select = ({value,onChange,options}) => (
  <select value={value} onChange={onChange}
    style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,padding:"8px 11px",color:"#E0E0F0",fontSize:11,fontFamily:"inherit",cursor:"pointer"}}>
    {options.map(o=><option key={o} value={o}>{o}</option>)}
  </select>
);
const BtnGreen = ({onClick,disabled,children,style={}}) => (
  <button onClick={onClick} disabled={disabled}
    style={{background:disabled?"#1A1A28":"linear-gradient(135deg,#00E5AA,#00A878)",border:"none",borderRadius:8,padding:"9px 18px",color:disabled?"#333":"#000",fontWeight:700,fontSize:11,cursor:disabled?"default":"pointer",transition:"all .2s",fontFamily:"inherit",...style}}>
    {children}
  </button>
);
const BtnGhost = ({onClick,children}) => (
  <button onClick={onClick}
    style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"9px 14px",color:"#888",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
    {children}
  </button>
);

// ── PILL ──────────────────────────────────────────────────────────────────────
const Pill = ({label,color}) => (
  <span style={{background:`${color}18`,color,border:`1px solid ${color}30`,borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:600,letterSpacing:1,whiteSpace:"nowrap"}}>
    {label}
  </span>
);

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function NOVIApp() {
  const [tab,setTab]       = useState("dashboard");
  const [sidebar,setSB]    = useState(true);
  const [tasks,setTasks]   = useState([]);
  const [updates,setUpd]   = useState([]);
  const [decisions,setDec] = useState([]);
  const [loading,setLoad]  = useState(true);
  const [notif,setNotif]   = useState(null);

  const toast = (msg,t="ok") => { setNotif({msg,t}); setTimeout(()=>setNotif(null),3500); };

  const load = useCallback(async () => {
    setLoad(true);
    const [t,u,d] = await Promise.all([
      notionApi("getTasks"),
      notionApi("getDeptUpdates"),
      notionApi("getDecisions"),
    ]);
    if(t.ok) setTasks(t.items||[]);
    if(u.ok) setUpd(u.items||[]);
    if(d.ok) setDec(d.items||[]);
    setLoad(false);
  },[]);

  useEffect(()=>{ load(); },[load]);

  const triggerEOD = async () => {
    toast("📧 Building EOD report...");
    const r = await fetch("/api/eod-email?trigger=manual");
    const d = await r.json();
    if(d.ok) toast("✅ EOD report sent to parekhjaymin11@gmail.com");
    else toast("❌ EOD failed — check Resend API key","err");
  };

  const urgent  = tasks.filter(t=>t.Priority==="Critical"&&t.Status!=="Completed");
  const blocked = tasks.filter(t=>t.Status==="Blocked");
  const open    = tasks.filter(t=>t.Status!=="Completed"&&t.Status!=="Deferred");
  const pendDec = decisions.filter(d=>d["Founder Approval"]==="Pending");
  const founderReq = updates.filter(u=>u["Founder Decision Required"]==="Yes");

  const nav = [
    {id:"dashboard", label:"Dashboard",      icon:"dash"},
    {id:"sync",      label:"Sync from Chat", icon:"sync",   badge:0},
    {id:"tasks",     label:"Tasks",          icon:"task",   badge:open.length},
    {id:"decisions", label:"Decision Log",   icon:"decide", badge:pendDec.length},
    {id:"eod",       label:"EOD Reports",    icon:"eod"},
    {id:"depts",     label:"Departments",    icon:"dept"},
  ];

  return (
    <div style={{display:"flex",height:"100vh",background:"#07070E",color:"#E0E0F0",fontFamily:"'DM Mono','Courier New',monospace",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1A1A28;border-radius:2px}
        input,textarea,select,button{font-family:inherit;outline:none}
        .hov{transition:all .18s;cursor:pointer}.hov:hover{opacity:.8}
        .card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:10px}
        .fade{animation:fd .28s ease}@keyframes fd{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .pulse{animation:pu 2s infinite}@keyframes pu{0%,100%{opacity:1}50%{opacity:.4}}
        .ni{animation:si .25s ease}@keyframes si{from{transform:translateX(110%)}to{transform:translateX(0)}}
        .stab{width:100%;display:flex;align-items:center;gap:9px;padding:8px 12px;border-radius:7px;border:none;background:transparent;color:#555;font-size:11px;cursor:pointer;transition:all .18s;text-align:left;font-family:inherit}
        .stab:hover{background:rgba(255,255,255,0.04);color:#AAA}
        .stab.on{background:rgba(0,229,170,0.1);color:#00E5AA;border:1px solid rgba(0,229,170,0.15)}
        .gbg{position:fixed;inset:0;background-image:linear-gradient(rgba(0,229,170,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,170,.022) 1px,transparent 1px);background-size:42px 42px;pointer-events:none;z-index:0}
      `}</style>

      <div className="gbg"/>

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      {sidebar && (
        <aside style={{width:218,background:"rgba(7,7,14,0.97)",borderRight:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",flexShrink:0,position:"relative",zIndex:1}}>
          {/* Logo */}
          <div style={{padding:"20px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:5,background:"linear-gradient(135deg,#00E5AA,#4FC3F7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>NOVI OS</div>
            <div style={{fontSize:8,color:"#222",letterSpacing:4,marginTop:1}}>FOUNDER COMMAND CENTRE</div>
            <div style={{marginTop:10,display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#00E5AA",boxShadow:"0 0 6px #00E5AA"}} className="pulse"/>
              <span style={{fontSize:9,color:"#00E5AA"}}>LIVE</span>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{padding:"10px 10px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {[{l:"CRITICAL",v:urgent.length,c:"#FF4444"},{l:"BLOCKED",v:blocked.length,c:"#FF8C00"},{l:"OPEN",v:open.length,c:"#4FC3F7"},{l:"DECISIONS",v:pendDec.length,c:"#FFD166"}].map(s=>(
              <div key={s.l} style={{background:`${s.c}10`,border:`1px solid ${s.c}20`,borderRadius:7,padding:"6px 8px",textAlign:"center"}}>
                <div style={{fontSize:17,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:7,color:s.c,opacity:.7,letterSpacing:1,marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Nav */}
          <nav style={{padding:"10px 8px",flex:1,overflowY:"auto"}}>
            <div style={{fontSize:8,color:"#222",letterSpacing:2,padding:"0 10px 6px"}}>MODULES</div>
            {nav.map(item=>(
              <button key={item.id} className={`stab ${tab===item.id?"on":""}`} onClick={()=>setTab(item.id)}>
                <Ic n={item.icon} s={13}/>
                <span>{item.label}</span>
                {item.badge>0&&<span style={{marginLeft:"auto",background:"#FF4444",color:"#fff",fontSize:8,borderRadius:8,padding:"1px 5px",fontWeight:700}}>{item.badge}</span>}
              </button>
            ))}

            <div style={{fontSize:8,color:"#222",letterSpacing:2,padding:"12px 10px 6px"}}>YOUR CLAUDE CHATS</div>
            {DEPTS.slice(0,7).map(d=>(
              <a key={d.id} href="https://claude.ai" target="_blank" rel="noreferrer"
                style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",borderRadius:7,color:"#3A3A5A",fontSize:10,textDecoration:"none",transition:"all .18s",marginBottom:1}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color=d.color;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#3A3A5A";}}>
                <span style={{fontSize:12}}>{d.icon}</span>
                <span>{d.name}</span>
                <Ic n="ext" s={8}/>
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div style={{padding:"10px 10px 16px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",gap:6}}>
            <button className="hov" onClick={triggerEOD}
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px",background:"linear-gradient(135deg,#00E5AA,#00A878)",border:"none",borderRadius:8,color:"#000",fontWeight:700,fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>
              <Ic n="eod" s={12}/> SEND EOD NOW
            </button>
            <a href="https://www.notion.so/NOVI-HQ-Dashboard-36009180590980dc98c3f6e2b02a9a15" target="_blank" rel="noreferrer"
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"#888",fontSize:10,textDecoration:"none",textAlign:"center"}}>
              <Ic n="notion" s={11}/> OPEN NOTION
            </a>
            <div style={{fontSize:8,color:"#222",textAlign:"center",marginTop:2}}>EOD auto-sends at 6:00 PM IST</div>
          </div>
        </aside>
      )}

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",zIndex:1}}>
        <header style={{padding:"12px 22px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:14,background:"rgba(7,7,14,0.9)",backdropFilter:"blur(10px)",flexShrink:0}}>
          <button className="hov" onClick={()=>setSB(s=>!s)} style={{background:"none",border:"none",color:"#444"}}><Ic n="menu" s={17}/></button>
          <div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:3}}>{nav.find(n=>n.id===tab)?.label.toUpperCase()}</div>
            <div style={{fontSize:8,color:"#333",marginTop:1}}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} · NOVI OPERATING SYSTEM</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            {founderReq.length>0&&<div style={{padding:"4px 10px",background:"#FF8C4215",border:"1px solid #FF8C4230",borderRadius:20,fontSize:9,color:"#FF8C42"}}>⚠️ {founderReq.length} FOUNDER INPUT NEEDED</div>}
            <button className="hov" onClick={load} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,color:"#888",fontSize:9,cursor:"pointer"}}>
              <Ic n="sync" s={11}/> REFRESH
            </button>
          </div>
        </header>

        <div style={{flex:1,overflow:"auto",padding:"22px 24px"}}>
          {loading
            ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#333"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:42,letterSpacing:6,color:"#00E5AA",opacity:.15}}>NOVI</div>
                  <div style={{fontSize:11,marginTop:8}}>Loading from Notion...</div>
                </div>
              </div>
            : <>
                {tab==="dashboard" && <DashView tasks={tasks} updates={updates} decisions={decisions} urgent={urgent} blocked={blocked} open={open} pendDec={pendDec} founderReq={founderReq} setTab={setTab} pCol={pCol} sCol={sCol}/>}
                {tab==="sync"      && <SyncView depts={DEPTS} toast={toast} load={load}/>}
                {tab==="tasks"     && <TasksView tasks={tasks} toast={toast} load={load} pCol={pCol} sCol={sCol}/>}
                {tab==="decisions" && <DecisionsView decisions={decisions} pendDec={pendDec} toast={toast} load={load} aCol={aCol}/>}
                {tab==="eod"       && <EODView triggerEOD={triggerEOD} tasks={tasks} updates={updates} urgent={urgent} open={open}/>}
                {tab==="depts"     && <DeptsView depts={DEPTS} updates={updates}/>}
              </>
          }
        </div>
      </div>

      {notif&&<div className="ni" style={{position:"fixed",top:16,right:16,background:notif.t==="ok"?"#00E5AA":"#FF4444",color:"#000",padding:"10px 18px",borderRadius:8,fontSize:11,fontWeight:700,zIndex:999}}>{notif.msg}</div>}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function DashView({tasks,updates,decisions,urgent,blocked,open,pendDec,founderReq,setTab,pCol,sCol}) {
  const today = new Date().toISOString().split("T")[0];
  const todayUpd = updates.filter(u=>u.Date===today);

  return (
    <div className="fade">
      {/* Welcome bar */}
      <div style={{background:"linear-gradient(135deg,rgba(0,229,170,0.06),rgba(79,195,247,0.04))",border:"1px solid rgba(0,229,170,0.1)",borderRadius:14,padding:"18px 22px",marginBottom:18}}>
        <div style={{fontSize:10,color:"#00E5AA",letterSpacing:2,marginBottom:3}}>
          {new Date().getHours()<12?"GOOD MORNING":"new Date().getHours()<17?"GOOD AFTERNOON":"GOOD EVENING"}, JAYMIN
        </div>
        <div style={{fontSize:17,fontWeight:600,marginBottom:8}}>NOVI Company Status — {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {urgent.map(t=><div key={t._id} style={{fontSize:9,color:"#FF4444",background:"#FF444412",border:"1px solid #FF444428",borderRadius:20,padding:"3px 9px"}}>🚨 {t["Task Name"]||"Untitled"}</div>)}
          {founderReq.map(u=><div key={u._id} style={{fontSize:9,color:"#FF8C42",background:"#FF8C4212",border:"1px solid #FF8C4228",borderRadius:20,padding:"3px 9px"}}>⚠️ Input needed: {u.Department}</div>)}
          {pendDec.map(d=><div key={d._id} style={{fontSize:9,color:"#FFD166",background:"#FFD16612",border:"1px solid #FFD16628",borderRadius:20,padding:"3px 9px"}}>📋 Decision pending: {d["Decision Title"]?.slice(0,30)}</div>)}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[
          {l:"Critical Tasks",v:urgent.length,c:"#FF4444",sub:"Needs immediate action",t:"tasks"},
          {l:"Blocked Tasks",v:blocked.length,c:"#FF8C00",sub:"Needs unblocking",t:"tasks"},
          {l:"Open Tasks",v:open.length,c:"#4FC3F7",sub:"Total in progress",t:"tasks"},
          {l:"Pending Decisions",v:pendDec.length,c:"#FFD166",sub:"Awaiting your approval",t:"decisions"},
        ].map(s=>(
          <div key={s.l} className="card hov" style={{padding:"16px 18px",borderTop:`3px solid ${s.c}`,cursor:"pointer"}} onClick={()=>setTab(s.t)}>
            <div style={{fontSize:28,fontWeight:700,color:s.c,marginBottom:4}}>{s.v}</div>
            <div style={{fontSize:11,color:"#C0C0D8",marginBottom:2}}>{s.l}</div>
            <div style={{fontSize:9,color:"#555"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {/* Critical tasks */}
        <div className="card" style={{padding:16}}>
          <div style={{fontSize:9,color:"#FF4444",letterSpacing:2,marginBottom:12}}>🚨 CRITICAL TASKS</div>
          {urgent.length===0
            ? <div style={{fontSize:11,color:"#333",textAlign:"center",padding:"16px 0"}}>No critical tasks 🎉</div>
            : urgent.slice(0,5).map(t=>(
              <div key={t._id} style={{padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <div style={{fontSize:11,color:"#E0E0F0",marginBottom:3}}>{t["Task Name"]||"Untitled"}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:8,color:"#888"}}>{t.Department||"—"}</span>
                  <Pill label={t.Status||"—"} color={sCol(t.Status)}/>
                  {t.Deadline&&<span style={{fontSize:8,color:"#555"}}>📅 {t.Deadline}</span>}
                </div>
              </div>
            ))}
        </div>

        {/* Today's dept updates */}
        <div className="card" style={{padding:16}}>
          <div style={{fontSize:9,color:"#00E5AA",letterSpacing:2,marginBottom:12}}>🏢 DEPT UPDATES TODAY — {todayUpd.length}</div>
          {todayUpd.length===0
            ? <div style={{fontSize:11,color:"#333",textAlign:"center",padding:"16px 0"}}>
                No updates synced yet.<br/><span style={{fontSize:9,color:"#2A2A3E"}}>Sync from Chat after dept conversations</span>
              </div>
            : todayUpd.map(u=>{
                const dept=DEPTS.find(d=>d.notionName===u.Department);
                return(
                  <div key={u._id} style={{padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <div style={{fontSize:10,color:dept?.color||"#00E5AA",fontWeight:600,marginBottom:3}}>{dept?.icon} {u.Department}</div>
                    <div style={{fontSize:10,color:"#888",lineHeight:1.5}}>{(u.Summary||"").slice(0,90)}...</div>
                    {u["Founder Decision Required"]==="Yes"&&<div style={{fontSize:9,color:"#FF8C42",marginTop:3}}>⚠️ Founder input required</div>}
                  </div>
                );
              })}
        </div>
      </div>

      {/* Pending decisions */}
      {pendDec.length>0&&(
        <div className="card" style={{padding:16,borderColor:"rgba(255,209,102,0.2)"}}>
          <div style={{fontSize:9,color:"#FFD166",letterSpacing:2,marginBottom:12}}>📋 DECISIONS AWAITING YOUR APPROVAL — {pendDec.length}</div>
          {pendDec.map(d=>(
            <div key={d._id} style={{padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:11,color:"#E0E0F0",marginBottom:3}}>{d["Decision Title"]||"Untitled"}</div>
                <div style={{fontSize:10,color:"#888",lineHeight:1.5,maxWidth:500}}>{(d["Decision Summary"]||"").slice(0,100)}</div>
                <div style={{display:"flex",gap:7,marginTop:4}}>
                  <span style={{fontSize:9,color: DEPTS.find(x=>x.notionName===d.Department)?.color||"#888"}}>{d.Department||"—"}</span>
                  <span style={{fontSize:9,color:"#555"}}>📅 {d.Date||"—"}</span>
                </div>
              </div>
              <Pill label="PENDING" color="#FFD166"/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SYNC VIEW ─────────────────────────────────────────────────────────────────
function SyncView({depts,toast,load}) {
  const [dept,setDept]     = useState(depts[0].notionName);
  const [summary,setSumm]  = useState("");
  const [status,setStatus] = useState("In Progress");
  const [priority,setPri]  = useState("Medium");
  const [risks,setRisks]   = useState("");
  const [founderReq,setFR] = useState(false);
  const [nextAct,setNA]    = useState("");
  const [syncing,setSyn]   = useState(false);

  const handleSync = async () => {
    if(!summary.trim()) return;
    setSyn(true);
    const r = await notionApi("syncDeptUpdate",{
      department:dept, summary, status, priority,
      risks, founderDecisionRequired:founderReq, nextActions:nextAct,
    });
    if(r.ok){ toast(`✅ ${dept} synced to Notion`); setSumm(""); setRisks(""); setNA(""); setFR(false); load(); }
    else toast("❌ Sync failed","err");
    setSyn(false);
  };

  return (
    <div className="fade" style={{maxWidth:680}}>
      <div style={{fontSize:18,fontWeight:600,marginBottom:4}}>Sync from Department Chat</div>
      <div style={{fontSize:10,color:"#555",marginBottom:20}}>After your Claude Project conversation, ask NOVI to summarise it → paste below → one click to Notion.</div>

      <div style={{background:"rgba(0,229,170,0.05)",border:"1px solid rgba(0,229,170,0.15)",borderRadius:10,padding:"12px 16px",marginBottom:20}}>
        <div style={{fontSize:10,color:"#00E5AA",letterSpacing:2,marginBottom:8}}>HOW TO USE</div>
        {["1. Finish your conversation in NOVI COO / CFO / CMO / CLO / Formulations / Market Strategy chat",
          "2. Type: \"Summarise this conversation for HQ sync — include decisions, next actions, risks, founder input needed\"",
          "3. Copy the output · Paste below · Select department · Click SYNC"].map((s,i)=>(
          <div key={i} style={{fontSize:10,color:"#888",marginBottom:4,lineHeight:1.6}}>{s}</div>
        ))}
      </div>

      <div className="card" style={{padding:20}}>
        {/* Department */}
        <div style={{marginBottom:14}}>
          <Label>Department</Label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {depts.map(d=>(
              <button key={d.id} onClick={()=>setDept(d.notionName)}
                style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${dept===d.notionName?d.color:d.color+"30"}`,background:dept===d.notionName?`${d.color}15`:"transparent",color:dept===d.notionName?d.color:"#555",fontSize:10,cursor:"pointer",transition:"all .15s",fontFamily:"inherit"}}>
                {d.icon} {d.notionName}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{marginBottom:12}}>
          <Label>Summary (paste from Claude chat)</Label>
          <Textarea value={summary} onChange={e=>setSumm(e.target.value)} rows={6} placeholder="Paste the conversation summary here..."/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div><Label>Status</Label><Select value={status} onChange={e=>setStatus(e.target.value)} options={DEPT_STATUS}/></div>
          <div><Label>Priority</Label><Select value={priority} onChange={e=>setPri(e.target.value)} options={PRIORITY}/></div>
        </div>

        <div style={{marginBottom:12}}>
          <Label>Risks identified</Label>
          <Input value={risks} onChange={e=>setRisks(e.target.value)} placeholder="Any risks from this conversation..."/>
        </div>

        <div style={{marginBottom:12}}>
          <Label>Next Actions</Label>
          <Input value={nextAct} onChange={e=>setNA(e.target.value)} placeholder="Action items from this conversation..."/>
        </div>

        <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
          <input type="checkbox" id="fr" checked={founderReq} onChange={e=>setFR(e.target.checked)}
            style={{width:16,height:16,cursor:"pointer",accentColor:"#FF8C42"}}/>
          <label htmlFor="fr" style={{fontSize:11,color:"#888",cursor:"pointer"}}>⚠️ Founder decision required from this conversation</label>
        </div>

        <BtnGreen onClick={handleSync} disabled={syncing||!summary.trim()} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"11px"}}>
          {syncing?"Syncing to Notion...":<><Ic n="sync" s={13}/> SYNC TO NOTION — {dept}</>}
        </BtnGreen>
      </div>
    </div>
  );
}

// ── TASKS VIEW ────────────────────────────────────────────────────────────────
function TasksView({tasks,toast,load,pCol,sCol}) {
  const [form,setForm] = useState(null);
  const empty = {taskName:"",department:"HQ",priority:"Medium",status:"Not Started",owner:"Jaymin",deadline:"",dependency:"",notes:""};

  const create = async () => {
    if(!form.taskName.trim()) return;
    const r = await notionApi("createTask",form);
    if(r.ok){ toast("✅ Task created in Notion"); setForm(null); load(); }
    else toast("❌ Failed to create task","err");
  };

  const sections = [
    {key:"Critical", label:"🚨 CRITICAL", color:"#FF4444"},
    {key:"High",     label:"⚡ HIGH",      color:"#FF8C00"},
    {key:"Medium",   label:"📌 MEDIUM",    color:"#FFD166"},
    {key:"Low",      label:"📋 LOW",       color:"#888"},
  ];

  return (
    <div className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div>
          <div style={{fontSize:18,fontWeight:600,marginBottom:2}}>Task Board</div>
          <div style={{fontSize:9,color:"#555",letterSpacing:1}}>{tasks.filter(t=>t.Status!=="Completed"&&t.Status!=="Deferred").length} OPEN · {tasks.length} TOTAL · LIVE FROM NOTION</div>
        </div>
        <BtnGreen onClick={()=>setForm({...empty})} style={{display:"flex",alignItems:"center",gap:6}}>
          <Ic n="plus" s={12}/> NEW TASK
        </BtnGreen>
      </div>

      {form&&(
        <div className="card" style={{padding:20,marginBottom:20,borderColor:"rgba(0,229,170,0.2)"}}>
          <div style={{fontSize:9,color:"#00E5AA",letterSpacing:2,marginBottom:14}}>CREATE TASK IN NOTION</div>
          <div style={{marginBottom:10}}><Label>Task Name</Label><Input value={form.taskName} onChange={e=>setForm(f=>({...f,taskName:e.target.value}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            <div><Label>Department</Label><Select value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} options={DEPTS.map(d=>d.notionName)}/></div>
            <div><Label>Priority</Label><Select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} options={PRIORITY}/></div>
            <div><Label>Status</Label><Select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} options={TASK_STATUS}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><Label>Owner</Label><Input value={form.owner} onChange={e=>setForm(f=>({...f,owner:e.target.value}))}/></div>
            <div><Label>Deadline</Label><Input value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} placeholder="YYYY-MM-DD"/></div>
          </div>
          <div style={{marginBottom:10}}><Label>Notes</Label><Input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
          <div style={{display:"flex",gap:8}}>
            <BtnGreen onClick={create}>CREATE IN NOTION</BtnGreen>
            <BtnGhost onClick={()=>setForm(null)}>CANCEL</BtnGhost>
          </div>
        </div>
      )}

      {sections.map(sec=>{
        const items = tasks.filter(t=>t.Priority===sec.key&&t.Status!=="Completed");
        if(!items.length) return null;
        return(
          <div key={sec.key} style={{marginBottom:18}}>
            <div style={{fontSize:9,color:sec.color,letterSpacing:2,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,height:1,background:`${sec.color}20`}}/>{sec.label} ({items.length})<div style={{flex:1,height:1,background:`${sec.color}20`}}/>
            </div>
            {items.map(t=>{
              const dept=DEPTS.find(d=>d.notionName===t.Department);
              return(
                <div key={t._id} className="card" style={{padding:"11px 14px",marginBottom:7,borderLeft:`3px solid ${pCol(t.Priority)}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <span style={{fontSize:12,color:"#D8D8F0"}}>{t["Task Name"]||"Untitled"}</span>
                    <Pill label={t.Status||"—"} color={sCol(t.Status)}/>
                  </div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    {dept&&<span style={{fontSize:9,color:dept.color}}>{dept.icon} {dept.notionName}</span>}
                    {t.Owner&&<span style={{fontSize:9,color:"#666"}}>👤 {t.Owner}</span>}
                    {t.Deadline&&<span style={{fontSize:9,color:"#555"}}>📅 {t.Deadline}</span>}
                    {t.Notes&&<span style={{fontSize:9,color:"#666"}}>📌 {t.Notes.slice(0,50)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Completed */}
      {tasks.filter(t=>t.Status==="Completed").length>0&&(
        <div style={{marginBottom:18}}>
          <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
            <div style={{flex:1,height:1,background:"#55555520"}}/>✅ COMPLETED ({tasks.filter(t=>t.Status==="Completed").length})<div style={{flex:1,height:1,background:"#55555520"}}/>
          </div>
          {tasks.filter(t=>t.Status==="Completed").map(t=>(
            <div key={t._id} className="card" style={{padding:"9px 14px",marginBottom:6,opacity:.4,borderLeft:"3px solid #00E5AA"}}>
              <span style={{fontSize:11,color:"#555",textDecoration:"line-through"}}>{t["Task Name"]||"Untitled"}</span>
              <span style={{fontSize:9,color:"#444",marginLeft:8}}>{t.Department}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── DECISIONS VIEW ────────────────────────────────────────────────────────────
function DecisionsView({decisions,pendDec,toast,load,aCol}) {
  const [form,setForm] = useState(null);
  const empty = {decisionTitle:"",department:"HQ",decisionSummary:"",reasoning:"",risks:"",founderApproval:"Pending",longTermImpact:""};

  const log = async () => {
    if(!form.decisionTitle.trim()) return;
    const r = await notionApi("logDecision",form);
    if(r.ok){ toast("✅ Decision logged in Notion"); setForm(null); load(); }
    else toast("❌ Failed to log decision","err");
  };

  return (
    <div className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div>
          <div style={{fontSize:18,fontWeight:600,marginBottom:2}}>Decision Log</div>
          <div style={{fontSize:9,color:"#555",letterSpacing:1}}>INSTITUTIONAL STRATEGIC MEMORY · {decisions.length} TOTAL · {pendDec.length} PENDING APPROVAL</div>
        </div>
        <BtnGreen onClick={()=>setForm({...empty})} style={{display:"flex",alignItems:"center",gap:6}}>
          <Ic n="plus" s={12}/> LOG DECISION
        </BtnGreen>
      </div>

      <div style={{background:"rgba(255,209,102,0.05)",border:"1px solid rgba(255,209,102,0.15)",borderRadius:10,padding:"10px 14px",marginBottom:18,fontSize:10,color:"#888",lineHeight:1.65}}>
        📋 This is your company's permanent institutional memory. Every major decision — approved or pending — is stored here forever and synced to Notion automatically.
      </div>

      {form&&(
        <div className="card" style={{padding:20,marginBottom:20,borderColor:"rgba(255,209,102,0.2)"}}>
          <div style={{fontSize:9,color:"#FFD166",letterSpacing:2,marginBottom:14}}>LOG DECISION TO NOTION</div>
          <div style={{marginBottom:10}}><Label>Decision Title</Label><Input value={form.decisionTitle} onChange={e=>setForm(f=>({...f,decisionTitle:e.target.value}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><Label>Department</Label><Select value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} options={DEPTS.map(d=>d.notionName)}/></div>
            <div><Label>Founder Approval</Label><Select value={form.founderApproval} onChange={e=>setForm(f=>({...f,founderApproval:e.target.value}))} options={APPROVAL}/></div>
          </div>
          <div style={{marginBottom:10}}><Label>Decision Summary</Label><Textarea value={form.decisionSummary} onChange={e=>setForm(f=>({...f,decisionSummary:e.target.value}))} rows={3}/></div>
          <div style={{marginBottom:10}}><Label>Reasoning</Label><Textarea value={form.reasoning} onChange={e=>setForm(f=>({...f,reasoning:e.target.value}))} rows={3}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><Label>Risks</Label><Input value={form.risks} onChange={e=>setForm(f=>({...f,risks:e.target.value}))}/></div>
            <div><Label>Long-Term Impact</Label><Input value={form.longTermImpact} onChange={e=>setForm(f=>({...f,longTermImpact:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <BtnGreen onClick={log}>LOG TO NOTION</BtnGreen>
            <BtnGhost onClick={()=>setForm(null)}>CANCEL</BtnGhost>
          </div>
        </div>
      )}

      {/* Pending first */}
      {[{label:"⏳ PENDING APPROVAL",items:pendDec,c:"#FFD166"},{label:"✅ APPROVED",items:decisions.filter(d=>d["Founder Approval"]==="Approved"),c:"#00E5AA"},{label:"❌ REJECTED",items:decisions.filter(d=>d["Founder Approval"]==="Rejected"),c:"#FF4444"},{label:"⏸️ DEFERRED",items:decisions.filter(d=>d["Founder Approval"]==="Deferred"),c:"#888"}].map(sec=>sec.items.length>0&&(
        <div key={sec.label} style={{marginBottom:20}}>
          <div style={{fontSize:9,color:sec.c,letterSpacing:2,marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
            <div style={{flex:1,height:1,background:`${sec.c}20`}}/>{sec.label} ({sec.items.length})<div style={{flex:1,height:1,background:`${sec.c}20`}}/>
          </div>
          {sec.items.map(d=>{
            const dept=DEPTS.find(x=>x.notionName===d.Department);
            return(
              <div key={d._id} className="card" style={{padding:"14px 16px",marginBottom:8,borderLeft:`4px solid ${aCol(d["Founder Approval"])}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                  <span style={{fontSize:12,fontWeight:600,color:"#E0E0F0"}}>{d["Decision Title"]||"Untitled"}</span>
                  <Pill label={d["Founder Approval"]||"Pending"} color={aCol(d["Founder Approval"])}/>
                </div>
                {d["Decision Summary"]&&<p style={{fontSize:11,color:"#888",lineHeight:1.65,marginBottom:8}}>{d["Decision Summary"]}</p>}
                {d.Reasoning&&<p style={{fontSize:10,color:"#666",lineHeight:1.55,marginBottom:8}}>💭 {d.Reasoning}</p>}
                {d.Risks&&<p style={{fontSize:10,color:"#FF8C42",marginBottom:8}}>⚠️ {d.Risks}</p>}
                {d["Long-Term Impact"]&&<p style={{fontSize:10,color:"#4FC3F7",marginBottom:8}}>🔭 {d["Long-Term Impact"]}</p>}
                <div style={{display:"flex",gap:8}}>
                  {dept&&<span style={{fontSize:9,color:dept.color}}>{dept.icon} {dept.notionName}</span>}
                  <span style={{fontSize:9,color:"#444"}}>📅 {d.Date||"—"}</span>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {decisions.length===0&&!form&&(
        <div style={{textAlign:"center",padding:"40px 0",color:"#333",fontSize:11}}>
          No decisions logged yet.<br/><span style={{fontSize:9,color:"#2A2A3E"}}>Log your first decision using the button above.</span>
        </div>
      )}
    </div>
  );
}

// ── EOD VIEW ──────────────────────────────────────────────────────────────────
function EODView({triggerEOD,tasks,updates,urgent,open}) {
  const today = new Date().toISOString().split("T")[0];
  const todayUpd = updates.filter(u=>u.Date===today);

  return (
    <div className="fade">
      <div style={{fontSize:18,fontWeight:600,marginBottom:4}}>EOD Reports</div>
      <div style={{fontSize:9,color:"#555",letterSpacing:1,marginBottom:20}}>AUTO-SENDS TO parekhjaymin11@gmail.com AT 6:00 PM IST DAILY · SAVED TO NOTION</div>

      <div style={{background:"rgba(0,229,170,0.05)",border:"1px solid rgba(0,229,170,0.15)",borderRadius:12,padding:"16px 20px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:12,color:"#00E5AA",fontWeight:600,marginBottom:4}}>🕕 Daily at 6:00 PM IST</div>
          <div style={{fontSize:10,color:"#888",marginBottom:2}}>Vercel cron runs at 12:30 UTC = 6:00 PM IST</div>
          <div style={{fontSize:9,color:"#555"}}>Report automatically saved to your Notion EOD Reports table after each send</div>
        </div>
        <BtnGreen onClick={triggerEOD} style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <Ic n="eod" s={12}/> SEND NOW
        </BtnGreen>
      </div>

      {/* Today preview */}
      <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:12}}>TODAY'S REPORT PREVIEW</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}>
        {[
          {l:"Critical",v:urgent.length,c:"#FF4444"},
          {l:"Open Tasks",v:open.length,c:"#4FC3F7"},
          {l:"Dept Updates",v:todayUpd.length,c:"#00E5AA"},
          {l:"Done Today",v:tasks.filter(t=>t.Status==="Completed").length,c:"#69F0AE"},
        ].map(s=>(
          <div key={s.l} className="card" style={{padding:"14px 16px",textAlign:"center",borderTop:`3px solid ${s.c}`}}>
            <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:9,color:"#888",marginTop:4}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{padding:16}}>
        <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:12}}>EMAIL INCLUDES</div>
        {["📊 Company snapshot with overall status (On Track / Delayed / Critical / Blocked)",
          "⚠️ Founder attention required — decisions pending + dept inputs needed",
          "🚨 Critical tasks with department, owner, deadline",
          "⚡ High priority tasks",
          "🚫 Blocked tasks that need unblocking",
          "🏢 Department updates synced today with risks",
          "📋 Decision log — pending approvals",
          "✅ Tasks completed today",
          "📋 Report saved to Notion EOD Reports table automatically"
        ].map((item,i)=>(
          <div key={i} style={{fontSize:11,color:"#888",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>{item}</div>
        ))}
      </div>
    </div>
  );
}

// ── DEPTS VIEW ────────────────────────────────────────────────────────────────
function DeptsView({depts,updates}) {
  return (
    <div className="fade">
      <div style={{fontSize:18,fontWeight:600,marginBottom:4}}>Departments</div>
      <div style={{fontSize:9,color:"#555",letterSpacing:1,marginBottom:8}}>LINKED TO YOUR CLAUDE PROJECT CHATS · NOTION SYNCED</div>
      <div style={{fontSize:10,color:"#888",marginBottom:20,background:"rgba(0,229,170,0.05)",border:"1px solid rgba(0,229,170,0.1)",borderRadius:8,padding:"10px 14px"}}>
        Click any department to open its Claude Project chat. After your conversation, use <strong style={{color:"#00E5AA"}}>Sync from Chat</strong> to push to Notion automatically.
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:12}}>
        {depts.map(d=>{
          const deptUpdates = updates.filter(u=>u.Department===d.notionName);
          const latest = deptUpdates[0];
          const hasFounderReq = deptUpdates.some(u=>u["Founder Decision Required"]==="Yes");
          return(
            <a key={d.id} href="https://claude.ai" target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
              <div className="card hov" style={{padding:"18px 16px",borderTop:`3px solid ${d.color}`,cursor:"pointer",height:"100%"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <span style={{fontSize:22}}>{d.icon}</span>
                  {hasFounderReq&&<span style={{fontSize:9,color:"#FF8C42",background:"#FF8C4215",border:"1px solid #FF8C4228",borderRadius:10,padding:"2px 6px"}}>⚠️ Input needed</span>}
                </div>
                <div style={{fontSize:12,fontWeight:600,color:d.color,marginBottom:3}}>{d.name}</div>
                <div style={{fontSize:9,color:"#444",marginBottom:8}}>{deptUpdates.length} syncs total</div>
                {latest
                  ? <div style={{fontSize:9,color:"#666",lineHeight:1.5}}>{(latest.Summary||"").slice(0,70)}...</div>
                  : <div style={{fontSize:9,color:"#2A2A3E"}}>No syncs yet — start a conversation</div>}
                <div style={{marginTop:10,display:"flex",alignItems:"center",gap:4,fontSize:8,color:"#333"}}>
                  Open Claude chat <Ic n="ext" s={8}/>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
