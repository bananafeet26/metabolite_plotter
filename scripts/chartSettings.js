var chartSettings = {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        responsive: true,
        scales: {
            x: {
                type: 'time',  // Use timescale
                time: {
                    unit: 'day',  // Display unit is 'day'
                    displayFormats: {
                        day: 'DD/MM',
                    },
                    tooltipFormat: 'll',  // Format for tooltips (optional)
                },
                title: {
                    display: true,
                    text: 'Date'
                },
                ticks: {
                    maxRotation: 0,  // Optional: Prevent the labels from rotating too much
                    autoSkip: true,  // Automatically skip labels if they are too crowded
                    maxTicksLimit: 10,  // Limit the number of ticks to show on the X-axis
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'ng/dL'
                },
                ticks: {
                    callback: (value) => value + ' ng/dL'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'pg/mL'
                },
                ticks: {
                    callback: (value) => value + ' pg/mL'
                },
                grid: {
                    drawOnChartArea: false // cleaner dual-axis look
                }
            },
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const dataset = context.dataset;
                        const value = context.parsed.y;

                        // attach unit per dataset
                        const unit = dataset.unit || '';
                        return `${dataset.label}: ${Math.floor(value)} ${unit} ng/dL`;
                    }
                }
            }
        }
    },
};

var blankDataset = {
    label: 'E2',
    data: [],  // Initial data
    borderColor: 'pink',
    hidden: false,
    fill: false
};