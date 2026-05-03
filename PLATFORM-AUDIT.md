# AACG Platform — Full End-to-End Wiring Audit
**IronForge SaaS Platform | Date: May 2026**

---

## Executive Summary

The AACG Platform (IronForge) is a full-stack SaaS for construction contractors. It consists of a public marketing website, a subscriber admin portal, a super admin portal, AI agent runners (free + cloud tiers), and a Supabase backend. This document audits every panel, feature, and integration — what's live, what's demo, and what's next.

---

## 1. Architecture Overview

```
Public Website (index.html)
  ├── Homepage, SEO landing pages, trade/sector pages
  ├── Signup → creates Supabase auth user + profile row
  └── Login → sets sessionStorage, loads admin

Subscriber Admin (admin/index.html)
  ├── Auth gate: reads sessionStorage['aacg_subscriber']
  ├── Sidebar panels: Dashboard | Lien Tracker | Projects | Analytics |
  │   Clients | Technicians | Photo AI | Compliance | Billing | Team | Settings
  ├── AI Agents panel: 14 agents × free/cloud tier
  └── Notifications: bell icon + in-memory dropdown

Super Admin (superadmin/index.html)
  ├── Password-gated (hardcoded passphrase)
  ├── Full user list from Supabase profiles table
  ├── Suspend / upgrade / delete subscribers
  └── Platform-wide usage stats

Supabase Backend
  ├── Auth (email/password)
  ├── profiles, jobs, agent_logs, invoices, lien_filings, documents, contacts
  ├── liens, clients, technicians (v2 tables)
  └── Row Level Security on all tables
```

---

## 2. Panel-by-Panel Status

### 2.1 Dashboard (Home)
| Feature | Status | Notes |
|---------|--------|-------|
| KPI cards | ✅ Live | Reads from jobs + agent_logs via Supabase with demo fallback |
| Live activity log | ✅ Live | Auto-scrolls, driven by `startLiveLog()` |
| Tier badge | ✅ Live | Shows current plan from session |

### 2.2 AI Agents
| Feature | Status | Notes |
|---------|--------|-------|
| 14 agents displayed | ✅ Live | From `AGENTS[]` array |
| Free tier agents | ✅ Live | `runFreeAgent()` — deterministic, ~2s, no API |
| Cloud tier agents | ✅ Live | `runAgent()` — calls OpenRouter → Claude Haiku |
| API key entry | ✅ Live | Inline key input, stored in `localStorage` |
| Progress bar | ✅ Live | Animated with step messages |
| Completion notification | ✅ Live | Both free (`⚡`) and cloud (`🤖`) fire `addNotification()` |
| Supabase log on complete | ✅ Live | Inserts to `agent_logs` table |
| Tier gating | ✅ Live | Free tier can run 10/mo, cloud unlimited |

### 2.3 Lien Tracker
| Feature | Status | Notes |
|---------|--------|-------|
| Kanban board (5 stages) | ✅ Live | draft → prelim → filed → satisfied → disputed |
| Supabase read | ✅ Live | `liens` table, filtered by user_id |
| Demo fallback | ✅ Live | 6 demo liens if no Supabase data |
| Add Lien modal | ✅ Live | `openAddLienModal()` + `saveLien()` → inserts to Supabase |
| Totals per column | ✅ Live | Calculated dynamically |

### 2.4 Projects
| Feature | Status | Notes |
|---------|--------|-------|
| Project table | ✅ Live | Reads from `jobs` table in Supabase |
| Demo fallback | ✅ Live | 5 demo projects if no Supabase data |
| Search/filter | ✅ Live | `filterProjects()` — client-side |
| Add Project modal | ✅ Live | `saveProject()` → inserts to `jobs` |
| Status pills | ✅ Live | active / completed / on_hold |

### 2.5 Analytics
| Feature | Status | Notes |
|---------|--------|-------|
| Tier gate (Pro+) | ✅ Live | Shows upgrade prompt for starter |
| KPI cards | ✅ Live | Pulls real job count + agent runs from Supabase |
| Revenue by Trade chart | ⚠️ Demo | Demo distribution bars — needs invoice-by-trade query |
| Top Agent Savings | ⚠️ Demo | Estimated savings, not calculated from logs |
| **Next step** | — | Add `SUM(contract_amount)` query per trade from `jobs` |

### 2.6 Clients
| Feature | Status | Notes |
|---------|--------|-------|
| Client table | ✅ Live | Reads from `clients` table |
| Demo fallback | ✅ Live | 5 demo clients |
| Add Client modal | ✅ Live | `saveClient()` → inserts to `clients` |
| Contact button | ✅ Live | Opens `mailto:` or `tel:` |
| Search/filter | ✅ Live | Client-side filter |

### 2.7 Technicians (Field Crew)
| Feature | Status | Notes |
|---------|--------|-------|
| Tech roster table | ✅ Live | Reads from `technicians` table |
| Demo fallback | ✅ Live | 5 demo technicians |
| Add Tech modal | ✅ Live | `saveTech()` → inserts to `technicians` |
| License column | ✅ Live | Displays license number |
| Trade badges | ✅ Live | Color-coded by trade |

