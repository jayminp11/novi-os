// ── NOVI OS — NOTION API BRIDGE ───────────────────────────────────────────────
// Perfectly mapped to Jaymin's exact Notion structure
// All 4 tables · All column names · All select options

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const BASE         = "https://api.notion.com/v1";

// ── YOUR EXACT DATABASE IDs ───────────────────────────────────────────────────
const DB = {
  departmentUpdates : "74366ef5e20f4bea89c1a6ecce710d17",
  tasks             : "36009180590980098e44f907ba6c249a",
  eodReports        : "3610918059098072b685c2fc076ae423",
  decisionLog       : "3620918059098002b3abfcc50cfabe5e",
  weeklyReviews     : "3610918059098067b08fd6a4a46bb439",
  todaysPriorities  : "360091805909808fa909ce8831c1bcb8",
  deptUpdatesFeed   : "36009180590980b39ee7c9b76be0e1ad",
};

// ── VALID SELECT OPTIONS (must match Notion exactly) ─────────────────────────
const OPTS = {
  departments : ["HQ","Formulations","COO","CFO","CLO","CMO","Market Strategy","Operations","Vendors","Compliance"],
  priority    : ["Low","Medium","High","Critical"],
  deptStatus  : ["Planned","In Progress","Blocked","Completed","On Hold"],
  taskStatus  : ["Not Started","In Progress","Blocked","Completed","Deferred"],
  eodStatus   : ["On Track","Delayed","Critical","Blocked"],
  approval    : ["Approved","Pending","Rejected","Deferred"],
};

const safe = (val, allowed, fallback) => allowed.includes(val) ? val : fallback;

// ── NOTION HELPERS ────────────────────────────────────────────────────────────
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
  return res.json();
};

const prop = {
  title     : (v) => ({ title     : [{ text: { content: String(v || "").slice(0, 2000) } }] }),
  text      : (v) => ({ rich_text : [{ text: { content: String(v || "").slice(0, 2000) } }] }),
  select    : (v) => ({ select    : { name: String(v || "") } }),
  multiSelect:(v) => ({ multi_select: (Array.isArray(v) ? v : [v]).map(n => ({ name: String(n) })) }),
  date      : (v) => ({ date      : { start: v || new Date().toISOString().split("T")[0] } }),
  checkbox  : (v) => ({ checkbox  : Boolean(v) }),
};

const extract = (p) => {
  if (!p) return "";
  switch (p.type) {
    case "title"       : return p.title?.map(t => t.plain_text).join("") || "";
    case "rich_text"   : return p.rich_text?.map(t => t.plain_text).join("") || "";
    case "select"      : return p.select?.name || "";
    case "multi_select": return p.multi_select?.map(t => t.name).join(", ") || "";
    case "date"        : return p.date?.start || "";
    case "checkbox"    : return p.checkbox ? "Yes" : "No";
    case "status"      : return p.status?.name || "";
    default            : return "";
  }
};

const parse = (pages) => pages.map(page => {
  const obj = { _id: page.id, _url: page.url };
  Object.entries(page.properties || {}).forEach(([k, v]) => { obj[k] = extract(v); });
  return obj;
});

const queryDB = async (dbId, sorts = null, filter = null) => {
  const body = { page_size: 100 };
  if (sorts)  body.sorts  = sorts;
  if (filter) body.filter = filter;
  const data = await nFetch(`/databases/${dbId}/query`, "POST", body);
  return parse(data.results || []);
};

const createPage = async (dbId, properties) => {
  return nFetch("/pages", "POST", { parent: { database_id: dbId }, properties });
};

