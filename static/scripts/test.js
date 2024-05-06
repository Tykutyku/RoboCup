const FIELD_WIDTH_METERS = 22; // width of the real field in meters (now using 'Y' dimension)
const FIELD_HEIGHT_METERS = 14;
const CANVAS_HEIGHT = 1400;
const CANVAS_WIDTH = 2200;

// const loadButton = document.getElementById('loadButton');
let robotSelector;
let positionCanvas;
let fieldCanvas;
let positionLogs;


let robotPositions = [];
let scaleX, scaleY, originX, originY;

// loadButton.addEventListener('click', function () {
//     const robotId = robotSelector.value;
//     if (robotId) { // Check if a robot is selected
//         fetchRobotPositions(robotId);
//         // updateField();
//     }
// });
document.addEventListener('DOMContentLoaded', function () {
    robotSelector = document.getElementById('robotSelector');
    positionCanvas = document.getElementById('positionCanvas');
    fieldCanvas = document.getElementById('fieldCanvas');
    positionLogs = document.getElementsByClassName('scrollable-logs')[0];
    robotSelector.onchange = () => { robotSelector_Change(); }
    
    
    drawField();
    let ctx = positionCanvas.getContext("2d");
    ctx.translate(fieldCanvas.width / 2, fieldCanvas.height / 2);
});

async function fetchRobotPositions(robotId) {
    try {
        const response = await fetch(`/robot_positions?robot_id=${robotId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        robotPositions = await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
    }
}
function drawField() {
    fieldCanvas.width = CANVAS_WIDTH;
    fieldCanvas.height = CANVAS_HEIGHT;
    positionCanvas.width = CANVAS_WIDTH;
    positionCanvas.height = CANVAS_HEIGHT;
    let ctx = fieldCanvas.getContext("2d");
    ctx.translate(fieldCanvas.width / 2, fieldCanvas.height / 2);
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.arc(0, 0, 20, 0, 2 * Math.PI);
    // ctx.fill();
    ctx.stroke();
}

function robotSelector_Change() {
    fetchRobotPositions(robotSelector.value);
    let ctx = positionCanvas.getContext("2d");
    ctx.clearRect(-positionCanvas.width / 2, -positionCanvas.height /2, positionCanvas.width, positionCanvas.height);
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    let counter = 0;
    for (item of robotPositions) {
        ctx.moveTo(item.y * 100, item.x * 100);
        ctx.arc(item.y * 100, item.x * 100, 2, 0, 2 * Math.PI);
        counter++;
    }
    ctx.stroke();
    console.log("done, added " + counter +" dots");
}
/*
window.addEventListener('resize', () => {
    updateScale();
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

function logPosition(realX, realY, screenX, screenY) {
    if (positionLogs) {
        const log = document.createElement('li');
        log.textContent = `Real position: ${realX.toFixed(2)}, ${realY.toFixed(2)} -> After calculation: ${screenX.toFixed(2)}, ${screenY.toFixed(2)}`;
        positionLogs.appendChild(log);
    } else {
        console.error('positionLogs element not found');
    }
}

function updateRobotPositions(positions) {
    const positionsDiv = document.getElementById('robotPositions');
    positionsDiv.innerHTML = ''; // Clear existing positions

    positions.forEach(pos => {
        const screenPos = convertCoordinates(pos.x, pos.y);
        // Now passing both original and calculated positions to logPosition
        logPosition(pos.x, pos.y, screenPos.x, screenPos.y);
        
        // Create and append the robot marker to the field
        const robotDiv = document.createElement('div');
        robotDiv.classList.add('robot-marker');
        robotDiv.style.left = `${screenPos.x}px`;
        robotDiv.style.top = `${screenPos.y}px`;
        positionsDiv.appendChild(robotDiv);
    });
}
*/
