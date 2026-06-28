# ⚡ SuperApp — All-in-One React Utility Suite

A modern React application combining document data processing, network diagnostic tools, and developer utilities in a single cohesive dashboard.

## Features

### 📄 Data Processor
- **Template Management** — Define fields with name, demo value, and validation rules (required, email, regex, min/max, minLength/maxLength)
- **Template Library** — Save and load named templates, persist to Supabase
- **File Upload** — Drag-and-drop or browse for PDF, Excel (.xlsx, .xls), CSV
- **CSV Import** — Import CSV files directly (headers become template fields)
- **Smart Extraction** — Parse files to extract values matching template fields with demo fallback
- **Validation Engine** — Validate each field against rules with per-row status badges
- **Preview & Export** — Table view with search, sort, pagination, row selection; export selected or all rows to CSV/JSON
- **Supabase Sync** — Templates and extracted data persist to Supabase (falls back to localStorage)

### 🌐 Network Tools
| Tool | Features |
|------|----------|
| **Ping** | Single/continuous mode, latency chart (bar/line), summary stats, history saved to Supabase |
| **Port Scanner** | Common ports (20), port range, custom list modes; 60+ service name DB; saved scan history |
| **DNS Lookup** | 8 record types (A, AAAA, MX, TXT, CNAME, NS, SOA, SRV); single & bulk lookup |
| **WHOIS** | Structured registration details (registrar, dates, name servers, contacts) |
| **Traceroute** | Hop-by-hop table with IP, hostname, and 3 RTT measurements |
| **IP Info** | Auto-detect public IP, geolocation, ISP, timezone, ASN via multi-API fallback |

### 🧰 Utilities (17 tools)
| Tool | Description |
|------|-------------|
| **Base64** | Encode/decode text + file-to-Base64 encoding |
| **UUID Generator** | Generate v4 UUIDs (bulk, copy all) |
| **Password Generator** | Configurable length, char types, strength meter |
| **QR Code Generator** | Custom foreground/background, 4 size presets, SVG/PNG download |
| **File Hasher** | Drag-drop files, MD5/SHA-1/SHA-256 using Web Crypto API |
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
| **Excel Validator** | Validate Excel files against a demo template — schema analysis, type inference, format checking, column mapping, multi-sheet, export reports |

## Tech Stack

- **Frontend:** React 19 (functional components, hooks, Context API)
- **Routing:** React Router v7
- **Charts:** Recharts (ping latency visualization)
- **QR Codes:** qrcode.react
- **Styling:** CSS custom properties (light/dark theme)
- **State Sync:** Supabase (anonymous auth, JSONB tables) + localStorage fallback
- **Build:** Vite 8

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (frontend only, simulated data for network tools)
npm run dev

# Build for production
npm run build
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:3001
```

Without Supabase env vars, the app falls back to localStorage automatically.

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in the SQL editor to create tables and RLS policies
3. Enable **Allow anonymous sign-ins** in Auth > Settings
4. Copy your project URL and anon key into `.env`

## Backend Proxy (Optional)

For real network diagnostics (not simulated):

```bash
cd backend
npm install
npm start   # Express on port 3001
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ping` | Ping a target (ICMP via system ping) |
| POST | `/api/scan-port` | TCP port scan |
| GET | `/api/dns` | DNS record lookup |
| GET | `/api/whois` | WHOIS domain/IP lookup |
| GET | `/api/traceroute` | Traceroute to target |
| GET | `/api/ip-info` | Public IP geolocation info |

## Project Structure

```
src/
├── components/
│   ├── Layout/          Navbar, Sidebar, Layout (routing shell)
│   └── common/          CopyButton, LoadingSpinner, ErrorMessage
├── pages/
│   ├── DataProcessor/   Template fields + file upload + extraction + validation + export
│   ├── NetworkTools/    Ping, PortScanner, DNSLookup, Whois, Traceroute, IPInfo
│   └── Utilities/       16 utility tools
├── context/             ThemeContext, SupabaseContext
├── hooks/               useLocalStorage, useSupabaseStorage
├── lib/                 Supabase client
├── utils/               Validation engine, API client
├── styles/              Global CSS with CSS variables
├── App.jsx              Router + homepage
└── main.jsx             Entry point

backend/
└── server.js            Express proxy for network tools
```

## Key Design Decisions

- **Supabase-first persistence** with automatic localStorage fallback when not configured
- **Anonymous auth** — no sign-up required; data is per-session
- **Simulated network tools** work without a backend; real data when backend is running
- **Light/dark theme** persisted to both localStorage and Supabase preferences table
- **All state managed via hooks** — no external state management library needed
