# Blood In Need

A fullstack web application for blood donation management. Donors register with their
blood group and contact details, and people in need can browse and filter donors.

Deployed on Vercel: the React client is served from the CDN and the Express API runs as
a single Vercel Function.

## Technology Stack

- **Frontend:** React 18, Material UI 5, React Router 6, axios
- **Backend:** Node.js 22, Express 4 (as a Vercel Function)
- **Database:** MongoDB (Atlas)

## Prerequisites

- Node.js 22 (an `.nvmrc` is provided — run `nvm use`)
- A MongoDB connection string

## Local Development

```bash
# 1. Install dependencies for both the server and the client
npm install
npm run client-install

# 2. Configure environment
cp .env.example .env   # then edit .env and set MONGODB_URI

# 3. Run the API and the React dev server together
npm run dev
```

The React dev server runs on <https://localhost:3000> and proxies API calls to the
Express server on port `10000`.

To run the production bundle locally:

```bash
npm run build
NODE_ENV=production npm start
```

When started directly like this, Express also serves the compiled client from `public/`.
On Vercel that never happens — see the architecture note below.

## Environment Variables

| Variable       | Required | Default       | Description                                                               |
| -------------- | -------- | ------------- | ------------------------------------------------------------------------- |
| `MONGODB_URI`  | Yes      | —             | MongoDB connection string.                                                 |
| `PORT`         | No       | `10000`       | Local only. Vercel does not use a port listener.                           |
| `NODE_ENV`     | No       | `development` | Vercel sets this to `production` automatically.                            |
| `CORS_ORIGINS` | No       | unset         | Comma separated cross-origin allowlist. Not needed for the bundled client. |

## API

| Method | Endpoint      | Description                                                     |
| ------ | ------------- | --------------------------------------------------------------- |
| `GET`  | `/api/health` | Health probe. Reports database connectivity.                     |
| `GET`  | `/api/donors` | List donors, newest first. Optional `?bloodGroup=O%2B` filter.    |
| `POST` | `/api/donors` | Register a donor.                                                |

Registration requires `name`, `location`, `email` (a Gmail address), `bloodGroup`, and
at least one of `phoneNumber` (11 digits) or `facebookProfileUrl`.

## Deployment (Vercel)

Push to `main` and Vercel builds automatically. Set `MONGODB_URI` in
**Project Settings → Environment Variables** before the first deploy.

Also confirm in **Project Settings → General** that **Root Directory** is the repository
root (not `client`).

The **Framework Preset** should be `Other`. `vercel.json` sets `"framework": null` to
enforce this, but leaving the dashboard on `Express` is worth correcting so the two
agree.

Everything else is defined in `vercel.json`.

### How the build fits together

`npm run build` compiles the React client into `public/` at the repository root, using
Create React App's `BUILD_PATH`. `vercel.json` points `outputDirectory` at `public`, so
Vercel serves it from the CDN.

`api/[...path].js` re-exports the Express app, which makes Vercel turn every `/api/*`
request into a single function. Matching on the filesystem rather than a rewrite means
Express receives the original URL and its router works unchanged.

`vercel.json` rewrites every other path to `/index.html` so React Router handles
client-side routes. Because Vercel applies rewrites only after checking the filesystem,
real files such as `/static/js/main.*.js` are still served directly.

`vercel.json` also sets `"framework": null`. This matters: under the `Express` framework
preset Vercel generates its own routing from the app, which supersedes the `rewrites`
and `headers` here and skips the client build entirely, leaving the site with a working
API but no frontend.

### Architecture notes

These differ from a traditional long-running Node host:

- **`server.js` exports the app** rather than always listening. It only calls
  `app.listen()` when run directly, which is what makes it work both as a Vercel
  Function and as a normal server locally.
- **Static files are served by the CDN from `public/`**, never by Express. The Express
  static handler is skipped when `VERCEL` is set, and only exists so that
  `npm start` can serve the built client locally.
- **The MongoDB connection is cached** on the global object in `lib/db.js`. Serverless
  invocations reuse warm containers, and without this cache each one would open its own
  pool and exhaust the Atlas connection limit.
- **Rate limiting is per function instance**, since the counters are in memory. It slows
  casual abuse but is not a global guarantee; a shared store such as Redis would be
  needed for strict enforcement.
- **HTTPS and canonical domain redirects are handled by Vercel**, so the application
  does not implement them.

### Before going live

- Allow access from anywhere in MongoDB Atlas (`0.0.0.0/0`), since Vercel Functions do
  not have static egress IPs, and use a database user scoped to this database only.
- Add your custom domain in **Project Settings → Domains** and mark one as primary so
  the others redirect to it.
