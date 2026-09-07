# German — Course Hub

A single-page hub that lists **every file in the `GermanBlob` Vercel Blob store**,
nested into folders, and links straight to each HTML file. The list is built
live on every visit — upload a file to the store and it appears here, no
redeploy needed.

- `index.html` — the homepage. Static, mobile-first (tuned for iPhone 16 Pro
  Max: `viewport-fit=cover` + safe-area insets, 44px tap targets, single
  760px column). No framework, no build step.
- `api/tree.js` — a Node serverless function that calls `@vercel/blob`
  `list()`, pages through the whole store, and returns a nested
  folder/file tree as JSON. Sent with `Cache-Control: no-store` so it's
  always current.
- `api/view.js` — proxies a single blob (`/api/view?path=<pathname>`) and
  re-serves it as `text/html` **inline**, so HTML renders in the browser
  instead of downloading (Vercel Blob serves user HTML as an attachment).

Blob keys are flat strings. A key like `Grammar/Week 1/dative.html` is shown
as the file `dative.html` inside `Grammar` → `Week 1`.

## One-time setup

### 1. Create the Vercel project

Import this repo in Vercel (**Add New → Project**), or from this folder:

```bash
npm i -g vercel
vercel            # link / create the project
```

No framework preset, build command, or output directory is needed —
`vercel.json` sets `framework: null` and Vercel serves `index.html` at `/`
and `api/tree.js` as a function.

### 2. Create the Blob store named `GermanBlob`

In the Vercel dashboard: **Project → Storage → Create Database → Blob**,
name it **`GermanBlob`**, and connect it to this project. That injects the
`BLOB_READ_WRITE_TOKEN` environment variable the function reads.

> After connecting the store, trigger one redeploy so the token is present
> in the running deployment.

### 3. Add content

Upload HTML files to the `GermanBlob` store — via the dashboard, the API, or the
CLI:

```bash
vercel blob put ./local/dative.html --pathname "Grammar/Week 1/dative.html"
```

Refresh the site; the file is listed and opens in a new tab.

## Local development

```bash
vercel env pull        # writes BLOB_READ_WRITE_TOKEN into .env
vercel dev             # serves index.html + /api/tree at localhost:3000
```

## Notes

- Every file type is listed; only the name and extension are shown. Files
  open through `/api/view`, which renders HTML (and images, PDFs, text)
  inline in a new tab.
- Folders are collapsed by default and sort before files, both
  numeric-aware (`Week 2` before `Week 10`).
- If the store isn't connected yet, the homepage shows a clear message
  instead of failing silently.
