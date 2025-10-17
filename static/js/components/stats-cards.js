/**
 * Stats Cards Component
 * Displays key metrics cards
 */
window.StatsCardsComponent = {
    props: {
        summaryStats: {
            type: Object,
            required: true
        },
        liveStats: {
            type: Object,
            default: () => ({})
        }
    },
    template: `
        <div class="row mb-4">
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="stats-card">
                    <div class="stats-number">[[ totalIncidents ]]</div>
                    <div class="stats-label">Total Incidents</div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="stats-card">
                    <div class="stats-number">[[ totalVulnerabilities ]]</div>
                    <div class="stats-label">Total Vulnerabilities</div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="stats-card">
                    <div class="stats-number">[[ totalThreatActors ]]</div>
                    <div class="stats-label">Total Threat Actors</div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="stats-card">
                    <div class="stats-number severity-high">[[ highSeverityIncidents ]]</div>
                    <div class="stats-label">High Severity Incidents</div>
                </div>
            </div>
        </div>
    `,
    computed: {
        totalIncidents() {
            return this.summaryStats.executive_summary?.total_incidents || 0;
        },
        totalVulnerabilities() {
            return this.summaryStats.executive_summary?.total_vulnerabilities || 0;
        },
        totalThreatActors() {
            return this.summaryStats.executive_summary?.total_threat_actors || 0;
        },
        highSeverityIncidents() {
            return this.summaryStats.executive_summary?.high_severity_incidents || 0;
        }
    }
};