// ── CORS ──────────────────────────────────────────────────────────────────────
const cors = (res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, payload } = req.body || {};

  try {
    switch (action) {

      // ── READ ────────────────────────────────────────────────────────────────

      case "getTasks": {
        const items = await queryDB(DB.tasks, [
          { property: "Status",   direction: "ascending" },
          { property: "Priority", direction: "descending" },
        ]);
        return res.json({ ok: true, items });
      }

      case "getDeptUpdates": {
        const items = await queryDB(DB.departmentUpdates, [
          { timestamp: "created_time", direction: "descending" }
        ]);
        return res.json({ ok: true, items });
      }

      case "getDecisions": {
        const items = await queryDB(DB.decisionLog, [
          { timestamp: "created_time", direction: "descending" }
        ]);
        return res.json({ ok: true, items });
      }

      case "getEODReports": {
        const items = await queryDB(DB.eodReports, [
          { property: "Date", direction: "descending" }
        ]);
        return res.json({ ok: true, items });
      }

      case "getPendingApprovals": {
        const items = await queryDB(DB.decisionLog, null, {
          property: "Founder Approval",
          select: { equals: "Pending" }
        });
        return res.json({ ok: true, items });
      }

      // ── WRITE ───────────────────────────────────────────────────────────────

      // Sync dept summary from Claude chat
      case "syncDeptUpdate": {
        const { department, summary, status, priority, risks, founderDecisionRequired, nextActions } = payload;
        await createPage(DB.departmentUpdates, {
          "Name"                    : prop.title(`${department} Update — ${new Date().toLocaleDateString("en-IN")}`),
          "Department"              : prop.select(safe(department, OPTS.departments, "HQ")),
          "Summary"                 : prop.text(summary),
          "Status"                  : prop.select(safe(status, OPTS.deptStatus, "In Progress")),
          "Priority"                : prop.select(safe(priority, OPTS.priority, "Medium")),
          "Risks"                   : prop.text(risks || ""),
          "Founder Decision Required": prop.checkbox(founderDecisionRequired || false),
          "Next Actions"            : prop.text(nextActions || ""),
          "Date"                    : prop.date(new Date().toISOString().split("T")[0]),
        });
        return res.json({ ok: true, message: `${department} update synced to Notion` });
      }

      // Create task
      case "createTask": {
        const { taskName, department, priority, status, owner, deadline, dependency, notes } = payload;
        await createPage(DB.tasks, {
          "Task Name"  : prop.title(taskName),
          "Department" : prop.select(safe(department, OPTS.departments, "HQ")),
          "Priority"   : prop.select(safe(priority, OPTS.priority, "Medium")),
          "Status"     : prop.select(safe(status, OPTS.taskStatus, "Not Started")),
          "Owner"      : prop.text(owner || "Jaymin"),
          "Deadline"   : prop.date(deadline),
          "Dependency" : prop.text(dependency || ""),
          "Notes"      : prop.text(notes || ""),
        });
        return res.json({ ok: true, message: "Task created in Notion" });
      }

      // Log decision — MOST IMPORTANT
      case "logDecision": {
        const { decisionTitle, department, decisionSummary, reasoning, risks, founderApproval, longTermImpact } = payload;
        await createPage(DB.decisionLog, {
          "Decision Title"  : prop.title(decisionTitle),
          "Department"      : prop.select(safe(department, OPTS.departments, "HQ")),
          "Decision Summary": prop.text(decisionSummary),
          "Reasoning"       : prop.text(reasoning || ""),
          "Risks"           : prop.text(risks || ""),
          "Founder Approval": prop.select(safe(founderApproval, OPTS.approval, "Pending")),
          "Long-Term Impact": prop.text(longTermImpact || ""),
          "Date"            : prop.date(new Date().toISOString().split("T")[0]),
        });
        return res.json({ ok: true, message: "Decision logged in Notion" });
      }

      // Save EOD report
      case "saveEODReport": {
        const { date, overallStatus, majorWins, keyUpdates, criticalBlockers, founderDecisionsRequired, risksIdentified, tomorrowPriorities } = payload;
        await createPage(DB.eodReports, {
          "Date"                      : prop.date(date),
          "Overall Status"            : prop.select(safe(overallStatus, OPTS.eodStatus, "On Track")),
          "Major Wins"                : prop.text(majorWins || ""),
          "Key Updates"               : prop.text(keyUpdates || ""),
          "Critical Blockers"         : prop.text(criticalBlockers || ""),
          "Founder Decisions Required": prop.text(founderDecisionsRequired || ""),
          "Risks Identified"          : prop.text(risksIdentified || ""),
          "Tomorrow Priorities"       : prop.text(tomorrowPriorities || ""),
        });
        return res.json({ ok: true, message: "EOD Report saved to Notion" });
      }

      // Save weekly review
      case "saveWeeklyReview": {
        const { week, majorAchievements, majorFailures, departmentAnalysis, strategicOpportunities, financialConcerns, founderBottlenecks, nextWeekPriorities } = payload;
        await createPage(DB.weeklyReviews, {
          "Week"                   : prop.title(week || `Week of ${new Date().toLocaleDateString("en-IN")}`),
          "Major Achievements"     : prop.text(majorAchievements || ""),
          "Major Failures"         : prop.text(majorFailures || ""),
          "Department Analysis"    : prop.text(departmentAnalysis || ""),
          "Strategic Opportunities": prop.text(strategicOpportunities || ""),
          "Financial Concerns"     : prop.text(financialConcerns || ""),
          "Founder Bottlenecks"    : prop.text(founderBottlenecks || ""),
          "Next Week Priorities"   : prop.text(nextWeekPriorities || ""),
        });
        return res.json({ ok: true, message: "Weekly review saved to Notion" });
      }

      default:
        return res.status(400).json({ ok: false, error: `Unknown action: ${action}` });
    }

  } catch (err) {
    console.error("Notion API error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
