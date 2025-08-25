# Deployment Troubleshooting Guide

## 🔧 Fixing Blank Page Issues

This guide helps resolve the most common deployment issues with the Justice Document Manager.

### ✅ Quick Health Check

Before deploying, run these commands locally:

```bash
# 1. Install dependencies
npm ci

# 2. Run type check
npm run type-check

# 3. Run tests
npm run test:run

# 4. Build for production
npm run build:prod

# 5. Test locally
npm run preview
```

Visit `http://localhost:4173` - if it works locally, the issue is deployment-specific.

### 🎯 Common Issues & Solutions

#### Issue 1: Blank Page on GitHub Pages

**Symptoms:**
- Local build works fine
- GitHub Pages shows blank white page
- Browser console shows 404 errors

**Solutions:**

1. **Check base path in `vite.config.prod.ts`:**
   ```typescript
   export default defineConfig({
     base: '/', // Should be '/' for custom domains, '/repo-name/' for GitHub Pages
   })
   ```

2. **Verify GitHub Pages settings:**
   - Go to Settings → Pages
   - Source: "Deploy from a branch" 
   - Branch: `main` or `gh-pages`
   - Folder: `/ (root)` or `/docs`

3. **Check if 404.html is present:**
   - Should exist in root directory
   - Contains SPA redirect script

#### Issue 2: Asset Loading Issues

**Symptoms:**
- CSS/JS files return 404
- App loads but styling is broken

**Solutions:**

1. **Check asset paths in build output:**
   ```bash
   # Assets should be in dist/assets/
   ls -la dist/assets/
   ```

2. **Verify index.html asset references:**
   ```html
   <!-- Should be relative paths starting with / -->
   <link rel="stylesheet" href="/assets/index-xxx.css">
   <script type="module" src="/assets/index-xxx.js"></script>
   ```

#### Issue 3: Spark Runtime Errors

**Symptoms:**
- Errors mentioning `@github/spark`
- Authentication redirects in production

**Solutions:**

1. **Use production build command:**
   ```bash
   npm run build:prod  # Uses vite.config.prod.ts (no Spark plugins)
   ```

2. **Verify fallback is loaded:**
   ```typescript
   // Should be imported in App.tsx
   import '@/lib/sparkFallback'
   ```

#### Issue 4: Environment Variables

**Symptoms:**
- App loads but API calls fail
- Missing configuration

**Solutions:**

1. **Check environment variables:**
   ```typescript
   // In vite.config.prod.ts
   define: {
     'import.meta.env.VITE_APP_TITLE': JSON.stringify('Justice Document Manager'),
     'process.env.NODE_ENV': JSON.stringify('production')
   }
   ```

2. **Use VITE_ prefix for client-side variables:**
   ```bash
   VITE_API_URL=https://api.example.com
   ```

### 🚀 Deployment Workflows

#### GitHub Pages (Current Setup)

The `.github/workflows/deploy.yml` handles automatic deployment:

```yaml
- name: Build for production
  run: npm run build:prod
  env:
    NODE_ENV: production
    GITHUB_PAGES: true
```

#### Manual Deployment

For other hosting providers:

```bash
# Build
npm run build:prod

# Deploy dist/ folder contents to your hosting provider
# Examples:
# - Netlify: drag dist/ folder to deploy
# - Vercel: connect repo and set build command to "npm run build:prod"
# - AWS S3: aws s3 sync dist/ s3://your-bucket --delete
```

### 🔍 Debugging Steps

#### 1. Local Development Test

```bash
npm run dev
# Visit http://localhost:5000
# Should work without issues
```

#### 2. Production Build Test

```bash
npm run build:prod
npm run preview
# Visit http://localhost:4173
# Should match deployed behavior
```

#### 3. Browser Console Check

Open browser dev tools (F12):
- **Console tab:** Look for JavaScript errors
- **Network tab:** Check for 404s on CSS/JS files
- **Application/Storage tab:** Verify localStorage works

#### 4. File Structure Verification

After build, verify structure:
```
dist/
├── index.html
├── 404.html
├── favicon.svg
├── app/
│   └── data/
│       └── justice-documents.json
├── assets/
│   ├── index-[hash].css
│   └── index-[hash].js
└── pdf.worker.min.js
```

### 🛠️ Advanced Fixes

#### Custom Domain Setup

If using a custom domain:

1. **Add CNAME file:**
   ```bash
   echo "yourdomain.com" > dist/CNAME
   ```

2. **Update base path:**
   ```typescript
   // vite.config.prod.ts
   base: '/' // Not '/repo-name/'
   ```

#### CSP (Content Security Policy) Issues

If your hosting provider has strict CSP:

```html
<!-- Add to index.html <head> -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  style-src 'self' 'unsafe-inline' fonts.googleapis.com;
  font-src fonts.gstatic.com;
  script-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
">
```

### 🆘 Getting Help

If you're still having issues:

1. **Check build logs:**
   - GitHub Actions: Go to Actions tab, click failed workflow
   - Local: Save build output to file

2. **Test with minimal setup:**
   - Comment out complex features
   - Test with basic React app

3. **Compare with working setup:**
   - Fork a working React + Vite project
   - Copy configuration files

### 📊 Health Check Checklist

Before deployment, verify:

- [ ] `npm run build:prod` completes without errors
- [ ] `dist/` directory contains all required files
- [ ] `npm run preview` serves app correctly
- [ ] No Spark-related imports in production build
- [ ] Environment variables are properly set
- [ ] 404.html exists for SPA routing
- [ ] Base path matches hosting setup

---

**Last Updated:** January 2025
**For Support:** Check GitHub Issues or project documentation