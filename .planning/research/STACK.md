# Technology Stack

**Project:** Eidiya (Eid money tracking web app)
**Researched:** 2026-03-11
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vanilla JavaScript (ES2022+)** | Native | Application logic | Zero build step, direct browser execution, no framework overhead for a simple CRUD app with localStorage |
| **Vite** | 7.3.1 | Development server + build tool | Instant HMR (10-20ms updates), zero-config vanilla JS template, outputs optimized static files for deployment |
| **Pico CSS** | 2.x | Styling | Classless semantic CSS (7.7KB), automatic dark mode, 130+ CSS variables for theming, no build step required |
| **GitHub Pages** | N/A | Free hosting | Truly permanent free tier, automatic HTTPS via Let's Encrypt, deploys directly from repo, zero maintenance |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **localStorage API** | Native | Data persistence | Default for all data storage; simple key-value store sufficient for this use case |
| **CSS Custom Properties** | Native | Theming | Use for AED currency colors, dark/light mode variables |
| **ES Modules** | Native | Code organization | Import/export for clean file structure without bundler complexity |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Vite dev server** | Local development | `npm run dev` for instant reloads |
| **Git** | Version control | Required for GitHub Pages deployment |
| **Modern browser DevTools** | Debugging | Chrome/Firefox/Safari native tools sufficient |

## Installation

```bash
# Create project with Vite vanilla template
npm create vite@latest eidiya -- --template vanilla

cd eidiya

# Install dependencies (Vite only, no runtime deps needed)
npm install

# Install Pico CSS (optional - can also use CDN)
npm install @picocss/pico

# Development
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

### CDN Alternative (No npm install needed)

```html
<!-- In index.html -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
<script type="module" src="./main.js"></script>
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| **Build tool** | Vite 7.3.1 | No build tool (pure HTML/JS) | Use no build if team prefers absolute simplicity and doesn't need HMR |
| **CSS framework** | Pico CSS 2.x | Water.css 2.x | Use Water.css (2.2KB) if absolute minimal size is priority over customization |
| **Hosting** | GitHub Pages | Cloudflare Pages | Use Cloudflare Pages if unlimited bandwidth or 300+ edge locations needed |
| **Storage** | localStorage | IndexedDB | Use IndexedDB if data grows beyond 5MB or needs structured queries |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **React/Vue/Angular** | Massive overhead for a simple CRUD app with no shared state complexity; adds 30-100KB+ bundle size | Vanilla JS with ES modules |
| **Next.js/Nuxt** | SSR frameworks are overkill for a client-side only app; requires server runtime | Static HTML + Vite build |
| **Tailwind CSS** | Requires build step, utility classes clutter HTML, 10KB+ with purging | Pico CSS classless approach |
| **Firebase/Supabase** | Adds external dependency, requires authentication setup, potential costs | localStorage (data never leaves device) |
| **Vercel free tier** | Prohibits commercial use on free tier; unpredictable costs at scale | GitHub Pages (truly free, no restrictions) |
| **Redux/Zustand/MobX** | State management libraries unnecessary for single-user local app | Plain objects + events |
| **TypeScript** | Adds build complexity for a 1-2 week project; no runtime benefits | JSDoc for type hints if needed |

## Stack Patterns by Variant

**If no build step preferred:**
- Use pure HTML + ES modules with import maps
- Serve with `npx serve` or Python `http.server` for local dev
- Because: Absolute minimal tooling, but lose HMR and optimized builds

**If dark mode not needed:**
- Use Water.css instead of Pico CSS
- Because: 2.2KB vs 7.7KB, even simpler

**If custom domain needed:**
- GitHub Pages supports custom domains with automatic HTTPS
- Add CNAME file, configure DNS A records to GitHub IPs
- Because: Professional appearance at zero cost

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Vite 7.3.1 | Node 18+ | LTS Node recommended |
| Pico CSS 2.x | All modern browsers | Uses CSS custom properties |
| ES2022 | Chrome 97+, Firefox 96+, Safari 15.4+ | All Baseline 2022 features |

## Deployment Configuration

### GitHub Pages Setup

1. Push code to GitHub repository
2. Go to Settings → Pages
3. Source: GitHub Actions (recommended) or Deploy from branch
4. If using Vite build: use ` peaceiris/actions-gh-pages` action
5. Custom domain (optional): Add CNAME file, configure DNS

### vite.config.js for GitHub Pages

```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/eidiya/', // Repository name for GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
```

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Vanilla JS approach | HIGH | Multiple sources confirm no-build/vanilla trend in 2025; 37signals, DHH/ONCE products prove viability |
| Vite version | HIGH | Official docs confirm v7.3.1 stable, v8 in beta |
| Pico CSS | HIGH | Official site confirms v2.x current; widely adopted |
| GitHub Pages | HIGH | Long-established, no changes to free tier model |
| localStorage | HIGH | Standard web API, universally supported |

## Sources

- [Vite Official Docs](https://vite.dev/guide/) — Version 7.3.1 confirmed stable
- [Vite 8 Beta Announcement](https://vite.dev/blog/announcing-vite8-beta) — Rolldown integration details
- [Eleventy v3.1 Release](https://www.11ty.dev/blog/eleventy-v3-1/) — 11% faster, 22% smaller
- [Pico CSS v2 Docs](https://picocss.com/docs/v2) — Current version features
- [Water.css](https://watercss.kognise.dev/) — Classless CSS alternative
- [Vanilla CSS is all you need](https://www.zolkos.com/2025/12/03/vanilla-css-is-all-you-need) — 37signals CSS architecture (14K lines, zero build tools)
- [Vercel vs Netlify vs Cloudflare Pages 2025](https://www.digitalapplied.com/blog/vercel-vs-netlify-vs-cloudflare-pages-comparison) — Hosting comparison
- [Modern CSS Techniques 2025](https://designwithrehana.com/modern-css-techniques-you-must-know-in-2025/) — Native CSS features
- [Writing Modern JavaScript without a Bundler](https://playfulprogramming.com/posts/modern-js-bundleless) — No-build patterns
