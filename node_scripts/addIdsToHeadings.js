const fs = require('fs');

let html = fs.readFileSync('input.html', 'utf8');

html = html.replace(
    /<h([1-6]) id="">(.*?)<\/h\1>/g,
    (_, level, text) => {
        const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove punctuation
            .trim()
            .replace(/\s+/g, '-');
        return `<h${level} id="${id}">${text}</h${level}>`;
    }
);

fs.writeFileSync('output.html', html);
