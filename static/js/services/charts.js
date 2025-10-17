/**
 * Charts Service for Cybersecurity Threat Intelligence Dashboard v2
 * Manages all Chart.js instances and data visualization
 */
class ChartsService {
    constructor() {
        this.charts = new Map();
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        };
    }

    /**
     * Color schemes for charts
     */
    get colors() {
        return {
            primary: 'rgba(13, 110, 253, 0.8)',
            secondary: 'rgba(108, 117, 125, 0.8)',
            success: 'rgba(25, 135, 84, 0.8)',
            danger: 'rgba(220, 53, 69, 0.8)',
            warning: 'rgba(255, 193, 7, 0.8)',
            info: 'rgba(13, 202, 240, 0.8)',
            light: 'rgba(248, 249, 250, 0.8)',
            dark: 'rgba(33, 37, 41, 0.8)',
            gradient: [
                'rgba(102, 126, 234, 0.8)',
                'rgba(118, 75, 162, 0.8)',
                'rgba(240, 147, 251, 0.8)',
                'rgba(245, 87, 108, 0.8)',
                'rgba(79, 172, 254, 0.8)',
                'rgba(0, 242, 254, 0.8)'
            ]
        };
    }

    /**
     * Create or update a chart
     */
    createChart(canvas, type, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const chartId = canvas.id || `chart-${Date.now()}`;
        
        // Destroy existing chart if it exists
        if (this.charts.has(chartId)) {
            this.charts.get(chartId).destroy();
        }

        const chart = new Chart(ctx, {
            type,
            data,
            options: {
                ...this.defaultOptions,
                ...options
            }
        });

        this.charts.set(chartId, chart);
        return chart;
    }

    /**
     * Create threat actors bar chart
     */
    createThreatActorsChart(canvas, data) {
        const chartData = {
            labels: data.map(item => item[0] || item.name),
            datasets: [{
                label: 'Mentions',
                data: data.map(item => item[1] || item.count),
                backgroundColor: this.colors.danger,
                borderColor: this.colors.danger.replace('0.8', '1'),
                borderWidth: 1
            }]
        };

        return this.createChart(canvas, 'bar', chartData, {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        });
    }

    /**
     * Create vulnerabilities doughnut chart
     */
    createVulnerabilitiesChart(canvas, data) {
        const chartData = {
            labels: data.map(item => item[0] || item.name),
            datasets: [{
                data: data.map(item => item[1] || item.count),
                backgroundColor: this.colors.gradient,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        return this.createChart(canvas, 'doughnut', chartData);
    }

    /**
     * Create incident types pie chart
     */
    createIncidentTypesChart(canvas, data) {
        const chartData = {
            labels: data.map(item => item[0] || item.name),
            datasets: [{
                data: data.map(item => item[1] || item.count),
                backgroundColor: [
                    this.colors.primary,
                    this.colors.secondary,
                    this.colors.success,
                    this.colors.danger,
                    this.colors.warning
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        return this.createChart(canvas, 'pie', chartData);
    }

    /**
     * Create geographies bar chart
     */
    createGeographiesChart(canvas, data) {
        const chartData = {
            labels: data.map(item => item[0] || item.name),
            datasets: [{
                label: 'Incidents',
                data: data.map(item => item[1] || item.count),
                backgroundColor: this.colors.info,
                borderColor: this.colors.info.replace('0.8', '1'),
                borderWidth: 1
            }]
        };

        return this.createChart(canvas, 'bar', chartData, {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        });
    }

    /**
     * Create MITRE techniques horizontal bar chart
     */
    createMitreTechniquesChart(canvas, data) {
        const chartData = {
            labels: data.map(item => item[0] || item.name),
            datasets: [{
                label: 'Usage',
                data: data.map(item => item[1] || item.count),
                backgroundColor: this.colors.warning,
                borderColor: this.colors.warning.replace('0.8', '1'),
                borderWidth: 1
            }]
        };

        return this.createChart(canvas, 'bar', chartData, {
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        });
    }

    /**
     * Create timeline line chart
     */
    createTimelineChart(canvas, data, label = 'Incidents') {
        const chartData = {
            labels: data.map(item => item[0] || item.date),
            datasets: [{
                label,
                data: data.map(item => item[1] || item.count),
                borderColor: this.colors.primary,
                backgroundColor: this.colors.primary.replace('0.8', '0.2'),
                fill: true,
                tension: 0.4
            }]
        };

        return this.createChart(canvas, 'line', chartData, {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        });
    }

    /**
     * Create CVSS distribution chart
     */
    createCvssDistributionChart(canvas, data) {
        const chartData = {
            labels: data.map(item => item[0] || item.range),
            datasets: [{
                label: 'Vulnerabilities',
                data: data.map(item => item[1] || item.count),
                backgroundColor: this.colors.danger,
                borderColor: this.colors.danger.replace('0.8', '1'),
                borderWidth: 1
            }]
        };

        return this.createChart(canvas, 'bar', chartData, {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        });
    }

    /**
     * Create severity distribution pie chart
     */
    createSeverityDistributionChart(canvas, data) {
        const severityColors = {
            critical: this.colors.danger,
            high: this.colors.warning,
            medium: this.colors.info,
            low: this.colors.success
        };

        const chartData = {
            labels: data.map(item => item[0] || item.severity),
            datasets: [{
                data: data.map(item => item[1] || item.count),
                backgroundColor: data.map(item => 
                    severityColors[item[0]?.toLowerCase()] || this.colors.secondary
                ),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        return this.createChart(canvas, 'pie', chartData);
    }

    /**
     * Create threat actor radar chart
     */
    createThreatActorRadarChart(canvas, data) {
        const chartData = {
            labels: data.map(item => item[0] || item.name),
            datasets: [{
                label: 'Activity Level',
                data: data.map(item => item[1] || item.count),
                borderColor: this.colors.danger,
                backgroundColor: this.colors.danger.replace('0.8', '0.2'),
                fill: true
            }]
        };

        return this.createChart(canvas, 'radar', chartData, {
            scales: {
                r: {
                    beginAtZero: true
                }
            }
        });
    }

    /**
     * Update chart data
     */
    updateChart(chartId, data) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.data = data;
            chart.update();
        }
    }

    /**
     * Destroy a specific chart
     */
    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartId);
        }
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }

    /**
     * Get chart by ID
     */
    getChart(chartId) {
        return this.charts.get(chartId);
    }

    /**
     * Export chart as image
     */
    exportChart(chartId, format = 'png') {
        const chart = this.charts.get(chartId);
        if (chart) {
            return chart.toBase64Image(format);
        }
        return null;
    }
}

// Global charts service instance
window.chartsService = new ChartsService();