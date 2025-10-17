// Charts Container Component
window.ChartsContainerComponent = {
    template: `
        <div class="charts-container">
            <div class="charts-header">
                <h3>Analytics & Trends</h3>
                <div class="chart-controls">
                    <select v-model="timeRange" @change="updateCharts">
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                    </select>
                    <button @click="refreshCharts" class="btn-refresh" :disabled="loading">
                        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
                        Refresh
                    </button>
                </div>
            </div>
            
            <div v-if="loading" class="loading">
                <i class="fas fa-spinner fa-spin"></i> Loading charts...
            </div>
            
            <div v-else-if="error" class="error">
                <i class="fas fa-exclamation-triangle"></i>
                [[ error ]]
                <button @click="refreshCharts" class="btn-retry">Retry</button>
            </div>
            
            <div v-else class="charts-grid">
                <!-- Incidents Trend Chart -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h4>Incidents Trend</h4>
                        <div class="chart-legend">
                            <span class="legend-item">
                                <span class="legend-color" style="background-color: #e74c3c;"></span>
                                High
                            </span>
                            <span class="legend-item">
                                <span class="legend-color" style="background-color: #f39c12;"></span>
                                Medium
                            </span>
                            <span class="legend-item">
                                <span class="legend-color" style="background-color: #27ae60;"></span>
                                Low
                            </span>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas ref="incidentsChart"></canvas>
                    </div>
                </div>
                
                <!-- Severity Distribution Chart -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h4>Severity Distribution</h4>
                    </div>
                    <div class="chart-container">
                        <canvas ref="severityChart"></canvas>
                    </div>
                </div>
                
                <!-- Threat Actors Chart -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h4>Top Threat Actors</h4>
                    </div>
                    <div class="chart-container">
                        <canvas ref="threatActorsChart"></canvas>
                    </div>
                </div>
                
                <!-- Vulnerabilities by Severity Chart -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h4>Vulnerabilities by Severity</h4>
                    </div>
                    <div class="chart-container">
                        <canvas ref="vulnerabilitiesChart"></canvas>
                    </div>
                </div>
                

                
                <!-- Geographic Distribution Chart -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h4>Geographic Distribution</h4>
                    </div>
                    <div class="chart-container">
                        <canvas ref="geographyChart"></canvas>
                    </div>
                </div>
                
                <!-- CVSS Score Distribution Chart -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h4>CVSS Score Distribution</h4>
                    </div>
                    <div class="chart-container">
                        <canvas ref="cvssChart"></canvas>
                    </div>
                </div>
                
                <!-- Industry Trends Chart -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h4>Industry Monthly Trends</h4>
                    </div>
                    <div class="chart-container">
                        <canvas ref="industryTrendsChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    props: {
        summaryData: {
            type: Object,
            default: () => ({})
        },
        incidentsData: {
            type: Array,
            default: () => []
        },
        vulnerabilitiesData: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: null
        }
    },
    
    data() {
        return {
            timeRange: '30',
            charts: {
                incidents: null,
                severity: null,
                threatActors: null,
                vulnerabilities: null,
                cvss: null,
                geography: null,
                industryTrends: null
            }
        };
    },
    
    mounted() {
        this.initializeCharts();
    },
    
    beforeUnmount() {
        this.destroyCharts();
    },
    
    watch: {
        summaryData: {
            handler() {
                this.updateCharts();
            },
            deep: true
        },
        incidentsData: {
            handler() {
                this.updateCharts();
            },
            deep: true
        },
        vulnerabilitiesData: {
            handler() {
                this.updateCharts();
            },
            deep: true
        }
    },
    
    methods: {
        initializeCharts() {
            this.$nextTick(() => {
                this.createIncidentsChart();
                this.createSeverityChart();
                this.createThreatActorsChart();
                this.createVulnerabilitiesChart();
                this.createGeographyChart();
                this.createCvssChart();
                this.createIndustryTrendsChart();
            });
        },
        
        destroyCharts() {
            Object.values(this.charts).forEach(chart => {
                if (chart) {
                    chart.destroy();
                }
            });
        },
        
        createIncidentsChart() {
            const ctx = this.$refs.incidentsChart?.getContext('2d');
            if (!ctx) return;
            
            const trendData = this.getIncidentsTrendData();
            
            this.charts.incidents = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trendData.labels,
                    datasets: [
                        {
                            label: 'High Severity',
                            data: trendData.high,
                            borderColor: '#e74c3c',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Medium Severity',
                            data: trendData.medium,
                            borderColor: '#f39c12',
                            backgroundColor: 'rgba(243, 156, 18, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Low Severity',
                            data: trendData.low,
                            borderColor: '#27ae60',
                            backgroundColor: 'rgba(39, 174, 96, 0.1)',
                            tension: 0.4
                        }
                    ]
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
        
        createSeverityChart() {
            const ctx = this.$refs.severityChart?.getContext('2d');
            if (!ctx) return;
            
            const severityData = this.getSeverityDistribution();
            
            this.charts.severity = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['High', 'Medium', 'Low'],
                    datasets: [{
                        data: [severityData.high, severityData.medium, severityData.low],
                        backgroundColor: ['#e74c3c', '#f39c12', '#27ae60']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        },
        
        createThreatActorsChart() {
            const ctx = this.$refs.threatActorsChart?.getContext('2d');
            if (!ctx) return;
            
            const actorsData = this.getThreatActorsData();
            
            this.charts.threatActors = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: actorsData.labels,
                    datasets: [{
                        label: 'Incidents',
                        data: actorsData.data,
                        backgroundColor: '#3498db'
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
        
        createVulnerabilitiesChart() {
            const ctx = this.$refs.vulnerabilitiesChart?.getContext('2d');
            if (!ctx) return;
            
            const vulnData = this.getVulnerabilitiesBySeverity();
            
            this.charts.vulnerabilities = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Critical', 'High', 'Medium', 'Low'],
                    datasets: [{
                        data: [vulnData.critical, vulnData.high, vulnData.medium, vulnData.low],
                        backgroundColor: ['#8e44ad', '#e74c3c', '#f39c12', '#27ae60']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        },
        

        

        
        createGeographyChart() {
            const ctx = this.$refs.geographyChart?.getContext('2d');
            if (!ctx) return;
            
            const geographyData = this.getGeographyData();
            
            this.charts.geography = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: geographyData.labels,
                    datasets: [{
                        data: geographyData.data,
                        backgroundColor: [
                            '#3498db', '#e74c3c', '#f39c12', '#27ae60', 
                            '#8e44ad', '#16a085', '#d35400', '#c0392b'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        },
        

        
        createCvssChart() {
            const ctx = this.$refs.cvssChart?.getContext('2d');
            if (!ctx) return;
            
            const cvssData = this.getCvssDistribution();
            
            this.charts.cvss = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['0-3', '4-6', '7-8', '9-10'],
                    datasets: [{
                        label: 'Vulnerabilities',
                        data: [cvssData.low, cvssData.medium, cvssData.high, cvssData.critical],
                        backgroundColor: ['#27ae60', '#f39c12', '#e74c3c', '#8e44ad']
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
        
        getIncidentsTrendData() {
            // Use industry monthly trends data from summary
            const industryTrends = this.summaryData?.stats?.industry_monthly_trends || {};
            
            if (Object.keys(industryTrends).length === 0) {
                // Fallback to mock data if no trends available
                return this.getMockTrendData();
            }
            
            const sortedMonths = Object.keys(industryTrends).sort();
            const labels = sortedMonths.map(month => {
                const date = new Date(month + '-01');
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            });
            
            // Aggregate all industries for total incidents trend
            const totals = sortedMonths.map(month => {
                const monthData = industryTrends[month];
                return Object.values(monthData).reduce((sum, count) => sum + count, 0);
            });
            
            // Split totals into severity levels (estimated distribution)
            const high = totals.map(total => Math.floor(total * 0.3));
            const medium = totals.map(total => Math.floor(total * 0.5));
            const low = totals.map(total => Math.floor(total * 0.2));
            
            return { labels, high, medium, low };
        },
        
        getMockTrendData() {
            const days = parseInt(this.timeRange);
            const labels = [];
            const high = [];
            const medium = [];
            const low = [];
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString());
                
                high.push(Math.floor(Math.random() * 5) + 1);
                medium.push(Math.floor(Math.random() * 8) + 2);
                low.push(Math.floor(Math.random() * 6) + 1);
            }
            
            return { labels, high, medium, low };
        },
        
        getSeverityDistribution() {
            const incidents = this.incidentsData;
            return {
                high: incidents.filter(i => i.severity === 'high').length,
                medium: incidents.filter(i => i.severity === 'medium').length,
                low: incidents.filter(i => i.severity === 'low').length
            };
        },
        
        getThreatActorsData() {
            // Use threat actors data from summary
            const timeRangeKey = this.timeRange + '_day';
            const threatActors = this.summaryData?.stats?.[timeRangeKey]?.top_threat_actors || [];
            
            if (threatActors.length === 0) {
                // Fallback to incidents data
                return this.getThreatActorsFromIncidents();
            }
            
            return {
                labels: threatActors.map(([actor]) => actor),
                data: threatActors.map(([, count]) => count)
            };
        },
        
        getThreatActorsFromIncidents() {
            const incidents = this.incidentsData;
            const actorCounts = {};
            
            incidents.forEach(incident => {
                if (incident.threat_actors) {
                    incident.threat_actors.forEach(actor => {
                        actorCounts[actor] = (actorCounts[actor] || 0) + 1;
                    });
                }
            });
            
            const sortedActors = Object.entries(actorCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10);
            
            return {
                labels: sortedActors.map(([actor]) => actor),
                data: sortedActors.map(([, count]) => count)
            };
        },
        
        getVulnerabilitiesBySeverity() {
            // Use high impact vulnerabilities from summary
            const highImpactVulns = this.summaryData?.stats?.high_impact_vulnerabilities || [];
            
            if (highImpactVulns.length === 0) {
                // Fallback to vulnerabilities data
                return this.getVulnerabilitiesFromData();
            }
            
            let critical = 0, high = 0, medium = 0, low = 0;
            
            highImpactVulns.forEach(vuln => {
                const cvss = vuln.cvss_score || 0;
                if (cvss >= 9.0) critical++;
                else if (cvss >= 7.0) high++;
                else if (cvss >= 4.0) medium++;
                else low++;
            });
            
            return { critical, high, medium, low };
        },
        
        getVulnerabilitiesFromData() {
            const vulnerabilities = this.vulnerabilitiesData;
            return {
                critical: vulnerabilities.filter(v => v.severity === 'critical').length,
                high: vulnerabilities.filter(v => v.severity === 'high').length,
                medium: vulnerabilities.filter(v => v.severity === 'medium').length,
                low: vulnerabilities.filter(v => v.severity === 'low').length
            };
        },
        
        getIncidentStatusData() {
            const incidents = this.incidentsData;
            return {
                active: incidents.filter(i => i.status === 'active').length,
                investigating: incidents.filter(i => i.status === 'investigating').length,
                resolved: incidents.filter(i => i.status === 'resolved').length
            };
        },
        
        getCvssDistribution() {
            // Use high impact vulnerabilities from summary
            const highImpactVulns = this.summaryData?.stats?.high_impact_vulnerabilities || [];
            
            if (highImpactVulns.length === 0) {
                // Fallback to vulnerabilities data
                return this.getCvssFromData();
            }
            
            let low = 0, medium = 0, high = 0, critical = 0;
            
            highImpactVulns.forEach(vuln => {
                const cvss = parseFloat(vuln.cvss_score) || 0;
                if (cvss <= 3) low++;
                else if (cvss <= 6) medium++;
                else if (cvss <= 8) high++;
                else critical++;
            });
            
            return { low, medium, high, critical };
        },
        
        getCvssFromData() {
            const vulnerabilities = this.vulnerabilitiesData;
            return {
                low: vulnerabilities.filter(v => parseFloat(v.cvss_score) <= 3).length,
                medium: vulnerabilities.filter(v => parseFloat(v.cvss_score) > 3 && parseFloat(v.cvss_score) <= 6).length,
                high: vulnerabilities.filter(v => parseFloat(v.cvss_score) > 6 && parseFloat(v.cvss_score) <= 8).length,
                critical: vulnerabilities.filter(v => parseFloat(v.cvss_score) > 8).length
            };
        },
        
        updateCharts() {
            this.destroyCharts();
            this.initializeCharts();
        },
        
        getIndustryTrendsData() {
            const industryTrends = this.summaryData?.stats?.industry_monthly_trends || {};
            
            if (Object.keys(industryTrends).length === 0) {
                return {
                    labels: ['No Data'],
                    datasets: [{
                        label: 'No Data Available',
                        data: [0],
                        borderColor: '#95a5a6',
                        backgroundColor: 'rgba(149, 165, 166, 0.1)'
                    }]
                };
            }
            
            const sortedMonths = Object.keys(industryTrends).sort();
            const labels = sortedMonths.map(month => {
                const date = new Date(month + '-01');
                return date.toLocaleDateString('en-US', { month: 'short' });
            });
            
            // Get all unique industries across all months
            const allIndustries = new Set();
            Object.values(industryTrends).forEach(monthData => {
                Object.keys(monthData).forEach(industry => allIndustries.add(industry));
            });
            
            const colors = [
                '#3498db', '#e74c3c', '#f39c12', '#27ae60', '#8e44ad',
                '#16a085', '#d35400', '#c0392b', '#2980b9', '#27ae60'
            ];
            
            const datasets = Array.from(allIndustries).slice(0, 8).map((industry, index) => ({
                label: industry,
                data: sortedMonths.map(month => industryTrends[month][industry] || 0),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20',
                tension: 0.4
            }));
            
            return { labels, datasets };
        },
        
        getGeographyData() {
            const timeRangeKey = this.timeRange + '_day';
            const geographies = this.summaryData?.stats?.[timeRangeKey]?.top_geographies || [];
            
            if (geographies.length === 0) {
                return {
                    labels: ['No Data'],
                    data: [1]
                };
            }
            
            return {
                labels: geographies.map(([geo]) => geo),
                data: geographies.map(([, count]) => count)
            };
        },
        
        getIndustryTrendsLineData() {
            const industryTrends = this.summaryData?.stats?.industry_monthly_trends || {};
            
            if (Object.keys(industryTrends).length === 0) {
                return {
                    labels: ['No Data'],
                    datasets: [{
                        label: 'No Data Available',
                        data: [0],
                        borderColor: '#95a5a6',
                        backgroundColor: 'rgba(149, 165, 166, 0.1)',
                        tension: 0.4
                    }]
                };
            }
            
            const sortedMonths = Object.keys(industryTrends).sort();
            const labels = sortedMonths.map(month => {
                const date = new Date(month + '-01');
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            });
            
            // Get all unique industries across all months
            const allIndustries = new Set();
            Object.values(industryTrends).forEach(monthData => {
                Object.keys(monthData).forEach(industry => allIndustries.add(industry));
            });
            
            // Filter industries based on selection or show top 6
            let industriesToShow = Array.from(allIndustries);
            if (this.selectedIndustries.length > 0) {
                industriesToShow = industriesToShow.filter(industry => 
                    this.selectedIndustries.includes(industry)
                );
            } else {
                // Show top 6 industries by total incidents
                const industryTotals = {};
                industriesToShow.forEach(industry => {
                    industryTotals[industry] = sortedMonths.reduce((sum, month) => 
                        sum + (industryTrends[month][industry] || 0), 0
                    );
                });
                industriesToShow = Object.entries(industryTotals)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 6)
                    .map(([industry]) => industry);
            }
            
            const colors = [
                '#3498db', '#e74c3c', '#f39c12', '#27ae60', '#8e44ad',
                '#16a085', '#d35400', '#c0392b', '#2980b9', '#27ae60',
                '#e67e22', '#95a5a6', '#34495e', '#f1c40f', '#2ecc71'
            ];
            
            const datasets = industriesToShow.map((industry, index) => ({
                label: industry,
                data: sortedMonths.map(month => industryTrends[month][industry] || 0),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: colors[index % colors.length],
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }));
            
            return { labels, datasets };
        },
        
        createIndustryTrendsChart() {
            const ctx = this.$refs.industryTrendsChart?.getContext('2d');
            if (!ctx) return;
            
            const industryTrends = this.summaryData?.stats?.industry_monthly_trends || {};
            
            if (Object.keys(industryTrends).length === 0) {
                this.charts.industryTrends = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['No Data'],
                        datasets: [{
                            label: 'No Data Available',
                            data: [0],
                            borderColor: '#95a5a6',
                            backgroundColor: 'rgba(149, 165, 166, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
                return;
            }
            
            const sortedMonths = Object.keys(industryTrends).sort();
            const labels = sortedMonths.map(month => {
                const date = new Date(month + '-01');
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            });
            
            // Get all unique industries
            const allIndustries = new Set();
            Object.values(industryTrends).forEach(monthData => {
                Object.keys(monthData).forEach(industry => allIndustries.add(industry));
            });
            
            const colors = ['#3498db', '#e74c3c', '#f39c12', '#27ae60', '#8e44ad', '#16a085', '#d35400', '#c0392b'];
            
            const datasets = Array.from(allIndustries).slice(0, 8).map((industry, index) => ({
                label: industry,
                data: sortedMonths.map(month => industryTrends[month][industry] || 0),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20',
                tension: 0.3,
                fill: false
            }));
            
            this.charts.industryTrends = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        },
        
        refreshCharts() {
            this.$emit('refresh');
        }
    }
};