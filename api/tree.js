// Serverless function: list everything in the "German" Vercel Blob store and
// return it as a nested folder/file tree.
//
// Blob keys are flat strings; a key like "Grammar/Week 1/dative.html" is
// treated as the file "dative.html" inside folder "Grammar" > "Week 1".
//
// The function reads BLOB_READ_WRITE_TOKEN from the environment. Vercel
// injects it automatically once a Blob store is connected to the project
// (Project > Storage). Nothing else to configure.

import { list } from "@vercel/blob";

export default async function handler(request, response) {
  try {
    const blobs = [];
    let cursor;

    // Page through the whole store (list() returns up to 1000 per call).
    do {
      const page = await list({ cursor, limit: 1000 });
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
    response.status(500).json({
      error:
        error?.message ||
        "Could not list the German Blob store. Is it connected to this project?",
    });
  }
}
