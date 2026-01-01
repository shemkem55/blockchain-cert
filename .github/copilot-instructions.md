# Copilot Instructions — Blockchain Certificate System

These notes help AI coding agents be productive in this repository.

## Big Picture
- Backend: `certificate-backend/server.js` — Express + Mongoose API that issues, verifies, lists and revokes certificates; uses JWT (httpOnly cookie) and email OTP flows.
- Frontend: `frontend v2/` — Vite + React app that calls backend through a dev proxy; axios client is in `frontend v2/src/api.js` and uses `withCredentials`.
- On-chain verification: `certificate-verification./` — Hardhat/viem project for smart-contract examples and tests (separate from the Express backend).

## Important files to reference
- `certificate-backend/server.js` — All Express routes and schema definitions (User, Certificate, Feedback) live here.
- `certificate-backend/generate-certs.js` — Generates self-signed `server.key` and `server.cert` for HTTPS development.
- `certificate-backend/config/db.js` — MongoDB connection helper.
- `certificate-backend/package.json` — backend dependencies (no start script; run `node server.js`).
- `frontend v2/src/api.js` and `frontend v2/src/utils/auth.js` — axios wrapper, dev proxy usage, and localStorage token helpers.
- `certificate-verification./README.md` and `hardhat.config.ts` — run Hardhat tests and deployments.

## Run / Dev commands (project-specific)
- Backend (from `certificate-backend`):
  - Install: `npm install`
  - Generate self-signed certs (optional dev HTTPS): `node generate-certs.js` (creates `server.key`/`server.cert`)
  - Run: `node server.js` (port from `PORT` env; default 3000)
- Frontend (from `frontend v2`):
  - Install: `npm install`
  - Dev: `npm run dev` (Vite dev server; uses proxy to backend)
- Verification (from `certificate-verification./`):
  - Run tests: `npx hardhat test`
  - Deploy example module: see `README.md` (`npx hardhat ignition deploy ...`)

## Environment variables (key ones)
- `MONGO_URI` — MongoDB connection string (required for backend)
- `EMAIL_USER`, `EMAIL_PASSWORD` — for OTP emails (Gmail app password recommended)
- `JWT_SECRET` — JSON Web Token secret (override default in production)
- `SSL_KEY_PATH`, `SSL_CERT_PATH` — optional paths to SSL certs; `generate-certs.js` writes `server.key`/`server.cert` locally
- `NODE_ENV`, `PORT`, `FORCE_SHOW_OTP` — dev/production behavior toggles

## Project-specific patterns & conventions
- Auth:
  - Backend sets an httpOnly cookie named `token`. Frontend saves a copy in `localStorage` primarily for UI state; do not remove cookie-based behavior.
  - JWT payload includes `{ id, email, role }`; admin-protected endpoints check `role === 'admin'` in `server.js` middleware `requireAdmin`.
- OTP flow:
  - OTP is 6 digits, stored on `User.otp` and expires at `otpExpire` (10 min). `sendOTPEmail` logs OTP as a fallback when email fails.
  - Routes: `/auth/login`, `/auth/send-otp`, `/auth/verify-otp` — front-end expects `otpRequired` responses and `devOtp` in non-production.
- Certificates:
  - IDs are generated from a SHA256 hash then `.slice(0,10)` — 10-character lowercase hex (`/issue` route).
  - Public verification via `/verify` (POST `{ id }`);
  - Revocation via `/revoke` (admin only).
- Validation: uses `express-validator` for request validation; reference `validateEmail`, `validateCertId` helpers in `server.js`.

## Integration notes for edits
- When adding backend endpoints, mirror client calls in `frontend v2/src/api.js` (same path and request shape) and ensure `withCredentials` if relying on cookie auth.
- If changing JWT behavior, update both `server.js` cookie handling and `frontend v2/src/utils/auth.js` (token storage and retrieval).
- For HTTPS dev, prefer `generate-certs.js` then start backend; Vite proxy (see `vite.config.js`) forwards to `https://localhost:3000` in dev so browser certificate warnings are expected.

## Tests & CI hints
- Backend has no unit tests in repo. Smart-contract tests live in `certificate-verification./` and use Hardhat: `npx hardhat test`.
- If adding tests for the backend, use a separate test db (set `MONGO_URI`) and avoid relying on real SMTP (use `FORCE_SHOW_OTP=true` to surface OTPs in responses).

## Quick examples (copyable)
- Start backend (dev HTTPS):
  - `cd certificate-backend && npm install && node generate-certs.js && node server.js`
- Start frontend (Vite):
  - `cd "frontend v2" && npm install && npm run dev`
- Run on-chain tests:
  - `cd certificate-verification./ && npx hardhat test`

## What to avoid / common pitfalls
- Do not remove cookie-based `token` behavior; many flows rely on `httpOnly` cookie set by backend.
- Be careful when changing certificate ID format — it's used by public verification and has a 10-char hex validation rule.

If anything here is incomplete or you'd like the agent to emphasize other areas (tests, code style, or CI), tell me what to expand. 
