# how to prepare a `.md` file as a html

# step 1

copy and paste `_structure.html`
rename the new file as you wanted
remove this style from newly created html file

```css
<style>
	h1 {
		height: 200px;
		width: 600px;
		border: 1px solid blue;
	}
</style>
```

if your markdown has a code blocks, add necessary script tags from `Prism.js`

# step 2

cd into node_scripts
copy paste the markdown file into this folder
edit and replace the input file name of `convertMdToHtml.js` from your md file's name

run

```sh
cp /path /path
cd node_scripts
node convertMdToHtml.js
```

this will create a html from the input markdown file and add ids for each h tag

# step 3

copy these into newly created html file's `<section class="content">` section
save the file

Done!