### 2.8 Photo AI
| Feature | Status | Notes |
|---------|--------|-------|
| Tier gate (Pro+) | ✅ Live | Shows upgrade prompt for starter |
| Photo cards | ⚠️ Demo | Shows demo site inspection cards |
| **Next step** | — | Wire to Supabase Storage for real photo uploads |

### 2.9 Compliance
| Feature | Status | Notes |
|---------|--------|-------|
| Tier gate (Pro+) | ✅ Live | Shows upgrade prompt for starter |
| Compliance items | ⚠️ Demo | Hardcoded permit/OSHA/bond items |
| **Next step** | — | Add `permits` table, wire deadline alerts |

### 2.10 Billing / Wallet
| Feature | Status | Notes |
|---------|--------|-------|
| Plan display | ✅ Live | Shows current tier name + price |
| Usage meters | ✅ Live | Agents run / projects / storage bars |
| Payment method display | ✅ Live | Stripe-ready UI (Visa •••• 4242 demo) |
| Invoice history | ✅ Live | Table with PDF button (notification fires) |
| Upgrade modal | ✅ Live | Shows plan comparison + pricing |
| **Next step** | — | Integrate Stripe SDK: `stripe.redirectToCheckout()` with `stripe_price_id` |
| **Next step** | — | Stripe webhook: update `profiles.plan` on `checkout.session.completed` |

### 2.11 Team (Enterprise)
| Feature | Status | Notes |
|---------|--------|-------|
| Tier gate (Enterprise) | ✅ Live | Shows upgrade prompt for non-enterprise |
| Team roster | ⚠️ Demo | Hardcoded 5 demo members |
| **Next step** | — | Add `team_members` table with invite flow |

### 2.12 Settings
| Feature | Status | Notes |
|---------|--------|-------|
| Profile save (name/company/email) | ✅ Live | Updates `profiles` table + local session |
| Password change | ✅ Live | `sbClient.auth.updateUser({ password })` |
| Notification toggles | ✅ UI | Toggle UI present; preferences not yet persisted |
| Integrations (QB, Procore, DocuSign) | ✅ UI | Connect buttons present; OAuth not yet implemented |
| **Next step** | — | Persist notification prefs as `profiles.notification_prefs` JSONB |

### 2.13 Notifications System
| Feature | Status | Notes |
|---------|--------|-------|
| Bell icon with red dot | ✅ Live | Unread count badge |
| Notification dropdown | ✅ Live | Slides in/out, marks read on open |
| Seeded boot alerts | ✅ Live | 7 realistic alerts on login |
| Agent completion hook | ✅ Live | Both free + cloud agents fire `addNotification()` |
| Data save hooks | ✅ Live | Project/client/tech/lien saves all trigger notifications |
| Clear all button | ✅ Live | |
| **Next step** | — | Persist notifications to Supabase `notifications` table |
| **Next step** | — | Push via Supabase Realtime for multi-device sync |

---

## 3. Supabase Table Status

| Table | Status | Used By |
|-------|--------|---------|
| `profiles` | ✅ Live | Auth, Settings, Super Admin |
| `jobs` | ✅ Live | Projects panel, Dashboard KPIs, Analytics |
| `agent_logs` | ✅ Live | AI Agents (both tiers), Analytics |
| `invoices` | ✅ Live | Billing panel (read), Analytics |
| `lien_filings` | ✅ Schema | Legacy table — admin uses `liens` instead |
| `documents` | ✅ Schema | Not yet read in admin panels |
| `contacts` | ✅ Schema | Not yet read in admin panels |
| `liens` | ✅ Live | Lien Tracker panel (read + write) |
| `clients` | ✅ Live | Clients panel (read + write) |
| `technicians` | ✅ Live | Technicians panel (read + write) |

---

## 4. Authentication Flow

```
Public site → Sign Up form
  → sbClient.auth.signUp({ email, password })
  → Trigger: auto-insert into profiles (via DB trigger or frontend)
  → sessionStorage['aacg_subscriber'] set with sbUser + plan

Public site → Login form  
  → sbClient.auth.signInWithPassword({ email, password })
  → Reads profiles row for name/company/plan
  → sessionStorage set → redirect to /admin/

Admin panel load
  → Reads sessionStorage['aacg_subscriber']
  → If not found → redirect to /#login
  → Sets window._sbUserId for all DB queries
```

---

## 5. Agent Tier System

| Tier | Who | Agents | API | Cost |
|------|-----|--------|-----|------|
| Free (Starter plan) | All subscribers | `runFreeAgent()` | None | $0 |
| Cloud | Pro + Enterprise | `runAgent()` | OpenRouter/Anthropic | Per API call |

**Free Agent**: Deterministic output built from `freeRun` template + job context. Takes ~2s with fake progress. No external API. Notification fires on complete.

