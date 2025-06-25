const fs = require("fs");
const { marked } = require("marked");

// Read markdown file
const content = fs.readFileSync("input.md", "utf8");

// Convert to HTML
const converted = marked(content);

// Write to output file
fs.writeFileSync("output.html", converted);

//Add ids to h tags
let html = fs.readFileSync('output.html', 'utf8');

html = html.replace(
    /<h([1-6])>(.*?)<\/h\1>/g,
    (_, level, text) => {
        const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove punctuation
            .trim()
            .replace(/\s+/g, '-');
        return `<br><h${level} id="${id}">${text}</h${level}><br>`;
    }
);

fs.writeFileSync('output.html', html);