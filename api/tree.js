// Serverless function: list everything in the "German" Vercel Blob store and
// return it as a nested folder/file tree.
//
// Blob keys are flat strings; a key like "Grammar/Week 1/dative.html" is
// treated as the file "dative.html" inside folder "Grammar" > "Week 1".
//
// Auth: the read/write token for the German store is read from the
// BLOB_READ_WRITE_TOKEN environment variable and passed explicitly to
// list(). Vercel sets that variable when the German Blob store is connected
// to this project (Project > Storage > Connect). If the store was connected
// with a custom env-var prefix, set BLOB_READ_WRITE_TOKEN in
// Project > Settings > Environment Variables to that store's token.

import { list } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export default async function handler(request, response) {
  try {
    if (!BLOB_TOKEN) {
      // Surface which blob/token-ish vars *are* present so a misnamed
      // connection (e.g. GERMAN_BLOB_READ_WRITE_TOKEN) is easy to spot.
      const seen = Object.keys(process.env)
        .filter((k) => /BLOB|TOKEN/i.test(k))
        .sort();
      response.setHeader("Cache-Control", "no-store, max-age=0");
      response.status(500).json({
        error:
          "BLOB_READ_WRITE_TOKEN is not set. Connect the German Blob store to " +
          "this project (Project > Storage), or set BLOB_READ_WRITE_TOKEN in " +
          "Settings > Environment Variables, then redeploy.",
        tokenEnvVarsPresent: seen,
      });
      return;
    }

    const blobs = [];
    let cursor;

    // Page through the whole store (list() returns up to 1000 per call).
    do {
      const page = await list({ token: BLOB_TOKEN, cursor, limit: 1000 });
      blobs.push(...page.blobs);
      cursor = page.cursor;
    } while (cursor);

    const root = { name: "", path: "", folders: new Map(), files: [] };

    for (const blob of blobs) {
      // Skip "folder placeholder" keys that end in a slash.
      if (blob.pathname.endsWith("/")) continue;

      const parts = blob.pathname.split("/").filter(Boolean);
      const fileName = parts.pop();
      if (!fileName) continue;

      let node = root;
      let acc = "";
      for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part;
        if (!node.folders.has(part)) {
          node.folders.set(part, {
            name: part,
            path: acc,
            folders: new Map(),
            files: [],
          });
        }
        node = node.folders.get(part);
      }

      node.files.push({
        name: fileName,
        pathname: blob.pathname,
        url: blob.url,
        size: blob.size ?? null,
        uploadedAt: blob.uploadedAt ?? null,
      });
    }

    const byName = (a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      });

    const serialize = (node) => ({
      name: node.name,
      path: node.path,
      folders: [...node.folders.values()].sort(byName).map(serialize),
      files: node.files.sort(byName),
    });

    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.status(200).json({ tree: serialize(root), count: blobs.length });
  } catch (error) {
    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.status(500).json({
      error:
        error?.message ||
        "Could not list the German Blob store. Is it connected to this project?",
    });
  }
}
