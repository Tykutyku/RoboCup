document.addEventListener('DOMContentLoaded', function() {
    const dataSelector = document.getElementById('dataSelector');
    const fileUploader = document.getElementById('fileUploader');
    const prevPageButton = document.getElementById('prevPageButton');
    const nextPageButton = document.getElementById('nextPageButton');
    const hiddenFrame = document.getElementById('hiddenFrame');
    const form = document.getElementById('fileUploaderForm');

    let currentPage = 0;
    const pageSize = 20;
    let lastCirclePositionSelf = null;
    let lastCirclePositionDecawave = null;

    function loadRobotPositions() {
        const dataType = dataSelector.value;
        if (!dataType) {
            alert('Please select a data type before loading positions.');
            return;
        }
        fetchPositionsByType(dataType, currentPage * pageSize, pageSize);
    }

    dataSelector.addEventListener('change', () => {
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

    function fetchPositionsByType(dataType, start, count) {
        fetch(`/robot_positions_csv?type=${dataType}&start=${start}&count=${count}`)
            .then(response => response.json())
            .then(data => {
                updatePositions(data, dataType);
                if (dataType === 'both') {
                    updateChart(data);
                }
            })
            .catch(error => console.error('Fetch error:', error));
    }

    function transformCoordinates(robotX, robotY) {
        const scale = 10;
        const offsetX = (230 / 2) - 5;
        const offsetY = (150 / 2) - 5;
        const svgX = (robotX * scale) + offsetX;
        const svgY = (robotY * scale) + offsetY;
        return { x: svgX, y: svgY };
    }

    function updatePositions(data, dataType) {
        const svgContainer = document.getElementById('robotPositions');
        svgContainer.innerHTML = '';
        lastCirclePositionSelf = null;
        lastCirclePositionDecawave = null;

        if (dataType === 'self' || dataType === 'both') {
            if (data.self) {
                Object.keys(data.self).forEach(robotId => {
                    data.self[robotId].forEach((pos, index, array) => {
                        const { x, y } = transformCoordinates(pos.x, pos.y);
                        let color = "blue";
                        if (index === 0) color = "yellow"; // Highlight first point
                        if (index === array.length - 1) color = "red"; // Highlight last point
                        createAndAppendCircle(svgContainer, x, y, color, "self");
                    });
                });
            }
        }

        if (dataType === 'decawave' || dataType === 'both') {
            if (data.decawave) {
                Object.keys(data.decawave).forEach(robotId => {
                    data.decawave[robotId].forEach((pos, index, array) => {
                        const { x, y } = transformCoordinates(pos.dx, pos.dy);
                        let color = "black";
                        if (index === 0) color = "yellow"; // Highlight first point
                        if (index === array.length - 1) color = "red"; // Highlight last point
                        createAndAppendCircle(svgContainer, x, y, color, "decawave");
                    });
                });
            }
        }
    }

    function createAndAppendCircle(container, x, y, color, type) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 1.5); // Slightly larger for visibility
        circle.setAttribute("fill", color);
        container.appendChild(circle);

        let lastCirclePosition = type === "self" ? lastCirclePositionSelf : lastCirclePositionDecawave;

        if (lastCirclePosition) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", lastCirclePosition.x);
            line.setAttribute("y1", lastCirclePosition.y);
            line.setAttribute("x2", x);
            line.setAttribute("y2", y);
            line.setAttribute("stroke", color);
            line.setAttribute("stroke-width", 0.5);
            container.appendChild(line);
        }

        if (type === "self") {
            lastCirclePositionSelf = { x, y };
        } else {
            lastCirclePositionDecawave = { x, y };
        }
    }

    function updateChart(data) {
        const canvas = document.getElementById('posDeltaChart');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        let labels = [];
        let posDeltaData = [];

        if (data.self && data.decawave) {
            Object.keys(data.self).forEach(robotId => {
                const selfPositions = data.self[robotId] || [];
                const decawavePositions = data.decawave[robotId] || [];

                selfPositions.forEach((selfPoint, index) => {
                    const decawavePoint = decawavePositions[index];
                    if (selfPoint && decawavePoint) {
                        const delta = Math.sqrt(
                            Math.pow((selfPoint.x - decawavePoint.dx), 2) + 
                            Math.pow((selfPoint.y - decawavePoint.dy), 2)
                        );
                        posDeltaData.push(delta);
                        labels.push(index);
                    } else {
                        console.warn(`No matching Decawave point for self point at index ${index} for robot ${robotId}`);
                    }
                });
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
                                text: 'Index'
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

    // Automatically submit the form upon file selection
    fileUploader.addEventListener('change', () => {
        form.submit();
    });

    hiddenFrame.onload = function() {
        document.getElementById('robotPositions').innerHTML = ''; // Clear previous positions
        if (window.chartInstance) {
            window.chartInstance.destroy();
        }
        document.getElementById('posDeltaChart').getContext('2d').clearRect(0, 0, 400, 400); // Clear the chart

        loadRobotPositions();
    };

    loadRobotPositions();
});
