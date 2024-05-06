document.addEventListener('DOMContentLoaded', function() {
    const dataSelector = document.getElementById('dataSelector');
    const robotPositionsGroup = document.getElementById('robotPositions');

    function loadRobotPositions() {
        const dataType = dataSelector.value;
        if (!dataType) {
            alert('Please select a data type before loading positions.');
            return;
        }
        console.log(`Fetching positions for type: ${dataType}`);
        fetchPositionsByType(dataType);
    }

    function fetchPositionsByType(dataType) {
        fetch(`/robot_positions_csv?type=${dataType}`)
            .then(response => response.json())
            .then(data => {
                console.log('Data from server:', data);
                updatePositions(data);
            })
            .catch(error => console.error('Fetch error:', error));
    }
    

    document.getElementById('loadPositionsButton').addEventListener('click', loadRobotPositions);

    function transformCoordinates(robotX, robotY) {
        var scale = 10;  
        
        var offsetX = (230 / 2)-5; // excluding margin
        var offsetY = (150 / 2)-5; // excluding margin
    
        var svgX = (robotX * scale) + offsetX; 
        var svgY = (robotY * scale) + offsetY; 
    
        return { x: svgX, y: svgY };
    }
    

    function updatePositions(data) {
        console.log('UpdatePositions called with data:', data);
        const svgContainer = document.getElementById('robotPositions');
        svgContainer.innerHTML = ''; // Clear previous positions
        
        if (data.self) {
            // Process 'self' data and create blue circles
            Object.keys(data.self).forEach(robotId => {
                data.self[robotId].forEach(pos => {
                    const {x, y} = transformCoordinates(pos.x, pos.y);
                    createAndAppendCircle(svgContainer, x, y, "blue");
                });
            });
        }
    
        if (data.decawave) {
            // Process 'decawave' data and create black circles
            Object.keys(data.decawave).forEach(robotId => {
                data.decawave[robotId].forEach(pos => {
                    // Change the property names to match the expected parameters
                    const transformedCoordinates = transformCoordinates(pos.dx, pos.dy);
                    createAndAppendCircle(svgContainer, transformedCoordinates.x, transformedCoordinates.y, "black");
                });
            });
        }        
    }        

function createAndAppendCircle(container, x, y, color) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 1);
    circle.setAttribute("fill", color);
    container.appendChild(circle);
}    
});
ChatGPT