const fieldWidthMeters = 22; // width of the real field in meters (now using 'Y' dimension)
const fieldHeightMeters = 14; 
const loadButton = document.getElementById('loadButton');
const robotSelector = document.getElementById('robotSelector');
let scaleX, scaleY, originX, originY;

window.addEventListener('load', () => {
    updateScale();
    // Optionally, call updateRobotPositions if you need to reposition markers on load
});
window.addEventListener('resize', () => {
    updateScale();
    // Optionally, call updateRobotPositions if you need to reposition markers on resize
});

function updateScale() {
    const fieldContainer = document.querySelector('.field-container');

    // Calculate the visible part of the field container that maintains the aspect ratio
    const visibleWidth = fieldContainer.clientWidth; // Full width is visible
    // Height is based on width and the aspect ratio of the field (14/22)
    const visibleHeight = visibleWidth * (fieldHeightMeters / fieldWidthMeters);

    // Calculate scale based on the visible dimensions
    scaleX = visibleWidth / fieldWidthMeters;
    scaleY = visibleHeight / fieldHeightMeters;

    // Calculate the origin with respect to the container
    originX = fieldContainer.offsetLeft + (visibleWidth / 2);
    // The header's height is subtracted from the offsetTop to get the correct Y position
    originY = fieldContainer.offsetTop + (visibleHeight / 2) - parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
    const headerHeight = document.querySelector('header').offsetHeight;
    originY = fieldContainer.offsetTop + (visibleHeight / 2) - headerHeight;
}

function convertCoordinates(realX, realY) {
    let screenX = originX + (realY * scaleY); // 'Y' now represents width
    let screenY = originY - (realX * scaleX); // 'X' now represents height, Y-axis is inverted
    return { x: screenX, y: screenY };
}

loadButton.addEventListener('click', function () {
    const robotId = robotSelector.value;
    if (robotId) { // Check if a robot is selected
        fetchRobotPositions(robotId);
    }
});

async function fetchRobotPositions(robotId) {
    try {
        const response = await fetch(`/robot_positions?robot_id=${robotId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const positions = await response.json();
        updateRobotPositions(positions);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

function updateRobotPositions(positions) {
    updateScale(); 
    const positionsDiv = document.getElementById('robotPositions');
    positionsDiv.innerHTML = ''; // Clear existing positions

    positions.forEach(pos => {
        const screenPos = convertCoordinates(pos.x, pos.y);
        const robotDiv = document.createElement('div');
        robotDiv.classList.add('robot-marker');
        robotDiv.style.left = `${screenPos.x}px`;
        robotDiv.style.top = `${screenPos.y}px`;
        positionsDiv.appendChild(robotDiv);
    });
}