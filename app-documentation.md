# SuperApp -- Complete Application Documentation

> **Location:** `C:\Users\mdmah\Desktop\SuperApp`
> **Stack:** React 19 + Vite 8 + Supabase + Express backend

---

## Table of Contents

1. [Overview](#1-overview)
2. [Directory Structure](#2-directory-structure)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Configuration Files](#4-configuration-files)
5. [Entry Points](#5-entry-points)
6. [Context Providers](#6-context-providers)
7. [Custom Hooks](#7-custom-hooks)
8. [Utility Modules](#8-utility-modules)
9. [Styling System](#9-styling-system)
10. [Shared Components](#10-shared-components)
11. [Layout Components](#11-layout-components)
12. [Data Processor Module](#12-data-processor-module)
13. [Network Tools Module](#13-network-tools-module)
14. [Utilities Module](#14-utilities-module)
15. [Backend Server](#15-backend-server)
16. [Supabase Schema](#16-supabase-schema)
17. [Data Flow & Architecture](#17-data-flow--architecture)

---

## 1. Overview

**SuperApp** is an all-in-one React utility suite combining three major modules:

- **Data Processor** -- Excel/CSV parsing, AI-powered extraction via Claude API, column mapping, validation, and export. Includes a "Fill from Sample" (Mark II) workflow.
- **Network Tools** -- Ping, Port Scanner, DNS Lookup, WHOIS, Traceroute, IP Info. Works with simulated data in the frontend or real data via the optional Express backend proxy.
- **Utilities (18 tools)** -- Base64, UUID Generator, Password Generator, QR Code Generator, File Hasher, JSON Formatter, Color Converter, Text Case Converter, URL Encoder/Decoder, Unit Converter, Timer/Stopwatch, Lorem Ipsum Generator, Text Analyzer, Number Base Converter, Epoch Converter, Regex Tester, PDF to Excel, Excel Validator.

---

## 2. Directory Structure

```
SuperApp/
├── .env                          # Supabase + backend env vars
├── .gitignore
├── .oxlintrc.json                # Linter config (oxlint)
├── package.json                  # Frontend dependencies
├── vite.config.js                # Vite build config
├── plan.md                       # Original project plan
├── README.md                     # Project README
├── supabase-schema.sql           # Database schema for Supabase
├── app-documentation.md          # THIS FILE
├── backend/
│   ├── package.json              # Backend dependencies
│   └── server.js                 # Express proxy server (155 lines)
├── public/
│   ├── favicon.svg               # Lightning bolt icon
│   └── icons.svg                 # SVG sprite for social icons
├── src/
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Router + Home page + providers
│   ├── App.css                   # Legacy styles (partially used)
│   ├── index.css                 # Base CSS variables + typography
│   ├── styles/
│   │   └── global.css            # Main design system (~115 lines)
│   ├── context/
│   │   ├── SupabaseContext.jsx   # Auth + Supabase provider
│   │   └── ThemeContext.jsx      # Light/dark theme + Supabase sync
│   ├── hooks/
│   │   ├── useLocalStorage.js    # Generic localStorage hook
│   │   └── useSupabaseStorage.js # Hybrid Supabase + localStorage hook
│   ├── lib/
│   │   └── supabase.js           # Supabase client initialization
│   ├── utils/
│   │   ├── api.js                # Axios client for backend API
│   │   └── validation.js         # Field validation engine
│   ├── components/
│   │   ├── common/
│   │   │   ├── CopyButton.jsx    # Copy-to-clipboard button
│   │   │   ├── ErrorMessage.jsx  # Error display with retry
│   │   │   └── LoadingSpinner.jsx # Animated loading spinner
│   │   └── Layout/
│   │       ├── Layout.jsx        # Shell with Navbar + Sidebar + Outlet
│   │       ├── Navbar.jsx        # Top nav bar with theme toggle
│   │       └── Sidebar.jsx       # Module-specific sidebar navigation
│   └── pages/
│       ├── DataProcessor/
│       │   ├── DataProcessor.jsx  # Main data processor (810 lines)
│       │   └── FillFromSample.jsx # Mark II workflow (1093 lines)
│       ├── NetworkTools/
│       │   ├── index.jsx          # Sub-router for network tools
│       │   ├── NetworkOverview.jsx # Grid of tool cards
│       │   ├── Ping.jsx           # ICMP ping simulation + chart
│       │   ├── PortScanner.jsx    # TCP port scanning simulation
│       │   ├── DNSLookup.jsx      # DNS record lookup
│       │   ├── Whois.jsx          # WHOIS domain lookup
│       │   ├── Traceroute.jsx     # Network path traceroute
│       │   └── IPInfo.jsx         # Public IP geolocation
│       └── Utilities/
│           ├── index.jsx          # Sub-router for utilities
│           ├── UtilitiesOverview.jsx # Grid of 16 tool cards
│           ├── Base64.jsx         # Encode/decode text + files
│           ├── UUIDGenerator.jsx  # Bulk UUID v4 generation
│           ├── PasswordGenerator.jsx # Configurable password generator
│           ├── QRGenerator.jsx    # QR code with color/size options
│           ├── FileHasher.jsx     # MD5/SHA-1/SHA-256 file hashing
│           ├── JSONFormatter.jsx  # Format/minify/validate JSON
│           ├── ColorConverter.jsx # HEX/RGB/HSL + palette + contrast
│           ├── TextCaseConverter.jsx # 10 case types
│           ├── URLEncoder.jsx     # URI encode/decode
│           ├── UnitConverter.jsx  # 25+ units across 4 categories
│           ├── Timer.jsx          # Stopwatch + countdown
│           ├── LoremIpsum.jsx     # Lorem ipsum text generator
│           ├── TextAnalyzer.jsx   # Text statistics + word frequency
│           ├── NumberBaseConverter.jsx # Binary/Octal/Decimal/Hex
│           ├── EpochConverter.jsx # Timestamp <-> human date
│           ├── RegexTester.jsx    # Regex pattern testing with highlights
│           ├── PDFToExcel.jsx     # Extract PDF text to Excel spreadsheets
│           └── ExcelValidator.jsx # Validate Excel files against a demo template
└── dist/                         # Production build output
```

---

## 3. Tech Stack & Dependencies

### Frontend (`package.json`)

| Dependency | Version | Purpose |
|---|---|---|
| `react` | ^19.2.7 | UI framework |
| `react-dom` | ^19.2.7 | DOM renderer |
| `react-router-dom` | ^7.18.0 | Client-side routing |
| `@supabase/supabase-js` | ^2.108.2 | Supabase database + auth |
| `axios` | ^1.18.1 | HTTP client for backend API |
| `recharts` | ^3.9.0 | Ping latency charts |
| `qrcode.react` | ^4.2.0 | QR code rendering |
| `xlsx-js-style` | ^1.2.0 | Excel export with styling |
| `file-saver` | ^2.0.5 | File download |
| `html2canvas` | ^1.4.1 | Canvas capture |
| `jspdf` | ^4.2.1 | PDF generation |

| Dev Dependency | Version | Purpose |
|---|---|---|
| `vite` | ^8.1.0 | Build tool |
| `@vitejs/plugin-react` | ^6.0.2 | React fast refresh |
| `oxlint` | ^1.69.0 | Linter |
| `@types/react` | ^19.2.17 | TypeScript types (dev reference) |
| `@types/react-dom` | ^19.2.3 | TypeScript types (dev reference) |

### Backend (`backend/package.json`)

| Dependency | Version | Purpose |
|---|---|---|
| `express` | ^4.18.2 | HTTP server |
| `cors` | ^2.8.5 | Cross-origin support |
| `whois` | ^2.14.0 | WHOIS lookup |

---

## 4. Configuration Files

### `vite.config.js`
Minimal Vite config with React plugin only.

### `.env`
```env
VITE_SUPABASE_URL=https://mcgclwyqkkavzrrcjukw.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_BACKEND_URL=http://localhost:3001
```

### `.oxlintrc.json`
Configures oxlint with React hooks rules and export-component warnings.

---

## 5. Entry Points

### `src/main.jsx`
Renders `<App />` inside `React.StrictMode`, imports `global.css`.

### `src/App.jsx`
- Wraps app in `SupabaseProvider` > `ThemeProvider` > `BrowserRouter`
- Defines routes:
  - `/` -- Home page (card links to 3 modules)
  - `/data-processor` -- DataProcessor
  - `/network-tools/*` -- NetworkTools sub-router
  - `/utilities/*` -- Utilities sub-router
  - `*` -- Redirect to `/`
- All routes rendered inside `<Layout />` (Navbar + Sidebar + Outlet)
- Home page has 3 animated cards linking to each module

---

## 6. Context Providers

### `SupabaseContext.jsx`
- Provides `{ supabase, session, loading, error, configured }`
- On mount: calls `supabase.auth.getSession()`, if no session, calls `supabase.auth.signInAnonymously()`
- Subscribes to auth state changes
- `configured` flag is true only when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### `ThemeContext.jsx`
- Provides `{ theme, toggleTheme }`
- Theme value stored in localStorage (`superapp-theme`), defaults to `'light'`
- On change: updates `document.documentElement` `data-theme` attribute
- Syncs theme to Supabase `user_preferences` table when configured
- Two-way sync: reads theme from Supabase on mount if available

---

## 7. Custom Hooks

### `useLocalStorage(key, initialValue)`
- Returns `[value, setValue]`
- Reads from `localStorage` on init (with JSON parse), falls back to `initialValue`
- Writes to `localStorage` on every value change via `useEffect`

### `useSupabaseStorage(table, localStorageKey, initialValue)`
- Returns `[data, upsert, { loading, error, removeItem }]`
- Hybrid storage: reads/writes to Supabase when configured, falls back to localStorage
- Merges multiple Supabase rows by taking the latest `created_at`
- `upsert(newData)` -- saves to both localStorage and Supabase (upsert by `user_id`)
- `removeItem()` -- clears data from both storage backends

---

## 8. Utility Modules

### `src/lib/supabase.js`
- Creates Supabase client from env vars
- Exports `supabase` (null if not configured) and `isConfigured()` function

### `src/utils/api.js`
- Axios instance with 30s timeout, base URL from `VITE_BACKEND_URL`
- Exports async functions: `pingTarget`, `scanPorts`, `dnsLookup`, `whoisLookup`, `traceroute`, `getIPInfo`
- Also exports `fetchPublicIPInfo()` with multi-API fallback: `ipapi.co` -> `ip-api.com` (independent of backend)

### `src/utils/validation.js`
- `validateField(value, rules)` -- validates a single field against rules array
- `validateAllFields(data, templateFields)` -- validates all fields in a data object
- Supported rule types: `required`, `email`, `regex`, `min`, `max`, `minLength`, `maxLength`
- Each rule can have a custom `message`

---

## 9. Styling System

### `src/styles/global.css`
Design system with CSS custom properties:

| Category | Variables |
|---|---|
| Backgrounds | `--bg-primary`, `--bg-secondary`, `--bg-card` |
| Text | `--text-primary`, `--text-secondary` |
| Interactive | `--accent`, `--accent-hover`, `--border-color` |
| State | `--success`, `--warning`, `--danger` |
| Layout | `--radius`, `--radius-lg`, `--shadow` |

Dark mode via `[data-theme="dark"]` selector with adjusted color values.

### Utility classes
- `.card` -- card container with border, shadow, padding
- `.btn-primary` / `.btn-secondary` / `.btn-sm` / `.btn-icon` -- button variants
- `.badge` / `.badge-success` / `.badge-danger` / `.badge-warning` -- status badges
- `.grid-2` / `.grid-3` -- responsive grid layouts
- `.main-content` -- main content area with sidebar-aware margin

### `src/index.css`
Legacy base styles (old Vite template) -- defines `--sans`, `--mono`, `--heading` fonts and base typography.

---

## 10. Shared Components

### `CopyButton.jsx`
- Props: `{ text, label }`
- Copies `text` to clipboard via `navigator.clipboard.writeText`
- Shows "✓ Copied" for 2 seconds after copy

### `ErrorMessage.jsx`
- Props: `{ message, onRetry }`
- Displays error with red background
- Shows "Retry" button if `onRetry` callback provided

### `LoadingSpinner.jsx`
- Props: `{ text }`
- CSS-animated spinning circle with text below

---

## 11. Layout Components

### `Layout.jsx`
- Renders `<Navbar />`, `<Sidebar />`, and `<Outlet />` (React Router)
- Uses `.app-layout` flex container

### `Navbar.jsx`
- Fixed top bar (height 56px, z-index 100)
- Logo links to home (`⚡ SuperApp`)
- Navigation links: Data Processor, Network Tools, Utilities (with icons)
- Active link highlighted with accent color (via `NavLink isActive`)
- Theme toggle button (🌙 Dark / ☀️ Light)

### `Sidebar.jsx`
- Fixed left sidebar (width 220px, top 56px)
- Content changes based on current module:
  - `/data-processor`: Dashboard link only
  - `/network-tools`: Overview, Ping, Port Scanner, DNS Lookup, WHOIS, Traceroute, IP Info
  - `/utilities`: Overview + all 18 utility tools
- Uses `NavLink` with `isActive` for active state styling
- Hidden when no module links match current route

---

## 12. Data Processor Module

### `DataProcessor.jsx` (810 lines)

The main data processing interface with a 4-step wizard:

**Step 1: Upload**
- Three upload modes:
  1. **Structured** -- Excel (.xlsx) or CSV files
  2. **AI Extract** -- PDF/Image files sent to Claude API for text extraction
  3. **Fill from Sample** -- Redirects to the FillFromSample workflow

**Step 2: Column Mapping**
- Auto-maps source columns to ISP template columns
- Alias matching for common column name variations
- Manual mapping via dropdown selectors
- Supports Excel column letter references (A, B, C...)

**Step 3: Validate**
- Per-cell validation with status badges (✅ Valid / ❌ Error)
- Color-coded cells (green=valid, red=error, yellow=fixed)
- Find & Replace tool for bulk corrections
- AI Fix button that uses Claude API to suggest fixes for invalid cells
- Formula bar for inline cell editing

**Step 4: Export**
- Export to CSV or JSON
- Option to export all rows or only selected rows
- Row selection with checkboxes
- Server-side cleanup after export

**Validation rules per column (25 ISP columns):**
- Name (required, text)
- Mobile (required, regex for BD mobile: `^01[3-9]\d{8}$`)
- Email (email format)
- NID (numeric, 10 or 17 digits)
- Date of Birth (date)
- Sales representative (required)
- Connection Type, Bandwidth, Media type, etc.

**Template management:**
- Save entire configuration as named template
- Load templates from Supabase (or localStorage fallback)
- Templates include: column definitions, validation rules, demo values

### `FillFromSample.jsx` (1093 lines)

Mark II workflow with 6 steps:

| Step | Description |
|---|---|
| 1. Upload Demo | Upload template/demo Excel/CSV file |
| 2. Upload Source | Upload source data file |
| 3. Column Map | Auto-mapping + manual column alignment |
| 4. Process | Fill engine: maps source -> demo, fills with demo data, enforces uniqueness |
| 5. Preview & Edit | Table view with search, cell editing |
| 6. Export | Export to styled Excel (xlsx-js-style) or CSV |

**Fill Engine logic:**
1. Maps source columns to demo columns
2. For each demo row, finds matching source data
3. Falls back to demo values for unmatched fields
4. Enforces unique `clientCode` constraints
5. Mobile fallback logic: if primary mobile is missing, uses secondary mobile or landline

---

## 13. Network Tools Module

### `NetworkTools/index.jsx`
Sub-router with routes for all 6 tools plus overview.

### `NetworkOverview.jsx`
Grid of 6 tool cards with icons and descriptions, linking to each tool.

### `Ping.jsx` (219 lines)
- Input: target hostname/IP, packet count (1-20)
- **Single mode**: Simulates latency (10-200ms, ~10% packet loss)
- **Continuous mode**: Pings every 1s, rolling window of 50 results
- Recharts bar/line chart for latency visualization
- Summary stats: sent/received, loss %, min/avg/max
- Timestamped log
- History saved via `useSupabaseStorage('ping_history', ...)`

### `PortScanner.jsx` (198 lines)
- Database of 60+ ports with service names (FTP=21, SSH=22, HTTP=80, HTTPS=443, etc.)
- 3 scan modes:
  1. **Common** -- scans predefined top 20 ports
  2. **Range** -- user-specified port range (e.g., 1-1000)
  3. **Custom** -- comma-separated list
- Simulated scan with progress bar
- Color-coded status: green=open, red=closed, yellow=filtered
- History saved via `useSupabaseStorage`

### `DNSLookup.jsx` (181 lines)
- 8 record types: A, AAAA, MX, TXT, CNAME, NS, SOA, SRV
- Tab-based switching between record types
- Simulated DNS responses
- Bulk mode: line-delimited domain list
- Results table with Type, Name, Value, TTL

### `Whois.jsx` (90 lines)
- Input: domain or IP
- Simulated WHOIS response with:
  - Registrar, Registered On, Expires On
  - Name Servers
  - Registrant Organization, Country
  - Admin/Technical contacts
- Copy-all button

### `Traceroute.jsx` (98 lines)
- Simulated traceroute (5-15 hops + destination)
- Each hop shows: Hop#, IP, Hostname, RTT1, RTT2, RTT3
- Uses common router IPs + random latency (5-100ms)

### `IPInfo.jsx` (94 lines)
- Auto-fetches on page load via `fetchPublicIPInfo()`
- API fallback chain: `ipapi.co` -> `ip-api.com` -> `api.ipify.org`
- Displays: IP, City, Region, Country, ISP, Timezone, ASN, Coordinates
- Refresh button for re-fetch

---

## 14. Utilities Module

### `Utilities/index.jsx`
Sub-router for all 18 utility tools.

### `UtilitiesOverview.jsx`
Grid of 18 tool cards with emoji icons.

### Utility Tools Detail

| Tool | Lines | Features |
|---|---|---|
| **Base64** | 83 | Encode/decode text; file-to-Base64 via FileReader |
| **UUID Generator** | 55 | `crypto.randomUUID()`; bulk generation (1-100); copy all |
| **Password Generator** | 108 | Configurable length (4-64); uppercase/lowercase/numbers/symbols toggles; strength meter (weak/fair/strong/very-strong); copy |
| **QR Generator** | 112 | Foreground/background color pickers; 4 size presets (128-512); SVG inline render + PNG download via canvas |
| **File Hasher** | 112 | Drag-drop file input; algorithm selector (MD5/SHA-1/SHA-256/SHA-512); Web Crypto API `subtle.digest`; hex output; copy |
| **JSON Formatter** | 188 | Format (pretty-print) / Minify; validate with error highlighting; tree view; JSON path query |
| **Color Converter** | 239 | HEX/RGB/HSL input with sliders; color preview; palette generator (5 analogous colors); WCAG contrast checker (AA/AAA for normal/large text) |
| **Text Case Converter** | 64 | 10 cases: UPPER, lower, Title, camelCase, PascalCase, snake_case, kebab-case, UPPER_SNAKE, Train-Case, aLtErNaTiNg |
| **URL Encoder** | 54 | Encode/decode URI components |
| **Unit Converter** | 114 | 4 categories: Length (8 units), Weight (6), Temperature (3), Data Size (8 units); bidirectional conversion |
| **Timer** | 132 | Stopwatch with start/stop/lap/reset; lap times table; countdown mode with MM:SS input and sound alert |
| **Lorem Ipsum** | 81 | Words/sentences/paragraphs modes; count input; one-click generate; copy |
| **Text Analyzer** | 92 | Real-time stats: characters (with/without spaces), words, sentences, lines, paragraphs; top 10 most frequent words |
| **Number Base** | 73 | Convert between Binary, Octal, Decimal, Hexadecimal; updates all fields on any change |
| **Epoch Converter** | 68 | Unix timestamp <-> human date; live preview; supports seconds and milliseconds; copy |
| **Regex Tester** | 165 | Input pattern + flags (g, i, m, s, u, y); real-time highlighting of matches in text; match list with index/length/value; replace functionality |
| **PDF to Excel** | — | Extract PDF text content to Excel spreadsheets |
| **Excel Validator** | 450+ | Multi-sheet validation: demo template vs source file; smart type inference (10+ types with confidence); column mapping with auto-suggest; configurable validation rules (required, types, formats, enums, duplicates); severity filtering (error/warning/info); grouped/expandable issue view with resolution suggestions; data preview panel; export reports to Excel/CSV/JSON/HTML; fill-rate bars, issue distribution charts, search within issues |

---

## 15. Backend Server

### `backend/server.js` (155 lines)

Express server on port 3001 with CORS enabled.

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/ip-info` | GET | Proxies `ipapi.co/json` with `ip-api.com/json` fallback |
| `POST /api/ping` | POST | Executes `ping` (Unix) or `ping -n` (Windows); parses output for sent/received/loss/min/avg/max |
| `POST /api/scan-port` | POST | TCP connection test via `net.Socket` with 2s timeout; returns open/closed |
| `GET /api/dns` | GET | `dns.resolve` for A, AAAA, MX, TXT, CNAME, NS records |
| `GET /api/whois` | GET | WHOIS lookup via `whois` npm package |
| `GET /api/traceroute` | GET | Executes `traceroute` (Unix) or `tracert` (Windows); parses hop output |

All endpoints include input validation and return JSON responses with appropriate error handling.

---

## 16. Supabase Schema

### Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `templates` | Data processor templates | `user_id`, `data` (JSONB) |
| `extracted_data` | Extracted document data | `user_id`, `data` (JSONB) |
| `ping_history` | Ping scan history | `user_id`, `data` (JSONB) |
| `user_preferences` | Theme + user settings | `user_id`, `data` (JSONB) |
| `data_sessions` | Fill from Sample sessions | `user_id`, `session_id`, `step`, `demo_*`, `source_*`, `col_map`, `filled_data`, `unique_rules` |

### RLS Policies
All tables have Row Level Security enabled with policies restricting access to `auth.uid() = user_id`.

### Auth
- Uses Supabase anonymous sign-ins (no user registration required)
- Anonymous auth must be enabled in Supabase Auth > Settings

---

## 17. Data Flow & Architecture

### Persistence Strategy
```
User Action
    |
    v
Component State
    |
    v
useSupabaseStorage hook
    |
    +---> localStorage (always)
    |
    +---> Supabase table (when configured + authenticated)
                |
                v
         upsert by user_id
         (one row per user per table)
```

### Network Tools Data Flow
```
Frontend (simulated data)
    |
    +---> Direct API calls to public services (IP info only)
    |
    +---> Backend proxy (when running)
              |
              +---> System commands (ping, traceroute)
              +---> net.Socket (port scan)
              +---> dns module (DNS lookup)
              +---> whois package (WHOIS)
```

### Routing Architecture
```
BrowserRouter
    |
    +-- Layout (Navbar + Sidebar + Outlet)
         |
         +-- /                    -> Home
         +-- /data-processor      -> DataProcessor
         +-- /network-tools/*     -> NetworkTools sub-router
         |    +-- /               -> NetworkOverview
         |    +-- /ping           -> Ping
         |    +-- /port-scanner   -> PortScanner
         |    +-- /dns-lookup     -> DNSLookup
         |    +-- /whois          -> Whois
         |    +-- /traceroute     -> Traceroute
         |    +-- /ip-info        -> IPInfo
         +-- /utilities/*         -> Utilities sub-router
         |    +-- /               -> UtilitiesOverview
         |    +-- /base64         -> Base64
         |    +-- /uuid           -> UUIDGenerator
         |    ... (18 total)
         +-- *                    -> Redirect to /
```

### Theme Flow
```
toggleTheme()
    |
    v
ThemeContext state changes
    |
    +---> document.documentElement.dataset.theme = 'dark'|'light'
    +---> localStorage.setItem('superapp-theme', value)
    +---> Supabase user_preferences upsert (async, fire-and-forget)
```

---

## Appendix: File Size Summary

| Category | Files | Est. Lines |
|---|---|---|
| Root config | 8 | ~250 |
| Public assets | 2 | ~80 |
| Entry/App | 4 | ~200 |
| Context | 2 | ~130 |
| Hooks | 2 | ~120 |
| Lib/Utils | 3 | ~150 |
| Styles | 2 | ~200 |
| Components | 6 | ~220 |
| Data Processor | 2 | ~1,900 |
| Network Tools | 8 | ~1,100 |
| Utilities | 20 | ~2,300 |
| Backend | 2 | ~170 |
| **Total** | **~59** | **~7,350** |

---

*Documentation generated on 2026-06-24 from the live codebase.*