**Cloud Agent**: Calls `https://openrouter.ai/api/v1/chat/completions` with model `anthropic/claude-haiku-4-5`. API key stored in `localStorage`. Inline key entry if not set. Notification fires on complete.

---

## 6. Competitor Feature Comparison

| Feature | IronForge | Procore | Buildertrend | Fieldwire | Jobber |
|---------|-----------|---------|--------------|-----------|--------|
| AI Agents | ✅ 14 agents | ❌ | ❌ | ❌ | ❌ |
| Lien Tracker | ✅ Kanban | ✅ | ✅ | ❌ | ❌ |
| Photo AI | ✅ (coming) | ❌ | ❌ | ✅ Basic | ❌ |
| Compliance / Permits | ✅ UI | ✅ Full | ✅ | ✅ | ❌ |
| Client CRM | ✅ Live | ✅ | ✅ | ❌ | ✅ Full |
| Field Crew Mgmt | ✅ Live | ✅ | ✅ | ✅ | ✅ |
| Billing / Invoicing | ✅ Stripe-ready | ✅ | ✅ | ❌ | ✅ Full |
| Free tier | ✅ | ❌ | ❌ | ✅ Limited | ✅ Limited |
| Construction-specific | ✅ | ✅ | ✅ | ✅ | ⚠️ Generic |
| Pricing | $0-$299/mo | $375+/mo | $99+/mo | $54+/mo | $9+/mo |

---

## 7. What's Wired vs. What's Next

### ✅ Fully Wired (Done)
- Supabase auth (signup, login, password change)
- Profile read/write to `profiles` table
- Projects → `jobs` table (read + write + search)
- Lien Tracker → `liens` table (read + write + kanban)
- Clients → `clients` table (read + write)
- Technicians → `technicians` table (read + write)
- Agent logs → `agent_logs` table (both free + cloud)
- Analytics KPI cards → real Supabase counts
- Notification system (bell, dropdown, agent hooks, data hooks)
- Billing panel (Stripe-ready UI, usage meters)
- Settings (profile + password)
- Tier gating on all premium panels

### ⚠️ Partially Done (UI complete, backend missing)
- **Billing / Stripe**: UI is done. Need Stripe SDK + webhook to actually charge cards
- **Analytics**: KPI cards live, revenue-by-trade and agent savings are demo estimates
- **Compliance**: UI complete. Need `permits` table + real deadline tracking
- **Photo AI**: UI complete. Need Supabase Storage + computer vision pipeline
- **Team**: UI complete. Need `team_members` table + invite emails
- **Notification preferences**: Toggle UI done. Preferences not persisted

### 🔴 Not Yet Built
- **Stripe integration**: `stripe.redirectToCheckout()`, webhooks, customer portal
- **SMS / Twilio**: Phone number (929-888-2848) on marketing site is personal. Need Twilio for:
  - Lien deadline SMS alerts
  - Agent completion texts
  - Lead inquiry auto-response
- **Email system**: No transactional emails (welcome, invoice, lien alerts)
- **Supabase Realtime**: Notifications could be real-time pushed (vs. in-memory only)
- **Photo upload**: Supabase Storage bucket for site photos
- **Document management**: `documents` table exists but no upload/view UI
- **QuickBooks / Procore / DocuSign OAuth**: Connect buttons exist, no OAuth flow

---

## 8. Recommended Next Priorities

### Priority 1: Stripe (Revenue)
```
1. Install Stripe SDK via CDN in admin/index.html
2. On "Upgrade" button click: stripe.redirectToCheckout({ priceId: plan.stripe_price_id })
3. Build /api/stripe-webhook endpoint (Supabase Edge Function)
4. Webhook: update profiles.plan on checkout.session.completed
5. Add customer portal link for self-service cancellation
```

### Priority 2: Twilio SMS
```
1. Buy Twilio number (replace personal number on website)
2. Supabase Edge Function: send SMS on lien deadline T-30, T-7, T-1
3. Supabase Edge Function: send SMS on agent completion (cloud tier)
4. Supabase Edge Function: incoming SMS to new lead → auto-insert contact
```

### Priority 3: Compliance Table
```sql
CREATE TABLE permits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  permit_number text,
  job_id uuid references jobs(id),
  type text,  -- building | OSHA | bond | insurance | license
  expiry date,
  status text default 'active',
  created_at timestamptz default now()
);
```

### Priority 4: Push Notifications via Supabase Realtime
```javascript
sbClient.channel('notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
    (payload) => addNotification(payload.new.title, payload.new.body, payload.new.type))
  .subscribe();
```

---

## 9. Files Reference

| File | Purpose |
|------|---------|
| `index.html` | Public marketing site + homepage |
| `admin/index.html` | Full subscriber admin portal (~2,500 lines) |
| `superadmin/index.html` | Owner-only moderation portal |
| `supabase-schema.sql` | All table definitions + RLS policies |
| `PLATFORM-AUDIT.md` | This document |
| `trades/*.html` | 34 trade SEO landing pages |
| `sectors/*.html` | 12 sector SEO landing pages |

---

*Generated by IronForge Platform Audit — May 2026*
