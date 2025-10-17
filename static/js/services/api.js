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
     * Generic file request method with caching
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
        return this.request('incidents.json');
    }

    async getHighlightedIncident() {
        const summary = await this.getFullSummary();
        return summary.stats?.highlighted_incident || null;
    }

    async getVulnerabilities(params = {}) {
        return this.request('vulnerabilities.json');
    }

    async getThreatActors(params = {}) {
        return this.request('threat_actors.json');
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
        return this.request('statistics.json');
    }

    // ============================================================================
    // DASHBOARD DATA ENDPOINTS
    // ============================================================================

    async getDashboardData() {
        return this.request('dashboard.json');
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
