# Publish Markdown articles

Articles are built into static HTML from Markdown files stored in this repository.
Visitors receive ordinary HTML, so articles work on GitHub Pages and when opened
directly from your computer.

Keep article sources in the root `mds/` folder. The source file path determines
the generated HTML path.

## Create an article

1. Add the source file under `mds/`, for example `mds/article1.md`.
2. Build every article from the repository root:

   ```sh
   npm --prefix node_scripts run build:articles
   ```

   The Markdown path determines the generated URL. For example,
   `mds/article1.md` becomes `article1.html`, while
   `mds/backend/article1.md` becomes `backend/article1.html`.

   Files named `README.md` inside `mds/` are ignored by the build, so reserve
   other filenames for published articles.
3. Optionally add an `article1.html` link to `index.html`.
4. Commit the Markdown file and its generated HTML file together.

The first Markdown `# heading` becomes the browser-page title. The contents menu is
built from its level-one and level-two headings. Fenced code blocks are highlighted
by Prism; its autoloader supports the language named after the opening backticks,
such as ```` ```javascript ```` or ```` ```dart ````.

## Lists and intentional line breaks

The build preserves Markdown structure; use Markdown list markers when you want
visible bullets. Indent a nested bullet by two spaces:

```md
- Main point
  - Nested point
```

A normal single line break remains part of the same paragraph. To force a visible
line break, end the preceding line with two spaces or use a separate paragraph.

## Markdown links and images

Relative paths in Markdown are resolved from the Markdown file's own folder. For
example, a link to `images/example.png` inside `mds/article1.md` points to
`mds/images/example.png`.

## Local preview

After running the build, open `index.html` directly by double-clicking it and use
its links as you do today. The pages are static, so they do not need a local web
server. Re-run the build whenever you change a Markdown source file.

## First-time setup

If dependencies are not installed yet, run `npm --prefix node_scripts ci` once.
