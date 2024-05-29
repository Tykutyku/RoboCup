document.addEventListener('DOMContentLoaded', function() {
    const robotSelector = document.getElementById('robotSelector');
    const positionSelector = document.getElementById('positionSelector');
    const prevPageButton = document.getElementById('prevPageButton');
    const nextPageButton = document.getElementById('nextPageButton');

    let currentPage = 0;
    const pageSize = 20;

    function loadRobotPositions() {
        const selectedRobotId = robotSelector.value;
        const selectedPositionType = positionSelector.value;
        fetchRobotPositions(selectedRobotId, selectedPositionType, currentPage * pageSize, pageSize);
    }

    document.getElementById('loadPositionsButton').addEventListener('click', () => {
        currentPage = 0;
        loadRobotPositions();
    });

    positionSelector.addEventListener('change', () => {
        currentPage = 0;
        loadRobotPositions();
    });

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadRobotPositions();
        }
    });

    nextPageButton.addEventListener('click', () => {
        currentPage++;
        loadRobotPositions();
    });

    async function fetchRobotPositions(robotId, positionType, start, count) {
        try {
            const response = await fetch(`/robot_positions?robot_id=${robotId}&type=${positionType}&start=${start}&count=${count}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            updateRobotPositions(data, positionType);
            if (positionType === 'both') {
                updateChart(data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

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

    function transformCoordinates(robotX, robotY) {
        var scale = 10;  
        var offsetX = (230 / 2) - 5;
        var offsetY = (150 / 2) - 5;
        var svgX = (robotY * scale) + offsetX; 
        var svgY = (robotX * -scale) + offsetY;
        return { x: svgX, y: svgY };
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
        fetch('/all_robots')
            .then(response => response.json())
            .then(data => {
                updateRobotSelector(data.robots);
                document.getElementById('pagination-controls').style.display = 'block';
            })
            .catch(error => console.error('Error fetching robot IDs:', error));
    }

    window.uploadComplete = uploadComplete;

    function updateChart(data) {
        const canvas = document.getElementById('posDeltaChart');
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

            if (window.chartInstance) {
                window.chartInstance.destroy();
            }

            window.chartInstance = new Chart(ctx, {
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
                                text: 'Game Time'
                            }
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        } else {
            console.error("Data structure is incorrect or missing required fields.");
        }
    }

    loadRobotPositions();
});
