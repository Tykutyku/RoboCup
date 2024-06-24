const fieldWidthMeters = 22; // width of the real field in meters
const fieldHeightMeters = 14; 

let scaleX, scaleY, originX, originY;

// UpdateScale when the window is fully loaded or when is resized
document.addEventListener('DOMContentLoaded', () => {
    updateScale();
    fetchRobotPositions();
});

// Function to convert real coordinates to screen coordinates
function convertCoordinates(realX, realY) {
    // Convert meters to pixels and adjust for the web coordinate system
    let screenX = originX + (realX * scaleX);
    let screenY = originY - (realY * scaleY); // Subtract because web y-coordinates go down, not up

    return { x: screenX, y: screenY };
}

async function fetchRobotPositions() {
    const response = await fetch('/robot_positions');
    const positions = await response.json();
    updateRobotPositions(positions);
}

function updateRobotPositions(positions) {
    const fieldImage = document.getElementById('field');
    
    // Coordinates of the field center
    originX = 960;
    originY = 541;

    //Calculate dimensions of field at image 
    const pitchWidthPixels = (originX - 84) * 2; // From the center to the left corner, times two for full width
    const pitchHeightPixels = (originY - 1037) * 2; // From the center to the bottom corner, times two for full height
    
    //Calculate scale
    scaleX = fieldImage.clientWidth / fieldWidthMeters;
    scaleY = fieldImage.clientHeight / fieldHeightMeters;


    const positionsDiv = document.getElementById('robotPositions');
    positionsDiv.innerHTML = ''; // Clear existing positions

    positions.forEach(pos => {
        // Convert real-world meters to screen pixels
        const screenPos = convertCoordinates(pos.x, pos.y);

        const robotDiv = document.createElement('div');
        robotDiv.classList.add('robot-marker');
        robotDiv.style.left = `${screenPos.x}px`;
        robotDiv.style.top = `${screenPos.y}px`;
        positionsDiv.appendChild(robotDiv);
    });
}

document.addEventListener('DOMContentLoaded', fetchRobotPositions);
