// ── NOVI OS — NOTION API BRIDGE ───────────────────────────────────────────────

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const BASE         = "https://api.notion.com/v1";

const DB = {
  departmentUpdates : "74366ef5e20f4bea89c1a6ecce710d17",
  tasks             : "36009180590980098e44f907ba6c249a",
  eodReports        : "3610918059098072b685c2fc076ae423",
  decisionLog       : "3620918059098002b3abfcc50cfabe5e",
  weeklyReviews     : "3610918059098067b08fd6a4a46bb439",
};

const OPTS = {
  departments : ["HQ","Formulations","COO","CFO","CLO","CMO","Market Strategy","Operations","Vendors","Compliance"],
  priority    : ["Low","Medium","High","Critical"],
  deptStatus  : ["Planned","In Progress","Blocked","Completed","On Hold"],
  taskStatus  : ["Not Started","In Progress","Blocked","Completed","Deferred"],
  eodStatus   : ["On Track","Delayed","Critical","Blocked"],
  approval    : ["Approved","Pending","Rejected","Deferred"],
};

const safe = (val, allowed, fallback) => allowed.includes(val) ? val : fallback;

const nFetch = async (path, method = "GET", body = null) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Authorization" : `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type"  : "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Notion API error");
  return data;
};

const prop = {
  title      : (v) => ({ title      : [{ text: { content: String(v||"").slice(0,2000) } }] }),
  text       : (v) => ({ rich_text  : [{ text: { content: String(v||"").slice(0,2000) } }] }),
  select     : (v) => ({ select     : { name: String(v||"") } }),
  date       : (v) => ({ date       : { start: v || new Date().toISOString().split("T")[0] } }),
  checkbox   : (v) => ({ checkbox   : Boolean(v) }),
};

const extract = (p) => {
  if (!p) return "";
  switch(p.type) {
    case "title"       : return p.title?.map(t=>t.plain_text).join("") || "";
    case "rich_text"   : return p.rich_text?.map(t=>t.plain_text).join("") || "";
    case "select"      : return p.select?.name || "";
    case "multi_select": return p.multi_select?.map(t=>t.name).join(", ") || "";
    case "date"        : return p.date?.start || "";
    case "checkbox"    : return p.checkbox ? "Yes" : "No";
    case "status"      : return p.status?.name || "";
    default            : return "";
  }
};

const parse = (pages) => pages.map(page => {
  const obj = { _id: page.id, _url: page.url };
  Object.entries(page.properties||{}).forEach(([k,v]) => { obj[k] = extract(v); });
  return obj;
});

const queryDB = async (dbId, sorts=null, filter=null) => {
  const body = { page_size: 100 };
  if (sorts)  body.sorts  = sorts;
  if (filter) body.filter = filter;
  const data = await nFetch(`/databases/${dbId}/query`, "POST", body);
  return parse(data.results || []);
};

