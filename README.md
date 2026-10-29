# VidyaMotion

## Local setup

1. Install dependencies with `npm install`.
2. Create a Clerk application and copy its publishable key and secret key from Clerk's API keys page.
3. Copy `.env.example` to `.env.local` and fill in the Clerk keys. `.env.local` is ignored by Git; never commit real keys.
4. Start the app with `npm run dev`.

The public homepage is available at `/`. Sign-up and sign-in live at `/sign-up` and `/sign-in`; authenticated users land in their private `/dashboard` workspace.

VidyaMotion turns educational ideas into short narrated motion-graphic explainers. The product requirements and technical decisions live in the linked documents below.

## Product and engineering documents

- [Project status](PROJECT_STATUS.md) — authoritative implementation status and feature roadmap.
- [Product requirements](PRD.md)
- [System design](SYSTEM_DESIGN.md)
- [API design](API_DESIGN.md)
- [Database design](DATABASE_DESIGN.md)
- [Video pipeline design](PIPELINE_DESIGN.md)
- [Brand guidelines](BRAND_GUIDELINES.md)

## Web app

The Next.js App Router application lives in `src/app`. The approved public homepage, Clerk sign-up/sign-in, and protected personal workspace shell are implemented. Remaining product workflows are tracked in `PROJECT_STATUS.md`.

### Prerequisites

- Node.js 20.9 or newer
- npm

### Run locally

```sh
npm install
npm run dev
```

Then open `http://localhost:3000`.

The existing provider-backed video prototype remains in `prototype/`; it is separate from the Next.js application and does not yet share app authentication, MongoDB, R2, or Instagram integration.
