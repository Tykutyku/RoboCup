// robotPositioning.js
function updateScale() {
    const fieldContainer = document.getElementById('fieldContainer');
    const fieldImage = document.getElementById('field');
    const positionsDiv = document.getElementById('robotPositions');

    // Update scaleX and scaleY to match the size of the fieldContainer if needed
    scaleX = fieldContainer.clientWidth / FIELD_WIDTH_METERS;
    scaleY = fieldContainer.clientHeight / FIELD_HEIGHT_METERS;
    
    const rect = fieldContainer.getBoundingClientRect();
    originX = rect.left + window.scrollX;
    originY = rect.bottom + window.scrollY;
    
    console.log('ScaleX:', scaleX, 'ScaleY:', scaleY);
    console.log('Origin X:', originX, 'Origin Y:', originY);
}

function placeBlueDotAtBottomLeft() {
    updateScale();
    const positionsDiv = document.getElementById('robotPositions');

    const bottomLeftPos = { x: originX, y: originY };
    
    const blueDot = document.createElement('div');
    blueDot.classList.add('robot-marker');
    blueDot.style.left = `${bottomLeftPos.x}px`;
    // Here we use `window.innerHeight` to calculate the y position from the bottom
    blueDot.style.top = `${bottomLeftPos.y - window.innerHeight}px`;
    positionsDiv.appendChild(blueDot);

    console.log('Blue Dot Position:', bottomLeftPos);
}

document.addEventListener('DOMContentLoaded', () => {
    placeBlueDotAtBottomLeft();
});
