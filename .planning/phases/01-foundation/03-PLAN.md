---
phase: 01-foundation
plan: 03
type: execute
wave: 3
depends_on:
  - 02-PLAN.md
files_modified:
  - index.html
  - src/main.js
  - src/app.js
  - src/styles/main.css
  - src/components/AppContainer.js
  - vite.config.js
autonomous: true
requirements:
  - UX-01
  - UX-02
  - PERS-03
must_haves:
  truths:
    - App loads without JavaScript errors
    - App initializes with empty state when no data exists
    - App displays storage warning when using fallback mode
    - Pico CSS provides responsive base styling
    - Viewport meta tag enables mobile responsiveness
    - Currency amounts display in AED format throughout
    - App layout works on mobile devices (320px+ width)
    - App layout works on desktop devices
  artifacts:
    - path: index.html
      provides: HTML entry point with Pico CSS and viewport meta
    - path: src/main.js
      provides: Application entry point with initialization
    - path: src/app.js
      provides: Core App controller
    - path: src/styles/main.css
      provides: Custom styles and Pico CSS overrides
    - path: src/components/AppContainer.js
      provides: Root UI component
    - path: vite.config.js
      provides: Vite configuration with path aliases
  key_links:
    - from: main.js
      to: SafeStorage
      via: import and instantiation
    - from: main.js
      to: Store
      via: import and instantiation with storage
    - from: main.js
      to: App
      via: import and mount to DOM
    - from: App
      to: AppContainer
      via: component rendering
    - from: App
      to: Store
      via: subscription for state updates
    - from: index.html
      to: Pico CSS
      via: CDN link or npm import
---

<objective>
Create the UI foundation with Pico CSS integration, responsive layout, and app shell initialization.

Purpose: Provide a working application shell that loads correctly, displays properly on all devices, and initializes the data layer with appropriate user feedback.
Output: Complete HTML/CSS/JS foundation with responsive layout, storage warnings, and AED currency display integration.
</objective>

<execution_context>
@/home/rashid/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-foundation/01-RESEARCH.md
@.planning/phases/01-foundation/01-02-SUMMARY.md

## Dependencies from Plan 02

From src/modules/state/Store.js:
- Store class with subscribe, getState, setState, load methods

From src/modules/state/schema.js:
- DEFAULT_STATE for initialization
- validateState for data validation

From src/modules/storage/SafeStorage.js:
- SafeStorage with isUsingFallback() method

From src/modules/money/formatters.js:
- formatAED for currency display

## Key Patterns from Research

### Pico CSS Integration (UX-01)
- Use semantic HTML (no utility classes needed)
- Wrap content in `<main class="container">`
- Automatic dark mode via data-theme attribute
- Mobile-first responsive by default

### App Initialization Pattern
1. Create SafeStorage instance
2. Create Store with DEFAULT_STATE and storage
3. Load persisted data with validation
4. Show storage warning if using fallback
5. Mount App to DOM element
6. Subscribe to state changes for re-renders

### Responsive Foundation (UX-01)
- Viewport meta: width=device-width, initial-scale=1.0
- Container class for max-width and padding
- CSS custom properties for spacing
- Mobile-first media queries

