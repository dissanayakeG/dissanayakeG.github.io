const fs = require("fs");
const content = fs.readFileSync("input.md", "utf8");
const converted = content.replace(
    /^(\#{1,6})\s+(.*)$/gm,
    (_, hashes, title) => {
        const level = hashes.length;
        return `<h${level}>${title}</h${level}>`;
    }
);
fs.writeFileSync("output.html", converted);