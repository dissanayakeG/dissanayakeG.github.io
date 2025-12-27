//create Nav
let links = [];
document.addEventListener("DOMContentLoaded", getAllHTags);
function getAllHTags() {
    // Create home button
    createHomeButton();

    // Query all h1, h2, h3 elements together to preserve document order
    const headings = document.querySelectorAll("h1, h2");
    headings.forEach((heading) => {
        links.push({ 
            id: "#" + heading.id, 
            innerText: heading.innerText,
            tag: heading.tagName.toLowerCase()
        });
    });
    let wrapperDiv = createNavLinks(links);
    let nav = document.getElementById("nav-container");
    nav.appendChild(wrapperDiv);
}
function createNavLinks(links) {
    let navList = document.createElement("div");
    navList.id = "nav-list";
    navList.className = "nav-list";

    // Add a header to the nav menu
    const navHeader = document.createElement("div");
    navHeader.className = "nav-header";
    navHeader.textContent = "Contents";
    navList.appendChild(navHeader);

    links.forEach((heading, index) => {
        let navItem = document.createElement("a");
        navItem.href = heading.id;
        navItem.innerHTML = heading.innerText;
        // Add indentation class for h2 elements
        if (heading.tag === 'h2') {
            navItem.classList.add('nav-item-h2');
        }
        navList.appendChild(navItem);
    });
    return navList;
}

//Toggle Nav
document
    .getElementById("nav-icon")
    .addEventListener("click", displayNav);

function displayNav(event) {
    event.stopPropagation();
    const navList = document.getElementById("nav-list");
    navList.classList.toggle("show-nav");
}

// Hide nav if click is outside
document.addEventListener("click", function (event) {
    const navList = document.getElementById("nav-list");
    const menuIcon = document.getElementById("nav-icon");

    if (
        !navList.contains(event.target) &&
        !menuIcon.contains(event.target)
    ) {
        navList.classList.remove("show-nav");
    }
});

// Create home button
function createHomeButton() {
    const homeLink = document.createElement("a");
    
    // Use relative path to support both local file system and hosted environments
    const isInSubfolder = window.location.pathname.includes('/util/') || window.location.pathname.includes('/node_scripts/');
    const homeUrl = isInSubfolder ? '../index.html' : './index.html';
    
    homeLink.href = homeUrl;
    homeLink.className = "home-link";
    homeLink.title = "Back to Home";
    
    // Create SVG icon
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z");
    svg.appendChild(path);
    
    homeLink.appendChild(svg);
    homeLink.appendChild(document.createTextNode("Home"));
    
    document.body.insertBefore(homeLink, document.body.firstChild);
}