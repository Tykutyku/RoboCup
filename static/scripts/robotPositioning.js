document.addEventListener('DOMContentLoaded', function() {
    const robotSelector = document.getElementById('robotSelector');
    const positionSelector = document.getElementById('positionSelector');
    const canvasBoth = document.getElementById('posDeltaChart');
    const canvasSelf = document.getElementById('selfPosDeltaChart');
    const canvasTarget = document.getElementById('targetPosDeltaChart'); 

    // Pagination settings
    let currentPage = 0;
    const pageSize = 20;

    // Load robot positions based on selected robot and position type
    function loadRobotPositions() {
        const selectedRobotId = robotSelector.value;
        const selectedPositionType = positionSelector.value;
        showCorrectCanvas(selectedPositionType);
        fetchRobotPositions(selectedRobotId, selectedPositionType, currentPage * pageSize, pageSize);
    }

    // Show the correct canvas based on position type
    function showCorrectCanvas(positionType) {
        console.log(`Showing canvas for position type: ${positionType}`);
        canvasBoth.style.display = 'none';
        canvasSelf.style.display = 'none';
        canvasTarget.style.display = 'none';

        if (positionType === 'both') {
            canvasBoth.style.display = 'block';
        } else if (positionType === 'self') {
            canvasSelf.style.display = 'block';
        } else if (positionType === 'target') {
            canvasTarget.style.display = 'block';
        }
    }

    // Event listeners for loading positions and changing position type
    document.getElementById('loadPositionsButton').addEventListener('click', () => {
        currentPage = 0;
        loadRobotPositions();
    });

    positionSelector.addEventListener('change', () => {
        currentPage = 0;
        loadRobotPositions();
    });

    // Add scroll event listeners to canvases
    canvasBoth.addEventListener('wheel', handleScrollEvent);
    canvasSelf.addEventListener('wheel', handleScrollEvent);
    canvasTarget.addEventListener('wheel', handleScrollEvent);

    // Handle scroll event for pagination
    function handleScrollEvent(event) {
        event.preventDefault();
        if (event.deltaY < 0) {
            if (currentPage > 0) {
                currentPage--;
                loadRobotPositions();
            }
        } else {
            currentPage++;
            loadRobotPositions();
        }
    }

    // Fetch robot positions from the server
    async function fetchRobotPositions(robotId, positionType, start, count) {
        try {
            const response = await fetch(`/robot_positions?robot_id=${robotId}&type=${positionType}&start=${start}&count=${count}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            console.log('Fetched data:', data); 
            updateRobotPositions(data, positionType);
            updateChartBasedOnPositionType(data, positionType);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

    // Update robot positions on the SVG container
    function updateRobotPositions(positions, positionType) {
        const svgContainer = document.getElementById('robotPositions');
        svgContainer.innerHTML = '';
        let lastSelfPosition = null;
        let lastTargetPosition = null;

        positions.forEach((pos, index) => {
            if (positionType === 'self' || positionType === 'both') {
                const {x, y} = transformCoordinates(pos.x, pos.y);
                createAndAppendCircle(svgContainer, x, y, "red", 1, lastSelfPosition, "self");
                if (index === 0 || index === positions.length - 1) {
                    createAndAppendCircle(svgContainer, x, y, "red", 1, null, null);
                }
                lastSelfPosition = { x, y };
            }
            if (positionType === 'target' || positionType === 'both') {
                const {x, y} = transformCoordinates(pos.target_x, pos.target_y);
                createAndAppendCircle(svgContainer, x, y, "black", 1, lastTargetPosition, "target");
                if (index === 0 || index === positions.length - 1) {
                    createAndAppendCircle(svgContainer, x, y, "black", 1, null, null);
                }
                lastTargetPosition = { x, y };
            }
        });
    }

    // Helper function to create and append a circle element
    function createAndAppendCircle(container, x, y, color, radius, lastPosition, type) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", radius);
        circle.setAttribute("fill", color);
        container.appendChild(circle);

        if (lastPosition) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", lastPosition.x);
            line.setAttribute("y1", lastPosition.y);
            line.setAttribute("x2", x);
            line.setAttribute("y2", y);
            line.setAttribute("stroke", type === "self" ? "red" : "black");
            line.setAttribute("stroke-width", 0.5);
            container.appendChild(line);
        }
    }

    // Transform robot coordinates for SVG display
    function transformCoordinates(robotX, robotY) {
        var scale = 10;  
        var offsetX = (230 / 2) - 5;
        var offsetY = (150 / 2) - 5;
        var svgX = (robotY * scale) + offsetX; 
        var svgY = (robotX * -scale) + offsetY;
        return { x: svgX, y: svgY };
    }

    // Update robot selector options
    function updateRobotSelector(robots) {
        robotSelector.innerHTML = '<option value="" hidden>Select a Robot</option>';
        robots.forEach(robotId => {
            const option = document.createElement('option');
            option.value = robotId;
            option.textContent = `Robot ${robotId}`;
            robotSelector.appendChild(option);
        });
    }

    // Handle upload completion and update robot selector
    function uploadComplete(data) {
        alert(data.message);
        fetch('/all_robots')
            .then(response => response.json())
            .then(data => {
                updateRobotSelector(data.robots);
            })
            .catch(error => console.error('Error fetching robot IDs:', error));
    }

    window.uploadComplete = uploadComplete;

    // Update chart based on the position type
    function updateChartBasedOnPositionType(data, positionType) {
        if (positionType === 'both') {
            updateChart(data, canvasBoth);
        } else if (positionType === 'self') {
            updateSelfChart(data, canvasSelf);
        } else if (positionType === 'target') {
            updateTargetChart(data, canvasTarget);
        }
    }

    // Update the 'both' position chart
    function updateChart(data, canvas) {
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        let labels = [];
        let posDeltaData = [];

        if (data && data.length > 0) {
            data.forEach((item) => {
                const delta = Math.sqrt(
                    Math.pow((item.x - item.target_x), 2) + 
                    Math.pow((item.y - item.target_y), 2)
                );
                posDeltaData.push(delta);
                labels.push(item.gametime); 
            });

            if (canvas.chartInstance) {
                canvas.chartInstance.destroy();
            }

            canvas.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Position Delta (meters)',
                        data: posDeltaData,
                        borderColor: 'green',
                        backgroundColor: 'rgba(92, 184, 92, 0.1)',
                        fill: true
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Distance (m)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Game Time (min.)'
                            }
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            console.log('Chart updated successfully');
        } else {
            console.error("Data structure is incorrect or missing required fields.");
        }
    }

    // Update the 'self' position chart
    function updateSelfChart(data, canvas) {
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        let labels = [];
        let posDeltaSelfData = [];

        if (data && data.length > 0) {
            data.forEach((item) => {
                const deltaSelf = Math.sqrt(Math.pow(item.x, 2) + Math.pow(item.y, 2));
                posDeltaSelfData.push(deltaSelf);
                labels.push(item.gametime); 
            });

            if (canvas.chartInstance) {
                canvas.chartInstance.destroy();
            }

            canvas.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Self Position Delta to (0,0)',
                        data: posDeltaSelfData,
                        borderColor: 'red',
                        backgroundColor: 'rgba(70, 130, 180, 0.1)',
                        fill: true
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Distance (m)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Game Time (min.)'
                            }
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            console.log('Self chart updated successfully');
        } else {
            console.error("Data structure is incorrect or missing required fields.");
        }
    }

    // Update the 'target' position chart
    function updateTargetChart(data, canvas) {
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        let labels = [];
        let posDeltaTargetData = [];

        if (data && data.length > 0) {
            data.forEach((item) => {
                const deltaTarget = Math.sqrt(Math.pow(item.target_x, 2) + Math.pow(item.target_y, 2));
                posDeltaTargetData.push(deltaTarget);
                labels.push(item.gametime); 
            });

            if (canvas.chartInstance) {
                canvas.chartInstance.destroy();
            }

            canvas.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Target Position Delta to (0,0)',
                        data: posDeltaTargetData,
                        borderColor: 'black',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        fill: true
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Distance (m)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Game Time (min.)'
                            }
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            console.log('Target chart updated successfully');
        } else {
            console.error("Data structure is incorrect or missing required fields.");
        }
    }

    // Initial load of robot positions
    loadRobotPositions();
});
