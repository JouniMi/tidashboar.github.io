/**
 * Static File Service for Cybersecurity Threat Intelligence Dashboard v2
 * Handles all communication with static JSON files for GitHub Pages compatibility
 */
class ApiService {
    constructor() {
        this.baseUrl = '';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        // Auto-detect base path for GitHub Pages compatibility
        this.guiPath = this.detectGuiPath();
    }

    /**
     * Detect the correct GUI path for GitHub Pages deployment
     */
    detectGuiPath() {
        // Use relative path to work regardless of deployment URL
        return './gui/';
    }

    /**
     * Generic file request method with caching and validation
     */
    async request(filename, options = {}) {
        const cacheKey = `${filename}${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await fetch(`${this.guiPath}${filename}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Validate response structure
            if (window.validator && !window.validator.isSafeToRender(data)) {
                console.warn(`Data from ${filename} may contain unsafe values, proceeding with caution`);
            }

            // Cache the response
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error(`File request failed for ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    // ============================================================================
    // SUMMARY ENDPOINTS (from JSON file)
    // ============================================================================

    async getFullSummary() {
        return this.request('latest_summary.json');
    }

    async getExecutiveSummary() {
        const summary = await this.getFullSummary();
        return { summary: summary.summary };
    }

    async getSummaryStats() {
        const summary = await this.getFullSummary();
        return summary.stats;
    }

    // ============================================================================
    // STATIC DATA ENDPOINTS (from JSON files)
    // ============================================================================

    async getIncidents(params = {}) {
        const response = await this.request('incidents.json');

        // Validate incidents if validator available
        if (window.validator && response.incidents) {
            response.incidents = response.incidents.map(incident => {
                const validation = window.validator.validateIncident(incident);
                if (!validation.valid) {
                    console.warn('Invalid incident detected:', incident, validation.errors);
                }
                return incident;
            });
        }

        return response;
    }

    async getHighlightedIncident() {
        const summary = await this.getFullSummary();
        return summary.stats?.highlighted_incident || null;
    }

    async getVulnerabilities(params = {}) {
        const response = await this.request('vulnerabilities.json');

        // Validate vulnerabilities if validator available
        if (window.validator && response.vulnerabilities) {
            response.vulnerabilities = response.vulnerabilities.map(vuln => {
                const validation = window.validator.validateVulnerability(vuln);
                if (!validation.valid) {
                    console.warn('Invalid vulnerability detected:', vuln, validation.errors);
                }
                return vuln;
            });
        }

        return response;
    }

    async getThreatActors(params = {}) {
        const response = await this.request('threat_actors.json');

        // Validate threat actors if validator available
        if (window.validator && response.threat_actors) {
            response.threat_actors = response.threat_actors.map(actor => {
                const validation = window.validator.validateThreatActor(actor);
                if (!validation.valid) {
                    console.warn('Invalid threat actor detected:', actor, validation.errors);
                }
                return actor;
            });
        }

        return response;
    }

    // ============================================================================
    // STATISTICS ENDPOINTS
    // ============================================================================

    async getIncidentStatistics() {
        const stats = await this.request('statistics.json');
        return stats.incidents;
    }

    async getVulnerabilityStatistics() {
        const stats = await this.request('statistics.json');
        return stats.vulnerabilities;
    }

    async getThreatActorStatistics() {
        const stats = await this.request('statistics.json');
        return stats.threat_actors;
    }

    async getOverviewStatistics() {
        const response = await this.request('statistics.json');

        // Validate statistics structure if validator available
        if (window.validator) {
            const validation = window.validator.validateStatistics(response);
            if (!validation.valid) {
                console.warn('Invalid statistics data detected:', validation.errors);
            }
        }

        return response;
    }


    // ============================================================================
    // DASHBOARD DATA ENDPOINTS
    // ============================================================================

    async getDashboardData() {
        return this.request('dashboard.json');
    }

    async getBreakingNews() {
        return this.request('breaking_news.json');
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Load all initial data for dashboard
     */
    async loadInitialData() {
        try {
            const [summaryStats, overviewStats, highlightedIncident] = await Promise.all([
                this.getSummaryStats(),
                this.getOverviewStatistics(),
                this.getHighlightedIncident().catch(() => null)
            ]);

            return {
                summaryStats,
                overviewStats,
                highlightedIncident
            };
        } catch (error) {
            console.error('Failed to load initial data:', error);
            throw error;
        }
    }

    /**
     * Load tab-specific data
     */
    async loadTabData(tab, params = {}) {
        switch (tab) {
            case 'incidents':
                return this.getIncidents(params);
            case 'vulnerabilities':
                return this.getVulnerabilities(params);
            case 'threat-actors':
                return this.getThreatActors(params);
            case 'analytics':
                return this.getOverviewStatistics();
            default:
                return {};
        }
    }

    /**
     * Search across all data types
     */
    async search(query, filters = {}) {
        try {
            const [incidents, vulnerabilities, threatActors] = await Promise.all([
                this.getIncidents(filters),
                this.getVulnerabilities(filters),
                this.getThreatActors(filters)
            ]);

            return {
                incidents: incidents.incidents || [],
                vulnerabilities: vulnerabilities.vulnerabilities || [],
                threatActors: threatActors.threat_actors || []
            };
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }
}

// Global API service instance
window.apiService = new ApiService();
