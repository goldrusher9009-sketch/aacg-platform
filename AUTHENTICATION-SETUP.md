# IronForge Authentication Setup & Testing Guide

## ✅ What's Implemented

### Signup Flow
- **Modal**: Modern, responsive signup form
- **Plan Selection**: Starter, Pro, Enterprise plans
- **Validation**: 
  - Name (first + last)
  - Email format
  - Strong password (8+ chars, letter + special char)
  - Account type (Sub-Contractor, GC, Property Owner, Vendor)
  - Phone (optional)
  - Company (optional)
- **Supabase Integration**: Creates user + profile record
- **Email Confirmation**: Shows "check email" message when confirmation required
- **Auto-Redirect**: Routes to correct portal on confirmation click:
  - `/sub/` for Sub-Contractors
  - `/gc/` for General Contractors
  - `/owner/` for Property Owners
  - `/admin/` for Admin/others

### Sign-in Flow ✨ NEW
- **Modal**: Clean signin form (email + password)
- **Validation**: Email format, password required
- **Supabase Authentication**: `auth.signInWithPassword()`
- **Profile Lookup**: Fetches user's account type from profile table
- **Smart Redirect**: Routes to correct portal based on account type
- **Error Handling**: Shows user-friendly error messages
- **Keyboard Support**: Enter key submits the form

### Navigation Updates
- Sign In button now opens signin modal (instead of redirecting)
- Sign Up button opens signup modal
- "Already have an account?" links toggle between signup and signin modals

---

## 🔧 Supabase Configuration Required

