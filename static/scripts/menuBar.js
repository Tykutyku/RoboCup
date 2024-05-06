document.addEventListener('DOMContentLoaded', function () {
    const pageTitles = {
        '/templates/realTime.html': 'Real-time',
        '/templates/fromCSV.html': 'CSV standard',
        '/templates/fromJSON.html': 'JSON standard',
        '/templates/index.html': 'Index for tests'
    };

    const pathname = window.location.pathname; // Get current pathname
    const title = pageTitles[pathname]; // Get title based on pathname

    if (title) {
        document.getElementById('selectedMenuItemName').textContent = title;
    } else {
        document.getElementById('selectedMenuItemName').textContent = 'Select page in menu';
    }

    menu = document.getElementById("side-nav");
    document.getElementById("menuIcon").addEventListener("click", toggle_sidebar);
    //toggle_sidebar(); // Ensure this is defined or handled appropriately

    // You might still want to keep switchSection here if it's used for other purposes
    switchSection('menu');
});

function toggle_sidebar() {
    if (menu.classList.contains("expanded")) {
        menu.classList.remove("expanded");
    } else {
        menu.classList.add("expanded");
    }
}

// tabs
function switchSection(section) {
    var sections = document.querySelectorAll('#left_setting .section');
    var buttons = document.querySelectorAll('#left_setting .section-tabs button');

    sections.forEach(function(sec) {
        sec.style.display = 'none'; 
        sec.classList.remove('active'); 
    });

    buttons.forEach(function(btn) {
        btn.classList.remove('active'); 
    });

    document.getElementById(section + '-section').style.display = 'block';
    document.getElementById(section + '-section').classList.add('active'); 
    document.querySelector('#left_setting .section-tabs button[data-section="' + section + '"]').classList.add('active');
}
