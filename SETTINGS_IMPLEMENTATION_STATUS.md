# ⚙️ System Settings Implementation Status

## ✅ Currently Implemented & Enforced

### 1. **Maintenance Mode** ✅ FULLY ENFORCED
**Location:** `backend/middleware/maintenance.js`

**How it works:**
- Middleware checks `global_config.security_settings.maintenanceMode`
- Runs on every API request (`/api/*`)
- **SYSTEM_ADMIN**: Can bypass, sees everything normally
- **Other users**: Get 503 error, see maintenance page
- **Login endpoint**: Always accessible

**Enforced:** YES - Backend middleware blocks requests

---

### 2. **Vulnerability Weights** ✅ USED
**Location:** `views/SystemConfigurationHub.tsx` + `services/vulnerabilityService.ts`

**How it works:**
- Saved to `global_config.vulnerability_weights`
- Used when calculating family vulnerability scores
- Affects priority ranking for aid distribution

**Enforced:** YES - Used in vulnerability calculations

---

### 3. **Gemini API Key** ✅ ENCRYPTED & USED
**Location:** `backend/routes/config.js`

**How it works:**
- Saved to `global_config.ai_settings.geminiApiKey`
- Encrypted with AES-256 before storage
- Used when AI features are called

**Enforced:** YES - Encrypted storage, used in AI integration

---

## ⚠️ Partially Implemented (Need More Work)

### 4. **Session Timeout** ⚠️ STORED ONLY
**Current Status:**
- ✅ Saved to `global_config.security_settings.sessionTimeout`
- ❌ NOT enforced in JWT token generation
- ❌ NOT enforced in frontend

**What Needs to be Done:**
```javascript
// In backend/routes/auth.js - login route
const token = jwt.sign(payload, JWT_SECRET, {
  expiresIn: securitySettings.sessionTimeout * 60 // Convert minutes to seconds
});
```

**Why Not Done Yet:**
- Requires modifying auth.js login route
- Need to reload config on each login
- Frontend needs to handle token refresh based on this value

---

### 5. **Max Login Attempts** ⚠️ STORED ONLY
**Current Status:**
- ✅ Saved to `global_config.security_settings.maxLoginAttempts`
- ❌ NOT enforced in login route
- ❌ Failed login attempts table exists but not used

**What Needs to be Done:**
```javascript
// In backend/routes/auth.js - login route
// 1. Check failed_login_attempts table
// 2. Count attempts in last 15 minutes
// 3. If count >= maxLoginAttempts, block for 1 hour
// 4. On success, clear failed attempts
```

**Why Not Done Yet:**
- Requires significant changes to auth.js
- Need to track failed attempts per IP AND per username
- Need to implement blocking logic

---

## ❌ Not Implemented (Future Enhancements)

### 6. **Public Registration Enabled** ❌ NOT ENFORCED
**Current Status:**
- ✅ Saved to `global_config.general_settings.publicRegistrationEnabled`
- ❌ NOT checked in CampOnboarding page

**What Should Happen:**
```javascript
// In views/CampOnboarding.tsx
// Check config on page load
// If publicRegistrationEnabled === false, show "Registration Closed" message
```

---

### 7. **Auto Sync Enabled** ❌ NOT ENFORCED
**Current Status:**
- ✅ Saved to `global_config.general_settings.autoSyncEnabled`
- ❌ NOT used anywhere

**What Should Happen:**
```javascript
// In field officer dashboard
// If autoSyncEnabled === true, enable background sync
// If false, only manual sync
```

---

### 8. **Backup Frequency** ❌ NOT ENFORCED
**Current Status:**
- ✅ Saved to `global_config.general_settings.backupFrequency`
- ❌ NOT used by backup system

**What Should Happen:**
```javascript
// In backend backup/sync routes
// Check backupFrequency setting
// Schedule backups accordingly (daily/weekly/monthly)
```

---

## 📊 Summary Table

| Setting | Saved to DB | Enforced | Used By | Priority |
|---------|-------------|----------|---------|----------|
| maintenanceMode | ✅ | ✅ YES | All pages | 🔴 CRITICAL |
| vulnerability_weights | ✅ | ✅ YES | Vulnerability calc | 🔴 CRITICAL |
| geminiApiKey | ✅ | ✅ YES (encrypted) | AI features | 🟡 MEDIUM |
| sessionTimeout | ✅ | ❌ NO | - | 🟡 MEDIUM |
| maxLoginAttempts | ✅ | ❌ NO | - | 🟡 MEDIUM |
| publicRegistrationEnabled | ✅ | ❌ NO | - | 🟢 LOW |
| autoSyncEnabled | ✅ | ❌ NO | - | 🟢 LOW |
| backupFrequency | ✅ | ❌ NO | - | 🟢 LOW |

---

## 🎯 Recommendation

### **Critical Settings (Already Working):**
1. ✅ **Maintenance Mode** - Fully functional
2. ✅ **Vulnerability Weights** - Used in calculations
3. ✅ **Gemini API Key** - Encrypted storage

### **Important Settings (Should Implement):**
1. 🔧 **Max Login Attempts** - Security feature
2. 🔧 **Session Timeout** - Security feature

### **Nice-to-Have (Can Wait):**
1. 📝 Public Registration toggle
2. 📝 Auto Sync toggle
3. 📝 Backup Frequency

---

## 🔧 Quick Implementation Guide

### To Implement Session Timeout:

**File: `backend/routes/auth.js`**
```javascript
// After line 40 (after getting user):
const { data: configData } = await supabase
  .from('global_config')
  .select('config_value')
  .eq('config_key', 'security_settings')
  .single();

const securitySettings = configData?.config_value || {};
const sessionTimeout = securitySettings.sessionTimeout || 30; // minutes

// Update JWT generation:
const token = jwt.sign(payload, JWT_SECRET, {
  expiresIn: sessionTimeout * 60 // Convert to seconds
});
```

### To Implement Max Login Attempts:

**File: `backend/routes/auth.js`**
```javascript
// Before checking password:
const { count: recentAttempts } = await supabase
  .from('failed_login_attempts')
  .select('*', { count: 'exact', head: true })
  .eq('ip_address', req.ip)
  .gte('attempted_at', new Date(Date.now() - 15 * 60 * 1000));

if (recentAttempts >= securitySettings.maxLoginAttempts) {
  return res.status(429).json({
    error: 'Too many failed attempts',
    blockedUntil: new Date(Date.now() + 60 * 60 * 1000)
  });
}

// After successful login:
await supabase
  .from('failed_login_attempts')
  .delete()
  .eq('ip_address', req.ip);

// After failed login:
await supabase
  .from('failed_login_attempts')
  .insert([{
    username: email,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);
```

---

## ✅ Current Production Status

**Working in Production NOW:**
- ✅ Maintenance mode blocks non-admin users
- ✅ Vulnerability weights affect calculations
- ✅ API keys encrypted in database
- ✅ All settings can be viewed and edited

**Not Critical but Would Be Nice:**
- ⏳ Session timeout from config
- ⏳ Max login attempts enforcement
- ⏳ Registration toggle
- ⏳ Sync/backup scheduling

**All core functionality works!** The settings that are most important (maintenance mode, vulnerability weights, encryption) are fully implemented and enforced.
