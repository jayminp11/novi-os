// ── NOVI OS — EOD EMAIL ────────────────────────────────────────────────────────
// Runs at 12:30 UTC = 6:00 PM IST via Vercel cron
// Reads Notion → builds HTML email → sends via Resend → saves back to Notion

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const RESEND_KEY   = process.env.RESEND_API_KEY;
const FOUNDER_EMAIL= process.env.FOUNDER_EMAIL || "novipetcare@gmail.com";
const BASE         = "https://api.notion.com/v1";

const DB = {
  tasks            : "36009180590980098e44f907ba6c249a",
  departmentUpdates: "74366ef5e20f4bea89c1a6ecce710d17",
  decisionLog      : "3620918059098002b3abfcc50cfabe5e",
  eodReports       : "3610918059098072b685c2fc076ae423",
};

const nHeaders = {
  "Authorization" : `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type"  : "application/json",
};

const queryDB = async (dbId, body = {}) => {
  const res = await fetch(`${BASE}/databases/${dbId}/query`, {
    method: "POST", headers: nHeaders,
    body: JSON.stringify({ page_size: 100, ...body }),
  });
  return res.json();
};

const getText = (prop) => {
  if (!prop) return "";
  switch (prop.type) {
    case "title"       : return prop.title?.map(t => t.plain_text).join("") || "";
    case "rich_text"   : return prop.rich_text?.map(t => t.plain_text).join("") || "";
    case "select"      : return prop.select?.name || "";
    case "date"        : return prop.date?.start || "";
    case "checkbox"    : return prop.checkbox ? "Yes" : "No";
    default            : return "";
  }
};

const parse = (pages) => pages.map(p => {
  const o = { _id: p.id };
  Object.entries(p.properties || {}).forEach(([k, v]) => { o[k] = getText(v); });
  return o;
});

// ── PRIORITY / STATUS COLORS ──────────────────────────────────────────────────
const pCol = p => ({ Critical:"#FF4444", High:"#FF8C00", Medium:"#FFD166", Low:"#888" }[p] || "#888");
const sCol = s => ({
  "Not Started":"#FFD166", "In Progress":"#4FC3F7",
  "Completed":"#00E5AA",   "Blocked":"#FF4444", "Deferred":"#888"
}[s] || "#888");

// ── BUILD EMAIL HTML ──────────────────────────────────────────────────────────
const buildEmail = ({ tasks, deptUpdates, decisions, date, dateStr }) => {
  const today       = deptUpdates.filter(u => u.Date === date);
  const urgent      = tasks.filter(t => t.Priority === "Critical" && t.Status !== "Completed");
  const high        = tasks.filter(t => t.Priority === "High"     && t.Status !== "Completed");
  const medium      = tasks.filter(t => t.Priority === "Medium"   && t.Status !== "Completed");
  const done        = tasks.filter(t => t.Status   === "Completed");
  const blocked     = tasks.filter(t => t.Status   === "Blocked");
  const pendingDec  = decisions.filter(d => d["Founder Approval"] === "Pending");
  const founderReq  = deptUpdates.filter(u => u["Founder Decision Required"] === "Yes");
  const totalOpen   = tasks.filter(t => t.Status !== "Completed" && t.Status !== "Deferred").length;

  const taskRow = (t) => `
    <tr style="border-bottom:1px solid #1A1A2E">
      <td style="padding:10px 14px;font-size:12px;color:#E0E0F0">${t["Task"]||"Untitled"}</td>
      <td style="padding:10px 14px;font-size:10px;color:#888">${t.Department||"—"}</td>
      <td style="padding:10px 14px">
        <span style="background:${pCol(t.Priority)}18;color:${pCol(t.Priority)};padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:1px">${t.Priority||"—"}</span>
      </td>
      <td style="padding:10px 14px">
        <span style="background:${sCol(t.Status)}18;color:${sCol(t.Status)};padding:2px 8px;border-radius:4px;font-size:9px">${t.Status||"—"}</span>
      </td>
      <td style="padding:10px 14px;font-size:10px;color:#666">${t.Deadline||"—"}</td>
      <td style="padding:10px 14px;font-size:10px;color:#666">${t.Owner||"—"}</td>
    </tr>`;

  const deptRow = (u) => `
    <tr style="border-bottom:1px solid #1A1A2E">
      <td style="padding:12px 14px;font-size:11px;color:#00E5AA;font-weight:700;width:140px">${u.Department||"—"}</td>
      <td style="padding:12px 14px;font-size:11px;color:#C0C0D8;line-height:1.65">${u.Summary||"No summary"}</td>
      <td style="padding:12px 14px">
        <span style="background:#FFD16618;color:#FFD166;padding:2px 8px;border-radius:4px;font-size:9px">${u.Priority||"—"}</span>
      </td>
      <td style="padding:12px 14px;font-size:10px;color:${u["Founder Input Required"]==="Yes"?"#FF8C42":"#555"}">${u["Founder Input Required"]==="Yes"?"⚠️ Yes":"No"}</td>
    </tr>`;

  const decRow = (d) => `
    <tr style="border-bottom:1px solid #1A1A2E">
      <td style="padding:10px 14px;font-size:12px;color:#FFD166">${d["Decision Title"]||"Untitled"}</td>
      <td style="padding:10px 14px;font-size:10px;color:#888">${d.Department||"—"}</td>
      <td style="padding:10px 14px;font-size:11px;color:#C0C0D8">${(d["Decision Summary"]||"").slice(0,80)}...</td>
      <td style="padding:10px 14px">
        <span style="background:#FF8C4218;color:#FF8C42;padding:2px 8px;border-radius:4px;font-size:9px">⏳ Pending</span>
      </td>
    </tr>`;

  // Determine overall status
  const overallStatus = blocked.length > 0 ? "Blocked" : urgent.length > 3 ? "Critical" : urgent.length > 0 ? "Delayed" : "On Track";
  const statusCol = { "On Track":"#00E5AA", "Delayed":"#FFD166", "Critical":"#FF8C00", "Blocked":"#FF4444" }[overallStatus];

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07070E;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:720px;margin:0 auto;padding:28px 16px">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#0A1A14,#080818);border:1px solid #1A1A2E;border-radius:16px;padding:28px 32px;margin-bottom:18px;text-align:center">
    <div style="font-size:11px;color:#444;letter-spacing:6px;margin-bottom:8px">NOVI OPERATING SYSTEM</div>
    <div style="font-size:34px;font-weight:900;letter-spacing:8px;background:linear-gradient(135deg,#00E5AA,#4FC3F7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px">EOD REPORT</div>
    <div style="font-size:13px;color:#888;margin-bottom:20px">${dateStr}</div>
    <div style="display:inline-block;background:${statusCol}18;border:1px solid ${statusCol}40;border-radius:30px;padding:6px 20px;font-size:11px;color:${statusCol};font-weight:700;letter-spacing:2px;margin-bottom:20px">${overallStatus}</div>
    <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">
      ${[
        {l:"CRITICAL", v:urgent.length,  c:"#FF4444"},
        {l:"HIGH",     v:high.length,    c:"#FF8C00"},
        {l:"OPEN",     v:totalOpen,      c:"#4FC3F7"},
        {l:"BLOCKED",  v:blocked.length, c:"#FF4444"},
        {l:"DONE",     v:done.length,    c:"#00E5AA"},
        {l:"DECISIONS",v:pendingDec.length,c:"#FFD166"},
      ].map(s=>`<div style="background:${s.c}12;border:1px solid ${s.c}28;border-radius:10px;padding:10px 16px;min-width:72px">
        <div style="font-size:22px;font-weight:800;color:${s.c};line-height:1">${s.v}</div>
        <div style="font-size:8px;color:${s.c};opacity:.8;letter-spacing:1px;margin-top:3px">${s.l}</div>
      </div>`).join("")}
    </div>
  </div>

  <!-- FOUNDER ACTION REQUIRED -->
  ${(founderReq.length > 0 || pendingDec.length > 0) ? `
  <div style="background:#0D0D18;border:2px solid #FF8C4240;border-radius:12px;margin-bottom:16px;overflow:hidden">
    <div style="padding:14px 20px;background:#FF8C4210;border-bottom:1px solid #FF8C4220;display:flex;align-items:center;gap:8px">
      <span style="font-size:18px">⚠️</span>
      <span style="font-size:12px;font-weight:700;color:#FF8C42;letter-spacing:2px">REQUIRES YOUR ATTENTION — ${founderReq.length + pendingDec.length} ITEMS</span>
    </div>
    <div style="padding:14px 20px">
      ${founderReq.map(u=>`<div style="padding:8px 0;border-bottom:1px solid #1A1A2E;font-size:12px;color:#E0E0F0">
        🏢 <strong>${u.Department}</strong> — ${u.Summary?.slice(0,100)||"Requires your input"}
      </div>`).join("")}
      ${pendingDec.map(d=>`<div style="padding:8px 0;border-bottom:1px solid #1A1A2E;font-size:12px;color:#FFD166">
        📋 Decision pending: <strong>${d["Decision Title"]||"Untitled"}</strong>
      </div>`).join("")}
    </div>
  </div>` : ""}

  <!-- CRITICAL TASKS -->
  ${urgent.length > 0 ? `
  <div style="background:#0D0D18;border:1px solid #FF444428;border-radius:12px;margin-bottom:16px;overflow:hidden">
    <div style="padding:13px 20px;background:#FF444410;border-bottom:1px solid #FF444420;display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">🚨</span>
      <span style="font-size:11px;font-weight:700;color:#FF4444;letter-spacing:2px">CRITICAL TASKS — ${urgent.length}</span>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#FF444408">
        ${["TASK","DEPT","PRIORITY","STATUS","DEADLINE","OWNER"].map(h=>`<th style="padding:7px 14px;text-align:left;font-size:9px;color:#FF4444;letter-spacing:1px">${h}</th>`).join("")}
      </tr></thead>
      <tbody>${urgent.map(taskRow).join("")}</tbody>
    </table>
  </div>` : ""}

  <!-- HIGH TASKS -->
  ${high.length > 0 ? `
  <div style="background:#0D0D18;border:1px solid #FF8C0028;border-radius:12px;margin-bottom:16px;overflow:hidden">
    <div style="padding:13px 20px;background:#FF8C0010;border-bottom:1px solid #FF8C0020;display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">⚡</span>
      <span style="font-size:11px;font-weight:700;color:#FF8C00;letter-spacing:2px">HIGH PRIORITY — ${high.length}</span>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tbody>${high.map(taskRow).join("")}</tbody>
    </table>
  </div>` : ""}

  <!-- BLOCKED -->
  ${blocked.length > 0 ? `
  <div style="background:#0D0D18;border:1px solid #FF444428;border-radius:12px;margin-bottom:16px;overflow:hidden">
    <div style="padding:13px 20px;background:#FF444408;border-bottom:1px solid #FF444418;display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">🚫</span>
      <span style="font-size:11px;font-weight:700;color:#FF4444;letter-spacing:2px">BLOCKED — ${blocked.length} TASKS NEED UNBLOCKING</span>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tbody>${blocked.map(taskRow).join("")}</tbody>
    </table>
  </div>` : ""}

  <!-- DEPT UPDATES TODAY -->
  <div style="background:#0D0D18;border:1px solid #00E5AA28;border-radius:12px;margin-bottom:16px;overflow:hidden">
    <div style="padding:13px 20px;background:#00E5AA08;border-bottom:1px solid #00E5AA18;display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">🏢</span>
      <span style="font-size:11px;font-weight:700;color:#00E5AA;letter-spacing:2px">DEPARTMENT UPDATES TODAY — ${today.length}</span>
    </div>
    ${today.length > 0 ? `
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#00E5AA08">
        ${["DEPARTMENT","SUMMARY","PRIORITY","FOUNDER INPUT"].map(h=>`<th style="padding:7px 14px;text-align:left;font-size:9px;color:#00E5AA;letter-spacing:1px">${h}</th>`).join("")}
      </tr></thead>
      <tbody>${today.map(deptRow).join("")}</tbody>
    </table>` : `
    <div style="padding:18px 20px;font-size:11px;color:#444;text-align:center">No department updates synced today</div>`}
  </div>

  <!-- MEDIUM TASKS -->
  ${medium.length > 0 ? `
  <div style="background:#0D0D18;border:1px solid #1E1E2E;border-radius:12px;margin-bottom:16px;overflow:hidden">
    <div style="padding:13px 20px;border-bottom:1px solid #1A1A2E;display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">📌</span>
      <span style="font-size:11px;font-weight:700;color:#888;letter-spacing:2px">MEDIUM PRIORITY — ${medium.length}</span>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tbody>${medium.map(taskRow).join("")}</tbody>
    </table>
  </div>` : ""}

  <!-- DECISIONS PENDING -->
  ${pendingDec.length > 0 ? `
  <div style="background:#0D0D18;border:1px solid #FFD16628;border-radius:12px;margin-bottom:16px;overflow:hidden">
    <div style="padding:13px 20px;background:#FFD16608;border-bottom:1px solid #FFD16618;display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">📋</span>
      <span style="font-size:11px;font-weight:700;color:#FFD166;letter-spacing:2px">DECISIONS AWAITING YOUR APPROVAL — ${pendingDec.length}</span>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#FFD16608">
        ${["DECISION","DEPT","SUMMARY","STATUS"].map(h=>`<th style="padding:7px 14px;text-align:left;font-size:9px;color:#FFD166;letter-spacing:1px">${h}</th>`).join("")}
      </tr></thead>
      <tbody>${pendingDec.map(decRow).join("")}</tbody>
    </table>
  </div>` : ""}

  <!-- DONE TODAY -->
  ${done.length > 0 ? `
  <div style="background:#0D0D18;border:1px solid #00E5AA18;border-radius:12px;margin-bottom:16px;overflow:hidden">
    <div style="padding:13px 20px;border-bottom:1px solid #00E5AA10;display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">✅</span>
      <span style="font-size:11px;font-weight:700;color:#00E5AA;letter-spacing:2px">COMPLETED — ${done.length} TASKS</span>
    </div>
    <div style="padding:6px 0">
      ${done.map(t=>`<div style="padding:8px 20px;font-size:11px;color:#555;border-bottom:1px solid #141420;text-decoration:line-through">${t["Task"]||"Untitled"} <span style="color:#444;margin-left:8px">${t.Department||""}</span></div>`).join("")}
    </div>
  </div>` : ""}

  <!-- FOOTER -->
  <div style="text-align:center;padding:20px 0;color:#2A2A3E;font-size:9px;letter-spacing:3px">
    NOVI OPERATING SYSTEM · EOD REPORT · ${dateStr} 18:00 IST<br><br>
    <span style="color:#1A1A28">Auto-generated · Saved to Notion · Next report tomorrow at 6:00 PM IST</span>
  </div>

</div>
</body>
</html>`;
};

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const today   = new Date().toISOString().split("T")[0];
    const dateStr = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

    // Pull all data from Notion
    const [tasksData, deptData, decData] = await Promise.all([
      queryDB(DB.tasks),
      queryDB(DB.departmentUpdates, { sorts:[{ timestamp:"created_time", direction:"descending" }] }),
      queryDB(DB.decisionLog, { sorts:[{ timestamp:"created_time", direction:"descending" }] }),
    ]);

    const tasks       = parse(tasksData.results      || []);
    const deptUpdates = parse(deptData.results        || []);
    const decisions   = parse(decData.results         || []);

    // Build email
    const html = buildEmail({ tasks, deptUpdates, decisions, date: today, dateStr });

    // Send via Resend
    let emailSent = false;
    if (!RESEND_KEY) return res.status(500).json({ ok:false, error:"RESEND_API_KEY missing in Vercel env vars" });
    {
      const r = await fetch("https://api.resend.com/emails", {
        method : "POST",
        headers: { "Authorization":`Bearer ${RESEND_KEY}`, "Content-Type":"application/json" },
        body   : JSON.stringify({
          from   : "NOVI OS <onboarding@resend.dev>",
          to     : [FOUNDER_EMAIL],
          subject: `NOVI EOD Report ${dateStr}`,
          html,
        }),
      });
      const rd = await r.json();
      console.log("Resend:", JSON.stringify(rd));
      if (rd.id) { emailSent = true; } else { return res.status(500).json({ ok:false, error: rd.message || rd.name || JSON.stringify(rd) }); }
    }

    // Save report to Notion
    const nHeaders2 = {
      "Authorization" : `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type"  : "application/json",
    };
    const urgent  = tasks.filter(t => t.Priority==="Critical" && t.Status!=="Completed");
    const blocked = tasks.filter(t => t.Status==="Blocked");
    const done    = tasks.filter(t => t.Status==="Completed");
    const pendDec = decisions.filter(d => d["Founder Approval"]==="Pending");
    const overallStatus = blocked.length>0?"Blocked":urgent.length>3?"Critical":urgent.length>0?"Delayed":"On Track";

    const notionSaveRes = await fetch(`${BASE}/pages`, {
      method : "POST",
      headers: nHeaders2,
      body   : JSON.stringify({
        parent: { database_id: DB.eodReports },
        properties: {
          "Name"                      : { title: [{ text: { content: "EOD Report — " + dateStr } }] },
          "Date"                      : { date: { start: today } },
          "Overall Status"            : { select: { name: overallStatus } },
          "Key Wins"                  : { rich_text:[{ text:{ content: done.length + " tasks completed today" } }] },
          "Critical Blockers"         : { rich_text:[{ text:{ content: blocked.map(t=>t["Task"]).join(", ") || "None" } }] },
          "Founder Decisions Required": { rich_text:[{ text:{ content: pendDec.map(d=>d["Decision Title"]).join(", ") || "None" } }] },
          "Risks Identified"          : { rich_text:[{ text:{ content: deptUpdates.filter(u=>u.Risks).map(u=>u.Department+": "+u.Risks).join(", ") || "None" } }] },
          "Tomorrow Priorities"       : { rich_text:[{ text:{ content: urgent.slice(0,3).map(t=>t["Task"]).join(", ") || "Review open tasks" } }] },
        },
      }),
    });
    const notionSaveData = await notionSaveRes.json();
    console.log("Notion EOD save:", notionSaveData.id ? "SUCCESS" : JSON.stringify(notionSaveData));

    return res.status(200).json({ ok:true, emailSent:true, sentTo:FOUNDER_EMAIL, stats:{ urgent:urgent.length, blocked:blocked.length, done:done.length } });

  } catch (err) {
    console.error("EOD error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
