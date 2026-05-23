import { useState, useEffect, useCallback, useRef } from "react";

// ── YOUR 7 CLAUDE PROJECT CHATS ───────────────────────────────────────────────
const DEPTS = [
  { id:"hq",      name:"NOVI HQ",             notionName:"HQ",             icon:"🏛️", color:"#4F46E5", chatUrl:"https://claude.ai/chat/a7dad3eb-def3-4631-a991-20ff81cfae01" },
  { id:"coo",     name:"NOVI COO",            notionName:"COO",            icon:"👔", color:"#059669", chatUrl:"https://claude.ai/chat/6ec486de-12f5-4007-9025-0eb01c10ff0e" },
  { id:"cfo",     name:"NOVI CFO",            notionName:"CFO",            icon:"💰", color:"#D97706", chatUrl:"https://claude.ai/chat/c420d1fa-ec99-4953-ab43-e2b47b4924df" },
  { id:"cmo",     name:"NOVI CMO",            notionName:"CMO",            icon:"📣", color:"#DB2777", chatUrl:"https://claude.ai/chat/d44df1ba-76ae-464a-91ef-2c6d708e0bc4" },
  { id:"clo",     name:"NOVI CLO",            notionName:"CLO",            icon:"⚖️",  color:"#7C3AED", chatUrl:"https://claude.ai/chat/2cca67c7-ec65-46c4-9db1-819b224d8b87" },
  { id:"form",    name:"Formulations",        notionName:"Formulations",   icon:"🧪", color:"#0891B2", chatUrl:"https://claude.ai/chat/302e1fd9-d88a-4e99-9020-620b23ebae8c" },
  { id:"mkt",     name:"Market Strategy",     notionName:"Market Strategy",icon:"🎯", color:"#16A34A", chatUrl:"https://claude.ai/chat/c704fffd-2165-48b3-b433-bc9b0dbee7a1" },
  { id:"ops",     name:"Operations",          notionName:"Operations",     icon:"⚙️",  color:"#2563EB", chatUrl:null },
  { id:"vendors", name:"Vendors",             notionName:"Vendors",        icon:"🤝", color:"#EA580C", chatUrl:null },
  { id:"comply",  name:"Compliance",          notionName:"Compliance",     icon:"📋", color:"#CA8A04", chatUrl:null },
];

const PRIORITY    = ["Low","Medium","High","Critical"];
const DEPT_STATUS = ["Planned","In Progress","Blocked","Completed","On Hold"];
const TASK_STATUS = ["Not Started","In Progress","Blocked","Completed","Deferred"];
const APPROVAL    = ["Approved","Pending","Rejected","Deferred"];

const pCol = p => ({ Critical:"#EF4444", High:"#F97316", Medium:"#F59E0B", Low:"#9CA3AF" }[p]||"#9CA3AF");
const sBg  = s => ({ "Not Started":"#FEF3C7","In Progress":"#DBEAFE","Completed":"#D1FAE5","Blocked":"#FEE2E2","Deferred":"#F3F4F6","Planned":"#DBEAFE","On Hold":"#F3F4F6" }[s]||"#F3F4F6");
const sFg  = s => ({ "Not Started":"#92400E","In Progress":"#1E40AF","Completed":"#065F46","Blocked":"#991B1B","Deferred":"#6B7280","Planned":"#1E40AF","On Hold":"#6B7280" }[s]||"#6B7280");
const aBg  = a => ({ Approved:"#D1FAE5",Pending:"#FEF3C7",Rejected:"#FEE2E2",Deferred:"#F3F4F6" }[a]||"#F3F4F6");
const aFg  = a => ({ Approved:"#065F46",Pending:"#92400E",Rejected:"#991B1B",Deferred:"#6B7280" }[a]||"#6B7280");

// ── API ───────────────────────────────────────────────────────────────────────
const notionApi = async (action, payload=null) => {
  try {
    const r = await fetch("/api/notion", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action, payload }),
    });
    return r.json();
  } catch { return { ok:false, error:"Network error" }; }
};

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Ic = ({ n, s=16 }) => {
  const m = {
    dash   :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    sync   :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    task   :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    decide :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    eod    :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    dept   :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    menu   :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    plus   :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    ext    :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
    notion :<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M4 2h11l5 5v15H4V2zm0 0v20m11-20v5h5"/></svg>,
    close  :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    send   :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    chat   :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    check  :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    info   :<svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  };
  return m[n]||null;
};

// ── REUSABLE COMPONENTS ───────────────────────────────────────────────────────
const Badge = ({label,bg,fg}) => (
  <span style={{background:bg,color:fg,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:500,whiteSpace:"nowrap",display:"inline-block"}}>{label}</span>
);

const Card = ({children,style={}}) => (
  <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"20px 24px",...style}}>{children}</div>
);

const SectionTitle = ({children}) => (
  <h2 style={{fontSize:20,fontWeight:700,color:"#111827",marginBottom:4}}>{children}</h2>
);

const SectionSub = ({children}) => (
  <p style={{fontSize:13,color:"#6B7280",marginBottom:24}}>{children}</p>
);

const Inp = ({value,onChange,placeholder,type="text",style={}}) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{width:"100%",border:"1px solid #E5E7EB",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#111827",background:"#fff",fontFamily:"inherit",outline:"none",...style}}
    onFocus={e=>e.target.style.borderColor="#4F46E5"}
    onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
);

const Txta = ({value,onChange,placeholder,rows=4}) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    style={{width:"100%",border:"1px solid #E5E7EB",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#111827",background:"#fff",fontFamily:"inherit",outline:"none",resize:"vertical"}}
    onFocus={e=>e.target.style.borderColor="#4F46E5"}
    onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
);

const Sel = ({value,onChange,options}) => (
  <select value={value} onChange={onChange}
    style={{width:"100%",border:"1px solid #E5E7EB",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#111827",background:"#fff",fontFamily:"inherit",outline:"none",cursor:"pointer"}}>
    {options.map(o=><option key={o} value={o}>{o}</option>)}
  </select>
);

const Field = ({label,children}) => (
  <div style={{marginBottom:14}}>
    <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5}}>{label}</label>
    {children}
  </div>
);

const Btn = ({onClick,disabled,children,variant="primary",small=false,style={}}) => {
  const s = {
    primary:{background:"#111827",color:"#fff",border:"none"},
    outline:{background:"#fff",color:"#374151",border:"1px solid #E5E7EB"},
    indigo :{background:"#4F46E5",color:"#fff",border:"none"},
    green  :{background:"#059669",color:"#fff",border:"none"},
    danger :{background:"#EF4444",color:"#fff",border:"none"},
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{...s[variant],borderRadius:8,padding:small?"6px 12px":"9px 18px",fontSize:small?12:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,display:"inline-flex",alignItems:"center",gap:6,transition:"all .15s",fontFamily:"inherit",...style}}>
      {children}
    </button>
  );
};