### Storage Warning UI (PERS-03)
- Banner at top of app when storage.isUsingFallback()
- Clear message: "Data will not persist: Private browsing mode detected"
- Use Pico CSS alert/contrast styling
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create HTML entry point with Pico CSS and viewport configuration</name>
  <files>index.html</files>
  <action>
    1. Create index.html with:
       - DOCTYPE and html lang="en"
       - Meta charset UTF-8
       - Viewport meta tag for mobile: width=device-width, initial-scale=1.0
       - Title: "Eidiya - Eid Money Tracker"
       - Pico CSS from CDN or npm (use @picocss/pico/css/pico.min.css)
       - Link to /src/styles/main.css
       - Main element with class="container"
       - Header with h1 "Eidiya" and tagline
       - Div with id="app" for mounting
       - Script type="module" src="/src/main.js"
    2. Ensure semantic HTML structure for Pico CSS styling
    3. Add data-theme="light" attribute (can be toggled later)
  </action>
  <verify>
    <automated>npm run dev & (sleep 2 && curl -s http://localhost:3000 | grep -q "Eidiya" && echo "OK" || echo "FAIL")</automated>
  </verify>
  <done>index.html loads without errors and contains proper structure</done>
</task>

<task type="auto">
  <name>Task 2: Create Vite configuration with path aliases</name>
  <files>vite.config.js</files>
  <action>
    1. Create vite.config.js with:
       - Import { defineConfig } from 'vite'
       - Import { resolve } from 'path'
       - Export default defineConfig with:
         - resolve.aliases:
           - @/ -> /src
           - @modules/ -> /src/modules
           - @components/ -> /src/components
           - @utils/ -> /src/utils
           - @styles/ -> /src/styles
         - server.port: 3000
         - server.open: true
         - build.outDir: 'dist'
         - build.sourcemap: true
    2. Ensure aliases match import patterns used in source files
  </action>
  <verify>
    <automated>npm run dev & (sleep 3 && kill %1) 2>/dev/null; echo "Vite config valid"</automated>
  </verify>
  <done>Vite dev server starts successfully with path aliases working</done>
</task>

<task type="auto">
  <name>Task 3: Create CSS foundation with responsive styles</name>
  <files>src/styles/main.css</files>
  <action>
    1. Create src/styles/main.css with:
       - Pico CSS variable overrides in :root:
         - --pico-primary: #0172ad (or preferred brand color)
         - --pico-primary-hover: #015887
         - --pico-font-family: system-ui, -apple-system, sans-serif
       - App container styles:
         - padding using --pico-spacing
         - max-width for readability
       - Storage warning banner styles:
         - background-color: var(--pico-contrast-focus)
         - color: var(--pico-contrast-inverse)
         - padding, border-radius, margin-bottom
       - Mobile-first responsive adjustments:
         - Base styles for mobile (320px+)
         - @media (min-width: 768px) for tablet adjustments
         - @media (min-width: 1024px) for desktop adjustments
       - Utility classes for common patterns:
         - .text-center, .mt-1, .mb-1, etc. using CSS custom properties
  </action>
  <verify>
    <automated>npm run build 2>&1 | grep -i error | wc -l | xargs test 0 -eq && echo "CSS valid"</automated>
  </verify>
  <done>CSS builds without errors and provides responsive foundation</done>
</task>

<task type="auto">
  <name>Task 4: Implement App controller and AppContainer component</name>
  <files>src/app.js, src/components/AppContainer.js, src/main.js</files>
  <action>
    1. Create src/components/AppContainer.js:
       - Class AppContainer with constructor(containerElement, store)
       - render() method that renders current state
       - renderStorageWarning() method for fallback banner
       - renderEmptyState() showing welcome message
       - Uses formatAED for any currency display
       - Uses semantic HTML for Pico CSS styling
    2. Create src/app.js:
       - Class App with constructor(rootElement, store)
       - init() method that:
         - Creates AppContainer instance
         - Subscribes to store changes for re-render
         - Performs initial render
       - destroy() method for cleanup
    3. Create src/main.js:
       - Import './styles/main.css'
       - Import SafeStorage from '@modules/storage/SafeStorage.js'
       - Import Store from '@modules/state/Store.js'
       - Import { DEFAULT_STATE } from '@modules/state/schema.js'
       - Import { App } from './app.js'
       - init() function that:
         - Creates SafeStorage
         - Creates Store with DEFAULT_STATE and storage
         - Calls store.load()
         - Shows storage warning if storage.isUsingFallback()
         - Creates App and calls app.init()
       - DOMContentLoaded event listener calling init()
  </action>
  <verify>
    <automated>npm run build && echo "Build successful"</automated>
  </verify>
  <done>App initializes without errors, renders empty state, shows storage warning when appropriate</done>
</task>

</tasks>

<verification>
1. Run dev server: `npm run dev`
2. Open browser to http://localhost:3000
3. Verify:
   - Page loads without console errors
   - Title shows "Eidiya - Eid Money Tracker"
   - Layout is responsive (test in DevTools mobile view)
   - Empty state displays welcome message
4. Test storage warning:
   - Open Safari private window or disable localStorage
   - Verify warning banner appears
5. Run build: `npm run build` completes without errors
</verification>

<success_criteria>
- App loads without JavaScript errors
- Responsive layout works on mobile and desktop
- Storage warning displays when localStorage unavailable
- AED formatting displays correctly
- Build completes successfully
- Dev server runs without errors
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-03-SUMMARY.md`
</output>
