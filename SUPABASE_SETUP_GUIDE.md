# 🗄️ **Supabase Database Setup Guide**

## 📋 **Quick Setup Steps**

### **1. Apply Database Schema**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select project: `rusfhlvwrzetrqsirzut`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run Schema**
   - Open the file: `supabase/schema.sql`
   - Copy the entire contents (407 lines)
   - Paste into the SQL Editor
   - Click "Run" to execute

4. **Verify Tables Created**
   After running, you should see 8 tables created:
   - ✅ `users`
   - ✅ `user_sessions`
   - ✅ `subscriptions`
   - ✅ `pdf_jobs`
   - ✅ `job_status`
   - ✅ `user_documents`
   - ✅ `pdf_templates`
   - ✅ `audit_log`

### **2. Create Storage Buckets**

1. **Go to Storage Section**
   - Click "Storage" in the left sidebar
   - Click "Create a new bucket"

2. **Create Required Buckets**

   **Bucket 1: pdf-uploads**
   - Name: `pdf-uploads`
   - Public: ❌ (Private)
   - File size limit: 50MB
   - Allowed MIME types: `application/pdf`

   **Bucket 2: pdf-processed**
   - Name: `pdf-processed`
   - Public: ✅ (Public)
   - File size limit: 50MB
   - Allowed MIME types: `application/pdf`

   **Bucket 3: pdf-templates**
   - Name: `pdf-templates`
   - Public: ✅ (Public)
   - File size limit: 10MB
   - Allowed MIME types: `application/pdf`

   **Bucket 4: thumbnails**
   - Name: `thumbnails`
   - Public: ✅ (Public)
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg,image/png,image/webp`

### **3. Set Up Row Level Security (RLS) Policies**

The schema already includes RLS policies, but verify they're active:

1. **Go to Authentication → Policies**
2. **Check each table has policies enabled**
3. **Verify policies are active for**:
   - Users can only access their own data
   - Public read access for templates
   - Secure file access controls

### **4. Test Database Connection**

After setup, test the API endpoints:

```bash
# Test template categories (should work now)
curl https://cl4pdf-api-5ad2fef3254f.herokuapp.com/api/templates/categories

# Test subscription plans
curl https://cl4pdf-api-5ad2fef3254f.herokuapp.com/api/subscriptions/plans

# Test user registration
curl -X POST https://cl4pdf-api-5ad2fef3254f.herokuapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","full_name":"Test User","platform":"snackpdf"}'
```

## 🔧 **Troubleshooting**

### **If Schema Fails to Apply**
1. Check for syntax errors in the SQL
2. Run sections individually if needed
3. Verify you have admin permissions

### **If Buckets Can't Be Created**
1. Check project storage limits
2. Verify naming conventions (lowercase, hyphens only)
3. Ensure you have storage permissions

### **If RLS Policies Don't Work**
1. Verify RLS is enabled on each table
2. Check policy syntax in the schema
3. Test with actual user tokens

## ✅ **Verification Checklist**

After completing setup:

- [ ] 8 database tables created
- [ ] 4 storage buckets created
- [ ] RLS policies active
- [ ] API endpoints responding
- [ ] File upload/download working
- [ ] User registration working

## 🎯 **Expected Results**

Once complete, your API will have:
- ✅ Full user authentication
- ✅ PDF job tracking
- ✅ File storage and retrieval
- ✅ Subscription management
- ✅ Template library access
- ✅ Usage analytics

**Estimated setup time: 5-10 minutes**
