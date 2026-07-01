# ⚡ SuperApp — All-in-One React Utility Suite

A modern React application combining document data processing, network diagnostic tools, ISP client validation, and developer utilities in a single cohesive dashboard.

**Deploy targets:** [Render](https://render.com) (full-stack) · [Vercel](https://vercel.com) (serverless API)

---

## Features

### 📄 Data Processor
- **Template Management** — Define fields with name, demo value, and validation rules (required, email, regex, min/max, minLength/maxLength)
- **Template Library** — Save and load named templates, persist to Supabase
- **File Upload** — Drag-and-drop or browse for PDF, Excel (.xlsx, .xls), CSV
- **Smart Extraction** — Parse files to extract values matching template fields with AI (Claude API) and demo fallback
- **Validation Engine** — Validate each field against rules with per-row status badges
- **Fill from Sample** — 6-step workflow: upload demo → upload source → column map → process → preview → export
- **Preview & Export** — Table view with search, sort, pagination; export to CSV/JSON/styled Excel

### 🌐 Network Tools
| Tool | Features |
|------|----------|
| **Ping** | Single/continuous mode, latency chart (bar/line), summary stats, history saved to Supabase |
| **Port Scanner** | Common ports (20), port range, custom list modes; 60+ service name DB; saved scan history |
| **DNS Lookup** | 8 record types (A, AAAA, MX, TXT, CNAME, NS, SOA, SRV); single & bulk lookup |
| **WHOIS** | Structured registration details (registrar, dates, name servers, contacts) |
| **Traceroute** | Hop-by-hop table with IP, hostname, and 3 RTT measurements |
| **IP Info** | Auto-detect public IP, geolocation, ISP, timezone, ASN via multi-API fallback |

### 📋 ISP Excel Validator
- **Template Support** — Admin (25 columns) and Mac (21 columns) fixed templates with exact headers
- **Drag-and-Drop Upload** — .xlsx file upload with template selection
- **Validation Engine** — Per-cell validation: phone (BD format 01XXXXXXXXX), email, dates (DD-MM-YYYY), bill month (MM-YYYY), status (Active/Inactive/Suspended), IP addresses, mandatory fields
- **Cell-Level Results** — Color-coded errors and warnings with detailed messages
- **Auto-Fix** — One-click fixes for common issues: phone formatting, date normalization, status casing, bill month conversion
- **Inline Editing** — Click any cell to edit with keyboard navigation (Tab, arrows, Enter, Escape)
- **Search & Filter** — Search across all columns; filter by All/Valid/Warnings/Errors
- **Download** — Exports fixed data as .xlsx with all cells stored as text to prevent Excel auto-conversion
- **Supabase Integration** — Anonymous auth, uploads to Supabase Storage (bypasses Vercel 4.5MB limit), history saved to `isp_validations` table
- **Animated Auto-Fix** — Visual progress steps showing which categories are being fixed

### 🧰 Utilities (18 tools)
| Tool | Description |
|------|-------------|
| **Base64** | Encode/decode text + file-to-Base64 encoding |
| **UUID Generator** | Generate v4 UUIDs (bulk, copy all) |
| **Password Generator** | Configurable length, char types, strength meter |
| **QR Code Generator** | Custom foreground/background, 4 size presets, SVG/PNG download |
| **File Hasher** | Drag-drop files, MD5/SHA-1/SHA-256/SHA-512 using Web Crypto API |
| **JSON Formatter** | Format/minify/validate, tree view, JSON path query |
| **Color Converter** | HEX/RGB/HSL with sliders, palette generator, WCAG contrast checker (AA/AAA) |
| **Text Case Converter** | 10 case types: UPPER, lower, Title, camelCase, PascalCase, snake_case, kebab-case, etc. |
| **URL Encoder/Decoder** | Encode/decode URI components |
| **Unit Converter** | Length, Weight, Temperature, Data Size — 25+ units |
| **Timer & Stopwatch** | Stopwatch with lap tracking + countdown mode |
| **Lorem Ipsum Generator** | Words, sentences, or paragraphs with configurable count |
| **Text Analyzer** | Character, word, sentence, paragraph counts; top 10 word frequency |
| **Number Base Converter** | Binary, Octal, Decimal, Hexadecimal |
| **Epoch Converter** | Timestamp ↔ human date, live preview |
| **Regex Tester** | Test patterns with highlighted matches, match list, replace |
| **PDF to Excel** | Extract PDF text content to Excel spreadsheets |

---

## Tech Stack

- **Frontend:** React 19 (functional components, hooks, Context API)
- **Routing:** React Router v7
- **Charts:** Recharts (ping latency visualization)
- **QR Codes:** qrcode.react
- **Styling:** CSS custom properties (light/dark theme)
- **State Sync:** Supabase (anonymous auth, JSONB tables) + localStorage fallback
- **Build:** Vite 8
- **Backend:** Node.js + Express (network tools + ISP validator)
- **Excel:** SheetJS (xlsx) for read/write with text-formatted cells

---

## Getting Started

```bash
# Install dependencies (frontend + backend)
npm install

# Start dev server (frontend on port 5173)
npm run dev

# Start backend (port 3001) — required for network tools
node backend/server.js
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:3001
```

Without Supabase env vars, the app falls back to localStorage automatically.

---

## Deployment

### Render (full-stack)

The backend serves the built frontend as static files. Configure:

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install; npm run build` |
| **Start Command** | `npm start` |
| **Root Directory** | `/` (repo root) |

All dependencies are in the root `package.json` — no separate backend install needed.

### Vercel (serverless API)

The `api/` directory contains serverless functions. Configure:

| Setting | Value |
|---------|-------|
| **Framework** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

Vercel's `vercel.json` rewrites `/api/*` to the Express serverless function in `api/index.js`.

> **Note:** Files larger than 4.5MB are uploaded to Supabase Storage first, then validated via `/api/isp/validate-from-url` to bypass Vercel's body size limit.

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in the SQL editor to create all tables, buckets, and RLS policies
3. Enable **Allow anonymous sign-ins** in Auth > Settings
4. Enable the `isp-uploads` storage bucket (Public)
5. Copy your project URL and anon key into `.env`

---

## Backend API

The Express backend (`backend/server.js`) provides:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ping` | Ping a target (ICMP via system ping) |
| POST | `/api/scan-port` | TCP port scan |
| GET | `/api/dns` | DNS record lookup |
| GET | `/api/whois` | WHOIS domain/IP lookup |
| GET | `/api/traceroute` | Traceroute to target |
| GET | `/api/ip-info` | Public IP geolocation info |
| POST | `/api/isp/validate` | Upload & validate ISP Excel file |
| POST | `/api/isp/validate-from-url` | Validate ISP Excel from Supabase Storage URL |
| POST | `/api/isp/autofix` | Auto-fix validation issues |
| POST | `/api/isp/download` | Download fixed data as .xlsx |

---

## Project Structure

```
src/
├── components/
│   ├── Layout/          Navbar, Sidebar, Layout (routing shell)
│   └── common/          CopyButton, LoadingSpinner, ErrorMessage
├── pages/
│   ├── DataProcessor/   Template fields + upload + extraction + validation + fill-from-sample
│   ├── NetworkTools/    Ping, PortScanner, DNSLookup, Whois, Traceroute, IPInfo
│   └── Utilities/       18 utility tools + ISP Excel Validator
├── context/             ThemeContext, SupabaseContext
├── hooks/               useLocalStorage, useSupabaseStorage
├── lib/                 Supabase client
├── utils/               Validation engine, API client
├── styles/              Global CSS with CSS variables
├── App.jsx              Router + homepage
└── main.jsx             Entry point

backend/
├── server.js            Express server (API + serves frontend in production)
└── isp-validator.js     Shared validation, autofix, and Excel generation module

api/
├── index.js             Vercel serverless Express (same endpoints as backend)
└── _isp-validator.js    Shared validator module (underscore prefix: ignored by Vercel)
```
