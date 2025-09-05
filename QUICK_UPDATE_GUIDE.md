# ⚡ **Quick Update Guide**

## 🚀 **Deploy Changes in 2 Minutes**

### **Update SnackPDF**
```bash
# 1. Make your changes to files in snackpdf/ folder
# 2. Deploy:
cd scripts
node deploy-snackpdf.js
```

### **Update RevisePDF**
```bash
# 1. Make your changes to files in revisepdf/ folder
# 2. Deploy:
cd scripts
node deploy-revisepdf.js
```

### **Update Backend API**
```bash
# 1. Make your changes to files in api/ folder
# 2. Deploy:
git add .
git commit -m "Update API"
git push heroku main
```

### **Deploy Both Frontends**
```bash
cd scripts
node deploy-frontends.js
```

## 🌐 **Live URLs**

### **Production Sites**
- **SnackPDF**: https://snackpdf-frontend-31ae65e54ecf.herokuapp.com/
- **RevisePDF**: https://revisepdf-frontend-c4aefb4be369.herokuapp.com/
- **Backend API**: https://cl4pdf-api-5ad2fef3254f.herokuapp.com/

### **Health Checks**
- **SnackPDF Health**: https://snackpdf-frontend-31ae65e54ecf.herokuapp.com/health
- **RevisePDF Health**: https://revisepdf-frontend-c4aefb4be369.herokuapp.com/health
- **API Health**: https://cl4pdf-api-5ad2fef3254f.herokuapp.com/health

## 📁 **File Structure**

```
CL4PDF/
├── api/                    # Backend API (Heroku: cl4pdf-api)
├── snackpdf/              # SnackPDF Frontend (Heroku: snackpdf-frontend)
├── revisepdf/             # RevisePDF Frontend (Heroku: revisepdf-frontend)
├── scripts/
│   ├── deploy-snackpdf.js     # Deploy SnackPDF only
│   ├── deploy-revisepdf.js    # Deploy RevisePDF only
│   └── deploy-frontends.js    # Deploy both frontends
└── supabase/              # Database schema
```

## 🔧 **Common Tasks**

### **Add New Page to SnackPDF**
1. Create `snackpdf/new-page.html`
2. Add route to `snackpdf/server.js` routes array
3. Deploy: `cd scripts && node deploy-snackpdf.js`

### **Add New Page to RevisePDF**
1. Create `revisepdf/new-page.html`
2. Add route to `revisepdf/server.js` routes array
3. Deploy: `cd scripts && node deploy-revisepdf.js`

### **Update API Endpoint**
1. Edit files in `api/` folder
2. Deploy: `git push heroku main`

### **Update Styling**
1. Edit CSS in `snackpdf/assets/css/` or `revisepdf/assets/css/`
2. Deploy respective frontend

## 🗄️ **Database Setup (One-time)**

1. Go to https://supabase.com/dashboard
2. Select project: `rusfhlvwrzetrqsirzut`
3. SQL Editor → Run `supabase/schema.sql`
4. Storage → Create 4 buckets

## 🌍 **Custom Domains (Tomorrow)**

### **Add Domains to Heroku**
```bash
heroku domains:add snackpdf.com --app snackpdf-frontend
heroku domains:add revisepdf.com --app revisepdf-frontend
```

### **DNS Settings**
- `snackpdf.com` CNAME → `snackpdf-frontend-31ae65e54ecf.herokuapp.com`
- `revisepdf.com` CNAME → `revisepdf-frontend-c4aefb4be369.herokuapp.com`

## 🧪 **Testing After Updates**

### **Quick Tests**
```bash
# Test SnackPDF
curl -I https://snackpdf-frontend-31ae65e54ecf.herokuapp.com/

# Test RevisePDF
curl -I https://revisepdf-frontend-c4aefb4be369.herokuapp.com/

# Test API
curl https://cl4pdf-api-5ad2fef3254f.herokuapp.com/health
```

## 📊 **Monitoring**

### **Check Logs**
```bash
# SnackPDF logs
heroku logs --tail --app snackpdf-frontend

# RevisePDF logs
heroku logs --tail --app revisepdf-frontend

# API logs
heroku logs --tail --app cl4pdf-api
```

### **App Status**
```bash
heroku ps --app snackpdf-frontend
heroku ps --app revisepdf-frontend
heroku ps --app cl4pdf-api
```

## ⚡ **Emergency Fixes**

### **Rollback Deployment**
```bash
# Rollback SnackPDF
heroku rollback --app snackpdf-frontend

# Rollback RevisePDF
heroku rollback --app revisepdf-frontend

# Rollback API
heroku rollback --app cl4pdf-api
```

### **Restart Apps**
```bash
heroku restart --app snackpdf-frontend
heroku restart --app revisepdf-frontend
heroku restart --app cl4pdf-api
```

## 🎯 **Remember**

- ✅ **All 3 apps are live** and serving users
- ✅ **Updates deploy in ~2 minutes**
- ✅ **No ZIP files needed** - just git push
- ✅ **Each site is independent** - update separately
- ✅ **Professional URLs** ready for custom domains

**Your PDF tools platform is production-ready! 🚀**
