# BCN 2026 Wake — Event Companion PWA

A disposable, mobile-first Progressive Web App for a one-week private event with
~400–500 pre-registered attendees. Built to run on AWS + third-party free tiers
and to be torn down after the event.

- **Frontend:** React 18 + TypeScript + Vite, installable PWA (`vite-plugin-pwa`).
- **Auth:** AWS Cognito, **passwordless OTP** (email / SMS) via a `CUSTOM_AUTH` flow.
- **Data:** DynamoDB (attendee roster + OTP store), Lambda + API Gateway (SAM).
- **Extras:** Google Drive gallery, OneSignal web push, i18n (EN / ES / ZH).

---

## Quick start (local, no AWS needed)

The app ships with a **demo mode** that mocks auth, contacts, and the gallery, so
you can run and develop the whole UI without any backend or credentials.

```bash
nvm use 24            # Node 24.x
npm install
npm run dev           # http://localhost:5173
```

On the login screen click **“Enter demo”** to load a mock attendee and explore
every tab. To force demo mode for the entire session (skips the button), set
`VITE_DEMO_MODE=true` in `.env`.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) + production bundle → `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

---

## Running against a real backend

Copy the example env file and fill in values from your deployed stack, then run
`npm run dev` as above.

```bash
cp .env.example .env
```

| Env var | What it is |
|---|---|
| `VITE_AWS_REGION` | Cognito region (e.g. `eu-west-3`) |
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID |
| `VITE_COGNITO_CLIENT_ID` | Cognito App Client ID |
| `VITE_API_BASE_URL` | API Gateway base URL (`.../prod`) |
| `VITE_GOOGLE_DRIVE_API_KEY` | Browser-restricted, read-only Drive key |
| `VITE_GOOGLE_DRIVE_FOLDER_ID` | Public parent folder (albums = subfolders) |
| `VITE_ONESIGNAL_APP_ID` | OneSignal Web app ID (optional) |
| `VITE_DEMO_MODE` | `true` to force demo mode |
| `VITE_ENABLE_TEST_LOGIN_BUTTON` | `false` to hide the “Enter demo” button |

Only non-secret, public values are ever exposed to the client bundle (`VITE_*`).

---

## How login works

There are **no passwords**. Every login is passwordless OTP:

1. Enter attendee ID → `GET /login/channels` returns which channels (email / SMS)
   are available, with masked hints. A 404 means the ID is not on the roster.
2. Pick a channel → Cognito `CUSTOM_AUTH` starts and the `CreateAuthChallenge`
   Lambda sends a 6-digit code (rate-limited with a cooldown).
3. Enter the code → Cognito issues JWTs; the profile is read from the ID-token
   claims populated at seed time.

---

## Project structure

```
index.html                 PWA entry (OneSignal SDK, iOS meta tags)
vite.config.ts             PWA manifest + Workbox runtime caching
src/
  config.ts                Runtime config + demo-mode toggle (VITE_* env)
  types.ts                 Shared domain types
  main.tsx / App.tsx       Bootstrap + auth-gated routing (Login | Dashboard)
  context/AuthContext.tsx  Session state, profile from JWT, demo profile
  pages/                   Login (id → channel → OTP), Dashboard (tab shell)
  components/
    Header, BottomNav, LanguageSelector, PushBanner, Lightbox
    tabs/                  Profile, Schedule (live "NOW"), Gallery, Contacts
  services/
    auth.ts                Cognito passwordless OTP client
    contacts.ts            Role-based directory (GET /contacts) + demo data
    googleDrive.ts         Drive API v3 albums + images
    push.ts                OneSignal init / identify / permission
  data/eventData.ts        Static schedule + emergency contacts (edit + redeploy)
  i18n/                    react-i18next setup + en/es/zh locales
infra/
  template.yaml            SAM: Cognito, DynamoDB, Lambda API
  lambda/                  loginChannels, {define,create,verify}AuthChallenge,
                           contacts, util (CUSTOM_AUTH triggers + REST handlers)
  seed/                    seedUsers.mjs (roster → Cognito + DynamoDB),
                           broadcast.mjs (OneSignal push), roster.csv
.github/workflows/         deploy-frontend.yml, deploy-backend.yml
```

---

## Backend & seed (deploy)

Deploying is only needed to test against real Cognito/DynamoDB — day-to-day UI
work uses demo mode. The project region is `eu-west-3`.

```bash
# 1. Deploy the stack (needs a verified SES sender for OTP emails)
cd infra
sam build
sam deploy --guided \
  --stack-name bcn2026-backend \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides SesFromAddress="no-reply@yourdomain.com"

# 2. Pre-provision attendees (idempotent — safe to re-run)
cd seed
npm install
AWS_REGION=eu-west-3 \
COGNITO_USER_POOL_ID=eu-west-3_XXXX \
ATTENDEES_TABLE=bcn2026-attendees \
  npm run seed

# 3. Broadcast a push (optional)
ONESIGNAL_APP_ID=xxx ONESIGNAL_REST_API_KEY=xxx \
  npm run broadcast -- "Keynote in 10 min" "Auditorium A"
```

Edit the roster in `infra/seed/roster.csv`
(`id,name,email,phone,church_name,team_code,team_name,room_number,leaders_id,roommates_id,is_leader,is_maintainer`).

CI/CD lives in `.github/workflows/`: `deploy-frontend.yml` runs on push to `main`
(build → S3 → CloudFront invalidate); `deploy-backend.yml` is manual. Both use
GitHub OIDC (no long-lived AWS keys) — see the workflow files for the required
repository secrets and variables.

---

## Notes

- Add binary PWA icons before deploying — see [public/ICONS_README.md](public/ICONS_README.md).
- OTPs are stored hashed (SHA-256) with a DynamoDB TTL and verified in constant
  time; the Google Drive key is browser-restricted and read-only.
- Teardown after the event: `aws cloudformation delete-stack --stack-name bcn2026-backend`,
  then remove the S3 bucket + CloudFront distribution and disable the OneSignal app.
