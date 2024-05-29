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

    const menu = document.getElementById('side-nav');
    document.getElementById('menuIcon').addEventListener("click", toggle_sidebar);

    function toggle_sidebar() {
        if (menu.classList.contains("expanded")) {
            menu.classList.remove("expanded");
        } else {
            menu.classList.add("expanded");
        }
    }

    // Set initial state
    switchSection('menu');
});

// Move switchSection function to global scope
function switchSection(section) {
    const sections = document.querySelectorAll("#left_setting .section");
    const buttons = document.querySelectorAll("#left_setting .section-tabs button");

    sections.forEach(function (sec) {
        sec.style.display = 'none';
        sec.classList.remove('active');
    });

    buttons.forEach(function (btn) {
        btn.classList.remove('active');
    });

    const targetSection = document.getElementById(section + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
    }

    const activeButton = document.querySelector('#left_setting .section-tabs button[data-section="' + section + '"]');
    if (activeButton) {
        activeButton.classList.add('active');
    }
}
