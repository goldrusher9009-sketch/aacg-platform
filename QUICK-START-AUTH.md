# ⚡ Quick Start - Authentication Live

## 🎯 TL;DR - What to Do Right Now

### 1️⃣ Update config.js (2 minutes)
```javascript
window.SUPABASE_URL = 'https://wausefmzaqtlomyhqcjf.supabase.co';
window.SUPABASE_ANON = 'your-actual-anon-key'; // Get from Supabase dashboard
```

### 2️⃣ Disable Email Confirmations in Supabase (1 minute)
- Go to: https://supabase.com/dashboard/project/wausefmzaqtlomyhqcjf
- Click: **Authentication** → **Settings** → **Email Auth**
- Uncheck: "Enable email confirmations"
- Save changes

**Why?** Users can login instantly without checking their email.

### 3️⃣ Test It (5 minutes)

**Sign Up Test:**
1. Open `aacg-website.html`
2. Click "Sign Up" button
3. Fill form:
   ```
   First Name: Test
   Last Name: User
   Email: testuser@example.com
   Password: TestPass123!@#
   Account Type: General Contractor (GC)
   Plan: Pro
   ```
4. Click "Start Free Trial →"
5. ✅ Should see confirmation message

**Sign In Test:**
1. Click "Sign In" button  
2. Enter credentials:
   ```
   Email: testuser@example.com
   Password: TestPass123!@#
   ```
3. Click "Sign In →"
4. ✅ Should redirect to `/gc/`

---

## 📋 What Was Built

| Feature | Status | Details |
|---------|--------|---------|
| Signup Modal | ✅ Complete | Plan selection, form validation |
| Signin Modal | ✅ Complete | Email + password, smart redirect |
| Supabase Integration | ✅ Complete | Full auth + profile storage |
| Form Validation | ✅ Complete | Email, password, required fields |
| Error Messages | ✅ Complete | User-friendly feedback |
| Smart Redirects | ✅ Complete | Routes to /gc/, /sub/, /owner/, /admin/ |
| Email Confirmation | ✅ Complete | Resend option, confirmation flow |
| Keyboard Support | ✅ Complete | Press Enter to sign in |

---

## 🔧 3 Critical Things to Remember

### ✅ Must Do
1. **Set SUPABASE credentials** in config.js
2. **Disable email confirmations** in Supabase settings
3. **Test signup → signin flow** end-to-end

### 🚫 Don't Forget
- Users need account_type to redirect correctly
- Profiles table must exist in Supabase
- Portal folders (/admin/, /gc/, /sub/, /owner/) must exist

### 📝 Optional Enhancements
- Add "Forgot Password" flow
- Add logout button
- Add profile edit page
- Add 2FA support

---

## 🧪 Quick Test Checklist

- [ ] Signup form opens with "Sign Up" click
- [ ] All form fields accept input
- [ ] Password validation works (8+ chars, special char required)
- [ ] Account type dropdown works
- [ ] Plan selection works
- [ ] Submit button works
- [ ] Signin form opens with "Sign In" click
- [ ] Email + password fields accept input
- [ ] Signin redirects to /gc/ (or correct portal)
- [ ] Error message shows with wrong password
- [ ] Modal closes with X button or outside click

---

## 📊 Architecture at a Glance

```
aacg-website.html
  ├── Signup Modal
  │   └── submitSignup() → sbSignUp() → Supabase auth
  │
  ├── Signin Modal ✨ NEW
  │   └── submitSignin() → sbSignIn() → Supabase auth → Smart Redirect
  │
  ├── Navigation
  │   ├── Sign In button → openSignin()
  │   └── Sign Up button → openSignup()
  │
  └── Database (Supabase)
      ├── auth.users (passwords, email)
      └── profiles (account_type, plan, company, etc)
```

---

## 🚀 Deployment Checklist

- [ ] SUPABASE_URL set in config.js
- [ ] SUPABASE_ANON key set in config.js
- [ ] Email confirmations disabled in Supabase
- [ ] Profiles table created with correct schema
- [ ] Portal folders exist (/admin/, /gc/, /sub/, /owner/)
- [ ] Test signup flow
- [ ] Test signin flow
- [ ] Test redirects to correct portal
- [ ] Check Supabase logs for errors
- [ ] Monitor first few signups

---

## 💬 Common Questions

**Q: How do users reset their password?**
A: Not yet implemented. You can add this in Supabase auth settings.

**Q: Why disable email confirmations?**
A: Users get instant access. You can enable it later if you prefer verification.

**Q: Where do I get the SUPABASE_ANON key?**
A: Supabase Dashboard → Settings → API → Project API keys → `anon` key

**Q: What if user signup fails?**
A: Check browser console (F12) for errors, or Supabase logs for auth issues.

**Q: Can users edit their profile?**
A: Yes! Profiles table is set up. Build a profile edit page to let them update.

---

## 🎯 Next Steps

1. **This Week**: Get config.js working, test flows
2. **This Month**: Add logout, password reset, profile page
3. **Later**: Add OAuth (Google/GitHub), 2FA, email notifications

---

## 📞 Support

See `AUTHENTICATION-SETUP.md` for detailed docs and troubleshooting.

**Built with ❤️ by AACG**
