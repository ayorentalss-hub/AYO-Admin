# AYO Admin

Admin frontend built with Next.js, React, and TypeScript.

## Requirements

- Node.js 20.9 or newer
- npm

## Setup

```bash
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The API defaults to the AYO hosted backend. To use another API, set
`NEXT_PUBLIC_API_URL` in `.env.local`, including the `/api/v1` path when needed.

## Checks

```bash
npm run lint
npm run build
```

To serve a production build locally, run `npm run start` after building.