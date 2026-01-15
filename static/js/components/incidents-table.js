// Incidents Table Component
window.IncidentsTableComponent = {
    template: `
        <div class="incidents-table" role="region" aria-labelledby="incidents-heading">
            <div class="table-header">
                <h3 id="incidents-heading"><span aria-hidden="true"><i class="bi bi-exclamation-triangle me-2"></i></span>Security Incidents</h3>
                <div class="table-controls">
                    <div class="search-container">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text" aria-hidden="true">
                                <i class="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                v-model="searchQuery"
                                @input="debouncedFilterIncidents"
                                @keydown.enter="filterIncidents"
                                placeholder="Search incidents..."
                                class="form-control"
                                aria-label="Search incidents"
                                id="incidents-search"
                            >
                            <button v-if="searchQuery" @click="clearSearch" class="btn btn-outline-secondary" type="button" aria-label="Clear search">
                                <i class="bi bi-x" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    <select v-model="severityFilter" @change="filterIncidents" class="form-select form-select-sm" aria-label="Filter by severity" id="severity-filter">
                        <option value="">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <select v-model="typeFilter" @change="filterIncidents" class="form-select form-select-sm" aria-label="Filter by incident type" id="type-filter">
                        <option value="">All Types</option>
                        <option value="phishing">Phishing</option>
                        <option value="data_breach">Data Breach</option>
                        <option value="malware">Malware</option>
                        <option value="ransomware">Ransomware</option>
                        <option value="ddos">DDoS</option>
                        <option value="insider_threat">Insider Threat</option>
                    </select>
                    <button @click="refreshIncidents" class="btn btn-sm btn-outline-primary" :disabled="loading" aria-label="Refresh incidents list">
                        <i class="bi bi-arrow-clockwise" :class="{ 'spin-icon': loading }" aria-hidden="true"></i>
                        <span class="visually-hidden">Refresh</span>
                    </button>
                </div>
            </div>

            <div v-if="loading" class="text-center py-4" role="status" aria-live="polite" aria-busy="true">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading incidents...</span>
                </div>
                <div class="mt-2">Loading incidents...</div>
            </div>

            <div v-else-if="error" class="alert alert-danger" role="alert" aria-live="assertive">
                <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
                [[ error ]]
                <button @click="refreshIncidents" class="btn btn-sm btn-outline-danger ms-2" aria-label="Retry loading incidents">Retry</button>
            </div>

            <div v-else-if="filteredIncidents.length === 0" class="text-center py-4 text-muted" role="status" aria-live="polite">
                <i class="bi bi-info-circle me-2" aria-hidden="true"></i>
                <span v-if="incidents.length === 0">No incidents found</span>
                <span v-else>No incidents match the selected filters</span>
            </div>

            <div v-else class="incidents-container" role="list" aria-label="Incidents list">
                <div class="incident-list">
                    <div v-for="incident in paginatedIncidents" :key="incident.id" class="incident-item" role="listitem">
                        <div class="incident-summary"
                             @click="toggleIncident(incident.id)"
                             @keydown.enter="toggleIncident(incident.id)"
                             @keydown.space.prevent="toggleIncident(incident.id)"
                             :tabindex="0"
                             :aria-expanded="expandedIncidents.includes(incident.id)"
                             :aria-controls="'incident-details-' + incident.id">
                            <div class="incident-main">
                                <div class="incident-title-section">
                                    <h5 class="incident-title">[[ incident.title ]]</h5>
                                    <div class="incident-meta">
                                        <span class="badge bg-secondary me-2">[[ incident.source ]]</span>
                                        <span class="text-muted">[[ formatDate(incident.published_date) ]]</span>
                                    </div>
                                </div>
                                <div class="incident-badges">
                                    <span :class="'severity-badge me-2 badge bg-' + getSeverityColor(incident.severity)">
                                        [[ incident.severity.toUpperCase() ]]
                                    </span>
                                    <span class="badge bg-info me-2">[[ incident.incident_type?.replace('_', ' ').toUpperCase() || 'UNKNOWN' ]]</span>
                                    <i class="bi bi-chevron-down expand-icon" :class="{ 'expanded': expandedIncidents.includes(incident.id) }" aria-hidden="true"></i>
                                </div>
                            </div>
                            
                            <div class="incident-preview">
                                <div class="row">
                                    <div class="col-md-3" v-if="incident.attack_vectors && incident.attack_vectors.length">
                                        <strong>Attack Vectors:</strong>
                                        <div class="small text-muted">
                                            [[ incident.attack_vectors.slice(0, 2).join(', ') ]]
                                            <span v-if="incident.attack_vectors.length > 2">+[[ incident.attack_vectors.length - 2 ]] more</span>
                                        </div>
                                    </div>
                                    <div class="col-md-3" v-if="incident.affected_companies && incident.affected_companies.length">
                                        <strong>Affected:</strong>
                                        <div class="small text-muted">
                                            [[ incident.affected_companies.slice(0, 2).join(', ') ]]
                                            <span v-if="incident.affected_companies.length > 2">+[[ incident.affected_companies.length - 2 ]] more</span>
                                        </div>
                                    </div>
                                    <div class="col-md-3" v-if="incident.threat_actors && incident.threat_actors.length">
                                        <strong>Threat Actors:</strong>
                                        <div class="small text-muted">
                                            [[ incident.threat_actors.slice(0, 2).join(', ') ]]
                                            <span v-if="incident.threat_actors.length > 2">+[[ incident.threat_actors.length - 2 ]] more</span>
                                        </div>
                                    </div>
                                    <div class="col-md-3" v-if="incident.confirmed_breach">
                                        <strong>Confirmed Breach:</strong>
                                        <div class="small">
                                            <span class="badge" :class="incident.confirmed_breach === 'yes' ? 'bg-danger' : 'bg-secondary'">
                                                [[ incident.confirmed_breach.toUpperCase() ]]
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-show="expandedIncidents.includes(incident.id)"
                             :id="'incident-details-' + incident.id"
                             class="incident-details"
                             role="region"
                             aria-label="Incident details">
                            <div class="incident-details-content">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6><i class="bi bi-info-circle me-2"></i>Overview</h6>
                                        <p><strong>Content Snippet:</strong> [[ incident.content_snippet ]]</p>
                                        <p v-if="incident.url"><strong>Source URL:</strong> <a :href="incident.url" target="_blank">[[ incident.url ]]</a></p>
                                        <p v-if="incident.financial_impact && incident.financial_impact !== 'unknown'">
                                            <strong>Financial Impact:</strong> [[ incident.financial_impact ]]
                                        </p>
                                        <p v-if="incident.customer_impact">
                                            <strong>Customer Impact:</strong> [[ incident.customer_impact ]]
                                        </p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6><i class="bi bi-shield-exclamation me-2"></i>Security Details</h6>
                                        <p v-if="incident.overall_risk">
                                            <strong>Overall Risk:</strong> 
                                            <span :class="'badge bg-' + getRiskColor(incident.overall_risk)">[[ incident.overall_risk.toUpperCase() ]]</span>
                                        </p>
                                        <p v-if="incident.confidence_level">
                                            <strong>Confidence:</strong> [[ incident.confidence_level.toUpperCase() ]]
                                        </p>
                                        <p v-if="incident.attack_sophistication">
                                            <strong>Attack Sophistication:</strong> [[ incident.attack_sophistication.toUpperCase() ]]
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-md-6" v-if="incident.attack_vectors && incident.attack_vectors.length">
                                        <h6><i class="bi bi-arrow-right-circle me-2"></i>Attack Vectors</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="vector in incident.attack_vectors" :key="vector" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ vector ]]
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6" v-if="incident.affected_companies && incident.affected_companies.length">
                                        <h6><i class="bi bi-building me-2"></i>Affected Companies</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="company in incident.affected_companies" :key="company" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ company ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-md-6" v-if="incident.threat_actors && incident.threat_actors.length">
                                        <h6><i class="bi bi-person-badge me-2"></i>Threat Actors</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="actor in incident.threat_actors" :key="actor" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ actor ]]
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6" v-if="incident.data_compromised && incident.data_compromised.length">
                                        <h6><i class="bi bi-database-exclamation me-2"></i>Data Compromised</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="data in incident.data_compromised" :key="data" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ data ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-md-6" v-if="incident.mitre_techniques && incident.mitre_techniques.length">
                                        <h6><i class="bi bi-diagram-3 me-2"></i>MITRE Techniques</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="technique in incident.mitre_techniques" :key="technique" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ technique ]]
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6" v-if="incident.indicators && (incident.indicators.domains?.length || incident.indicators.urls?.length || incident.indicators.ip_addresses?.length)">
                                        <h6><i class="bi bi-flag me-2"></i>Indicators of Compromise</h6>
                                        <div v-if="incident.indicators.domains?.length">
                                            <strong>Domains:</strong>
                                            <ul class="list-unstyled">
                                                <li v-for="domain in incident.indicators.domains" :key="domain" class="mb-1">
                                                    <i class="bi bi-chevron-right text-muted me-1"></i>[[ domain ]]
                                                </li>
                                            </ul>
                                        </div>
                                        <div v-if="incident.indicators.urls?.length">
                                            <strong>URLs:</strong>
                                            <ul class="list-unstyled">
                                                <li v-for="url in incident.indicators.urls" :key="url" class="mb-1">
                                                    <i class="bi bi-chevron-right text-muted me-1"></i>[[ url ]]
                                                </li>
                                            </ul>
                                        </div>
                                        <div v-if="incident.indicators.ip_addresses?.length">
                                            <strong>IP Addresses:</strong>
                                            <ul class="list-unstyled">
                                                <li v-for="ip in incident.indicators.ip_addresses" :key="ip" class="mb-1">
                                                    <i class="bi bi-chevron-right text-muted me-1"></i>[[ ip ]]
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-12" v-if="incident.security_recommendations && incident.security_recommendations.length">
                                        <h6><i class="bi bi-shield-check me-2"></i>Security Recommendations</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="recommendation in incident.security_recommendations" :key="recommendation" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ recommendation ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-12" v-if="incident.lessons_learned && incident.lessons_learned.length">
                                        <h6><i class="bi bi-lightbulb me-2"></i>Lessons Learned</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="lesson in incident.lessons_learned" :key="lesson" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ lesson ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Pagination -->
                <nav class="d-flex justify-content-between align-items-center mt-4" v-if="totalPages > 1" aria-label="Pagination navigation">
                    <div class="text-muted" aria-live="polite">
                        Showing [[ (currentPage - 1) * itemsPerPage + 1 ]] to [[ Math.min(currentPage * itemsPerPage, filteredIncidents.length) ]]
                        of [[ filteredIncidents.length ]] incidents
                    </div>
                    <div class="pagination-controls" role="navigation" aria-label="Page navigation">
                        <button @click="currentPage = 1"
                                :disabled="currentPage === 1"
                                class="btn btn-sm btn-outline-secondary"
                                :aria-label="'Go to first page'">
                            <i class="bi bi-chevron-double-left" aria-hidden="true"></i>
                        </button>
                        <button @click="currentPage--"
                                :disabled="currentPage === 1"
                                class="btn btn-sm btn-outline-secondary"
                                :aria-label="'Go to previous page'">
                            <i class="bi bi-chevron-left" aria-hidden="true"></i>
                        </button>
                        <span class="mx-3" aria-current="page">Page [[ currentPage ]] of [[ totalPages ]]</span>
                        <button @click="currentPage++"
                                :disabled="currentPage === totalPages"
                                class="btn btn-sm btn-outline-secondary"
                                :aria-label="'Go to next page'">
                            <i class="bi bi-chevron-right" aria-hidden="true"></i>
                        </button>
                        <button @click="currentPage = totalPages"
                                :disabled="currentPage === totalPages"
                                class="btn btn-sm btn-outline-secondary"
                                :aria-label="'Go to last page'">
                            <i class="bi bi-chevron-double-right" aria-hidden="true"></i>
                        </button>
                    </div>
                </nav>
            </div>
        </div>
    `,
    
    props: {
        incidents: {
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
            searchQuery: '',
            severityFilter: '',
            typeFilter: '',
            sortByField: 'published_date',
            sortDirection: 'desc',
            currentPage: 1,
            itemsPerPage: 20,
            expandedIncidents: [],
            filteredIncidents: []
        };
    },
    
    computed: {
        paginatedIncidents() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.filteredIncidents.slice(start, end);
        },
        
        totalPages() {
            return Math.ceil(this.filteredIncidents.length / this.itemsPerPage);
        }
    },
    
    watch: {
        incidents: {
            handler() {
                this.filterIncidents();
            },
            immediate: true
        }
    },

    created() {
        this.debouncedFilterIncidents = Utils.debounce(this.filterIncidents, 300);
    },

    methods: {
        filterIncidents() {
            let filtered = [...(this.incidents || [])];
            
            // Apply search filter
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(incident => {
                    // Search in title
                    if (incident.title && incident.title.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in content snippet
                    if (incident.content_snippet && incident.content_snippet.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in source
                    if (incident.source && incident.source.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in severity
                    if (incident.severity && incident.severity.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in incident type
                    if (incident.incident_type && incident.incident_type.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in attack vectors
                    if (incident.attack_vectors && incident.attack_vectors.some(vector => 
                        vector.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in affected companies
                    if (incident.affected_companies && incident.affected_companies.some(company => 
                        company.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in threat actors
                    if (incident.threat_actors && incident.threat_actors.some(actor => 
                        actor.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in data compromised
                    if (incident.data_compromised && incident.data_compromised.some(data => 
                        data.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in MITRE techniques
                    if (incident.mitre_techniques && incident.mitre_techniques.some(technique => 
                        technique.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in indicators (domains, URLs, IPs)
                    if (incident.indicators) {
                        if (incident.indicators.domains && incident.indicators.domains.some(domain => 
                            domain.toLowerCase().includes(query))) {
                            return true;
                        }
                        if (incident.indicators.urls && incident.indicators.urls.some(url => 
                            url.toLowerCase().includes(query))) {
                            return true;
                        }
                        if (incident.indicators.ip_addresses && incident.indicators.ip_addresses.some(ip => 
                            ip.toLowerCase().includes(query))) {
                            return true;
                        }
                    }
                    // Search in security recommendations
                    if (incident.security_recommendations && incident.security_recommendations.some(rec => 
                        rec.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in lessons learned
                    if (incident.lessons_learned && incident.lessons_learned.some(lesson => 
                        lesson.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in financial impact
                    if (incident.financial_impact && incident.financial_impact.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in customer impact
                    if (incident.customer_impact && incident.customer_impact.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in overall risk
                    if (incident.overall_risk && incident.overall_risk.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in confidence level
                    if (incident.confidence_level && incident.confidence_level.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in attack sophistication
                    if (incident.attack_sophistication && incident.attack_sophistication.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in confirmed breach
                    if (incident.confirmed_breach && incident.confirmed_breach.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in URL
                    if (incident.url && incident.url.toLowerCase().includes(query)) {
                        return true;
                    }
                    return false;
                });
            }
            
            if (this.severityFilter) {
                filtered = filtered.filter(incident => incident.severity === this.severityFilter);
            }
            
            if (this.typeFilter) {
                filtered = filtered.filter(incident => incident.incident_type === this.typeFilter);
            }
            
            this.filteredIncidents = this.sortIncidents(filtered);
            this.currentPage = 1;
        },
        
        sortIncidents(incidents) {
            return incidents.sort((a, b) => {
                let aVal = a[this.sortByField];
                let bVal = b[this.sortByField];
                
                // Handle different data types
                if (this.sortByField === 'date') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }
                
                if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        },
        
        sortBy(field) {
            if (this.sortByField === field) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortByField = field;
                this.sortDirection = 'asc';
            }
            this.filterIncidents();
        },
        
        getSortIcon(field) {
            if (this.sortByField !== field) return 'fa-sort';
            return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
        },
        
        refreshIncidents() {
            this.$emit('refresh');
        },
        
        toggleIncident(incidentId) {
            const index = this.expandedIncidents.indexOf(incidentId);
            if (index > -1) {
                this.expandedIncidents.splice(index, 1);
            } else {
                this.expandedIncidents.push(incidentId);
            }
        },
        
        getSeverityColor(severity) {
            switch (severity?.toLowerCase()) {
                case 'critical': return 'danger';
                case 'high': return 'warning';
                case 'medium': return 'info';
                case 'low': return 'success';
                default: return 'secondary';
            }
        },
        
        getRiskColor(risk) {
            switch (risk?.toLowerCase()) {
                case 'critical': return 'danger';
                case 'high': return 'warning';
                case 'medium': return 'info';
                case 'low': return 'success';
                default: return 'secondary';
            }
        },
        
        formatDate(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        },
        
        truncateText(text, maxLength) {
            if (!text) return '';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        },
        
        clearSearch() {
            this.searchQuery = '';
            this.filterIncidents();
        }
    },
    

};