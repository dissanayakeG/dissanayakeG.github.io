const fs = require("fs/promises");
const path = require("path");
const { marked } = require("marked");

const scriptsDirectory = __dirname;
const siteDirectory = path.resolve(scriptsDirectory, "..");
const markdownDirectory = path.join(siteDirectory, "mds");
const templatePath = path.join(siteDirectory, "_structure.html");
const reservedOutputPaths = new Set(["_structure.html", "index.html"]);

async function main() {
	const markdownSources = await findMarkdownSources(markdownDirectory);

	if (markdownSources.length === 0) {
		console.log("No article Markdown files were found in mds/.");
		return;
	}

	const template = await fs.readFile(templatePath, "utf8");
	for (const markdownPath of markdownSources) {
		await buildArticle(markdownPath, template);
	}

	console.log(`Built ${markdownSources.length} article${markdownSources.length === 1 ? "" : "s"}.`);
}

async function findMarkdownSources(directory) {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	entries.sort((left, right) => left.name.localeCompare(right.name));
	const sources = [];

	for (const entry of entries) {
		if (entry.isDirectory()) {
			if (!entry.name.startsWith(".")) {
				sources.push(...(await findMarkdownSources(path.join(directory, entry.name))));
			}
			continue;
		}

		if (
			!entry.isFile() ||
			entry.name.startsWith(".") ||
			!entry.name.endsWith(".md") ||
			entry.name.toLowerCase() === "readme.md"
		) {
			continue;
		}

		sources.push(path.join(directory, entry.name));
	}

	return sources;
}


async function buildArticle(markdownPath, template) {
	const outputPath = outputPathFor(markdownPath);
	if (reservedOutputPaths.has(relativePath(outputPath))) {
		throw new Error(`${relativePath(markdownPath)} would overwrite a reserved site file.`);
	}

	const markdown = await fs.readFile(markdownPath, "utf8");
	const { html: articleHtml, title } = renderMarkdown(markdown, markdownPath, outputPath);
	const staticPage = setPageTitle(
		replaceArticleContent(prepareTemplate(template, outputPath), articleHtml),
		title,
	);

	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, staticPage);
	console.log(`  ${relativePath(outputPath)} ← ${relativePath(markdownPath)}`);
}

function outputPathFor(markdownPath) {
	const sourceRelativePath = path.relative(markdownDirectory, markdownPath);
	const outputRelativePath = sourceRelativePath.replace(/\.md$/i, ".html");
	const outputPath = path.resolve(siteDirectory, outputRelativePath);

	if (!isInsideDirectory(outputPath, siteDirectory)) {
		throw new Error(`${relativePath(markdownPath)} has an invalid output path.`);
	}

	return outputPath;
}

function prepareTemplate(template, outputPath) {
	const relativeToSiteRoot = path
		.relative(path.dirname(outputPath), siteDirectory)
		.split(path.sep)
		.join("/");
	const siteRoot = relativeToSiteRoot ? `${relativeToSiteRoot}/` : "./";
	return template.replaceAll("{{SITE_ROOT}}", siteRoot);
}

function renderMarkdown(markdown, markdownPath, pagePath) {
	let title = "Markdown article";
	const usedIds = new Set();
	const renderer = new marked.Renderer();

	renderer.heading = function heading({ tokens, depth }) {
		const content = this.parser.parseInline(tokens);
		const text = plainText(this.parser.parseInline(tokens, this.parser.textRenderer));
		const id = uniqueSlug(text, usedIds);

		if (depth === 1 && title === "Markdown article") {
			title = text;
		}

		// Match the spacing produced by the previous Markdown conversion workflow.
		return `<br><h${depth} id="${escapeHtml(id)}">${content}</h${depth}><br>\n`;
	};

	renderer.link = function link({ href, title: linkTitle, tokens }) {
		const content = this.parser.parseInline(tokens);
		const resolvedUrl = resolveMarkdownUrl(href, markdownPath, pagePath);

		if (resolvedUrl === null) {
			return content;
		}

		const titleAttribute = linkTitle ? ` title="${escapeHtml(linkTitle)}"` : "";
		return `<a href="${escapeHtml(resolvedUrl)}"${titleAttribute}>${content}</a>`;
	};

	renderer.image = function image({ href, title: imageTitle, text, tokens }) {
		const alt = plainText(
			tokens ? this.parser.parseInline(tokens, this.parser.textRenderer) : text,
		);
		const resolvedUrl = resolveMarkdownUrl(href, markdownPath, pagePath);

		if (resolvedUrl === null) {
			return escapeHtml(alt);
		}

		const titleAttribute = imageTitle ? ` title="${escapeHtml(imageTitle)}"` : "";
		return `<img src="${escapeHtml(resolvedUrl)}" alt="${escapeHtml(alt)}"${titleAttribute}>`;
	};

	return {
		html: marked.parse(markdown, { gfm: true, renderer }),
		title,
	};
}