### Step 1: Disable Email Confirmations (IMPORTANT)
Go to [Supabase Dashboard](https://supabase.com/dashboard/project/wausefmzaqtlomyhqcjf)
- **Path**: Authentication → Settings → Email Auth
- **Action**: Uncheck "Enable email confirmations"
- **Save** changes

**OR** Run this SQL in Supabase SQL Editor:
```sql
-- SUPABASE_ENABLE_AUTOCONFIRM.sql
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

### Step 2: Verify Profiles Table Schema
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  company TEXT,
  plan TEXT DEFAULT 'starter',
  account_type TEXT,
  role TEXT DEFAULT 'subscriber',
  status TEXT DEFAULT 'trial',
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);
```

---

## 🧪 Testing Checklist

### Test Signup
```
1. Click "Sign Up" button in nav
2. Enter details:
   - First Name: John
   - Last Name: Smith
   - Company: Acme Construction
   - Email: john@acmeconstruction.com
   - Phone: 555-123-4567 (optional)
   - Password: TestPass123!@#
   - Account Type: General Contractor (GC)
3. Select plan (Starter, Pro, or Enterprise)
4. Click "Start Free Trial"
5. ✅ Expect:
   - Success message (or email confirmation if enabled)
   - User created in Supabase auth.users
   - Profile record created

### Test Sign In
```
1. Click "Sign In" button in nav
2. Enter credentials:
   - Email: john@acmeconstruction.com
   - Password: TestPass123!@#
3. Click "Sign In →"
4. ✅ Expect:
   - Modal closes
   - User redirected to /gc/ (or correct portal for their account type)
   - Session established

### Test Invalid Credentials
```
1. Sign in with:
   - Correct email, wrong password
2. ✅ Expect: Error message "Sign in failed..."

### Test Form Validation
```
1. Try submitting signup/signin with:
   - Missing fields
   - Invalid email format
   - Weak password (if signup)
   - Wrong account type selected
2. ✅ Expect: Validation errors shown, form stays open

### Test Modal Interactions
```
1. Open Sign Up
2. Click "Already have an account? Log in here"
3. ✅ Expect: Signup modal closes, signin modal opens
4. Click "Don't have an account? Sign up here"
5. ✅ Expect: Signin modal closes, signup modal opens
6. Click X button or outside modal
7. ✅ Expect: Modal closes, can interact with page
```

---

## 📝 Functions Reference

### Signup Functions
- `openSignup(plan)` - Opens signup modal with optional plan selection
- `closeSignup()` - Closes signup modal
- `selectPlan(element)` - Handles plan selection
- `submitSignup()` - Validates form and calls Supabase signup
- `sbSignUp(...)` - Supabase signup helper function
- `resendConfirmEmail(email, type, plan)` - Resends confirmation email

### Sign-in Functions ✨ NEW
- `openSignin()` - Opens signin modal, clears form
- `closeSignin()` - Closes signin modal
- `submitSignin()` - Validates form and calls Supabase signin
- `sbSignIn(email, password)` - Supabase signin helper, handles redirect
- `goToSignup()` - Closes signin, opens signup
- `goToLogin()` - Closes signup, opens signin (now calls openSignin)

---

## 🚀 Deployment Steps

### 1. Update config.js with Supabase Credentials
```javascript
window.SUPABASE_URL = 'https://wausefmzaqtlomyhqcjf.supabase.co';
window.SUPABASE_ANON = 'your-anon-key-here';
```

### 2. Configure Email Confirmations
- Go to Supabase Dashboard
- Disable "Enable email confirmations" in Authentication → Settings
- This allows instant login without email confirmation

### 3. Test Live
```
- Open aacg-website.html locally or on your domain
- Test signup flow
- Test signin flow
- Verify redirects work to /admin/, /sub/, /gc/, /owner/
```

### 4. Monitor Supabase Logs
- Auth section shows signup/signin events
- Check for errors in real-time
- Monitor profile table for new users

---

## 🔒 Security Notes

✅ **Implemented**:
- Strong password validation (8+ chars, letter + special char)
- Input validation (email format, required fields)
- Supabase auth (no passwords stored in localStorage)
- Session tokens managed by Supabase
- Error messages don't leak user info (generic)

⚠️ **Remember**:
- Always use HTTPS in production
- Supabase handles password hashing
- Never log sensitive data to console in production
- Review RLS policies before going live

---

## 🐛 Troubleshooting

### "Authentication service not configured"
- ✅ Check config.js has SUPABASE_URL and SUPABASE_ANON set
- ✅ Verify Supabase project exists
- ✅ Check anon key is correct

### "Signup succeeds but no profile created"
- ✅ Check profiles table RLS policies
- ✅ Verify trigger or function creates profile on user creation
- ✅ Check Supabase logs for errors

### "Sign in doesn't redirect"
- ✅ Check profile table has account_type for the user
- ✅ Verify /admin/, /sub/, /gc/, /owner/ folders exist
- ✅ Check browser console for errors

### "Email confirmation keeps asking"
- ✅ Go to Supabase Settings → Email Auth
- ✅ Uncheck "Enable email confirmations"
- ✅ Or run the SQL to confirm existing users

---

## 📊 Database Schema

### auth.users (Supabase built-in)
- id (UUID)
- email (TEXT)
- encrypted_password (TEXT)
- email_confirmed_at (TIMESTAMP)
- ... (other Supabase fields)

### public.profiles (Your table)
```sql
id          UUID        → auth.users.id
email       TEXT        → user's email
name        TEXT        → full name
phone       TEXT        → contact number
company     TEXT        → organization
plan        TEXT        → starter/pro/enterprise
account_type TEXT       → Sub/GC/Owner/Vendor
role        TEXT        → subscriber/admin/etc
status      TEXT        → trial/active/cancelled
trial_start TIMESTAMP   → when trial started
trial_end   TIMESTAMP   → when trial ends
created_at  TIMESTAMP   → signup date
updated_at  TIMESTAMP   → last update
```

---

## ✨ What's Next

After successful authentication setup:
1. **Portal Pages**: Update /admin/, /gc/, /sub/, /owner/ to check session
2. **Dashboard**: Build dashboard based on account type
3. **Logout**: Add logout functionality in portals
4. **Profile Page**: Let users edit their profile
5. **Password Reset**: Implement forgot password flow
6. **2FA**: Add two-factor authentication (optional)

---

**Built with ❤️ by AACG Platform Team**
Last Updated: May 2026