// ── TASK DETAIL MODAL ─────────────────────────────────────────────────────────
function TaskModal({task, onClose}) {
  const dept = DEPTS.find(d=>d.notionName===task.Department);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,padding:28,maxWidth:560,width:"100%",maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div style={{flex:1,paddingRight:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              {dept&&<span style={{fontSize:18}}>{dept.icon}</span>}
              <span style={{fontSize:12,fontWeight:600,color:dept?.color||"#6B7280"}}>{task.Department}</span>
            </div>
            <h2 style={{fontSize:18,fontWeight:700,color:"#111827",lineHeight:1.4}}>{task["Task Name"]||"Untitled"}</h2>
          </div>
          <button onClick={onClose} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:8,cursor:"pointer",color:"#6B7280",flexShrink:0}}><Ic n="close" s={16}/></button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          {[
            ["Priority",  <Badge label={task.Priority||"—"} bg={task.Priority==="Critical"?"#FEE2E2":task.Priority==="High"?"#FFEDD5":task.Priority==="Medium"?"#FEF3C7":"#F3F4F6"} fg={pCol(task.Priority)}/>],
            ["Status",    <Badge label={task.Status||"—"} bg={sBg(task.Status)} fg={sFg(task.Status)}/>],
            ["Owner",     <span style={{fontSize:13,color:"#374151"}}>👤 {task.Owner||"—"}</span>],
            ["Deadline",  <span style={{fontSize:13,color:"#374151"}}>📅 {task.Deadline||"Not set"}</span>],
          ].map(([label,val])=>(
            <div key={label} style={{background:"#F9FAFB",borderRadius:8,padding:"10px 14px"}}>
              <div style={{fontSize:11,fontWeight:600,color:"#9CA3AF",marginBottom:4}}>{label}</div>
              {val}
            </div>
          ))}
        </div>

        {task.Notes&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Notes</div>
            <div style={{background:"#F9FAFB",borderRadius:8,padding:"12px 14px",fontSize:13,color:"#4B5563",lineHeight:1.65}}>{task.Notes}</div>
          </div>
        )}
        {task.Dependency&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Dependencies</div>
            <div style={{background:"#FEF3C7",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#92400E"}}>⚠️ {task.Dependency}</div>
          </div>
        )}
        {task._url&&(
          <a href={task._url} target="_blank" rel="noreferrer"
            style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,color:"#4F46E5",textDecoration:"none",marginTop:8}}>
            <Ic n="ext" s={13}/> Open in Notion
          </a>
        )}
      </div>
    </div>
  );
}

