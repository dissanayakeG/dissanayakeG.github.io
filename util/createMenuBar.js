// Build navigation from the static article headings.
document.addEventListener("DOMContentLoaded", initialiseMenu);

function initialiseMenu() {
    createHomeButton();

    const nav = document.getElementById("nav-container");
    if (!nav) {
        return;
    }

    const links = Array.from(document.querySelectorAll("h1, h2"), (heading) => ({
        id: `#${heading.id}`,
        innerText: heading.innerText,
        tag: heading.tagName.toLowerCase(),
    }));

    nav.replaceChildren(createNavLinks(links));
}

function createNavLinks(links) {
    const navList = document.createElement("div");
    navList.id = "nav-list";
    navList.className = "nav-list";

    const navHeader = document.createElement("div");
    navHeader.className = "nav-header";
    navHeader.textContent = "Contents";
    navList.appendChild(navHeader);

    links.forEach((heading) => {
        const navItem = document.createElement("a");
        navItem.href = heading.id;
        navItem.textContent = heading.innerText;

        if (heading.tag === "h2") {
            navItem.classList.add("nav-item-h2");
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
    if (navList) {
        navList.classList.toggle("show-nav");
    }
}

// Hide nav if click is outside
document.addEventListener("click", function (event) {
    const navList = document.getElementById("nav-list");
    const menuIcon = document.getElementById("nav-icon");

    if (
        navList &&
        !navList.contains(event.target) &&
        !menuIcon.contains(event.target)
    ) {
        navList.classList.remove("show-nav");
    }
});

// Create home button
function createHomeButton() {
    if (document.querySelector(".home-link")) {
        return;
    }

    const homeLink = document.createElement("a");
    
    // Static Markdown builds provide this value for root and nested article pages.
    const configuredSiteRoot = document.body.dataset.siteRoot;
    const isInSubfolder = window.location.pathname.includes('/util/') || window.location.pathname.includes('/node_scripts/');
    const homeUrl = configuredSiteRoot
        ? `${configuredSiteRoot}index.html`
        : isInSubfolder
            ? '../index.html'
            : './index.html';
    
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
