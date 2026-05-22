// ── NOVI OS — NOTION API BRIDGE ───────────────────────────────────────────────
// FIXED VERSION — TASK TITLES + CLEANER PARSING

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const BASE = "https://api.notion.com/v1";

// ── DATABASE IDs ──────────────────────────────────────────────────────────────
const DB = {
  departmentUpdates : "74366ef5e20f4bea89c1a6ecce710d17",
  tasks             : "36009180590980098e44f907ba6c249a",
  eodReports        : "3610918059098072b685c2fc076ae423",
  decisionLog       : "3620918059098002b3abfcc50cfabe5e",
  weeklyReviews     : "3610918059098067b08fd6a4a46bb439",
  todaysPriorities  : "360091805909808fa909ce8831c1bcb8",
  deptUpdatesFeed   : "36009180590980b39ee7c9b76be0e1ad",
};

// ── VALID OPTIONS ─────────────────────────────────────────────────────────────
const OPTS = {
  departments : [
    "HQ",
    "Formulations",
    "COO",
    "CFO",
    "CLO",
    "CMO",
    "Market Strategy",
    "Operations",
    "Vendors",
    "Compliance"
  ],

  priority : [
    "Low",
    "Medium",
    "High",
    "Critical"
  ],

  deptStatus : [
    "Planned",
    "In Progress",
    "Blocked",
    "Completed",
    "On Hold"
  ],

  taskStatus : [
    "Not Started",
    "In Progress",
    "Blocked",
    "Completed",
    "Deferred"
  ],

  eodStatus : [
    "On Track",
    "Delayed",
    "Critical",
    "Blocked"
  ],

  approval : [
    "Approved",
    "Pending",
    "Rejected",
    "Deferred"
  ],
};

const safe = (val, allowed, fallback) =>
  allowed.includes(val) ? val : fallback;

// ── NOTION FETCH ──────────────────────────────────────────────────────────────
const nFetch = async (path, method = "GET", body = null) => {

  const res = await fetch(`${BASE}${path}`, {
    method,

    headers: {
      "Authorization"  : `Bearer ${NOTION_TOKEN}`,
      "Notion-Version" : "2022-06-28",
      "Content-Type"   : "application/json",
    },

    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("NOTION ERROR:", data);
    throw new Error(data.message || "Notion API Error");
  }

  return data;
};

// ── PROPERTY HELPERS ──────────────────────────────────────────────────────────
const prop = {

  title: (v) => ({
    title: [
      {
        text: {
          content: String(v || "").slice(0, 2000)
        }
      }
    ]
  }),

  text: (v) => ({
    rich_text: [
      {
        text: {
          content: String(v || "").slice(0, 2000)
        }
      }
    ]
  }),

  select: (v) => ({
    select: {
      name: String(v || "")
    }
  }),

  multiSelect: (v) => ({
    multi_select: (Array.isArray(v) ? v : [v]).map(n => ({
      name: String(n)
    }))
  }),

  date: (v) => ({
    date: {
      start: v || new Date().toISOString().split("T")[0]
    }
  }),

  checkbox: (v) => ({
    checkbox: Boolean(v)
  }),
};

// ── PROPERTY EXTRACTION ───────────────────────────────────────────────────────
const extract = (p) => {

  if (!p) return "";

  switch (p.type) {

    case "title":
      return p.title?.map(t => t.plain_text).join("") || "";

    case "rich_text":
      return p.rich_text?.map(t => t.plain_text).join("") || "";

    case "select":
      return p.select?.name || "";

    case "multi_select":
      return p.multi_select?.map(t => t.name).join(", ") || "";

    case "date":
      return p.date?.start || "";

    case "checkbox":
      return p.checkbox ? "Yes" : "No";

    case "status":
      return p.status?.name || "";

    default:
      return "";
  }
};

// ── CLEAN PARSER ──────────────────────────────────────────────────────────────
const parse = (pages) => pages.map(page => {

  const obj = {
    _id  : page.id,
    _url : page.url
  };

  Object.entries(page.properties || {}).forEach(([k, v]) => {
    obj[k] = extract(v);
  });

  // ── CLEAN FRONTEND KEYS ────────────────────────────────────────────────────

  obj.taskName         = obj["Task Name"] || "";
  obj.decisionTitle    = obj["Decision Title"] || "";
  obj.overallStatus    = obj["Overall Status"] || "";
  obj.founderApproval  = obj["Founder Approval"] || "";

  return obj;
});

// ── QUERY DATABASE ────────────────────────────────────────────────────────────
const queryDB = async (dbId, sorts = null, filter = null) => {

  const body = {
    page_size: 100
  };

  if (sorts) {
    body.sorts = sorts;
  }

  if (filter) {
    body.filter = filter;
  }

  const data = await nFetch(
    `/databases/${dbId}/query`,
    "POST",
    body
  );

  return parse(data.results || []);
};

// ── CREATE PAGE ───────────────────────────────────────────────────────────────
const createPage = async (dbId, properties) => {

  return nFetch("/pages", "POST", {
    parent: {
      database_id: dbId
    },
    properties
  });
};

// ── CORS ──────────────────────────────────────────────────────────────────────
const cors = (res) => {

  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );
};

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {

  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { action, payload } = req.body || {};

  try {

    // ── GET TASKS ────────────────────────────────────────────────────────────
    if (action === "getTasks") {

      const items = await queryDB(DB.tasks, [
        {
          property : "Status",
          direction: "ascending"
        },

        {
          property : "Priority",
          direction: "descending"
        }
      ]);

      return res.json({
        ok: true,
        items
      });
    }

    // ── GET DEPARTMENT UPDATES ──────────────────────────────────────────────
    if (action === "getDeptUpdates") {

      const items = await queryDB(DB.departmentUpdates, [
        {
          timestamp : "created_time",
          direction : "descending"
        }
      ]);

      return res.json({
        ok: true,
        items
      });
    }

    // ── CREATE TASK ─────────────────────────────────────────────────────────
    if (action === "createTask") {

      const {
        taskName,
        department,
        priority,
        status,
        owner,
        deadline,
        dependency,
        notes
      } = payload;

      await createPage(DB.tasks, {

        "Task Name": prop.title(taskName),

        "Department": prop.select(
          safe(department, OPTS.departments, "HQ")
        ),

        "Priority": prop.select(
          safe(priority, OPTS.priority, "Medium")
        ),

        "Status": prop.select(
          safe(status, OPTS.taskStatus, "Not Started")
        ),

        "Owner": prop.text(owner || "Jaymin"),

        "Deadline": prop.date(deadline),

        "Dependency": prop.text(dependency || ""),

        "Notes": prop.text(notes || ""),
      });

      return res.json({
        ok: true,
        message: "Task created in Notion"
      });
    }

    // ── DEFAULT ─────────────────────────────────────────────────────────────
    return res.status(400).json({
      ok: false,
      error: `Unknown action: ${action}`
    });

  } catch (err) {

    console.error("Notion API error:", err);

    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