// ── QUICK COMMAND BAR ─────────────────────────────────────────────────────────
function CommandBar({toast, load}) {
  const [input,  setInput]  = useState("");
  const [loading,setLoading]= useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  // Parse natural language command into structured task
  const parseCommand = (text) => {
    const lower = text.toLowerCase();
    let priority = "Medium";
    let dept     = "HQ";
    let deadline = "";

    if (lower.includes("urgent") || lower.includes("asap") || lower.includes("critical")) priority = "Critical";
    else if (lower.includes("high") || lower.includes("important"))                         priority = "High";
    else if (lower.includes("low") || lower.includes("later"))                              priority = "Low";

    DEPTS.forEach(d => {
      if (lower.includes(d.notionName.toLowerCase()) || lower.includes(d.name.toLowerCase())) {
        dept = d.notionName;
      }
    });

    const dateMatch = text.match(/by\s+(\w+\s+\d+|\d{4}-\d{2}-\d{2}|tomorrow|today|friday|monday)/i);
    if (dateMatch) deadline = dateMatch[1];

    // Clean task name — remove command words
    let taskName = text
      .replace(/^(do|create|add|make|task[:\s]+)/i, "")
      .replace(/(urgent|asap|critical|high priority|low priority)/i, "")
      .replace(/by\s+\w+(\s+\d+)?/i, "")
      .trim();

    if (taskName.length < 3) taskName = text;

    return { taskName, department: dept, priority, status: "Not Started", owner: "Jaymin", deadline, notes: `Created via Command Bar: "${text}"` };
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setResult(null);

    const parsed = parseCommand(input);
    const r = await notionApi("createTask", parsed);

    if (r.ok) {
      setResult({ ok:true, task:parsed });
      toast(`✓ Task created: "${parsed.taskName}"`);
      setInput("");
      load();
    } else {
      setResult({ ok:false, error:r.error });
      toast("Failed to create task","err");
    }
    setLoading(false);
  };

  return (
    <Card style={{marginBottom:24,borderColor:"#C7D2FE",background:"linear-gradient(135deg,#EEF2FF,#F8FAFF)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:18}}>⚡</span>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#111827"}}>Quick Command</div>
          <div style={{fontSize:12,color:"#6B7280"}}>Type any task in plain English → auto-creates in Notion</div>
        </div>
      </div>

      <div style={{display:"flex",gap:8}}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")handleSend();}}
          placeholder='e.g. "Do trademark filing — urgent Legal" or "Create budget report for CFO by Friday"'
          style={{flex:1,border:"1px solid #C7D2FE",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#111827",background:"#fff",fontFamily:"inherit",outline:"none"}}
          onFocus={e=>e.target.style.borderColor="#4F46E5"}
          onBlur={e=>e.target.style.borderColor="#C7D2FE"}/>
        <Btn onClick={handleSend} disabled={loading||!input.trim()} variant="indigo">
          {loading ? "Creating..." : <><Ic n="send" s={14}/> Create</>}
        </Btn>
      </div>

      {result?.ok && (
        <div style={{marginTop:10,padding:"10px 14px",background:"#D1FAE5",borderRadius:8,display:"flex",alignItems:"center",gap:8}}>
          <Ic n="check" s={14}/>
          <div style={{fontSize:12,color:"#065F46"}}>
            <strong>Task created in Notion:</strong> {result.task.taskName}
            <span style={{marginLeft:8,opacity:.7}}>· {result.task.department} · {result.task.priority}</span>
          </div>
        </div>
      )}

      <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
        {[
          "Do trademark filing — urgent Compliance",
          "Create Q3 budget report CFO",
          "Follow up with vendor Operations",
          "Finalise label design Formulations",
        ].map(ex=>(
          <button key={ex} onClick={()=>setInput(ex)}
            style={{fontSize:11,color:"#4F46E5",background:"#EEF2FF",border:"1px solid #C7D2FE",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontFamily:"inherit"}}>
            {ex}
          </button>
        ))}
      </div>
    </Card>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function NOVIApp() {
  const [tab,       setTab]  = useState("dashboard");
  const [mobileNav, setMN]   = useState(false);
  const [tasks,     setTasks]= useState([]);
  const [updates,   setUpd]  = useState([]);
  const [decisions, setDec]  = useState([]);
  const [loading,   setLoad] = useState(true);
  const [notif,     setNotif]= useState(null);

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
    toast("Sending EOD report...");
    try {
      const r = await fetch("/api/eod-email?trigger=manual");
      const d = await r.json();
      if(d.ok) toast("EOD report sent to parekhjaymin11@gmail.com ✓");
      else toast(`EOD failed: ${d.error||"Unknown error"}`,"err");
    } catch(e) { toast(`EOD failed: ${e.message}`,"err"); }
  };

  const urgent    = tasks.filter(t=>t.Priority==="Critical"&&t.Status!=="Completed");
  const blocked   = tasks.filter(t=>t.Status==="Blocked");
  const open      = tasks.filter(t=>t.Status!=="Completed"&&t.Status!=="Deferred");
  const pendDec   = decisions.filter(d=>d["Founder Approval"]==="Pending");
  const founderReq= updates.filter(u=>u["Founder Decision Required"]==="Yes");

  const nav = [
    {id:"dashboard", label:"Dashboard",      icon:"dash"},
    {id:"command",   label:"Quick Command",  icon:"chat",  badge:0},
    {id:"sync",      label:"Sync from Chat", icon:"sync",  badge:0},
    {id:"tasks",     label:"Tasks",          icon:"task",  badge:open.length},
    {id:"decisions", label:"Decisions",      icon:"decide",badge:pendDec.length},
    {id:"eod",       label:"EOD Reports",    icon:"eod"},
    {id:"depts",     label:"Departments",    icon:"dept"},
  ];

  const NavItems = () => (
    <>
      <div style={{padding:"0 10px 8px",fontSize:11,fontWeight:600,color:"#9CA3AF",letterSpacing:1,textTransform:"uppercase"}}>Menu</div>
      {nav.map(item=>(
        <button key={item.id} onClick={()=>{setTab(item.id);setMN(false);}}
          style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,border:"none",background:tab===item.id?"#EEF2FF":"transparent",color:tab===item.id?"#4F46E5":"#6B7280",fontSize:13,fontWeight:tab===item.id?600:400,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .15s",marginBottom:2}}>
          <span style={{color:tab===item.id?"#4F46E5":"#9CA3AF"}}><Ic n={item.icon} s={16}/></span>
          {item.label}
          {item.badge>0&&<span style={{marginLeft:"auto",background:"#EF4444",color:"#fff",fontSize:11,borderRadius:20,padding:"1px 7px",fontWeight:700}}>{item.badge}</span>}
        </button>
      ))}

      <div style={{padding:"16px 10px 6px",fontSize:11,fontWeight:600,color:"#9CA3AF",letterSpacing:1,textTransform:"uppercase"}}>Department Chats</div>
      {DEPTS.filter(d=>d.chatUrl).map(d=>(
        <a key={d.id} href={d.chatUrl} target="_blank" rel="noreferrer"
          style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",borderRadius:8,color:"#6B7280",fontSize:13,textDecoration:"none",transition:"all .15s",marginBottom:2}}
          onMouseEnter={e=>{e.currentTarget.style.background="#F9FAFB";e.currentTarget.style.color="#111827";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#6B7280";}}>
          <span style={{fontSize:15}}>{d.icon}</span>
          <span>{d.name}</span>
          <span style={{marginLeft:"auto",color:"#D1D5DB"}}><Ic n="ext" s={11}/></span>
        </a>
      ))}
    </>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F9FAFB",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",color:"#111827"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:4px;}
        input,textarea,select,button{font-family:inherit;}
        .fade{animation:fd .2s ease;}@keyframes fd{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .notif{animation:si .25s ease;}@keyframes si{from{transform:translateX(110%)}to{transform:translateX(0)}}
        .task-row:hover{background:#F9FAFB!important;cursor:pointer;}
        @media(max-width:768px){
          .desktop-sidebar{display:none!important;}
          .main-content{margin-left:0!important;padding-top:56px!important;}
          .page-pad{padding:16px!important;}
          .stat-grid{grid-template-columns:1fr 1fr!important;}
          .two-col{grid-template-columns:1fr!important;}
          .form-grid{grid-template-columns:1fr!important;}
        }
        @media(min-width:769px){
          .mobile-header{display:none!important;}
          .mobile-overlay{display:none!important;}
        }
      `}</style>

      {/* DESKTOP SIDEBAR */}
      <aside className="desktop-sidebar" style={{position:"fixed",top:0,left:0,width:240,height:"100vh",background:"#fff",borderRight:"1px solid #E5E7EB",display:"flex",flexDirection:"column",zIndex:100,overflowY:"auto"}}>
        <div style={{padding:"22px 18px 14px",borderBottom:"1px solid #F3F4F6"}}>
          <div style={{fontSize:22,fontWeight:800,color:"#111827",letterSpacing:-0.5}}>NOVI OS</div>
          <div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>Founder Command Centre</div>
          <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
            {urgent.length>0&&<span style={{background:"#FEE2E2",color:"#991B1B",fontSize:11,borderRadius:20,padding:"2px 8px",fontWeight:600}}>{urgent.length} Critical</span>}
            {pendDec.length>0&&<span style={{background:"#FEF3C7",color:"#92400E",fontSize:11,borderRadius:20,padding:"2px 8px",fontWeight:600}}>{pendDec.length} Pending</span>}
            {open.length>0&&<span style={{background:"#DBEAFE",color:"#1E40AF",fontSize:11,borderRadius:20,padding:"2px 8px",fontWeight:600}}>{open.length} Open</span>}
          </div>
        </div>
        <nav style={{flex:1,padding:"12px 10px",overflowY:"auto"}}><NavItems/></nav>
        <div style={{padding:"12px 14px 20px",borderTop:"1px solid #F3F4F6",display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={triggerEOD} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",background:"#111827",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            <Ic n="eod" s={14}/> Send EOD Report
          </button>
          <a href="https://www.notion.so/NOVI-HQ-Dashboard-36009180590980dc98c3f6e2b02a9a15" target="_blank" rel="noreferrer"
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px",background:"#F9FAFB",color:"#374151",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13,fontWeight:500,textDecoration:"none"}}>
            <Ic n="notion" s={13}/> Open Notion
          </a>
          <div style={{fontSize:11,color:"#9CA3AF",textAlign:"center"}}>Auto EOD at 6:00 PM IST</div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="mobile-header" style={{display:"none",position:"fixed",top:0,left:0,right:0,height:56,background:"#fff",borderBottom:"1px solid #E5E7EB",alignItems:"center",padding:"0 16px",zIndex:100,gap:12}}>
        <button onClick={()=>setMN(true)} style={{background:"none",border:"none",cursor:"pointer",color:"#374151",padding:4}}><Ic n="menu" s={20}/></button>
        <div style={{fontSize:16,fontWeight:800,color:"#111827"}}>NOVI OS</div>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          {urgent.length>0&&<span style={{background:"#FEE2E2",color:"#991B1B",fontSize:11,borderRadius:20,padding:"2px 8px",fontWeight:600}}>{urgent.length}</span>}
          <button onClick={load} style={{background:"none",border:"1px solid #E5E7EB",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",color:"#6B7280"}}>↻</button>
        </div>
      </header>

      {/* MOBILE NAV OVERLAY */}
      {mobileNav&&(
        <div className="mobile-overlay" style={{position:"fixed",inset:0,zIndex:200}}>
          <div onClick={()=>setMN(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)"}}/>
          <div style={{position:"absolute",top:0,left:0,width:280,height:"100vh",background:"#fff",overflowY:"auto",padding:"16px 10px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 14px 16px",borderBottom:"1px solid #F3F4F6",marginBottom:8}}>
              <div style={{fontSize:18,fontWeight:800}}>NOVI OS</div>
              <button onClick={()=>setMN(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF"}}><Ic n="close" s={20}/></button>
            </div>
            <NavItems/>
            <div style={{padding:"16px 14px 0",borderTop:"1px solid #F3F4F6",marginTop:8}}>
              <button onClick={()=>{triggerEOD();setMN(false);}} style={{width:"100%",padding:"10px",background:"#111827",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>Send EOD Report</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="main-content" style={{marginLeft:240,minHeight:"100vh"}}>
        <div style={{background:"#fff",borderBottom:"1px solid #E5E7EB",padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
          <div>
            <h1 style={{fontSize:15,fontWeight:700,color:"#111827"}}>{nav.find(n=>n.id===tab)?.label}</h1>
            <p style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {founderReq.length>0&&<span style={{background:"#FEF3C7",color:"#92400E",fontSize:12,borderRadius:6,padding:"4px 10px",fontWeight:500}}>⚠️ {founderReq.length} input needed</span>}
            <button onClick={load} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",background:"#fff",border:"1px solid #E5E7EB",borderRadius:8,color:"#374151",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>
              <Ic n="sync" s={13}/> Refresh
            </button>
          </div>
        </div>

        <div className="page-pad" style={{padding:"28px 32px",maxWidth:1100}}>
          {loading
            ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,gap:12}}>
                <div style={{width:36,height:36,border:"3px solid #E5E7EB",borderTopColor:"#4F46E5",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{color:"#9CA3AF",fontSize:14}}>Loading from Notion...</p>
              </div>
            : <div className="fade">
                {tab==="dashboard" && <DashView tasks={tasks} updates={updates} decisions={decisions} urgent={urgent} blocked={blocked} open={open} pendDec={pendDec} founderReq={founderReq} setTab={setTab} toast={toast} load={load}/>}
                {tab==="command"   && <CommandView toast={toast} load={load}/>}
                {tab==="sync"      && <SyncView depts={DEPTS} toast={toast} load={load}/>}
                {tab==="tasks"     && <TasksView tasks={tasks} toast={toast} load={load}/>}
                {tab==="decisions" && <DecisionsView decisions={decisions} pendDec={pendDec} toast={toast} load={load}/>}
                {tab==="eod"       && <EODView triggerEOD={triggerEOD} tasks={tasks} updates={updates} urgent={urgent} open={open}/>}
                {tab==="depts"     && <DeptsView depts={DEPTS} updates={updates}/>}
              </div>
          }
        </div>
      </main>

      {notif&&<div className="notif" style={{position:"fixed",bottom:24,right:24,background:notif.t==="ok"?"#111827":"#EF4444",color:"#fff",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:500,zIndex:999,boxShadow:"0 4px 16px rgba(0,0,0,0.15)",maxWidth:340}}>{notif.msg}</div>}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function DashView({tasks,updates,decisions,urgent,blocked,open,pendDec,founderReq,setTab,toast,load}) {
  const today    = new Date().toISOString().split("T")[0];
  const todayUpd = updates.filter(u=>u.Date===today);
  const hr       = new Date().getHours();
  const greeting = hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
  const [selTask,setSelTask] = useState(null);

  return (
    <div>
      {selTask&&<TaskModal task={selTask} onClose={()=>setSelTask(null)}/>}

      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:800,color:"#111827",marginBottom:4}}>{greeting}, Jaymin 👋</h1>
        <p style={{fontSize:13,color:"#6B7280"}}>Here's your NOVI company status for today.</p>
      </div>

      {/* Command Bar on Dashboard */}
      <CommandBar toast={toast} load={load}/>

      {/* Alert */}
      {(urgent.length>0||founderReq.length>0||pendDec.length>0)&&(
        <div style={{background:"#FFFBEB",border:"1px solid #FCD34D",borderRadius:10,padding:"14px 18px",marginBottom:20,display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:600,color:"#92400E"}}>⚠️ Needs attention:</span>
          {urgent.map(t=><span key={t._id} style={{background:"#FEE2E2",color:"#991B1B",fontSize:12,borderRadius:6,padding:"3px 10px"}}>🚨 {t["Task Name"]}</span>)}
          {founderReq.slice(0,2).map(u=><span key={u._id} style={{background:"#FEF3C7",color:"#92400E",fontSize:12,borderRadius:6,padding:"3px 10px"}}>📋 {u.Department} needs input</span>)}
          {pendDec.slice(0,2).map(d=><span key={d._id} style={{background:"#EDE9FE",color:"#5B21B6",fontSize:12,borderRadius:6,padding:"3px 10px"}}>⏳ {d["Decision Title"]?.slice(0,25)}</span>)}
        </div>
      )}

      {/* Stats */}
      <div className="stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        {[
          {l:"Critical Tasks",  v:urgent.length,  sub:"Immediate action",   c:"#EF4444",t:"tasks"},
          {l:"Blocked Tasks",   v:blocked.length, sub:"Needs unblocking",   c:"#F97316",t:"tasks"},
          {l:"Open Tasks",      v:open.length,    sub:"Across departments", c:"#3B82F6",t:"tasks"},
          {l:"Pending Decisions",v:pendDec.length,sub:"Awaiting approval",  c:"#8B5CF6",t:"decisions"},
        ].map(s=>(
          <div key={s.l} onClick={()=>setTab(s.t)}
            style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"18px 20px",cursor:"pointer",transition:"all .15s",borderLeft:`4px solid ${s.c}`}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.08)"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
            <div style={{fontSize:30,fontWeight:800,color:s.c,lineHeight:1,marginBottom:5}}>{s.v}</div>
            <div style={{fontSize:13,fontWeight:600,color:"#111827",marginBottom:2}}>{s.l}</div>
            <div style={{fontSize:11,color:"#9CA3AF"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        {/* Critical tasks — clickable */}
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:700,color:"#111827"}}>🚨 Critical Tasks</h3>
            <button onClick={()=>setTab("tasks")} style={{fontSize:12,color:"#4F46E5",background:"none",border:"none",cursor:"pointer",fontWeight:500}}>View all →</button>
          </div>
          {urgent.length===0
            ? <div style={{textAlign:"center",padding:"20px 0",color:"#9CA3AF",fontSize:13}}>No critical tasks 🎉</div>
            : urgent.slice(0,4).map(t=>(
              <div key={t._id} className="task-row" onClick={()=>setSelTask(t)}
                style={{padding:"10px 8px",borderBottom:"1px solid #F3F4F6",borderRadius:6,transition:"background .15s"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#111827",marginBottom:4}}>{t["Task Name"]||"Untitled"}</div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  {DEPTS.find(d=>d.notionName===t.Department)&&<span style={{fontSize:11,color:DEPTS.find(d=>d.notionName===t.Department)?.color,fontWeight:500}}>{DEPTS.find(d=>d.notionName===t.Department)?.icon} {t.Department}</span>}
                  <Badge label={t.Status||"—"} bg={sBg(t.Status)} fg={sFg(t.Status)}/>
                  {t.Deadline&&<span style={{fontSize:11,color:"#9CA3AF"}}>📅 {t.Deadline}</span>}
                </div>
              </div>
            ))}
        </Card>

        {/* Today's updates */}
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:700,color:"#111827"}}>🏢 Today's Updates</h3>
            <button onClick={()=>setTab("sync")} style={{fontSize:12,color:"#4F46E5",background:"none",border:"none",cursor:"pointer",fontWeight:500}}>Sync →</button>
          </div>
          {todayUpd.length===0
            ? <div style={{textAlign:"center",padding:"20px 0"}}>
                <p style={{color:"#9CA3AF",fontSize:13,marginBottom:8}}>No updates synced today</p>
                <button onClick={()=>setTab("sync")} style={{fontSize:12,color:"#4F46E5",background:"#EEF2FF",border:"none",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontWeight:500}}>Sync from Chat →</button>
              </div>
            : todayUpd.map(u=>{
                const dept=DEPTS.find(d=>d.notionName===u.Department);
                return(
                  <div key={u._id} style={{padding:"10px 0",borderBottom:"1px solid #F3F4F6"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{fontSize:14}}>{dept?.icon}</span>
                      <span style={{fontSize:13,fontWeight:600,color:dept?.color||"#374151"}}>{u.Department}</span>
                      {u["Founder Decision Required"]==="Yes"&&<span style={{fontSize:11,background:"#FEF3C7",color:"#92400E",borderRadius:4,padding:"1px 6px"}}>Input needed</span>}
                    </div>
                    <p style={{fontSize:12,color:"#6B7280",lineHeight:1.5}}>{(u.Summary||"").slice(0,90)}{u.Summary?.length>90?"...":""}</p>
                  </div>
                );
              })}
        </Card>
      </div>

      {/* Pending decisions */}
      {pendDec.length>0&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:700,color:"#111827"}}>📋 Decisions Awaiting Approval</h3>
            <button onClick={()=>setTab("decisions")} style={{fontSize:12,color:"#4F46E5",background:"none",border:"none",cursor:"pointer",fontWeight:500}}>View all →</button>
          </div>
          {pendDec.slice(0,3).map(d=>{
            const dept=DEPTS.find(x=>x.notionName===d.Department);
            return(
              <div key={d._id} style={{padding:"12px 0",borderBottom:"1px solid #F3F4F6",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#111827",marginBottom:3}}>{d["Decision Title"]||"Untitled"}</div>
                  <div style={{fontSize:12,color:"#6B7280",marginBottom:4}}>{(d["Decision Summary"]||"").slice(0,80)}</div>
                  <div style={{display:"flex",gap:8}}>
                    {dept&&<span style={{fontSize:11,color:dept.color,fontWeight:500}}>{dept.icon} {dept.name}</span>}
                    <span style={{fontSize:11,color:"#9CA3AF"}}>📅 {d.Date}</span>
                  </div>
                </div>
                <Badge label="Pending" bg="#FEF3C7" fg="#92400E"/>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// ── COMMAND VIEW (dedicated page) ─────────────────────────────────────────────
function CommandView({toast,load}) {
  const [input,   setInput]  = useState("");
  const [loading, setLoading]= useState(false);
  const [history, setHistory]= useState([]);

  const parseCommand = (text) => {
    const lower = text.toLowerCase();
    let priority="Medium", dept="HQ", deadline="";

    if(lower.includes("urgent")||lower.includes("asap")||lower.includes("critical")) priority="Critical";
    else if(lower.includes("high")||lower.includes("important")) priority="High";
    else if(lower.includes("low")||lower.includes("later")) priority="Low";

    DEPTS.forEach(d=>{
      if(lower.includes(d.notionName.toLowerCase())||lower.includes(d.name.toLowerCase())) dept=d.notionName;
    });

    const dm=text.match(/by\s+(\w+\s+\d+|\d{4}-\d{2}-\d{2}|tomorrow|today|friday|monday)/i);
    if(dm) deadline=dm[1];

    let taskName=text.replace(/^(do|create|add|make|task[:\s]+)/i,"").replace(/(urgent|asap|critical|high priority|low priority)/gi,"").replace(/by\s+\w+(\s+\d+)?/i,"").trim();
    if(taskName.length<3) taskName=text;

    return {taskName,department:dept,priority,status:"Not Started",owner:"Jaymin",deadline,notes:`Created via Quick Command: "${text}"`};
  };

  const handleSend = async () => {
    if(!input.trim()||loading) return;
    const cmd=input;
    setInput(""); setLoading(true);
    const parsed=parseCommand(cmd);
    const r=await notionApi("createTask",parsed);
    setHistory(h=>[{cmd,parsed,ok:r.ok,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})},...h.slice(0,9)]);
    if(r.ok){toast(`✓ Task created: "${parsed.taskName}"`);load();}
    else toast("Failed to create task","err");
    setLoading(false);
  };

  return(
    <div style={{maxWidth:680}}>
      <SectionTitle>Quick Command</SectionTitle>
      <SectionSub>Type any task in plain English. NOVI parses it and creates in Notion instantly.</SectionSub>

      <Card style={{marginBottom:20,borderColor:"#C7D2FE",background:"#F5F3FF"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#4F46E5",marginBottom:10}}>How it works</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            ["\"Do trademark filing — urgent Compliance\"","Creates Critical task in Compliance"],
            ["\"Create budget report CFO by Friday\"",     "Creates task for CFO dept with deadline"],
            ["\"Add vendor connect task Operations\"",      "Creates task in Operations dept"],
            ["\"High priority: label design Formulations\"","Creates High priority Formulations task"],
          ].map(([ex,desc])=>(
            <div key={ex} style={{background:"#fff",borderRadius:8,padding:"10px 12px",cursor:"pointer",border:"1px solid #E5E7EB"}} onClick={()=>setInput(ex)}>
              <div style={{fontSize:11,color:"#4F46E5",fontWeight:600,marginBottom:3}}>"{ex}"</div>
              <div style={{fontSize:11,color:"#6B7280"}}>{desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{marginBottom:20}}>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")handleSend();}}
            placeholder='e.g. "Do XYZ task urgent Legal" or "Create ABC report CFO"'
            style={{flex:1,border:"1px solid #E5E7EB",borderRadius:8,padding:"11px 14px",fontSize:13,color:"#111827",background:"#fff",fontFamily:"inherit",outline:"none"}}
            onFocus={e=>e.target.style.borderColor="#4F46E5"}
            onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
          <Btn onClick={handleSend} disabled={loading||!input.trim()} variant="indigo">
            {loading?"Creating...":<><Ic n="send" s={14}/> Create Task</>}
          </Btn>
        </div>
        <div style={{fontSize:11,color:"#9CA3AF"}}>Press Enter or click Create · Task goes directly to Notion</div>
      </Card>

      {/* Command history */}
      {history.length>0&&(
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:12}}>Recent Commands</div>
          {history.map((h,i)=>(
            <div key={i} style={{padding:"10px 0",borderBottom:"1px solid #F3F4F6",display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:h.ok?"#D1FAE5":"#FEE2E2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                <span style={{fontSize:10,color:h.ok?"#065F46":"#991B1B"}}>{h.ok?"✓":"✗"}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:"#9CA3AF",marginBottom:2}}>{h.time}</div>
                <div style={{fontSize:13,color:"#111827",fontWeight:500,marginBottom:2}}>"{h.cmd}"</div>
                {h.ok&&<div style={{fontSize:11,color:"#6B7280"}}>→ {h.parsed.taskName} · {h.parsed.department} · <span style={{color:pCol(h.parsed.priority),fontWeight:600}}>{h.parsed.priority}</span></div>}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── SYNC VIEW ─────────────────────────────────────────────────────────────────
function SyncView({depts,toast,load}) {
  const [dept,   setDept]  = useState(depts[0].notionName);
  const [summary,setSumm]  = useState("");
  const [status, setStatus]= useState("In Progress");
  const [priority,setPri]  = useState("Medium");
  const [risks,  setRisks] = useState("");
  const [fr,     setFR]    = useState(false);
  const [nextAct,setNA]    = useState("");
  const [syncing,setSyn]   = useState(false);

  const handleSync=async()=>{
    if(!summary.trim()) return;
    setSyn(true);
    const r=await notionApi("syncDeptUpdate",{department:dept,summary,status,priority,risks,founderDecisionRequired:fr,nextActions:nextAct});
    if(r.ok){toast(`${dept} synced to Notion ✓`);setSumm("");setRisks("");setNA("");setFR(false);load();}
    else toast("Sync failed — check Notion connection","err");
    setSyn(false);
  };

  return(
    <div style={{maxWidth:680}}>
      <SectionTitle>Sync from Department Chat</SectionTitle>
      <SectionSub>After your Claude conversation, ask NOVI to summarise it, paste below, and sync to Notion in one click.</SectionSub>

      <Card style={{marginBottom:20,background:"#F0FDF4",borderColor:"#BBF7D0"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#065F46",marginBottom:8}}>Steps</div>
        {["1. Finish conversation in any NOVI department chat (COO, CFO, CMO, CLO, etc.)",
          "2. Type: \"Summarise this for HQ sync — include decisions, next actions, risks, founder input needed\"",
          "3. Copy Claude's output → paste below → click Sync"
        ].map((s,i)=><p key={i} style={{fontSize:12,color:"#047857",marginBottom:3,lineHeight:1.6}}>{s}</p>)}
      </Card>

      <Card>
        <Field label="Department">
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {depts.map(d=>(
              <button key={d.id} onClick={()=>setDept(d.notionName)}
                style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${dept===d.notionName?d.color:"#E5E7EB"}`,background:dept===d.notionName?`${d.color}15`:"#fff",color:dept===d.notionName?d.color:"#6B7280",fontSize:12,fontWeight:dept===d.notionName?600:400,cursor:"pointer",transition:"all .15s",fontFamily:"inherit"}}>
                {d.icon} {d.notionName}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Paste summary from Claude chat">
          <Txta value={summary} onChange={e=>setSumm(e.target.value)} rows={6} placeholder="Paste the conversation summary here..."/>
        </Field>

        <div className="form-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:0}}>
          <Field label="Status"><Sel value={status} onChange={e=>setStatus(e.target.value)} options={DEPT_STATUS}/></Field>
          <Field label="Priority"><Sel value={priority} onChange={e=>setPri(e.target.value)} options={PRIORITY}/></Field>
        </div>

        <Field label="Risks Identified">
          <Inp value={risks} onChange={e=>setRisks(e.target.value)} placeholder="Any risks from this conversation..."/>
        </Field>

        <Field label="Next Actions">
          <Inp value={nextAct} onChange={e=>setNA(e.target.value)} placeholder="Action items..."/>
        </Field>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,padding:"12px 14px",background:"#FFFBEB",borderRadius:8,border:"1px solid #FCD34D"}}>
          <input type="checkbox" id="fr" checked={fr} onChange={e=>setFR(e.target.checked)} style={{width:16,height:16,cursor:"pointer",accentColor:"#F59E0B"}}/>
          <label htmlFor="fr" style={{fontSize:13,color:"#92400E",cursor:"pointer"}}>⚠️ Founder decision required from this conversation</label>
        </div>

        <Btn onClick={handleSync} disabled={syncing||!summary.trim()} variant="indigo" style={{width:"100%",justifyContent:"center",padding:"11px"}}>
          {syncing?"Syncing to Notion...":<><Ic n="sync" s={14}/> Sync to Notion — {dept}</>}
        </Btn>
      </Card>
    </div>
  );
}

// ── TASKS VIEW ────────────────────────────────────────────────────────────────
function TasksView({tasks,toast,load}) {
  const [selTask,setSelTask]= useState(null);
  const [form,   setForm]   = useState(null);
  const empty={taskName:"",department:"HQ",priority:"Medium",status:"Not Started",owner:"Jaymin",deadline:"",dependency:"",notes:""};

  const create=async()=>{
    if(!form.taskName.trim()) return;
    const r=await notionApi("createTask",form);
    if(r.ok){toast("Task created in Notion ✓");setForm(null);load();}
    else toast("Failed to create task","err");
  };

  const sections=[
    {key:"Critical",label:"Critical",    color:"#EF4444"},
    {key:"High",    label:"High",        color:"#F97316"},
    {key:"Medium",  label:"Medium",      color:"#F59E0B"},
    {key:"Low",     label:"Low",         color:"#9CA3AF"},
  ];

  return(
    <div>
      {selTask&&<TaskModal task={selTask} onClose={()=>setSelTask(null)}/>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <SectionTitle>Task Board</SectionTitle>
          <SectionSub>{tasks.filter(t=>t.Status!=="Completed"&&t.Status!=="Deferred").length} open · {tasks.length} total · Click any task to view details</SectionSub>
        </div>
        <Btn onClick={()=>setForm({...empty})}><Ic n="plus" s={14}/> New Task</Btn>
      </div>

      {form&&(
        <Card style={{marginBottom:24,borderColor:"#C7D2FE"}}>
          <h3 style={{fontSize:14,fontWeight:700,color:"#111827",marginBottom:16}}>Create Task in Notion</h3>
          <Field label="Task Name"><Inp value={form.taskName} onChange={e=>setForm(f=>({...f,taskName:e.target.value}))}/></Field>
          <div className="form-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            <Field label="Department"><Sel value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} options={DEPTS.map(d=>d.notionName)}/></Field>
            <Field label="Priority"><Sel value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} options={PRIORITY}/></Field>
            <Field label="Status"><Sel value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} options={TASK_STATUS}/></Field>
          </div>
          <div className="form-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Owner"><Inp value={form.owner} onChange={e=>setForm(f=>({...f,owner:e.target.value}))}/></Field>
            <Field label="Deadline"><Inp value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} placeholder="YYYY-MM-DD"/></Field>
          </div>
          <Field label="Notes"><Inp value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></Field>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={create} variant="indigo">Create in Notion</Btn>
            <Btn onClick={()=>setForm(null)} variant="outline">Cancel</Btn>
          </div>
        </Card>
      )}

      {sections.map(sec=>{
        const items=tasks.filter(t=>t.Priority===sec.key&&t.Status!=="Completed");
        if(!items.length) return null;
        return(
          <div key={sec.key} style={{marginBottom:22}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:sec.color,display:"inline-block"}}/>
              <span style={{fontSize:13,fontWeight:700,color:"#374151"}}>{sec.label}</span>
              <span style={{fontSize:12,color:"#9CA3AF"}}>({items.length})</span>
            </div>
            {items.map(t=>{
              const dept=DEPTS.find(d=>d.notionName===t.Department);
              return(
                <div key={t._id} className="task-row" onClick={()=>setSelTask(t)}
                  style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:10,padding:"14px 18px",marginBottom:8,borderLeft:`4px solid ${pCol(t.Priority)}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,transition:"background .15s"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:"#111827",marginBottom:6}}>{t["Task Name"]||"Untitled"}</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      {dept&&<span style={{fontSize:12,color:dept.color,fontWeight:500}}>{dept.icon} {dept.notionName}</span>}
                      {t.Owner&&<span style={{fontSize:12,color:"#9CA3AF"}}>👤 {t.Owner}</span>}
                      {t.Deadline&&<span style={{fontSize:12,color:"#9CA3AF"}}>📅 {t.Deadline}</span>}
                      {t.Notes&&<span style={{fontSize:12,color:"#9CA3AF"}}>· {t.Notes.slice(0,50)}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                    <Badge label={t.Status||"—"} bg={sBg(t.Status)} fg={sFg(t.Status)}/>
                    <span style={{fontSize:11,color:"#9CA3AF"}}>click for details</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {tasks.filter(t=>t.Status==="Completed").length>0&&(
        <div style={{marginBottom:22}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:"#10B981",display:"inline-block"}}/>
            <span style={{fontSize:13,fontWeight:700,color:"#374151"}}>Completed</span>
            <span style={{fontSize:12,color:"#9CA3AF"}}>({tasks.filter(t=>t.Status==="Completed").length})</span>
          </div>
          {tasks.filter(t=>t.Status==="Completed").map(t=>(
            <div key={t._id} style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:10,padding:"12px 18px",marginBottom:6,opacity:.55}}>
              <span style={{fontSize:13,color:"#6B7280",textDecoration:"line-through"}}>{t["Task Name"]}</span>
              <span style={{fontSize:12,color:"#9CA3AF",marginLeft:8}}>{t.Department}</span>
            </div>
          ))}
        </div>
      )}

      {tasks.length===0&&!form&&(
        <Card style={{textAlign:"center",padding:"48px 24px"}}>
          <p style={{color:"#9CA3AF",fontSize:14,marginBottom:6}}>No tasks loaded from Notion yet.</p>
          <p style={{color:"#D1D5DB",fontSize:12}}>Make sure your Notion Tasks database is connected to the NOVI OS integration.</p>
        </Card>
      )}
    </div>
  );
}

// ── DECISIONS VIEW ────────────────────────────────────────────────────────────
function DecisionsView({decisions,pendDec,toast,load}) {
  const [form,setForm]=useState(null);
  const empty={decisionTitle:"",department:"HQ",decisionSummary:"",reasoning:"",risks:"",founderApproval:"Pending",longTermImpact:""};

  const log=async()=>{
    if(!form.decisionTitle.trim()) return;
    const r=await notionApi("logDecision",form);
    if(r.ok){toast("Decision logged in Notion ✓");setForm(null);load();}
    else toast("Failed to log decision","err");
  };

  const groups=[
    {key:"Pending",  label:"Pending Approval", items:pendDec},
    {key:"Approved", label:"Approved",          items:decisions.filter(d=>d["Founder Approval"]==="Approved")},
    {key:"Rejected", label:"Rejected",          items:decisions.filter(d=>d["Founder Approval"]==="Rejected")},
    {key:"Deferred", label:"Deferred",          items:decisions.filter(d=>d["Founder Approval"]==="Deferred")},
  ];

  const groupColor={Pending:"#F59E0B",Approved:"#10B981",Rejected:"#EF4444",Deferred:"#9CA3AF"};

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:12}}>
        <div>
          <SectionTitle>Decision Log</SectionTitle>
          <SectionSub>Institutional memory · {decisions.length} total · {pendDec.length} pending approval</SectionSub>
        </div>
        <Btn onClick={()=>setForm({...empty})}><Ic n="plus" s={14}/> Log Decision</Btn>
      </div>

      {form&&(
        <Card style={{marginBottom:24,borderColor:"#C7D2FE"}}>
          <h3 style={{fontSize:14,fontWeight:700,color:"#111827",marginBottom:16}}>Log Decision to Notion</h3>
          <Field label="Decision Title"><Inp value={form.decisionTitle} onChange={e=>setForm(f=>({...f,decisionTitle:e.target.value}))}/></Field>
          <div className="form-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Department"><Sel value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} options={DEPTS.map(d=>d.notionName)}/></Field>
            <Field label="Founder Approval"><Sel value={form.founderApproval} onChange={e=>setForm(f=>({...f,founderApproval:e.target.value}))} options={APPROVAL}/></Field>
          </div>
          <Field label="Decision Summary"><Txta value={form.decisionSummary} onChange={e=>setForm(f=>({...f,decisionSummary:e.target.value}))} rows={3}/></Field>
          <Field label="Reasoning"><Txta value={form.reasoning} onChange={e=>setForm(f=>({...f,reasoning:e.target.value}))} rows={2}/></Field>
          <div className="form-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Risks"><Inp value={form.risks} onChange={e=>setForm(f=>({...f,risks:e.target.value}))}/></Field>
            <Field label="Long-Term Impact"><Inp value={form.longTermImpact} onChange={e=>setForm(f=>({...f,longTermImpact:e.target.value}))}/></Field>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={log} variant="indigo">Log to Notion</Btn>
            <Btn onClick={()=>setForm(null)} variant="outline">Cancel</Btn>
          </div>
        </Card>
      )}

      {groups.map(g=>g.items.length>0&&(
        <div key={g.key} style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:groupColor[g.key],display:"inline-block"}}/>
            <h3 style={{fontSize:13,fontWeight:700,color:"#374151"}}>{g.label}</h3>
            <span style={{fontSize:12,color:"#9CA3AF"}}>({g.items.length})</span>
          </div>
          {g.items.map(d=>{
            const dept=DEPTS.find(x=>x.notionName===d.Department);
            return(
              <Card key={d._id} style={{marginBottom:10,borderLeft:`4px solid ${groupColor[g.key]}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,gap:12}}>
                  <h4 style={{fontSize:14,fontWeight:600,color:"#111827"}}>{d["Decision Title"]||"Untitled"}</h4>
                  <Badge label={d["Founder Approval"]||"Pending"} bg={aBg(d["Founder Approval"])} fg={aFg(d["Founder Approval"])}/>
                </div>
                {d["Decision Summary"]&&<p style={{fontSize:13,color:"#4B5563",lineHeight:1.6,marginBottom:8}}>{d["Decision Summary"]}</p>}
                {d.Reasoning&&<p style={{fontSize:12,color:"#6B7280",marginBottom:6}}>💭 {d.Reasoning}</p>}
                {d.Risks&&<p style={{fontSize:12,color:"#EF4444",marginBottom:6}}>⚠️ {d.Risks}</p>}
                {d["Long-Term Impact"]&&<p style={{fontSize:12,color:"#3B82F6",marginBottom:8}}>🔭 {d["Long-Term Impact"]}</p>}
                <div style={{display:"flex",gap:10,marginTop:4}}>
                  {dept&&<span style={{fontSize:12,color:dept.color,fontWeight:500}}>{dept.icon} {dept.name}</span>}
                  <span style={{fontSize:12,color:"#9CA3AF"}}>📅 {d.Date||"—"}</span>
                  {d._url&&<a href={d._url} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#4F46E5",marginLeft:"auto",textDecoration:"none",display:"flex",alignItems:"center",gap:4}}><Ic n="ext" s={12}/> Notion</a>}
                </div>
              </Card>
            );
          })}
        </div>
      ))}

      {decisions.length===0&&!form&&(
        <Card style={{textAlign:"center",padding:"48px 24px"}}>
          <p style={{color:"#9CA3AF",fontSize:14}}>No decisions logged yet. Use the button above to log your first.</p>
        </Card>
      )}
    </div>
  );
}

