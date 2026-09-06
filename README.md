# Course Hub

A homepage that automatically lists every course, subfolder, and file inside
`public/Content Folder` — nested exactly as it sits on disk. The folder itself
is never shown; only what's inside it.

## How it works

- `lib/content.ts` walks `public/Content Folder` recursively at build time
  and turns it into a tree of folders and files.
- `components/ContentTree.tsx` renders that tree as nested, expandable
  sections using native `<details>`/`<summary>` — no client-side JavaScript
  required, so it's fast and works even with JS disabled.
- `app/page.tsx` is the homepage. It reads the tree and shows a count of
  courses/files, or a friendly empty state if the folder has nothing in it.
- Because everything under `public/` is served as static files, every file
  in the content folder is directly openable at its own URL (e.g. an HTML
  file opens and renders like a normal web page when tapped).

## Managing content

Everything lives under:

```
public/Content Folder/
```

- Top-level folders show up as courses.
- Any level of subfolders is supported (modules, units, weeks — nest as
  deep as you like).
- Any file type works. Files link out with `target="_blank"`; browser-native
  types like `.html`, `.pdf`, and images open/render directly, other types
  (like `.docx`) will download.
- Loose files placed directly in `Content Folder` (not inside a subfolder)
  show up as a flat list before the folders.

To update the site: add, remove, or rename files/folders under
`public/Content Folder`, commit, and push to GitHub. Vercel rebuilds
automatically and the homepage regenerates from whatever is currently in
the folder — no code changes needed.

> Note: the tree is generated at **build time** (standard static generation),
> which keeps the site fast and avoids serverless filesystem quirks. That
> means a change to the content folder needs a new deploy to appear, which
> a normal `git push` already triggers.

### Renaming the content folder

If you'd rather not have a space in the folder name, rename
`public/Content Folder` to whatever you like and update the constant at the
top of `lib/content.ts`:

```ts
export const CONTENT_DIR_NAME = "Content Folder";
```

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploying to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, click **Add New → Project** and import that repository.
3. Vercel auto-detects Next.js — no configuration needed. Click **Deploy**.
4. From then on, every push to your default branch triggers a new deploy.

## Design notes

- Layout is a single centered column (max 760px) so it reads well as a list
  on desktop and needs no changes on mobile — tested down to 390–430px
  wide (iPhone 16 Pro Max and similar), with safe-area padding for the
  notch/Dynamic Island and 44px-minimum tap targets throughout.
- Typography pairs Fraunces (course titles) with Inter (navigation, file
  names, metadata) via `next/font`, so fonts are self-hosted at build time
  with no external requests at runtime.
