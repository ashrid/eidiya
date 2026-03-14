# Free Hosting Guide for Eidiya

This guide covers the best free hosting options for your Vite static site, from simplest to most robust.

---

## Option 1: GitHub Pages (Recommended for Beginners)

**Best for:** Portfolio sites, personal projects, simple static sites

### Setup

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create eidiya --public --source=. --push
   ```

2. **Enable GitHub Pages:**
   - Go to your repo on GitHub → Settings → Pages
   - Source: "GitHub Actions"

3. **Create deployment workflow:**
   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm ci
         - run: npm run build
         - uses: actions/upload-pages-artifact@v3
           with:
             path: ./dist
         - uses: actions/deploy-pages@v4
   ```

4. **Configure Vite for GitHub Pages:**
   Edit `vite.config.js`:
   ```javascript
   import { defineConfig } from 'vite'

   export default defineConfig({
     base: '/eidiya/',  // Replace with your repo name
     // ... existing config
   })
   ```

**Limits:** 1GB storage, 100GB bandwidth/month, public repos only

---

## Option 2: Cloudflare Pages (Recommended for Performance)

**Best for:** Global CDN, custom domains, generous limits

### Setup

1. **Push to GitHub** (same as above)

2. **Connect to Cloudflare:**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Pages → "Connect to Git"
   - Select your repo
   - Build settings:
     - Build command: `npm run build`
     - Build output: `dist`

3. **Done!** Cloudflare auto-deploys on every push.

**Limits:** 500 builds/month, unlimited bandwidth, generous CPU time

---

## Option 3: Netlify (Recommended for Features)

**Best for:** Branch previews, forms, functions, edge deployment

### Setup

1. **Push to GitHub**

2. **Connect to Netlify:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - "Add new site" → "Import from Git"
   - Select your repo
   - Build settings auto-detected (Vite)

3. **Or use Netlify CLI:**
   ```bash
   npx netlify login
   npx netlify init
   npx netlify deploy --prod --dir=dist
   ```

**Limits:** 100GB bandwidth/month, 300 build minutes/month

---

## Option 4: Vercel (Recommended for Speed)

**Best for:** Fast global deployment, preview URLs, analytics

### Setup

1. **Push to GitHub**

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - "Add New Project"
   - Import your repo
   - Framework preset: Vite

3. **Or use Vercel CLI:**
   ```bash
   npx vercel
   ```

**Limits:** 100GB bandwidth/month, 6,000 build minutes/month

---

## Quick Comparison

| Platform | Bandwidth | Build Time | CDN | Custom Domain | Best Feature |
|----------|-----------|------------|-----|---------------|--------------|
| **GitHub Pages** | 100GB/mo | 2,000 min/mo | Limited | Yes | Zero config for GitHub repos |
| **Cloudflare** | Unlimited | 500 builds/mo | Global | Yes | Best performance globally |
| **Netlify** | 100GB/mo | 300 min/mo | Global | Yes | Branch previews & forms |
| **Vercel** | 100GB/mo | 6,000 min/mo | Global | Yes | Fastest deployments |

---

## My Recommendation

1. **Start with Cloudflare Pages** - Best performance, generous limits, easy setup
2. **Use GitHub Pages** - If you want everything in one place
3. **Try Netlify** - If you need form handling or branch previews
4. **Consider Vercel** - If you need speed and analytics

---

## Custom Domain (All Platforms)

All four options support free custom domains:

1. Buy a domain (Cloudflare Registrar, Namecheap, Porkbun ~$10/year)
2. Add it in your hosting platform's settings
3. Update DNS records as instructed
4. Enable HTTPS (automatic on all platforms)

---

## Next Steps

1. Choose your platform
2. Push code to GitHub
3. Connect the platform to your repo
4. Configure build settings if needed
5. Deploy!

Your site will auto-deploy on every push to `main`.
