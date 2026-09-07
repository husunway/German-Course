// Serverless function: stream a single blob back to the browser with an
// *inline* Content-Disposition so HTML renders instead of downloading.
//
// Vercel Blob serves user-uploaded HTML as `attachment` on the shared
// *.public.blob.vercel-storage.com domain, which forces a download. This
// proxy re-serves the same bytes from our own domain as text/html inline.
//
// Usage: /api/view?path=<blob pathname>, e.g.
//   /api/view?path=Grammar/Week%201/dative.html

import { list } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const TYPE_BY_EXT = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
};

export default async function handler(request, response) {
  try {
    if (!BLOB_TOKEN) {
      response.status(500).send("BLOB_READ_WRITE_TOKEN is not set.");
      return;
    }

    const pathname =
      (request.query && request.query.path) ||
      new URL(request.url, "http://localhost").searchParams.get("path");

    if (!pathname) {
      response.status(400).send("Missing ?path parameter.");
      return;
    }

    // The public URL has a random suffix, so it can't be built by hand —
    // look the blob up by exact pathname.
    let match;
    let cursor;
    do {
      const page = await list({
        token: BLOB_TOKEN,
        prefix: pathname,
        limit: 1000,
        cursor,
      });
      match = page.blobs.find((b) => b.pathname === pathname);
      cursor = page.cursor;
    } while (!match && cursor);

    if (!match) {
      response.status(404).send("No file at: " + pathname);
      return;
    }

    const upstream = await fetch(match.url);
    if (!upstream.ok) {
      response.status(502).send("Could not fetch the file from storage.");
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    const ext = (pathname.split(".").pop() || "").toLowerCase();
    const contentType =
      TYPE_BY_EXT[ext] ||
      upstream.headers.get("content-type") ||
      "application/octet-stream";

    response.setHeader("Content-Type", contentType);
    response.setHeader("Content-Disposition", "inline");
    response.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
    response.status(200).send(buffer);
  } catch (error) {
    response.status(500).send(error?.message || "Failed to load the file.");
  }
}
