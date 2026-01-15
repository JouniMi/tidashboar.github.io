// Threat Actors Table Component
window.ThreatActorsTableComponent = {
    template: `
        <div class="threat-actors-table">
            <div class="table-header">
                <h3><i class="bi bi-person-badge me-2"></i>Threat Actors</h3>
                <div class="table-controls">
                    <div class="search-container">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text">
                                <i class="bi bi-search"></i>
                            </span>
                            <input 
                                type="text" 
                                v-model="searchQuery" 
                                @input="debouncedFilterThreatActors"
                                placeholder="Search threat actors..." 
                                class="form-control"
                            >
                            <button v-if="searchQuery" @click="clearSearch" class="btn btn-outline-secondary" type="button">
                                <i class="bi bi-x"></i>
                            </button>
                        </div>
                    </div>
                    <select v-model="typeFilter" @change="filterThreatActors" class="form-select form-select-sm">
                        <option value="">All Types</option>
                        <option value="apt">APT</option>
                        <option value="state-sponsored">State-Sponsored</option>
                        <option value="cybercriminal">Cybercriminal</option>
                        <option value="hacktivist">Hacktivist</option>
                        <option value="terrorist">Terrorist</option>
                    </select>
                    <select v-model="motivationFilter" @change="filterThreatActors" class="form-select form-select-sm">
                        <option value="">All Motivations</option>
                        <option value="financial">Financial</option>
                        <option value="espionage">Espionage</option>
                        <option value="political">Political</option>
                        <option value="destruction">Destruction</option>
                        <option value="ideological">Ideological</option>
                    </select>
                    <select v-model="riskFilter" @change="filterThreatActors" class="form-select form-select-sm">
                        <option value="">All Risk Levels</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <button @click="refreshThreatActors" class="btn btn-sm btn-outline-primary" :disabled="loading">
                        <i class="bi bi-arrow-clockwise" :class="{ 'spin-icon': loading }"></i>
                        Refresh
                    </button>
                </div>
            </div>
            
            <div v-if="loading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading threat actors...</span>
                </div>
                <div class="mt-2">Loading threat actors...</div>
            </div>
            
            <div v-else-if="error" class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                [[ error ]]
                <button @click="refreshThreatActors" class="btn btn-sm btn-outline-danger ms-2">Retry</button>
            </div>
            
            <div v-else-if="filteredThreatActors.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-info-circle me-2"></i>
                <span v-if="threatActors.length === 0">No threat actors found</span>
                <span v-else>No threat actors match the selected filters</span>
            </div>
            
            <div v-else class="threat-actors-container">
                <div class="threat-actor-list">
                    <div v-for="actor in paginatedThreatActors" :key="actor.id" class="threat-actor-item">
                        <div class="threat-actor-summary" @click="toggleThreatActor(actor.id)">
                            <div class="threat-actor-main">
                                <div class="threat-actor-title-section">
                                    <h5 class="threat-actor-title">[[ actor.name || 'Unknown' ]]</h5>
                                    <div class="threat-actor-meta">
                                        <span class="badge bg-secondary me-2">[[ actor.source ]]</span>
                                        <span class="text-muted">[[ formatDate(actor.published_date) ]]</span>
                                    </div>
                                </div>
                                <div class="threat-actor-badges">
                                    <span :class="'type-badge me-2 badge bg-' + getTypeColor(actor.type)">
                                        [[ formatType(actor.type) ]]
                                    </span>
                                    <span v-if="actor.motivation" class="badge bg-info me-2">
                                        [[ actor.motivation.toUpperCase() ]]
                                    </span>
                                    <span v-if="actor.overall_risk" :class="'risk-badge me-2 badge bg-' + getRiskColor(actor.overall_risk)">
                                        [[ actor.overall_risk.toUpperCase() ]]
                                    </span>
                                    <i class="bi bi-chevron-down expand-icon" :class="{ 'expanded': expandedThreatActors.includes(actor.id) }"></i>
                                </div>
                            </div>
                            
                            <div class="threat-actor-preview">
                                <div class="row">
                                    <div class="col-md-3" v-if="actor.country_of_origin">
                                        <strong>Country:</strong>
                                        <div class="small text-muted">[[ actor.country_of_origin ]]</div>
                                    </div>
                                    <div class="col-md-3" v-if="actor.malware_families && actor.malware_families.length">
                                        <strong>Malware:</strong>
                                        <div class="small text-muted">
                                            [[ actor.malware_families.slice(0, 2).join(', ') ]]
                                            <span v-if="actor.malware_families.length > 2">+[[ actor.malware_families.length - 2 ]] more</span>
                                        </div>
                                    </div>
                                    <div class="col-md-3" v-if="actor.target_industries && actor.target_industries.length">
                                        <strong>Targets:</strong>
                                        <div class="small text-muted">
                                            [[ actor.target_industries.slice(0, 2).join(', ') ]]
                                            <span v-if="actor.target_industries.length > 2">+[[ actor.target_industries.length - 2 ]] more</span>
                                        </div>
                                    </div>
                                    <div class="col-md-3" v-if="actor.first_seen || actor.last_seen">
                                        <strong>Active:</strong>
                                        <div class="small text-muted">
                                            [[ actor.first_seen || 'Unknown' ]] - [[ actor.last_seen || 'Present' ]]
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div v-show="expandedThreatActors.includes(actor.id)" class="threat-actor-details">
                            <div class="threat-actor-details-content">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6><i class="bi bi-info-circle me-2"></i>Overview</h6>
                                        <p><strong>Title:</strong> [[ actor.title ]]</p>
                                        <p v-if="actor.content_snippet"><strong>Content Snippet:</strong> [[ actor.content_snippet ]]</p>
                                        <p v-if="actor.url"><strong>Source URL:</strong> <a :href="actor.url" target="_blank">[[ actor.url ]]</a></p>
                                        <p v-if="actor.attribution_confidence">
                                            <strong>Attribution Confidence:</strong> 
                                            <span :class="'badge bg-' + getConfidenceColor(actor.attribution_confidence)">[[ actor.attribution_confidence.toUpperCase() ]]</span>
                                        </p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6><i class="bi bi-shield-exclamation me-2"></i>Threat Details</h6>
                                        <p v-if="actor.overall_risk">
                                            <strong>Overall Risk:</strong> 
                                            <span :class="'badge bg-' + getRiskColor(actor.overall_risk)">[[ actor.overall_risk.toUpperCase() ]]</span>
                                        </p>
                                        <p v-if="actor.confidence_level">
                                            <strong>Confidence Level:</strong> [[ actor.confidence_level.toUpperCase() ]]
                                        </p>
                                        <p v-if="actor.sophistication_level">
                                            <strong>Sophistication:</strong> [[ actor.sophistication_level.toUpperCase() ]]
                                        </p>
                                        <p v-if="actor.threat_score !== undefined">
                                            <strong>Threat Score:</strong> [[ actor.threat_score ]]
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-md-6" v-if="actor.aliases && actor.aliases.length">
                                        <h6><i class="bi bi-tags me-2"></i>Aliases</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="alias in actor.aliases" :key="alias" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ alias ]]
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6" v-if="actor.tools && actor.tools.length">
                                        <h6><i class="bi bi-tools me-2"></i>Tools</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="tool in actor.tools" :key="tool" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ tool ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-md-6" v-if="actor.malware_families && actor.malware_families.length">
                                        <h6><i class="bi bi-bug me-2"></i>Malware Families</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="malware in actor.malware_families" :key="malware" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ malware ]]
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6" v-if="actor.tactics && actor.tactics.length">
                                        <h6><i class="bi bi-diagram-3 me-2"></i>Tactics</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="tactic in actor.tactics" :key="tactic" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ tactic ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-md-6" v-if="actor.techniques && actor.techniques.length">
                                        <h6><i class="bi bi-gear me-2"></i>Techniques</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="technique in actor.techniques" :key="technique" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ technique ]]
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6" v-if="actor.attack_patterns && actor.attack_patterns.length">
                                        <h6><i class="bi bi-lightning me-2"></i>Attack Patterns</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="pattern in actor.attack_patterns" :key="pattern" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ pattern ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-md-6" v-if="actor.target_geographies && actor.target_geographies.length">
                                        <h6><i class="bi bi-globe me-2"></i>Target Geographies</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="geography in actor.target_geographies" :key="geography" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ geography ]]
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6" v-if="actor.target_industries && actor.target_industries.length">
                                        <h6><i class="bi bi-building me-2"></i>Target Industries</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="industry in actor.target_industries" :key="industry" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ industry ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-md-6" v-if="actor.primary_objectives && actor.primary_objectives.length">
                                        <h6><i class="bi bi-bullseye me-2"></i>Primary Objectives</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="objective in actor.primary_objectives" :key="objective" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ objective ]]
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6" v-if="actor.campaigns && actor.campaigns.length">
                                        <h6><i class="bi bi-flag me-2"></i>Campaigns</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="campaign in actor.campaigns" :key="campaign" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ campaign ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-12" v-if="actor.known_iocs && actor.known_iocs.length">
                                        <h6><i class="bi bi-exclamation-triangle me-2"></i>Known IOCs</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="ioc in actor.known_iocs" :key="ioc" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ ioc ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-12" v-if="actor.mitigation_recommendations && actor.mitigation_recommendations.length">
                                        <h6><i class="bi bi-shield-check me-2"></i>Mitigation Recommendations</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="recommendation in actor.mitigation_recommendations" :key="recommendation" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ recommendation ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-12" v-if="actor.impact_assessment">
                                        <h6><i class="bi bi-exclamation-diamond me-2"></i>Impact Assessment</h6>
                                        <p>[[ actor.impact_assessment ]]</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Pagination -->
                <div class="d-flex justify-content-between align-items-center mt-4" v-if="totalPages > 1">
                    <div class="text-muted">
                        Showing [[ (currentPage - 1) * itemsPerPage + 1 ]] to [[ Math.min(currentPage * itemsPerPage, filteredThreatActors.length) ]] 
                        of [[ filteredThreatActors.length ]] threat actors
                    </div>
                    <div class="pagination-controls">
                        <button @click="currentPage = 1" :disabled="currentPage === 1" class="btn btn-sm btn-outline-secondary">
                            <i class="bi bi-chevron-double-left"></i>
                        </button>
                        <button @click="currentPage--" :disabled="currentPage === 1" class="btn btn-sm btn-outline-secondary">
                            <i class="bi bi-chevron-left"></i>
                        </button>
                        <span class="mx-3">Page [[ currentPage ]] of [[ totalPages ]]</span>
                        <button @click="currentPage++" :disabled="currentPage === totalPages" class="btn btn-sm btn-outline-secondary">
                            <i class="bi bi-chevron-right"></i>
                        </button>
                        <button @click="currentPage = totalPages" :disabled="currentPage === totalPages" class="btn btn-sm btn-outline-secondary">
                            <i class="bi bi-chevron-double-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    props: {
        threatActors: {
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
            typeFilter: '',
            motivationFilter: '',
            riskFilter: '',
            sortByField: 'published_date',
            sortDirection: 'desc',
            currentPage: 1,
            itemsPerPage: 20,
            expandedThreatActors: [],
            filteredThreatActors: []
        };
    },
    
    computed: {
        paginatedThreatActors() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.filteredThreatActors.slice(start, end);
        },
        
        totalPages() {
            return Math.ceil(this.filteredThreatActors.length / this.itemsPerPage);
        }
    },
    
    watch: {
        threatActors: {
            handler() {
                this.filterThreatActors();
            },
            immediate: true
        }
    },

    created() {
        this.debouncedFilterThreatActors = Utils.debounce(this.filterThreatActors, 300);
    },

    methods: {
        filterThreatActors() {
            let filtered = [...(this.threatActors || [])];
            
            // Apply search filter
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(actor => {
                    // Search in name
                    if (actor.name && actor.name.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in title
                    if (actor.title && actor.title.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in content snippet
                    if (actor.content_snippet && actor.content_snippet.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in source
                    if (actor.source && actor.source.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in type
                    if (actor.type && actor.type.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in motivation
                    if (actor.motivation && actor.motivation.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in country
                    if (actor.country_of_origin && actor.country_of_origin.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in aliases
                    if (actor.aliases && actor.aliases.some(alias => 
                        alias.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in malware families
                    if (actor.malware_families && actor.malware_families.some(malware => 
                        malware.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in tools
                    if (actor.tools && actor.tools.some(tool => 
                        tool.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in tactics
                    if (actor.tactics && actor.tactics.some(tactic => 
                        tactic.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in techniques
                    if (actor.techniques && actor.techniques.some(technique => 
                        technique.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in target industries
                    if (actor.target_industries && actor.target_industries.some(industry => 
                        industry.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in target geographies
                    if (actor.target_geographies && actor.target_geographies.some(geography => 
                        geography.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in campaigns
                    if (actor.campaigns && actor.campaigns.some(campaign => 
                        campaign.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in IOCs
                    if (actor.known_iocs && actor.known_iocs.some(ioc => 
                        ioc.toLowerCase().includes(query))) {
                        return true;
                    }
                    return false;
                });
            }
            
            if (this.typeFilter) {
                filtered = filtered.filter(actor => 
                    actor.type && actor.type.toLowerCase().includes(this.typeFilter.toLowerCase())
                );
            }
            
            if (this.motivationFilter) {
                filtered = filtered.filter(actor => 
                    actor.motivation && actor.motivation.toLowerCase().includes(this.motivationFilter.toLowerCase())
                );
            }
            
            if (this.riskFilter) {
                filtered = filtered.filter(actor => actor.overall_risk === this.riskFilter);
            }
            
            this.filteredThreatActors = this.sortThreatActors(filtered);
            this.currentPage = 1;
        },
        
        sortThreatActors(actors) {
            return actors.sort((a, b) => {
                let aVal = a[this.sortByField];
                let bVal = b[this.sortByField];
                
                // Handle different data types
                if (this.sortByField === 'published_date' || this.sortByField === 'first_seen' || this.sortByField === 'last_seen') {
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
            this.filterThreatActors();
        },
        
        refreshThreatActors() {
            this.$emit('refresh');
        },
        
        toggleThreatActor(actorId) {
            const index = this.expandedThreatActors.indexOf(actorId);
            if (index > -1) {
                this.expandedThreatActors.splice(index, 1);
            } else {
                this.expandedThreatActors.push(actorId);
            }
        },
        
        getTypeColor(type) {
            switch (type?.toLowerCase()) {
                case 'apt':
                case 'state-sponsored': return 'danger';
                case 'cybercriminal': return 'warning';
                case 'hacktivist': return 'info';
                case 'terrorist': return 'dark';
                default: return 'secondary';
            }
        },
        
        formatType(type) {
            if (!type) return 'UNKNOWN';
            return type.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
        
        getConfidenceColor(confidence) {
            switch (confidence?.toLowerCase()) {
                case 'high': return 'success';
                case 'medium': return 'warning';
                case 'low': return 'danger';
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
            this.filterThreatActors();
        }
    }
};