function uniqueSlug(text, usedIds) {
	const base =
		text
			.toLowerCase()
			.trim()
			.replace(/[^\p{L}\p{N}\s-]/gu, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-") || "section";

	let id = base;
	let number = 2;
	while (usedIds.has(id)) {
		id = `${base}-${number}`;
		number += 1;
	}

	usedIds.add(id);
	return id;
}

function plainText(value) {
	return String(value).replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, code) => {
		const normalizedCode = code.toLowerCase();
		if (normalizedCode === "amp") return "&";
		if (normalizedCode === "lt") return "<";
		if (normalizedCode === "gt") return ">";
		if (normalizedCode === "quot") return '"';
		if (normalizedCode === "apos") return "'";

		const number = normalizedCode.startsWith("#x")
			? Number.parseInt(normalizedCode.slice(2), 16)
			: Number.parseInt(normalizedCode.slice(1), 10);
		return Number.isNaN(number) || number < 0 || number > 0x10ffff
			? entity
			: String.fromCodePoint(number);
	});
}

function resolveMarkdownUrl(url, markdownPath, pagePath) {
	if (!url || url.startsWith("#") || url.startsWith("/") || url.startsWith("//")) {
		return url;
	}

	if (/^\s*(?:javascript|vbscript|data):/i.test(url)) {
		return null;
	}

	if (/^[a-z][a-z\d+.-]*:/i.test(url)) {
		return url;
	}

	const [, pathname, suffix = ""] = url.match(/^([^?#]*)([?#][\s\S]*)?$/) || [];
	if (!pathname) {
		return url;
	}

	const targetPath = path.resolve(path.dirname(markdownPath), pathname);
	let relativeUrl = path.relative(path.dirname(pagePath), targetPath).split(path.sep).join("/");
	if (!relativeUrl.startsWith(".")) {
		relativeUrl = `./${relativeUrl}`;
	}

	return `${relativeUrl}${suffix}`;
}

function replaceArticleContent(template, articleHtml) {
	const startMarker = "<!-- MARKDOWN_CONTENT_START -->";
	const endMarker = "<!-- MARKDOWN_CONTENT_END -->";
	const startIndex = template.indexOf(startMarker);
	const endIndex = template.indexOf(endMarker);

	if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
		throw new Error("_structure.html must contain valid Markdown content markers.");
	}

	const content = `\n${articleHtml.trim()}\n`;
	return `${template.slice(0, startIndex + startMarker.length)}${content}${template.slice(endIndex)}`;
}

function setPageTitle(page, title) {
	const cleanTitle = title.replace(/\s*[-–—]+\s*$/, "").trim() || "Markdown article";
	const titleTag = `<title>${escapeHtml(cleanTitle)}</title>`;
	if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(page)) {
		return page.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, titleTag);
	}

	return page.replace(/<head\b[^>]*>/i, (head) => `${head}\n\t\t${titleTag}`);
}

function isInsideDirectory(targetPath, directory) {
	const relative = path.relative(directory, targetPath);
	return relative && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

function relativePath(filePath) {
	return path.relative(siteDirectory, filePath).split(path.sep).join("/");
}

function escapeHtml(value) {
	return String(value).replace(/[&<>"']/g, (character) => {
		return {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;",
		}[character];
	});
}

main().catch((error) => {
	console.error(`Build failed: ${error.message}`);
	process.exitCode = 1;
});
