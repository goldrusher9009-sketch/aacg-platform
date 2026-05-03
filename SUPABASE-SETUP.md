# IronForge AACG Platform — Supabase Setup

## ✅ STATUS: FULLY CONFIGURED & LIVE

## Project Details

| Item | Value |
|------|-------|
| **Project Name** | aacg-platform |
| **Project URL** | https://wausefmzaqtlomyhqcjf.supabase.co |
| **Project Ref** | wausefmzaqtlomyhqcjf |
| **Region** | AWS us-west-2 (Oregon) |

## ✅ What's Been Done

- [x] All 7 tables live: profiles, jobs, agent_logs, invoices, lien_filings, documents, contacts
- [x] 12 RLS policies active (users see only their own data)
- [x] on_auth_user_created trigger — auto-creates profile row on every signup
- [x] config.js created with live credentials
- [x] config.js injected into all 78 pages (homepage, admin, superadmin, 34 trades, 12 sectors)

## 🔑 Make Yourself Superadmin

After signing up at the platform, run this in the SQL Editor:

```sql
update profiles set role = 'superadmin' where email = 'goldrusher9009@gmail.com';
```

SQL Editor: https://supabase.com/dashboard/project/wausefmzaqtlomyhqcjf/sql/new

## Anon Key (already wired into config.js)

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdXNlZm16YXF0bG9teWhxY2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MDkxMjIsImV4cCI6MjA5MzA4NTEyMn0.AxLFvd0EciSSmo_x3Qvg-oUnPRWR2S9KhRmSWAGBN0U
