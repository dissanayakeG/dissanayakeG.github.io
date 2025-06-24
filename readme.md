# how to prepare a `.md` file as a html

# step 1

copy and paste `structure.html`
rename the new file as you wanted

remove this style

```css
h1 {
	height: 200px;
	width: 600px;
	border: 1px solid blue;
}
```

if your markdown has a code blocks, add necessary script tags from `Prism.js`

# step 2

open the conversion needed `.md` file in vscode
use search and replace with regex on mode

```sh
^### (.*)	<h3>$1</h3>
^## (.*)	<h2>$1</h2>
^# (.*)	    <h1>$1</h1>
```

or you can create a simple node script

```javascript
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
```

# step 3

add ids for all the `h1/h2/h3...` tags that need to be appeared in the menu bar.
and edit the `structure.html` file's `getAllH1Tags` function accordingly

# step 4

replace code blocks with
<pre><code class="language-bash">
and
</code></pre>

change `language-bash` accordingly

# step 5

copy these into newly created html file's `<section class="content">` section
save the file

Done!