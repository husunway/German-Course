import fs from "node:fs";
import path from "node:path";

// The folder shown on the homepage. It lives inside /public so every file
// inside it is automatically servable at its own URL. Rename it here if you
// ever rename the folder on disk.
export const CONTENT_DIR_NAME = "Content Folder";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const CONTENT_ROOT = path.join(PUBLIC_DIR, CONTENT_DIR_NAME);

export type FileNode = {
  type: "file";
  name: string;
  relativePath: string;
  ext: string;
  url: string;
};

export type FolderNode = {
  type: "folder";
  name: string;
  relativePath: string;
  children: ContentNode[];
};

export type ContentNode = FileNode | FolderNode;

function toUrl(relativePath: string): string {
  const segments = relativePath.split(path.sep).filter(Boolean);
  const encoded = [CONTENT_DIR_NAME, ...segments].map(encodeURIComponent).join("/");
  return `/${encoded}`;
}

function readDir(absDir: string, relDir: string): ContentNode[] {
  if (!fs.existsSync(absDir)) return [];

  const entries = fs.readdirSync(absDir, { withFileTypes: true });

  const nodes: ContentNode[] = entries
    // Skip dotfiles like .DS_Store / .gitkeep
    .filter((entry) => !entry.name.startsWith("."))
    .map((entry) => {
      const absPath = path.join(absDir, entry.name);
      const relPath = path.join(relDir, entry.name);

      if (entry.isDirectory()) {
        const folder: FolderNode = {
          type: "folder",
          name: entry.name,
          relativePath: relPath,
          children: readDir(absPath, relPath),
        };
        return folder;
      }

      const ext = path.extname(entry.name).replace(".", "").toLowerCase();
      const file: FileNode = {
        type: "file",
        name: entry.name,
        relativePath: relPath,
        ext,
        url: toUrl(relPath),
      };
      return file;
    });

  // Folders first, then files, both alphabetically (numeric-aware, so
  // "Week 2" sorts before "Week 10").
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
  });

  return nodes;
}

/** Reads the Content Folder and returns its direct children (not itself). */
export function getContentTree(): ContentNode[] {
  return readDir(CONTENT_ROOT, "");
}

/** Recursively counts every file under a set of nodes. */
export function countFiles(nodes: ContentNode[]): number {
  return nodes.reduce((total, node) => {
    if (node.type === "file") return total + 1;
    return total + countFiles(node.children);
  }, 0);
}
