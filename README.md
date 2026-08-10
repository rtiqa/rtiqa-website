# Rtiqa (رتقاء) – AI Operating System for Education

The official global web application for **Rtiqa** (رتقاء), an AI Operating System designed for educational institutions, higher education, and enterprise digital infrastructure.

> **Status Notice:** This repository contains the official prototype and public portal for Rtiqa. Features marked as architectural targets or roadmap concepts are strictly presented as design goals and are distinguished from currently live interactive capabilities.

---

## 🏛️ High-Level Architecture

Rtiqa is structured as a full-stack web application designed for modern containerized execution (e.g., Google Cloud Run, Docker):

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion (animations), Lucide React (icons).
- **Frontend Routing:** Route-based code splitting using `React.lazy()` and `React.Suspense` for optimal initial bundle loading and fast home-page rendering.
- **Backend:** Node.js, Express, `esbuild` for CJS bundling.
- **Form APIs & Services:** Server-side API routes for `/api/contact`, `/api/demo`, and `/api/subscribe` with input validation, sanitization, IP rate-limiting, and optional webhook dispatching.
- **Bilingual Support:** Complete Arabic (RTL) and English (LTR) language parity via React Context.
- **SEO & Metadata:** Dynamic open-graph, canonical URL, and title/description metadata management.

---

## 📋 Prerequisites

- **Node.js:** v20.x or v22.x LTS
- **npm:** v10.x or higher

---

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rtiqa/rtiqa-website.git
   cd rtiqa-website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env` and adjust settings as needed:
   ```bash
   cp .env.example .env
   ```

---

## 🔐 Environment Variables

The server inspects the following environment variables (defined in `.env.example`):

| Variable | Scope | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Server | Application environment (`development`, `production`, `test`) | `development` |
| `PORT` | Server | HTTP port for Express server | `3000` |
| `APP_URL` | Server | Allowed production origin for CORS restrictions | `https://rtiqa.com` |
| `FORM_WEBHOOK_URL` | Server-Only | Optional webhook URL for forwarding form submissions | `https://hooks.example.com/...` |
| `CONTACT_NOTIFICATION_EMAIL` | Server-Only | Optional recipient email for administrative notifications | `contact@rtiqa.com` |

*Note: Server-only secrets are never exposed to client-side bundles.*

---

## 🚀 Running the Application

### Development Mode
Starts the Express server with `tsx` and mounts Vite dev middleware with HMR:
```bash
npm run dev
```
Access the dev server at `http://localhost:3000`.

### Production Build
Builds the Vite static frontend into `dist/` and compiles `server.ts` into a bundled CommonJS file (`dist/server.cjs`):
```bash
npm run build
```

### Production Start
Launches the standalone compiled server:
```bash
npm run start
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description | Rate Limit |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health-check endpoint returning `{ "status": "ok" }` | Unrestricted |
| `POST` | `/api/contact` | Submits general contact inquiry with sanitization and validation | 5 req / 15 min per IP |
| `POST` | `/api/demo` | Submits institutional demo request with sanitization and validation | 5 req / 15 min per IP |
| `POST` | `/api/subscribe` | Submits newsletter subscription email | 5 req / 15 min per IP |

---

## 🔒 Security Architecture

- **HTTP Security Headers:** Implemented via custom Express middleware:
  - `Content-Security-Policy` (strict frame-ancestors, object-src, base-uri)
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security` (HSTS enabled in production)
- **CORS Restrictions:** Restricts `/api` origin access in production to `APP_URL` and `rtiqa.com`.
- **IP Rate Limiting:** Enforces maximum 5 form submissions per 15-minute window per IP.
- **Graceful Shutdown:** Handles `SIGTERM` and `SIGINT` signals to cleanly drain active connections before terminating.

---

## 🧪 Testing & Quality Assurance

Run the automated verification suite:

```bash
# Type check and linting
npm run lint

# Automated unit & API integration tests (Node native test runner)
npm test

# Production build test
npm run build

# Security audit
npm audit --audit-level=high
```

---

## 🎯 Implementation vs. Roadmap Capabilities

| Feature | Implementation Status | Notes |
| :--- | :--- | :--- |
| Public Website & Landing Experience | **IMPLEMENTED** | Interactive product showcase, bilingual UI |
| Contact, Demo & Subscription Forms | **IMPLEMENTED** | Server-side validation, rate limiting, optional webhooks |
| Dynamic SEO & Metadata Service | **IMPLEMENTED** | Route-based title, description, OG tags |
| Security Headers & API Rate Limiting | **IMPLEMENTED** | Configured in `server.ts` |
| Health Check (`/api/health`) | **IMPLEMENTED** | Available for Cloud Run / load balancers |
| Route Code-Splitting | **IMPLEMENTED** | React.lazy & Suspense for secondary pages |
| Enterprise SSO / SAML / OAuth2 | **PLANNED** | Architectural target for future enterprise platform versions |
| SOC 2 / GDPR Certifications | **UNOBTAINED** | Design practices align with standard security principles |
