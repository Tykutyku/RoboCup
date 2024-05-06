document.getElementById('fileUploader').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    fetch('/get_distance_data', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        const parsedData = JSON.parse(data.data);
        const ctx = document.getElementById('distanceChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: parsedData.map(item => item.liveseconds),
                datasets: [{
                    label: 'Distance over Time',
                    data: parsedData.map(item => item.distance),
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    })
    .catch(error => console.error('Error:', error));
});
