import { CONTENT_DIR_NAME, countFiles, getContentTree } from "@/lib/content";
import { ContentTree } from "@/components/ContentTree";

export default function HomePage() {
  const tree = getContentTree();
  const courseCount = tree.filter((node) => node.type === "folder").length;
  const fileCount = countFiles(tree);
  const isEmpty = tree.length === 0;

  return (
    <main className="page">
      <header className="hero">
        <div className="hero-inner">
          <h1>Course Hub</h1>
          <p>
            {isEmpty
              ? "Everything you add to the content folder will be indexed here automatically."
              : `${courseCount} ${courseCount === 1 ? "course" : "courses"} · ${fileCount} ${
                  fileCount === 1 ? "file" : "files"
                }. Tap a course to open it.`}
          </p>
          <div className="accent-rule" aria-hidden="true" />
        </div>
      </header>

      <section className="panel">
        <div className="panel-inner">
          {isEmpty ? (
            <div className="empty-state">
              <h2>No courses yet</h2>
              <p>
                Add folders and files under <code>public/{CONTENT_DIR_NAME}</code> in the
                repository, then push to GitHub. Vercel will rebuild and they&apos;ll show up
                here.
              </p>
            </div>
          ) : (
            <ContentTree nodes={tree} />
          )}
        </div>
      </section>

      <p className="footer-note">
        This page is generated from the <code>{CONTENT_DIR_NAME}</code> folder each time the
        site is built. Push changes to that folder on GitHub to update it.
      </p>
    </main>
  );
}
