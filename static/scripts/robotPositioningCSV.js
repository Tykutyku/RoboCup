document.addEventListener('DOMContentLoaded', function() {
    const dataSelector = document.getElementById('dataSelector');
    const fileUploader = document.getElementById('fileUploader');
    const canvas = document.getElementById('posDeltaChart'); 
    const hiddenFrame = document.getElementById('hiddenFrame');
    const form = document.getElementById('fileUploaderForm');

    let currentPage = 0;
    const pageSize = 20;
    let lastCirclePositionSelf = null;
    let lastCirclePositionDecawave = null;
    let selectedCircle = null;

    hiddenFrame.onload = function() {
        clearPreviousData(); 
        loadRobotPositions();
    };    

    function loadRobotPositions() {
        const dataType = dataSelector.value;
        if (!dataType) {
            alert('Please select a data type before loading positions.');
            return;
        }
        clearPreviousData();
        fetchPositionsByType(dataType, currentPage * pageSize, pageSize);
    }

    dataSelector.addEventListener('change', () => {
        currentPage = 0;
        loadRobotPositions();
    });

    canvas.addEventListener('wheel', (event) => {
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
    });

    function fetchPositionsByType(dataType, start, count) {
        fetch(`/robot_positions_csv?type=${dataType}&start=${start}&count=${count}`)
            .then(response => response.json())
            .then(data => {
                console.log("Fetched Data:", data); // Log data to console
                updatePositions(data, dataType);
                if (dataType === 'both' || dataType === 'self' || dataType === 'decawave') {
                    updateChart(data, dataType);
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
                    data.self[robotId].slice(currentPage * pageSize, (currentPage + 1) * pageSize).forEach((pos, index) => {
                        const { x, y } = transformCoordinates(pos.x, pos.y);
                        let color = "red";
                        createAndAppendCircle(svgContainer, x, y, color, "self", index);
                    });
                });
            }
        }

        if (dataType === 'decawave' || dataType === 'both') {
            if (data.decawave) {
                Object.keys(data.decawave).forEach(robotId => {
                    data.decawave[robotId].slice(currentPage * pageSize, (currentPage + 1) * pageSize).forEach((pos, index) => {
                        const { x, y } = transformCoordinates(pos.dx, pos.dy);
                        let color = "black";
                        createAndAppendCircle(svgContainer, x, y, color, "decawave", index);
                    });
                });
            }
        }
    }

    function createAndAppendCircle(container, x, y, color, type, index) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 1.5);
        circle.setAttribute("fill", color);
        circle.dataset.index = index;
        circle.dataset.type = type;
        circle.addEventListener('click', handleCircleClick);
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

        console.log(`Created circle at (${x}, ${y}) with index ${index} and type ${type}`);
    }

    
    function updateStatsSection(pointData) {
        const statsSection = document.getElementById('stats-section');
        statsSection.innerHTML = `
            <p><strong>X Position:</strong> ${pointData.x}</p>
            <p><strong>Y Position:</strong> ${pointData.y}</p>
            <p><strong>Orientation:</strong> ${pointData.orientation}</p>
            <p><strong>Game Time:</strong> ${pointData.gametime}</p>
        `;
        statsSection.style.display = 'block';
    }
    

    function handleCircleClick(event) {
        if (selectedCircle) {
            selectedCircle.setAttribute("r", 1.5); // Reset size of previously selected circle
        }
        selectedCircle = event.target;
        selectedCircle.setAttribute("r", 3); // Highlight selected circle by increasing size
    
        const index = selectedCircle.dataset.index;
        const type = selectedCircle.dataset.type;
    
        console.log(`Circle clicked with index ${index} and type ${type}`);
    
        if (dataSelector.value === 'both') {
            highlightSvgPoint(index, 'self');
            highlightSvgPoint(index, 'decawave');
            highlightChartPoint(index, 'self');
            highlightChartPoint(index, 'decawave');
        } else {
            highlightSvgPoint(index, type);
            highlightChartPoint(index, type);
        }
    
        const x = selectedCircle.getAttribute("cx");
        const y = selectedCircle.getAttribute("cy");
        const pointData = {
            x: x,
            y: y,
            orientation: selectedCircle.dataset.orientation,
            gametime: selectedCircle.dataset.gametime
        };
        updateStatsSection(pointData);
    }
    
    

    function highlightChartPoint(index, type) {
        const chartType = dataSelector.value;
        let datasetIndex = type === "self" ? 0 : 1;

        if (chartType === 'both' || chartType === type) {
            const meta = window.chartInstance.getDatasetMeta(datasetIndex);
            const point = meta.data[index];
            if (point) {
                const activeElements = [
                    { datasetIndex: datasetIndex, index: parseInt(index) }
                ];
                if (chartType === 'both') {
                    const otherDatasetIndex = datasetIndex === 0 ? 1 : 0;
                    activeElements.push({ datasetIndex: otherDatasetIndex, index: parseInt(index) });
                }
                window.chartInstance.setActiveElements(activeElements);
                window.chartInstance.update();
                console.log(`Highlighted chart point with index ${index} and dataset index ${datasetIndex}`);
            }
        }
    }

    function updateChart(data, dataType) {
        const canvas = document.getElementById('posDeltaChart');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        let labels = [];
        let posDeltaDataSelf = [];
        let posDeltaDataDecawave = [];
        let distanceData = [];

        if (dataType === 'both') {
            if (data.self && data.decawave) {
                Object.keys(data.self).forEach(robotId => {
                    const selfPositions = data.self[robotId] || [];
                    const decawavePositions = data.decawave[robotId] || [];

                    selfPositions.slice(currentPage * pageSize, (currentPage + 1) * pageSize).forEach((selfPoint, index) => {
                        const decawavePoint = decawavePositions[index];
                        if (selfPoint && decawavePoint) {
                            const delta = Math.sqrt(
                                Math.pow((selfPoint.x - decawavePoint.dx), 2) +
                                Math.pow((selfPoint.y - decawavePoint.dy), 2)
                            );
                            distanceData.push(delta);
                            labels.push(selfPoint.gametime);
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
                            label: 'Distance Between Self and Decawave (meters)',
                            data: distanceData,
                            borderColor: 'green',
                            backgroundColor: 'rgba(92, 184, 92, 0.1)',
                            fill: true
                        }]
                    },
                    options: {
                        onClick: handleChartClick,
                        scales: {
                            y: {
                                beginAtZero: true,
                                min: 0,
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
            } else {
                console.error("Data structure is incorrect or missing required fields.");
            }
        } else if (dataType === 'self' || dataType === 'decawave') {
            let positions = [];
            let label = '';
            let borderColor = '';
            let backgroundColor = '';

            if (dataType === 'self' && data.self) {
                Object.keys(data.self).forEach(robotId => {
                    positions = data.self[robotId] || [];
                });
                label = 'Self Distance to (0,0)';
                borderColor = 'red';
                backgroundColor = 'rgba(255, 0, 0, 0.1)';
                positions.slice(currentPage * pageSize, (currentPage + 1) * pageSize).forEach((point, index) => {
                    const distance = Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2));
                    posDeltaDataSelf.push(distance);
                    labels.push(point.gametime);
                });
            } else if (dataType === 'decawave' && data.decawave) {
                Object.keys(data.decawave).forEach(robotId => {
                    positions = data.decawave[robotId] || [];
                });
                label = 'Decawave Distance to (0,0)';
                borderColor = 'black';
                backgroundColor = 'rgba(0, 0, 0, 0.1)';
                positions.slice(currentPage * pageSize, (currentPage + 1) * pageSize).forEach((point, index) => {
                    const distance = Math.sqrt(Math.pow(point.dx, 2) + Math.pow(point.dy, 2));
                    posDeltaDataDecawave.push(distance);
                    labels.push(point.gametime);
                });
            }

            if (window.chartInstance) {
                window.chartInstance.destroy();
            }

            window.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: label,
                        data: dataType === 'self' ? posDeltaDataSelf : posDeltaDataDecawave,
                        borderColor: borderColor,
                        backgroundColor: backgroundColor,
                        fill: true
                    }]
                },
                options: {
                    onClick: handleChartClick,
                    scales: {
                        y: {
                            beginAtZero: true,
                            min: 0,
                            max: Math.max(...(dataType === 'self' ? posDeltaDataSelf : posDeltaDataDecawave)) + 1,
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
        }
    }

    function handleChartClick(event, elements) {
        if (elements.length > 0) {
            const element = elements[0];
            const index = element.index;
            const type = dataSelector.value;

            console.log(`Chart point clicked with index ${index} and type ${type}`);

            if (type === 'both') {
                highlightSvgPoint(index, 'self');
                highlightSvgPoint(index, 'decawave');
            } else {
                highlightSvgPoint(index, type);
            }
        }
    }

    function highlightSvgPoint(index, type) {
        const svgContainer = document.getElementById('robotPositions');
        const circles = svgContainer.querySelectorAll(`circle[data-type="${type}"]`);
    
        circles.forEach(circle => {
            if (circle.dataset.index == index) {
                circle.setAttribute("r", 3); // Highlight selected circle by increasing size
                console.log(`Highlighted SVG circle with index ${index} and type ${type}`);
            } else {
                circle.setAttribute("r", 1.5); // Reset size of other circles
            }
        });

        highlightChartPoint(index, type); // Ensure chart points are highlighted 
    }    

    function clearPreviousData() {
        const svgContainer = document.getElementById('robotPositions');
        while (svgContainer.firstChild) {
            svgContainer.removeChild(svgContainer.firstChild);
        }
        if (window.chartInstance) {
            window.chartInstance.destroy();
            window.chartInstance = null;
        }
        const ctx = document.getElementById('posDeltaChart').getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the chart
        lastCirclePositionSelf = null;
        lastCirclePositionDecawave = null;
        selectedCircle = null; // Clear selected circle reference
    }
    
    function uploadComplete(result) {
        console.log("Upload complete:", result);
        document.getElementById('pagination-controls').style.display = 'flex';
        clearPreviousData(); 
        loadRobotPositions();
    }
    
    // Ensure this is available globally
    window.uploadComplete = uploadComplete;
    

    // Automatically submit the form upon file selection
    fileUploader.addEventListener('change', () => {
        form.submit();
    });

    hiddenFrame.onload = function() {
        clearPreviousData(); // Clear previous data upon new file upload
        loadRobotPositions();
    };

    loadRobotPositions();
});
