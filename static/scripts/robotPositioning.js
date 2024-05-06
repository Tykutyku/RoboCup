document.addEventListener('DOMContentLoaded', function() {
    const robotSelector = document.getElementById('robotSelector');
    const robotPositionsGroup = document.getElementById('robotPositions'); // Define this outside the functions for easy access
    
        // Function to fetch and load robot positions
    function loadRobotPositions() {
            const selectedRobotId = robotSelector.value;
            if (!selectedRobotId) {
                alert('Please select a robot before loading positions.');
                return;
            }
            fetchRobotPositions(selectedRobotId);
        }
    
        // Event listener for "Load Positions" button click
        document.getElementById('loadPositionsButton').addEventListener('click', loadRobotPositions);


    function testCenter() {
        const svgContainer = document.getElementById('robotPositions');
        svgContainer.innerHTML = '';
    
        const center = transformCoordinates(0, 0);
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", center.x);
        circle.setAttribute("cy", center.y);
        circle.setAttribute("r", 1); // Size of the marker
        circle.setAttribute("fill", "blue"); // Color of the center marker
        svgContainer.appendChild(circle);
    }
     

    async function fetchRobotPositions(robotId) {
        try {
            const response = await fetch(`/robot_positions?robot_id=${robotId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            updateRobotPositions(data);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

    function transformCoordinates(robotX, robotY) {
        var scale = 10;  
        
        var offsetX = (230 / 2)-5; // excluding margin
        var offsetY = (150 / 2)-5; // excluding margin
    
        var svgX = (robotY * scale) + offsetX; 
        var svgY = (robotX * -scale) + offsetY; 
    
        return { x: svgX, y: svgY };
    }

    testCenter();

    function updateRobotPositions(positions) {
        console.log('UpdatePositions called with data:', positions);
        const svgContainer = document.getElementById('robotPositions');
        svgContainer.innerHTML = '';
    
        // Add new positions
        positions.forEach(pos => {
            const {x, y} = transformCoordinates(pos.x, pos.y);
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", x);
            circle.setAttribute("cy", y);
            circle.setAttribute("r", 1); 
            circle.setAttribute("fill", "red"); 
            svgContainer.appendChild(circle);
        });
    }
    
        function updateRobotSelector(robots) {
            robotSelector.innerHTML = '<option value="" hidden>Select a Robot</option>';
            robots.forEach(robotId => {
                const option = document.createElement('option');
                option.value = robotId;
                option.textContent = `Robot ${robotId}`;
                robotSelector.appendChild(option);
            });
        }

    function uploadComplete(data) {
        alert(data.message);
        // Fetch the latest robot IDs from the server or extract them from the response
        fetch('/all_robots') // Endpoint to fetch all robot IDs
            .then(response => response.json())
            .then(data => updateRobotSelector(data.robots))
            .catch(error => console.error('Error fetching robot IDs:', error));
    }

    window.uploadComplete = uploadComplete; 
    loadRobotPositions();
});

