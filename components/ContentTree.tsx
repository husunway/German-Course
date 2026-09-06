import { ContentNode, countFiles } from "@/lib/content";

function Caret() {
  return (
    <svg className="caret" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 0 L8 5 L2 10" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function FileRow({ node }: { node: Extract<ContentNode, { type: "file" }> }) {
  return (
    <a className="file" href={node.url} target="_blank" rel="noopener noreferrer">
      <span className="file-name">{node.name}</span>
      <span className="file-ext">{node.ext || "file"}</span>
    </a>
  );
}

function FolderRow({
  node,
  depth,
}: {
  node: Extract<ContentNode, { type: "folder" }>;
  depth: number;
}) {
  const fileCount = countFiles(node.children);
  return (
    <details className="folder" style={{ ["--depth" as string]: depth }}>
      <summary>
        <Caret />
        <span className="folder-name">{node.name}</span>
        <span className="item-count">
          {fileCount} {fileCount === 1 ? "file" : "files"}
        </span>
      </summary>
      <div className="folder-children">
        <ContentTree nodes={node.children} depth={depth + 1} />
      </div>
    </details>
  );
}

export function ContentTree({
  nodes,
  depth = 0,
}: {
  nodes: ContentNode[];
  depth?: number;
}) {
  if (nodes.length === 0) {
    return depth === 0 ? null : <p className="empty-folder">Nothing in here yet.</p>;
  }

  return (
    <ul className={`tree depth-${Math.min(depth, 3)}`}>
      {nodes.map((node) => (
        <li key={node.relativePath || node.name}>
          {node.type === "folder" ? (
            <FolderRow node={node} depth={depth} />
          ) : (
            <FileRow node={node} />
          )}
        </li>
      ))}
    </ul>
  );
}
