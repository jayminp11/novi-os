# NOVI OS — Deployment Guide v2
## Jaymin Parekh | parekhjaymin11@gmail.com
## Built on your exact Notion structure

---

## YOUR NOTION DATABASE IDs (already wired in code)
- Department Updates : 74366ef5e20f4bea89c1a6ecce710d17
- Tasks             : 36009180590980098e44f907ba6c249a
- EOD Reports       : 3610918059098072b685c2fc076ae423
- Decision Log      : 3620918059098002b3abfcc50cfabe5e
- Weekly Reviews    : 3610918059098067b08fd6a4a46bb439

## YOUR 7 CLAUDE PROJECT CHATS (linked in dashboard)
NOVI COO · NOVI Formulations · NOVI Market Strategy
NOVI HQ — Central Command · NOVI CMO · NOVI CFO · NOVI CLO

---

## STEP 1 — Connect Notion Integration (5 min)

1. Go to notion.so/my-integrations
2. Click "New Integration" → Name: "NOVI OS" → Submit
3. Copy the secret token (starts with ntn_ or secret_)
4. For EACH of your 5 databases:
   - Open the database in Notion
   - Click ··· top right → Connections → Add NOVI OS
5. Done — Notion is now connected

---

## STEP 2 — Verify Column Names Match Exactly

The code uses these EXACT column names. Check yours match:

### DEPARTMENT UPDATES
Name | Department | Summary | Status | Priority |
Risks | Founder Decision Required | Next Actions | Date

### TASKS
Task Name | Department | Priority | Status |
Owner | Deadline | Dependency | Notes

### EOD REPORTS
Date | Overall Status | Major Wins | Key Updates |
Critical Blockers | Founder Decisions Required |
Risks Identified | Tomorrow Priorities

### DECISION LOG
Decision Title | Department | Decision Summary |
Reasoning | Risks | Founder Approval | Long-Term Impact | Date

If any column name differs, either:
A) Rename it in Notion to match above, OR
B) Tell me your exact name and I'll update the code

---

## STEP 3 — Set Up Free Email Service (5 min)

Resend sends your EOD email for free (3000 emails/month):

1. Go to resend.com → Sign up free
2. Verify your domain OR use their sandbox
3. Dashboard → API Keys → Create API Key
4. Copy the key (starts with re_)

---

## STEP 4 — Deploy to Vercel (10 min)

### Install
```bash
npm install -g vercel
npm install
```

### Deploy
```bash
vercel deploy --prod
```

### Set Environment Variables
Go to vercel.com → Your Project → Settings → Environment Variables

Add these 3:
```
NOTION_TOKEN    = ntn_b24411077213ocC3OU9HXGhjiMx7NEmPeWSMyvt8KxsfFI
GMAIL_USER      = parekhjaymin11@gmail.com
RESEND_API_KEY  = re_your_key_here
```

Redeploy after adding env vars:
```bash
vercel deploy --prod
```

---

## STEP 5 — Test Everything

1. Open your Vercel URL
2. Dashboard should load your Notion tasks
3. Click "SEND EOD NOW" → check your email
4. Create a test task → check Notion Tasks table
5. Log a test decision → check Notion Decision Log

---

## YOUR DAILY WORKFLOW

### Morning (2 min)
Open novi-os.vercel.app → see full company status

### During the Day
1. Open claude.ai → NOVI Operating System project
2. Go to relevant dept chat
3. Have your AI conversation as normal
4. End with: "Summarise for HQ sync — include decisions, next actions, risks, founder input needed"
5. Copy summary → NOVI Dashboard → Sync from Chat → SYNC
6. One click → saved to Notion Department Updates

### 6:00 PM IST — Automatic
EOD report emails to parekhjaymin11@gmail.com
Saved to Notion EOD Reports table

---

## NOTION SELECT OPTIONS (exact values in code)

Department: HQ, Formulations, COO, CFO, CLO, CMO, Market Strategy, Operations, Vendors, Compliance
Priority: Low, Medium, High, Critical
Dept Status: Planned, In Progress, Blocked, Completed, On Hold
Task Status: Not Started, In Progress, Blocked, Completed, Deferred
EOD Status: On Track, Delayed, Critical, Blocked
Approval: Approved, Pending, Rejected, Deferred

Make sure your Notion select options match these EXACTLY (case sensitive).