// ── EOD VIEW ──────────────────────────────────────────────────────────────────
function EODView({triggerEOD,tasks,updates,urgent,open}) {
  const today    = new Date().toISOString().split("T")[0];
  const todayUpd = updates.filter(u=>u.Date===today);

  return(
    <div style={{maxWidth:680}}>
      <SectionTitle>EOD Reports</SectionTitle>
      <SectionSub>Auto-sends to parekhjaymin11@gmail.com at 6:00 PM IST · Saved to Notion EOD Reports table</SectionSub>

      <Card style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#111827",marginBottom:4}}>🕕 Daily at 6:00 PM IST</div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:2}}>Vercel cron job runs at 12:30 UTC = 6:00 PM IST</div>
          <div style={{fontSize:12,color:"#9CA3AF"}}>Report auto-saved to Notion after each send</div>
        </div>
        <Btn onClick={triggerEOD} variant="indigo"><Ic n="eod" s={14}/> Send Now</Btn>
      </Card>

      <h3 style={{fontSize:14,fontWeight:700,color:"#374151",marginBottom:12}}>Today's Preview</h3>
      <div className="stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
        {[
          {l:"Critical",   v:urgent.length,                              c:"#EF4444",bg:"#FEF2F2"},
          {l:"Open",       v:open.length,                                c:"#3B82F6",bg:"#EFF6FF"},
          {l:"Dept Updates",v:todayUpd.length,                           c:"#10B981",bg:"#ECFDF5"},
          {l:"Done Today", v:tasks.filter(t=>t.Status==="Completed").length,c:"#8B5CF6",bg:"#F5F3FF"},
        ].map(s=>(
          <div key={s.l} style={{background:s.bg,borderRadius:10,padding:"14px",textAlign:"center",border:`1px solid ${s.c}20`}}>
            <div style={{fontSize:26,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:s.c,opacity:.8,marginTop:3}}>{s.l}</div>
          </div>
        ))}
      </div>

      <Card>
        <h3 style={{fontSize:14,fontWeight:700,color:"#111827",marginBottom:12}}>Email Includes</h3>
        {["📊 Company snapshot — overall status (On Track / Delayed / Critical / Blocked)",
          "⚠️ Founder attention items — decisions pending + dept inputs needed",
          "🚨 Critical tasks with department, owner, deadline",
          "⚡ High priority tasks",
          "🚫 Blocked tasks needing unblocking",
          "🏢 Department updates synced today",
          "📋 Decision log — pending approvals",
          "✅ Tasks completed today",
          "💾 Auto-saved to Notion EOD Reports table",
        ].map((item,i)=>(
          <div key={i} style={{padding:"9px 0",borderBottom:"1px solid #F3F4F6",fontSize:13,color:"#4B5563",display:"flex",alignItems:"center",gap:8}}>{item}</div>
        ))}
      </Card>
    </div>
  );
}

