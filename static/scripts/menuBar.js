document.addEventListener('DOMContentLoaded', function () {
    const pageTitles = {
        '/templates/index.html': 'Real-time',
        '/templates/fromCSV.html': 'CSV standard',
        '/templates/fromJSON.html': 'JSON standard',
        '/templates/test.html': 'Index for tests'
    };

    const pathname = window.location.pathname; // Get current pathname
    const title = pageTitles[pathname]; // Get title based on pathname

    if (title) {
        document.getElementById('selectedMenuItemName').textContent = title;
    } else {
        document.getElementById('selectedMenuItemName').textContent = 'Select page in menu';
    }

    const menu = document.getElementById('side-nav');
    document.getElementById('menuIcon').addEventListener("click", toggleSidebar);
    document.getElementById('backIcon').addEventListener("click", toggleSidebar);

    const sectionButtons = document.querySelectorAll('#left_setting .section-tabs button');
    sectionButtons.forEach(button => {
        button.addEventListener('click', function () {
            switchSection(button.getAttribute('data-section'));
        });
    });

    switchSection('menu');

    const legendToggle = document.getElementById('legend-toggle');
    legendToggle.addEventListener('click', toggleLegend);
});

function toggleSidebar() {
    const menu = document.getElementById('side-nav');
    if (menu.classList.contains("expanded")) {
        menu.classList.remove("expanded");
    } else {
        menu.classList.add("expanded");
    }
}

function toggleLegend() {
    const legend = document.getElementById('right_legend');
    if (legend.classList.contains("expanded")) {
        legend.classList.remove("expanded");
    } else {
        legend.classList.add("expanded");
    }
}

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
