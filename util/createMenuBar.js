//create Nav
let links = [];
document.addEventListener("DOMContentLoaded", getAllHTags);
function getAllHTags() {
    const h1Elements = document.querySelectorAll("h1");
    const h2Elements = document.querySelectorAll("h2");
    const h1Array = Array.from(h1Elements);
    const h2Array = Array.from(h2Elements);
    let headings = [...h1Array, ...h2Array];
    headings.forEach((h1, index) => {
        links.push({ id: "#" + h1.id, innerText: h1.innerText });
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
    const homeUrl = window.location.protocol+"//"+window.location.host
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