// Main Vue.js Application
const { createApp } = Vue;

// API Service
const apiService = window.apiService;

// Chart Service
const chartService = window.chartsService;

// Main Application
const app = createApp({
    
    data() {
        return {
            // Loading states
            loading: false,
            
            // Error states
            error: null,
            
            // Data
            summaryData: {},
            incidents: [],
            vulnerabilities: [],
            threatActors: [],
            statisticsData: {},
            chartData: {},
            liveStats: {},
            charts: {},
            
            // UI state
            activeTab: 'overview',
            lastUpdated: 'Never'
        };
    },
    
    mounted() {
        console.log('Vue app mounted, loading data...');
        this.refreshData();
        this.initializeAnalytics();
    },
    
    methods: {
        async refreshData() {
            this.loading = true;
            this.error = null;
            
            try {
                // Load all data in parallel
                await Promise.all([
                    this.loadSummaryData(),
                    this.loadIncidents(),
                    this.loadVulnerabilities(),
                    this.loadThreatActors(),
                    this.loadStatisticsData()
                ]);
                
                this.updateLastUpdated();
            } catch (error) {
                console.error('Failed to refresh data:', error);
                this.error = 'Failed to load dashboard data. Please try again.';
            } finally {
                this.loading = false;
                // Initialize analytics if on analytics tab
                if (this.activeTab === 'analytics' && this.statisticsData) {
                    this.$nextTick(() => {
                        this.createAllCharts();
                    });
                }
            }
        },
        
        async loadSummaryData() {
            try {
                // Load both summary and dashboard data
                const [summaryData, dashboardData] = await Promise.all([
                    apiService.getFullSummary(),
                    apiService.getDashboardData()
                ]);
                
                // Map the API response to what components expect
                this.summaryData = {
                    ...summaryData,
                    ...dashboardData,
                    executiveSummary: summaryData.summary, // Map 'summary' to 'executiveSummary'
                    generatedAt: summaryData.generated_at,
                    total_documents_7d: summaryData.stats?.['7_day']?.total_documents || 0,
                    high_impact_vulnerabilities: summaryData.high_impact_vulnerabilities?.length || 0,
                    high_impact_incidents: summaryData.high_impact_incidents?.length || 0,
                    ransomware_targets: summaryData.ransomware_targets?.length || 0
                };
            } catch (error) {
                console.error('Failed to load summary data:', error);
                throw error;
            }
        },
        
        async loadIncidents() {
            try {
                const response = await apiService.getIncidents({ limit: 2000 });
                this.incidents = response.incidents || [];
            } catch (error) {
                console.error('Failed to load incidents data:', error);
                this.incidents = [];
            }
        },
        
        async loadVulnerabilities() {
            try {
                const response = await apiService.getVulnerabilities({ limit: 2000 });
                this.vulnerabilities = response.vulnerabilities || [];
            } catch (error) {
                console.error('Failed to load vulnerabilities data:', error);
                this.vulnerabilities = [];
            }
        },
        
        async loadThreatActors() {
            try {
                const response = await apiService.getThreatActors({ limit: 2000 });
                this.threatActors = response.threat_actors || [];
            } catch (error) {
                console.error('Failed to load threat actors:', error);
                this.threatActors = [];
            }
        },
        
        async loadStatisticsData() {
            try {
                this.statisticsData = await apiService.getOverviewStatistics();
                console.log('Statistics data loaded:', this.statisticsData);
            } catch (error) {
                console.error('Failed to load statistics data:', error);
                this.statisticsData = {};
            }
        },
        
        updateLastUpdated() {
            this.lastUpdated = new Date().toLocaleString();
        },
        
        formatDateTime(dateString) {
            if (!dateString) return 'Unknown';
            return new Date(dateString).toLocaleString();
        },
        
        formatDate(dateString) {
            if (!dateString) return 'Unknown';
            return new Date(dateString).toLocaleDateString();
        },
        
        async loadAllData() {
            await this.refreshData();
        },
        
        // Analytics methods
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
        },
        
        // Analytics chart methods
        initializeAnalytics() {
            console.log('Initializing analytics...');
            
            // Watch for tab changes
            this.$watch('activeTab', (newTab) => {
                console.log('Tab changed to:', newTab);
                console.log('Statistics data available:', !!this.statisticsData);
                
                if (newTab === 'analytics' && this.statisticsData) {
                    console.log('Analytics tab activated, creating charts...');
                    this.$nextTick(() => {
                        setTimeout(() => {
                            this.createAllCharts();
                        }, 100); // Small delay to ensure DOM is ready
                    });
                }
            });
        },
        
        createAllCharts() {
            console.log('Creating all charts...');
            console.log('Statistics data available:', !!this.statisticsData);
            
            if (!this.statisticsData) {
                console.log('No statistics data available');
                return;
            }
            
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
            
            console.log('All charts creation attempted');
        },
        
        destroyAllCharts() {
            if (this.charts) {
                Object.values(this.charts).forEach(chart => {
                    if (chart) chart.destroy();
                });
                this.charts = {};
            }
        },
        
        createIncidentTypesChart() {
            console.log('Creating incident types chart...');
            const ctx = this.$refs.incidentTypesChart;
            console.log('Canvas context:', ctx);
            console.log('Statistics data:', this.statisticsData);
            
            if (!ctx) {
                console.log('No canvas context found');
                return;
            }
            
            if (!this.statisticsData.incidents?.incident_types) {
                console.log('No incident types data found');
                return;
            }
            
            const data = this.statisticsData.incidents.incident_types;
            const labels = data.map(item => item[0].replace(/\|/g, ' + '));
            const values = data.map(item => item[1]);
            
            console.log('Chart data:', { labels, values });
            
            this.charts = this.charts || {};
            this.charts.incidentTypes = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            
            console.log('Incident types chart created successfully');
        },
        
        createIncidentSeverityChart() {
            const ctx = this.$refs.incidentSeverityChart;
            if (!ctx || !this.statisticsData.incidents?.severities) return;
            
            const data = this.statisticsData.incidents.severities;
            const labels = data.map(item => item[0]);
            const values = data.map(item => item[1]);
            
            this.charts = this.charts || {};
            this.charts.incidentSeverity = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#28a745'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        },
        
        createIncidentTimelineChart() {
            const ctx = this.$refs.incidentTimelineChart;
            if (!ctx || !this.statisticsData.incidents?.timeline) return;
            
            const timeline = this.statisticsData.incidents.timeline;
            const recentData = timeline.filter(item => item[1] > 0).slice(-20);
            const labels = recentData.map(item => {
                const date = new Date(item[0]);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
            const values = recentData.map(item => item[1]);
            
            this.charts = this.charts || {};
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
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        },
        
        createCvssDistributionChart() {
            const ctx = this.$refs.cvssDistributionChart;
            if (!ctx || !this.statisticsData.vulnerabilities?.cvss_distribution) return;
            
            const data = this.statisticsData.vulnerabilities.cvss_distribution;
            const labels = data.map(item => `CVSS ${item[0]}`);
            const values = data.map(item => item[1]);
            
            this.charts = this.charts || {};
            this.charts.cvssDistribution = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Vulnerabilities',
                        data: values,
                        backgroundColor: '#36A2EB'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        },
        
        createVendorVulnerabilitiesChart() {
            const ctx = this.$refs.vendorVulnerabilitiesChart;
            if (!ctx || !this.statisticsData.vulnerabilities?.vendors) return;
            
            const data = this.statisticsData.vulnerabilities.vendors.slice(0, 10);
            const labels = data.map(item => item[0]);
            const values = data.map(item => item[1]);
            
            this.charts = this.charts || {};
            this.charts.vendorVulnerabilities = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Vulnerabilities',
                        data: values,
                        backgroundColor: '#dc3545'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        },
        
        createMotivationsChart() {
            const ctx = this.$refs.motivationsChart;
            if (!ctx || !this.statisticsData.threat_actors?.motivations) return;
            
            const motivations = this.statisticsData.threat_actors.motivations;
            const filteredData = Object.entries(motivations).filter(([key, value]) => key && value > 0);
            const labels = filteredData.map(item => item[0].replace(/\|/g, ' + '));
            const values = filteredData.map(item => item[1]);
            
            this.charts = this.charts || {};
            this.charts.motivations = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
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
            
            this.charts = this.charts || {};
            this.charts.countries = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        },
        
        createMalwareFamiliesChart() {
            const ctx = this.$refs.malwareFamiliesChart;
            if (!ctx || !this.statisticsData.threat_actors?.top_malware_families) return;
            
            const malware = this.statisticsData.threat_actors.top_malware_families;
            const labels = Object.keys(malware);
            const values = Object.values(malware);
            
            this.charts = this.charts || {};
            this.charts.malwareFamilies = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Incidents',
                        data: values,
                        backgroundColor: '#dc3545'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        },
        
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
        }
    }
});

// Configure Vue delimiters for compatibility with Jinja2
app.config.compilerOptions.delimiters = ['[[', ']]'];

// Register components
app.component('executive-summary', window.ExecutiveSummaryComponent);
app.component('stats-cards', window.StatsCardsComponent);
app.component('incidents-table', window.IncidentsTableComponent);
app.component('vulnerabilities-table', window.VulnerabilitiesTableComponent);
app.component('threat-actors-table', window.ThreatActorsTableComponent);
app.component('charts-container', window.ChartsContainerComponent);

// Mount the application
app.mount('#app');

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Service Worker registration (for PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/js/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + R to refresh all data
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (window.app && window.app.refreshAll) {
            window.app.refreshAll();
        }
    }
    
    // Escape to close modals
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.click();
        });
    }
});

// Auto-refresh functionality (optional)
let autoRefreshInterval;
let autoRefreshEnabled = false;

function toggleAutoRefresh() {
    if (autoRefreshEnabled) {
        clearInterval(autoRefreshInterval);
        autoRefreshEnabled = false;
        console.log('Auto-refresh disabled');
    } else {
        autoRefreshInterval = setInterval(() => {
            if (window.app && window.app.refreshAll) {
                console.log('Auto-refreshing dashboard...');
                window.app.refreshAll();
            }
        }, 300000); // Refresh every 5 minutes
        autoRefreshEnabled = true;
        console.log('Auto-refresh enabled (every 5 minutes)');
    }
}

// Make app instance globally available for debugging
window.app = app.config.globalProperties.$root;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = app;
}