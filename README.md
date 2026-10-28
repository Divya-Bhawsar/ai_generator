# VidyaMotion

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

The Next.js App Router scaffold lives in `src/app`. The first implementation slice is the approved public homepage and the shared Color Lives in the Story design tokens. Product workflows and provider integrations will be added in the feature order tracked in `PROJECT_STATUS.md`.

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
