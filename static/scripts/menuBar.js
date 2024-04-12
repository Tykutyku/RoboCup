let menu;
//page name display
document.addEventListener('DOMContentLoaded', function () {
    window.updateSelectedItemName = function (itemName) {
        document.getElementById('selectedMenuItemName').textContent = itemName;
        toggle_sidebar
    };
    menu = document.getElementById("side-nav");

    // slide-out menu
    document.getElementById("menuIcon").addEventListener("click", toggle_sidebar);
});
function toggle_sidebar() {
    if (menu.classList.contains("expanded")) {
        menu.classList.remove("expanded");
    } else {
        menu.classList.add("expanded");
    }
}