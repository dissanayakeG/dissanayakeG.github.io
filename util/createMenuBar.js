//create Nav
let links = [];
document.addEventListener("DOMContentLoaded", getAllHTags);
function getAllHTags() {
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

    //create a link for home
    const homeLink = document.createElement("a");
    // Use relative path to support both local file system and hosted environments
    const pathDepth = window.location.pathname.split('/').filter(p => p).length;
    const isInSubfolder = window.location.pathname.includes('/util/') || window.location.pathname.includes('/node_scripts/');
    const homeUrl = isInSubfolder ? '../index.html' : './index.html';
    homeLink.href = homeUrl;
    homeLink.textContent = "Home";
    navList.appendChild(homeLink);


    links.forEach((h1, index) => {
        let navItem = document.createElement("a");
        navItem.href = h1.id;
        navItem.innerHTML = h1.innerText;
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