// Analytics Dashboard Component
window.AnalyticsDashboardComponent = {
    template: `
        <div class="analytics-dashboard">
            <!-- Content is handled in the main template -->
        </div>
    `,
    props: {
        statisticsData: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            charts: {},
            isAnalyticsTab: false
        };
    },
    mounted() {
        this.initializeAnalytics();
    },
    watch: {
        'statisticsData': {
            handler(newData) {
                if (newData && this.isAnalyticsTab) {
                    this.updateAllCharts();
                }
            },
            deep: true
        }
    },
    methods: {
        initializeAnalytics() {
            // Watch for tab changes
            this.$root.$watch('activeTab', (newTab) => {
                this.isAnalyticsTab = newTab === 'analytics';
                if (this.isAnalyticsTab && this.statisticsData) {
                    this.$nextTick(() => {
                        this.createAllCharts();
                    });
                }
            });
            
            // Initial check if analytics tab is active
            if (this.$root.activeTab === 'analytics') {
                this.isAnalyticsTab = true;
                this.$nextTick(() => {
                    this.createAllCharts();
                });
            }
        },
        
        async createAllCharts() {
            if (!this.statisticsData) return;
            
            await this.$nextTick();
            
            // Destroy existing charts
            this.destroyAllCharts();
            
            // Create new charts
            this.createIncidentTypesChart();
            this.createIncidentSeverityChart();
            this.createIncidentTimelineChart();
            this.createCvssDistributionChart();
            this.createVendorVulnerabilitiesChart();
            this.createMotivationsChart();
            this.createCountriesChart();
            this.createMalwareFamiliesChart();
            this.createRiskGauge();
        },
        
        destroyAllCharts() {
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.destroy();
            });
            this.charts = {};
        },
        
        updateAllCharts() {
            this.createAllCharts();
        },
        
        // Incident Analytics Charts
        createIncidentTypesChart() {
            const ctx = this.$refs.incidentTypesChart;
            if (!ctx || !this.statisticsData.incidents?.incident_types) return;
            
            const data = this.statisticsData.incidents.incident_types;
            const labels = data.map(item => item[0].replace(/\|/g, ' + '));
            const values = data.map(item => item[1]);
            
            this.charts.incidentTypes = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: { size: 11 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        },
        
        createIncidentSeverityChart() {
            const ctx = this.$refs.incidentSeverityChart;
            if (!ctx || !this.statisticsData.incidents?.severities) return;
            
            const data = this.statisticsData.incidents.severities;
            const labels = data.map(item => item[0]);
            const values = data.map(item => item[1]);
            
            this.charts.incidentSeverity = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
                    datasets: [{
                        data: values,
                        backgroundColor: {
                            'critical': '#dc3545',
                            'high': '#fd7e14', 
                            'medium': '#ffc107',
                            'low': '#28a745'
                        },
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: { size: 11 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        },
        
        createIncidentTimelineChart() {
            const ctx = this.$refs.incidentTimelineChart;
            if (!ctx || !this.statisticsData.incidents?.timeline) return;
            
            const timeline = this.statisticsData.incidents.timeline;
            // Filter to show only recent data with incidents
            const recentData = timeline.filter(item => item[1] > 0).slice(-20);
            const labels = recentData.map(item => {
                const date = new Date(item[0]);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
            const values = recentData.map(item => item[1]);
            
            this.charts.incidentTimeline = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Incidents',
                        data: values,
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#36A2EB',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        },
        
        // Vulnerability Analytics Charts
        createCvssDistributionChart() {
            const ctx = this.$refs.cvssDistributionChart;
            if (!ctx || !this.statisticsData.vulnerabilities?.cvss_distribution) return;
            
            const data = this.statisticsData.vulnerabilities.cvss_distribution;
            const labels = data.map(item => `CVSS ${item[0]}`);
            const values = data.map(item => item[1]);
            
            this.charts.cvssDistribution = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Vulnerabilities',
                        data: values,
                        backgroundColor: values.map((_, index) => {
                            const colors = ['#28a745', '#ffc107', '#fd7e14', '#dc3545', '#dc3545', '#dc3545', '#dc3545', '#6f42c1'];
                            return colors[index] || '#6c757d';
                        }),
                        borderWidth: 1,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 10
                            }
                        }
                    }
                }
            });
        },
        
        createVendorVulnerabilitiesChart() {
            const ctx = this.$refs.vendorVulnerabilitiesChart;
            if (!ctx || !this.statisticsData.vulnerabilities?.vendors) return;
            
            const data = this.statisticsData.vulnerabilities.vendors.slice(0, 10); // Top 10
            const labels = data.map(item => item[0]);
            const values = data.map(item => item[1]);
            
            this.charts.vendorVulnerabilities = new Chart(ctx, {
                type: 'horizontalBar',
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Vulnerabilities',
                        data: values,
                        backgroundColor: '#36A2EB',
                        borderWidth: 1,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 5
                            }
                        }
                    }
                }
            });
        },
        
        // Threat Actor Analytics Charts
        createMotivationsChart() {
            const ctx = this.$refs.motivationsChart;
            if (!ctx || !this.statisticsData.threat_actors?.motivations) return;
            
            const motivations = this.statisticsData.threat_actors.motivations;
            const filteredData = Object.entries(motivations).filter(([key, value]) => key && value > 0);
            const labels = filteredData.map(item => item[0].replace(/\|/g, ' + '));
            const values = filteredData.map(item => item[1]);
            
            this.charts.motivations = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 10,
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        },
        
        createCountriesChart() {
            const ctx = this.$refs.countriesChart;
            if (!ctx || !this.statisticsData.threat_actors?.countries) return;
            
            const countries = this.statisticsData.threat_actors.countries;
            const filteredData = Object.entries(countries).filter(([key, value]) => key && value > 0);
            const labels = filteredData.map(item => item[0]);
            const values = filteredData.map(item => item[1]);
            
            this.charts.countries = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#C9CBCF', '#4BC0C0'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 10,
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        },
        
        createMalwareFamiliesChart() {
            const ctx = this.$refs.malwareFamiliesChart;
            if (!ctx || !this.statisticsData.threat_actors?.top_malware_families) return;
            
            const malware = this.statisticsData.threat_actors.top_malware_families;
            const labels = Object.keys(malware);
            const values = Object.values(malware);
            
            this.charts.malwareFamilies = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Incidents',
                        data: values,
                        backgroundColor: '#dc3545',
                        borderWidth: 1,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        },
                        x: {
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45
                            }
                        }
                    }
                }
            });
        },
        
        // Risk Gauge (Simple CSS implementation)
        createRiskGauge() {
            const gaugeElement = document.getElementById('riskGauge');
            if (!gaugeElement) return;
            
            const riskLevel = this.statisticsData?.risk_assessment?.overall_risk || 'medium';
            const riskConfig = {
                'low': { color: '#28a745', percentage: '25%' },
                'medium': { color: '#ffc107', percentage: '50%' },
                'high': { color: '#fd7e14', percentage: '75%' },
                'critical': { color: '#dc3545', percentage: '100%' }
            };
            
            const config = riskConfig[riskLevel.toLowerCase()] || riskConfig.medium;
            
            gaugeElement.innerHTML = `
                <div class="gauge-container">
                    <div class="gauge-background"></div>
                    <div class="gauge-fill" style="width: ${config.percentage}; background: ${config.color};"></div>
                    <div class="gauge-label">${riskLevel.toUpperCase()}</div>
                </div>
            `;
        },
        
        // Utility methods
        getCriticalVulnCount() {
            if (!this.statisticsData?.vulnerabilities?.cvss_distribution) return 0;
            return this.statisticsData.vulnerabilities.cvss_distribution
                .filter(item => item[0] >= 9.0)
                .reduce((sum, item) => sum + item[1], 0);
        },
        
        formatRiskFactor(factor) {
            return factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        },
        
        formatRecommendation(rec) {
            return rec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    },
    
    beforeUnmount() {
        this.destroyAllCharts();
    }
};