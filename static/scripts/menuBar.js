//page name display
document.addEventListener('DOMContentLoaded', function() {
    window.updateSelectedItemName = function(itemName) {
        document.getElementById('selectedMenuItemName').textContent = itemName;
    };

    // slide-out menu
    document.getElementById("menuIcon").addEventListener("click", function() {
        var menu = document.getElementById("side-nav");
        if (menu.classList.contains("expanded")) {
            menu.classList.remove("expanded");
        } else {
            menu.classList.add("expanded");
        }
    });
});