// ── DEPTS VIEW ────────────────────────────────────────────────────────────────
function DeptsView({depts,updates}) {
  return(
    <div>
      <SectionTitle>Departments</SectionTitle>
      <SectionSub>Click any department to open its Claude chat. After conversation, sync the summary to Notion.</SectionSub>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
        {depts.map(d=>{
          const deptUpd    = updates.filter(u=>u.Department===d.notionName);
          const latest     = deptUpd[0];
          const needsInput = deptUpd.some(u=>u["Founder Decision Required"]==="Yes");
          return(
            <a key={d.id} href={d.chatUrl||"https://claude.ai"} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
              <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"20px 18px",cursor:"pointer",transition:"all .15s",height:"100%",borderTop:`4px solid ${d.color}`}}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)";e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <span style={{fontSize:26}}>{d.icon}</span>
                  {needsInput&&<span style={{fontSize:11,background:"#FEF3C7",color:"#92400E",borderRadius:4,padding:"2px 7px",fontWeight:500}}>Input needed</span>}
                  {!d.chatUrl&&<span style={{fontSize:11,background:"#F3F4F6",color:"#9CA3AF",borderRadius:4,padding:"2px 7px"}}>No chat</span>}
                </div>
                <div style={{fontSize:14,fontWeight:700,color:d.color,marginBottom:2}}>{d.name}</div>
                <div style={{fontSize:11,color:"#9CA3AF",marginBottom:8}}>{deptUpd.length} syncs</div>
                {latest
                  ?<p style={{fontSize:11,color:"#6B7280",lineHeight:1.5}}>{(latest.Summary||"").slice(0,65)}...</p>
                  :<p style={{fontSize:11,color:"#D1D5DB"}}>No syncs yet</p>}
                <div style={{marginTop:12,display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#9CA3AF"}}>
                  {d.chatUrl?"Open Claude chat":"No direct link"} <Ic n="ext" s={11}/>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