const createPage = async (dbId, properties) => {
  return nFetch("/pages", "POST", { parent: { database_id: dbId }, properties });
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Health check
  if (req.method === "GET") {
    return res.json({ ok: true, message: "NOVI Notion API is running", token: NOTION_TOKEN ? "set" : "MISSING" });
  }

  if (!NOTION_TOKEN) {
    return res.status(500).json({ ok: false, error: "NOTION_TOKEN environment variable not set" });
  }

  const { action, payload } = req.body || {};

  try {
    switch(action) {

      case "getTasks": {
        const items = await queryDB(DB.tasks, [
          { property:"Priority", direction:"descending" },
          { property:"Status",   direction:"ascending"  },
        ]);
        return res.json({ ok:true, items });
      }

      case "getDeptUpdates": {
        const items = await queryDB(DB.departmentUpdates, [
          { timestamp:"created_time", direction:"descending" }
        ]);
        return res.json({ ok:true, items });
      }

      case "getDecisions": {
        const items = await queryDB(DB.decisionLog, [
          { timestamp:"created_time", direction:"descending" }
        ]);
        return res.json({ ok:true, items });
      }

      case "getEODReports": {
        const items = await queryDB(DB.eodReports, [
          { property:"Date", direction:"descending" }
        ]);
        return res.json({ ok:true, items });
      }

      case "syncDeptUpdate": {
        const { department, summary, status, priority, risks, founderDecisionRequired, nextActions } = payload;
        await createPage(DB.departmentUpdates, {
          "Name"                     : prop.title(`${department} — ${new Date().toLocaleDateString("en-IN")}`),
          "Department"               : prop.select(safe(department, OPTS.departments, "HQ")),
          "Summary"                  : prop.text(summary),
          "Status"                   : prop.select(safe(status, OPTS.deptStatus, "In Progress")),
          "Priority"                 : prop.select(safe(priority, OPTS.priority, "Medium")),
          "Risks"                    : prop.text(risks||""),
          "Founder Decision Required": prop.checkbox(founderDecisionRequired||false),
          "Next Actions"             : prop.text(nextActions||""),
          "Date"                     : prop.date(new Date().toISOString().split("T")[0]),
        });
        return res.json({ ok:true, message:`${department} synced to Notion` });
      }

      case "createTask": {
        const { taskName, department, priority, status, owner, deadline, dependency, notes } = payload;
        await createPage(DB.tasks, {
          "Task Name"  : prop.title(taskName),
          "Department" : prop.select(safe(department, OPTS.departments, "HQ")),
          "Priority"   : prop.select(safe(priority, OPTS.priority, "Medium")),
          "Status"     : prop.select(safe(status, OPTS.taskStatus, "Not Started")),
          "Owner"      : prop.text(owner||"Jaymin"),
          "Deadline"   : prop.date(deadline),
          "Dependency" : prop.text(dependency||""),
          "Notes"      : prop.text(notes||""),
        });
        return res.json({ ok:true, message:"Task created in Notion" });
      }

      case "logDecision": {
        const { decisionTitle, department, decisionSummary, reasoning, risks, founderApproval, longTermImpact } = payload;
        await createPage(DB.decisionLog, {
          "Decision Title"  : prop.title(decisionTitle),
          "Department"      : prop.select(safe(department, OPTS.departments, "HQ")),
          "Decision Summary": prop.text(decisionSummary||""),
          "Reasoning"       : prop.text(reasoning||""),
          "Risks"           : prop.text(risks||""),
          "Founder Approval": prop.select(safe(founderApproval, OPTS.approval, "Pending")),
          "Long-Term Impact": prop.text(longTermImpact||""),
          "Date"            : prop.date(new Date().toISOString().split("T")[0]),
        });
        return res.json({ ok:true, message:"Decision logged in Notion" });
      }

      case "saveEODReport": {
        const { date, overallStatus, majorWins, keyUpdates, criticalBlockers, founderDecisionsRequired, risksIdentified, tomorrowPriorities } = payload;
        await createPage(DB.eodReports, {
          "Date"                      : prop.date(date),
          "Overall Status"            : prop.select(safe(overallStatus, OPTS.eodStatus, "On Track")),
          "Major Wins"                : prop.text(majorWins||""),
          "Key Updates"               : prop.text(keyUpdates||""),
          "Critical Blockers"         : prop.text(criticalBlockers||""),
          "Founder Decisions Required": prop.text(founderDecisionsRequired||""),
          "Risks Identified"          : prop.text(risksIdentified||""),
          "Tomorrow Priorities"       : prop.text(tomorrowPriorities||""),
        });
        return res.json({ ok:true, message:"EOD Report saved" });
      }

      default:
        return res.status(400).json({ ok:false, error:`Unknown action: ${action}` });
    }
  } catch(err) {
    console.error("Notion API error:", err);
    return res.status(500).json({ ok:false, error: err.message });
  }
}
