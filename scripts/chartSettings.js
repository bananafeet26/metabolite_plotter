var theme_text = getThemeColors().text;
var theme_secondary = getThemeColors().secondary;
var theme_border = getThemeColors().border;
var theme_bg = getThemeColors().bg;

var chartSettings = {
    type: 'pie',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        maintainAspectRatio: false,
        layout: {
            padding: 30,
        },
        scales: {
            y: {
                display: false,
                beginAtZero: true,
                ticks: {
                    display: false,
                },
                grid: {
                    display: false,
                },
            },
            x: {
                display: false,
                ticks: {
                    display: false,
                },
                grid: {
                    display: false,
                },
            },
        },
        plugins: {
            legend: {
                position: 'left', // 👈 moves legend to the left
                labels: {
                    boxWidth: 20,
                    padding: 15,
                    color: theme_text,
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return context.label + ': ' + context.raw + ' mL';
                    }
                }
            }
        }
    },
};
function getThemeColors() {

    const styles = getComputedStyle(document.documentElement);

    return {
        text: styles.getPropertyValue('--bs-body-color').trim(),
        secondary: styles.getPropertyValue('--bs-secondary-color').trim(),
        border: styles.getPropertyValue('--bs-border-color').trim(),
        bg: styles.getPropertyValue('--bs-body-bg').trim()
    };
}

var colours = ["#8cb369", "#f4e285", "#f4a259", "#5b8e7d", "#bc4b51"]

var palettes = {
    nature: ["#8cb369", "#f4e285", "#f4a259", "#5b8e7d", "#bc4b51"],
    ocean: ["#05668d", "#028090", "#00a896", "#02c39a", "#f0f3bd"],
    sunset: ["#ff6b6b", "#f7b267", "#f79d65", "#f4845f", "#f27059"],
    neon: ["#ff006e", "#8338ec", "#3a86ff", "#06d6a0", "#ffbe0b"],
    unique: ["#1be7ff", "#6eeb83", "#e4ff1a", "#e8aa14", "#ff5714"]
}