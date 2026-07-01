# SuperApp -- Complete Application Documentation

> **Stack:** React 19 + Vite 8 + Supabase + Express backend
> **Deploy:** Render (full-stack) · Vercel (serverless API)

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
15. [ISP Excel Validator](#15-isp-excel-validator)
16. [Backend Server](#16-backend-server)
17. [Vercel Serverless API](#17-vercel-serverless-api)
18. [Supabase Schema](#18-supabase-schema)
19. [Deployment](#19-deployment)
20. [Data Flow & Architecture](#20-data-flow--architecture)

---

## 1. Overview

**SuperApp** is an all-in-one React utility suite combining four major modules:

- **Data Processor** -- Excel/CSV parsing, AI-powered extraction via Claude API, column mapping, validation, and export. Includes a "Fill from Sample" (Mark II) workflow.
- **Network Tools** -- Ping, Port Scanner, DNS Lookup, WHOIS, Traceroute, IP Info. Works with simulated data in the frontend or real data via the optional Express backend proxy.
- **ISP Excel Validator** -- Upload, validate, auto-fix, and download ISP client data. Supports Admin (25 columns) and Mac (21 columns) templates with cell-level error highlighting, inline editing, and keyboard navigation.
- **Utilities (18 tools)** -- Base64, UUID Generator, Password Generator, QR Code Generator, File Hasher, JSON Formatter, Color Converter, Text Case Converter, URL Encoder/Decoder, Unit Converter, Timer/Stopwatch, Lorem Ipsum Generator, Text Analyzer, Number Base Converter, Epoch Converter, Regex Tester, PDF to Excel.

---

## 2. Directory Structure

```
SuperApp/
├── .env                          # Supabase + backend env vars
├── .gitignore
├── .oxlintrc.json                # Linter config (oxlint)
├── package.json                  # Frontend + backend dependencies (merged)
├── vite.config.js                # Vite build config
├── vercel.json                   # Vercel deployment config
├── plan.md                       # Original project plan
├── README.md                     # Project README
├── supabase-schema.sql           # Database schema for Supabase
├── app-documentation.md          # THIS FILE
├── backend/
│   ├── package.json              # Backend dependencies (legacy)
│   ├── server.js                 # Express proxy server (1159 lines)
│   └── isp-validator.js          # Shared validation + autofix + Excel module
├── api/
│   ├── index.js                  # Vercel serverless Express (same endpoints)
│   ├── _isp-validator.js         # Shared validator (underscore → ignored by Vercel)
│   └── package.json              # Vercel function dependencies
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
│           ├── UtilitiesOverview.jsx # Grid of 18 tool cards
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
│           └── IspExcelValidator.jsx # ISP Client validation tool (1130 lines)
└── dist/                         # Production build output
```

---

## 3. Tech Stack & Dependencies

### Root (`package.json`) — merged frontend + backend

| Dependency | Version | Purpose |
|---|---|---|
| `react` | ^19.2.7 | UI framework |
| `react-dom` | ^19.2.7 | DOM renderer |
| `react-router-dom` | ^7.18.0 | Client-side routing |
| `@supabase/supabase-js` | ^2.108.2 | Supabase database + auth |
| `axios` | ^1.18.1 | HTTP client |
| `recharts` | ^3.9.0 | Ping latency charts |
| `qrcode.react` | ^4.2.0 | QR code rendering |
| `xlsx` | ^0.18.5 | Excel read/write (backend + ISP validator) |
| `xlsx-js-style` | ^1.2.0 | Excel export with styling (Data Processor) |
| `file-saver` | ^2.0.5 | File download |
| `html2canvas` | ^1.4.1 | Canvas capture |
| `jspdf` | ^4.2.1 | PDF generation |
| `express` | ^4.18.2 | HTTP server (backend) |
| `cors` | ^2.8.5 | Cross-origin support |
| `multer` | ^2.2.0 | File upload middleware |
| `whois` | ^2.14.0 | WHOIS lookup (lazy-loaded for Vercel compatibility) |
| `mikro-routeros` | ^1.0.6 | RouterOS API client |
| `net-snmp` | ^3.26.1 | SNMP query client |
| `validator` | ^13.15.35 | String validation utilities |

| Dev Dependency | Version | Purpose |
|---|---|---|
| `vite` | ^8.1.0 | Build tool |
| `@vitejs/plugin-react` | ^6.0.2 | React fast refresh |
| `oxlint` | ^1.69.0 | Linter |
| `@types/react` | ^19.2.17 | TypeScript types (dev reference) |
| `@types/react-dom` | ^19.2.3 | TypeScript types (dev reference) |

---

## 4. Configuration Files

### `vite.config.js`
Minimal Vite config with React plugin only.

### `vercel.json`
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

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

---

## 6. Context Providers

### `SupabaseContext.jsx`
- Provides `{ supabase, session, loading, error, configured }`
- On mount: calls `supabase.auth.getSession()`, if no session, calls `supabase.auth.signInAnonymously()`
- `configured` flag is true only when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### `ThemeContext.jsx`
- Provides `{ theme, toggleTheme }` with localStorage + Supabase persistence

---

## 7–13

> (Sections 7–13 remain unchanged from the previous version — see the original documentation for details on custom hooks, styling, shared components, layout, Data Processor, and Network Tools.)

---

## 14. Utilities Module

### `Utilities/index.jsx`
Sub-router for all 18 utility tools.

### `UtilitiesOverview.jsx`
Grid of 18 tool cards with emoji icons (updated to include ISP Excel Validator).

### Utility Tools Detail

| Tool | Lines | Features |
|---|---|---|
| **Base64** | 83 | Encode/decode text; file-to-Base64 via FileReader |
| **UUID Generator** | 55 | `crypto.randomUUID()`; bulk generation (1-100) |
| **Password Generator** | 108 | Length 4-64; char type toggles; strength meter |
| **QR Generator** | 112 | Color pickers; 4 size presets; SVG + PNG download |
| **File Hasher** | 112 | Drag-drop; MD5/SHA-1/SHA-256/SHA-512; Web Crypto API |
| **JSON Formatter** | 188 | Format/minify/validate; tree view; JSON path query |
| **Color Converter** | 239 | HEX/RGB/HSL; palette; WCAG contrast checker (AA/AAA) |
| **Text Case Converter** | 64 | 10 case types |
| **URL Encoder** | 54 | Encode/decode URI components |
| **Unit Converter** | 114 | 4 categories, 25+ units |
| **Timer** | 132 | Stopwatch + countdown with lap tracking |
| **Lorem Ipsum** | 81 | Words/sentences/paragraphs modes |
| **Text Analyzer** | 92 | Word/sentence/paragraph counts; top 10 word frequency |
| **Number Base** | 73 | Binary/Octal/Decimal/Hex |
| **Epoch Converter** | 68 | Timestamp <-> human date |
| **Regex Tester** | 165 | Pattern testing with highlights; match list; replace |
| **PDF to Excel** | — | Extract PDF text to Excel |
| **ISP Excel Validator** | 1130 | Full ISP client validation with auto-fix and inline editing |

---

## 15. ISP Excel Validator

**File:** `src/pages/Utilities/IspExcelValidator.jsx` (1130 lines)

### Templates
Two fixed templates with exact case-sensitive headers:

**Admin (25 columns):** Name, Mobile, Email, NationalId, Address, Zone, Conn.Type, Server, Prot.Type, Profile, UserName, Password, R.Address, C.Type, Package, B.Status, M.Bill, Bill.Month, Join.Date, Exp.Date, Assign2Emp., DateOfBirth(Opt.), FatherName(Opt.), MotherName(Opt.), Occupation(Opt.)

**Mac (21 columns):** Same as Admin minus Assign2Emp., DateOfBirth(Opt.), FatherName(Opt.), MotherName(Opt.), Occupation(Opt.), plus V.ToDate.

### Validation Rules

| Column | Rule |
|---|---|
| Mobile | 11 digits starting with 01 (BD format) |
| Email | Standard email format |
| NationalId | Should be numeric (warning) |
| R.Address | Valid IPv4 or empty |
| B.Status | Active, Inactive, or Suspended (case-insensitive) |
| M.Bill | Positive number |
| Bill.Month | MM-YYYY format |
| Join.Date / Exp.Date / V.ToDate / DateOfBirth | DD-MM-YYYY or day number (1-31) for Exp.Date |
| Exp.Date (full date) | Warning if in the past or >1 year in future |
| Exp.Date after Join.Date | Error if after Join.Date |
| Mandatory fields | Name, Mobile, Email, Zone, Conn.Type, Server, Prot.Type, Profile, UserName, Password, C.Type, Package, B.Status, M.Bill, Bill.Month, Join.Date, Exp.Date, Assign2Emp. |

### Auto-Fix Capabilities

| Category | Fix |
|---|---|
| Phone | Strip spaces/dashes/parens; pad to 11 digits; prefix 0 |
| Date | Normalize to DD-MM-YYYY |
| Bill Month | Convert full date to MM-YYYY |
| Status | Capitalize (active → Active) |
| Bill | Convert to string number |

### Data Flow

```
File Upload (drag-drop or browse)
  → Supabase Storage upload (if configured, bypasses Vercel 4.5MB limit)
  → /api/isp/validate-from-url OR /api/isp/validate (direct)
  → Cell-level validation results displayed in table
  → Auto-fix via /api/isp/autofix
  → Inline editing with keyboard navigation
  → Download fixed .xlsx with all cells as text (t: 's', z: '@')
```

---

## 16. Backend Server

**File:** `backend/server.js` (1159 lines)

Express server on port 3001. Serves API endpoints and, in production, the built frontend from `dist/`.

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/ip-info` | Proxies `ipapi.co` with `ip-api.com` fallback |
| POST | `/api/ping` | System ping (Unix `ping` / Windows `ping -n`) |
| POST | `/api/scan-port` | TCP connection test via `net.Socket` (2s timeout) |
| GET | `/api/dns` | DNS resolve (A, AAAA, MX, TXT, CNAME, NS) |
| GET | `/api/whois` | WHOIS lookup via `whois` package (lazy-loaded) |
| GET | `/api/traceroute` | System traceroute (Unix/Win) |
| POST | `/api/isp/validate` | Upload .xlsx + validate against template |
| POST | `/api/isp/validate-from-url` | Validate from Supabase Storage URL |
| POST | `/api/isp/autofix` | Auto-fix validation issues |
| POST | `/api/isp/download` | Download fixed data as .xlsx |
| POST | `/api/mikrotik/test` | MikroTik RouterOS API connectivity test |
| POST | `/api/snmp/check` | SNMP device check (sysDescr + interface walk) |
| POST | `/api/snmp/query` | Custom SNMP OID query (get/walk/getnext/getmulti) |
| POST | `/api/http-test` | HTTP request tester |
| POST | `/api/scan-campaign` | Subdomain discovery + port scan |
| GET | `/api/subdomain-discovery` | Subdomain discovery via crt.sh + brute force |
| GET | `/api/http-headers` | HTTP headers check |
| GET | `/api/ssl-cert` | SSL certificate details |
| POST | `/api/run-scenario` | Multi-step scenario runner (dns + http + ssl + headers) |

### Production Mode
When `dist/` exists, the backend serves it as static files with SPA fallback — all non-API routes return `index.html`.

---

## 17. Vercel Serverless API

**File:** `api/index.js` (1118 lines)

A serverless Express app exported from `api/index.js`, deployed via Vercel's `api/` directory convention.

### Key Differences from Backend

| Aspect | Backend (`backend/server.js`) | Vercel (`api/index.js`) |
|---|---|---|
| Runtime | Persistent Node.js process | Serverless (per-request) |
| Port | 3001 (configurable) | Vercel-managed |
| File uploads | Multer with 100MB limit | Multer but subject to 4.5MB Vercel body limit |
| Large files | Direct upload | Upload to Supabase Storage → `validate-from-url` |
| Static files | Serves `dist/` when present | Handled by Vercel's static hosting |
| Module loading | Eager `require` | Lazy `whois` import to avoid ESM crash |

### ISP Validator Module
**File:** `api/_isp-validator.js` (412 lines)

The underscore prefix (`_isp-validator.js`) prevents Vercel from treating it as a separate serverless function. Imported by `api/index.js` via `require('./_isp-validator')`.

---

## 18. Supabase Schema

**File:** `supabase-schema.sql`

### Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `templates` | Data processor templates | `user_id`, `data` (JSONB) |
| `extracted_data` | Extracted document data | `user_id`, `data` (JSONB) |
| `ping_history` | Ping scan history | `user_id`, `data` (JSONB) |
| `user_preferences` | Theme + user settings | `user_id`, `data` (JSONB) |
| `data_sessions` | Fill from Sample sessions | `user_id`, `session_id`, `step`, `demo_*`, `source_*`, `col_map`, `filled_data` |
| `http_profiles` | HTTP request tester profiles | `user_id`, `data` (JSONB) |
| `subdomain_history` | Subdomain discovery history | `user_id`, `data` (JSONB) |
| `scenarios` | Test scenario definitions | `user_id`, `data` (JSONB) |
| `network_checks` | Network dashboard check results | `session_id`, `target`, `type`, `status`, `latency_ms` |
| `ssl_certificates` | SSL certificate monitor | `session_id`, `domain`, `expires_at`, `notify_expiry` |
| `scan_campaigns` | Subdomain + port scan campaigns | `session_id`, `target_domain`, `status`, `results` |
| `api_collections` | API request collections | `session_id`, `name`, `requests` |
| `profiles` | User profiles | `user_id`, `preferences` (JSONB) |
| `isp_validations` | ISP Excel validation history | `user_id`, `template_type`, `file_name`, `data`, `errors`, `warnings` (JSONB) |

### Storage Buckets

| Bucket | Public | Purpose |
|---|---|---|
| `isp-uploads` | Yes | ISP Excel file uploads (bypasses Vercel body limit) |

### RLS Policies
All tables have Row Level Security enabled. Policies for both `authenticated` and `anon` roles. The `isp-uploads` storage bucket has RLS policies for both roles on `storage.objects`.

### Auth
Supabase anonymous sign-ins enabled (no user registration required).

---

## 19. Deployment

### Render (Full-Stack)

| Setting | Value |
|---|---|
| Build Command | `npm install; npm run build` |
| Start Command | `npm start` (runs `node backend/server.js`) |
| Env Variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

The backend serves the built frontend from `dist/` as static files. API routes are prefixed with `/api/`.

### Vercel (Serverless)

| Setting | Value |
|---|---|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| vercel.json | Rewrites `/api/(.*)` → `/api` and `/(.*)` → `/index.html` |

Vercel's serverless functions have a 4.5MB body size limit. Files larger than 4.5MB are uploaded to Supabase Storage (`isp-uploads` bucket), then validated via `/api/isp/validate-from-url`.

---

## 20. Data Flow & Architecture

### ISP Excel Validator Flow

```
User drops .xlsx file
  → File stored in state
  → User selects template (Admin/Mac)
  → Click "Validate"
     → IF Supabase configured: upload to Storage → get public URL → POST /api/isp/validate-from-url
     → ELSE: POST /api/isp/validate with FormData (multer)
  → Validation results displayed (table with cell-level colors + issue panel)
  → Click "Auto-Fix": POST /api/isp/autofix → animated progress → fixed data
  → Inline editing: click any cell, edit with keyboard navigation
  → Click "Download": POST /api/isp/download → .xlsx buffer → browser download
```

### Persistence Strategy
```
Component → useSupabaseStorage hook → localStorage (always) + Supabase (when configured)
```

### Network Tools Data Flow
```
Frontend (simulated data)
  → Direct public API calls (IP info only)
  → Backend proxy (system commands, net.Socket, dns, whois)
```

---

## Appendix: File Size Summary

| Category | Files | Est. Lines |
|---|---|---|
| Root config | 9 | ~300 |
| Public assets | 2 | ~80 |
| Entry/App | 4 | ~200 |
| Context | 2 | ~130 |
| Hooks | 2 | ~120 |
| Lib/Utils | 3 | ~150 |
| Styles | 2 | ~200 |
| Components | 6 | ~220 |
| Data Processor | 2 | ~1,900 |
| Network Tools | 8 | ~1,100 |
| Utilities | 20 | ~2,700 |
| Backend | 2 | ~1,160 |
| Vercel API | 2 | ~1,120 |
| **Total** | **~64** | **~9,500** |

---

*Documentation updated 2026-07-02.*
