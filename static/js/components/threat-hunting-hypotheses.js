// Threat Hunting Hypotheses Table Component
window.ThreatHuntingHypothesesComponent = {
    template: `
        <div class="threat-hunting-hypotheses" role="region" aria-labelledby="hypotheses-heading">
            <div class="table-header">
                <h3 id="hypotheses-heading"><span aria-hidden="true"><i class="bi bi-bullseye me-2"></i></span>Threat Hunting Hypotheses</h3>
                <div class="hypotheses-meta mb-3" v-if="hypothesesData.generated_at">
                    <span class="badge bg-secondary me-2">
                        <i class="bi bi-calendar me-1"></i>Generated: [[ formatDateTime(hypothesesData.generated_at) ]]
                    </span>
                    <span class="badge bg-info me-2">
                        <i class="bi bi-clock me-1"></i>Time Window: [[ hypothesesData.time_window ]]
                    </span>
                    <span class="badge bg-primary me-2">
                        <i class="bi bi-file-text me-1"></i>Articles Analyzed: [[ hypothesesData.total_articles_analyzed ]]
                    </span>
                    <span class="badge bg-success">
                        <i class="bi bi-lightbulb me-1"></i>Hypotheses: [[ hypothesesData.hypotheses_count ]]
                    </span>
                </div>
                <div class="table-controls">
                    <div class="search-container">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text" aria-hidden="true">
                                <i class="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                v-model="searchQuery"
                                @input="debouncedFilterHypotheses"
                                @keydown.enter="filterHypotheses"
                                placeholder="Search hypotheses..."
                                class="form-control"
                                aria-label="Search hypotheses"
                                id="hypotheses-search"
                            >
                            <button v-if="searchQuery" @click="clearSearch" class="btn btn-outline-secondary" type="button" aria-label="Clear search">
                                <i class="bi bi-x" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    <select v-model="priorityFilter" @change="filterHypotheses" class="form-select form-select-sm" aria-label="Filter by priority" id="priority-filter">
                        <option value="">All Priorities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>
                    <select v-model="confidenceFilter" @change="filterHypotheses" class="form-select form-select-sm" aria-label="Filter by confidence" id="confidence-filter">
                        <option value="">All Confidence</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>
                    <select v-model="industryFilter" @change="filterHypotheses" class="form-select form-select-sm" aria-label="Filter by industry" id="industry-filter">
                        <option value="">All Industries</option>
                        <option v-for="industry in uniqueIndustries" :key="industry" :value="industry">[[ industry ]]</option>
                    </select>
                    <button @click="refreshHypotheses" class="btn btn-sm btn-outline-primary" :disabled="loading" aria-label="Refresh hypotheses list">
                        <i class="bi bi-arrow-clockwise" :class="{ 'spin-icon': loading }" aria-hidden="true"></i>
                        <span class="visually-hidden">Refresh</span>
                    </button>
                </div>
                <div v-if="searchQuery || priorityFilter || confidenceFilter || industryFilter" class="text-end mb-2">
                    <button @click="clearAllFilters" class="btn btn-sm btn-outline-secondary" aria-label="Clear all filters">
                        <i class="bi bi-x-circle me-1" aria-hidden="true"></i>Clear All Filters
                    </button>
                </div>
            </div>

            <div v-if="loading" class="text-center py-4" role="status" aria-live="polite" aria-busy="true">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading hypotheses...</span>
                </div>
                <div class="mt-2">Loading threat hunting hypotheses...</div>
            </div>

            <div v-else-if="error" class="alert alert-danger" role="alert" aria-live="assertive">
                <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
                [[ error ]]
                <button @click="refreshHypotheses" class="btn btn-sm btn-outline-danger ms-2" aria-label="Retry loading hypotheses">Retry</button>
            </div>

            <div v-else-if="filteredHypotheses.length === 0" class="text-center py-4 text-muted" role="status" aria-live="polite">
                <i class="bi bi-info-circle me-2" aria-hidden="true"></i>
                <span v-if="hypotheses.length === 0">No threat hunting hypotheses found</span>
                <span v-else>No hypotheses match the selected filters</span>
            </div>

            <div v-else class="hypotheses-container" role="list" aria-label="Hypotheses list">
                <div class="hypothesis-list">
                    <div v-for="hypothesis in paginatedHypotheses" :key="hypothesis.hypothesis_id" class="hypothesis-item" role="listitem">
                        <div class="hypothesis-summary"
                             @click="toggleHypothesis(hypothesis.hypothesis_id)"
                             @keydown.enter="toggleHypothesis(hypothesis.hypothesis_id)"
                             @keydown.space.prevent="toggleHypothesis(hypothesis.hypothesis_id)"
                             :tabindex="0"
                             :aria-expanded="expandedHypotheses.includes(hypothesis.hypothesis_id)"
                             :aria-controls="'hypothesis-details-' + hypothesis.hypothesis_id">
                            <div class="hypothesis-main">
                                <div class="hypothesis-title-section">
                                    <div class="d-flex align-items-center">
                                        <span class="badge bg-dark me-2">[[ hypothesis.hypothesis_id ]]</span>
                                        <h5 class="hypothesis-title mb-0">[[ hypothesis.title ]]</h5>
                                    </div>
                                </div>
                                <div class="hypothesis-badges">
                                    <span :class="'severity-badge me-2 badge bg-' + getPriorityColor(hypothesis.priority)">
                                        [[ hypothesis.priority ]]
                                    </span>
                                    <span class="badge me-2" :class="'bg-' + getConfidenceColor(hypothesis.confidence)">
                                        [[ hypothesis.confidence ]] Confidence
                                    </span>
                                    <i class="bi bi-chevron-down expand-icon" :class="{ 'expanded': expandedHypotheses.includes(hypothesis.hypothesis_id) }" aria-hidden="true"></i>
                                </div>
                            </div>
                            
                            <div class="hypothesis-preview">
                                <p class="mb-2 text-muted small">[[ truncateText(hypothesis.description, 200) ]]</p>
                                <div class="row">
                                    <div class="col-md-4" v-if="hypothesis.threat_actors && hypothesis.threat_actors.length">
                                        <strong>Threat Actors:</strong>
                                        <div class="small text-muted">
                                            [[ hypothesis.threat_actors.slice(0, 2).join(', ') ]]
                                            <span v-if="hypothesis.threat_actors.length > 2">+[[ hypothesis.threat_actors.length - 2 ]] more</span>
                                        </div>
                                    </div>
                                    <div class="col-md-4" v-if="hypothesis.industries_targeted && hypothesis.industries_targeted.length">
                                        <strong>Industries:</strong>
                                        <div class="small text-muted">
                                            [[ hypothesis.industries_targeted.slice(0, 2).join(', ') ]]
                                            <span v-if="hypothesis.industries_targeted.length > 2">+[[ hypothesis.industries_targeted.length - 2 ]] more</span>
                                        </div>
                                    </div>
                                    <div class="col-md-4" v-if="hypothesis.mitre_attack_techniques && hypothesis.mitre_attack_techniques.length">
                                        <strong>MITRE Techniques:</strong>
                                        <div class="small text-muted">
                                            [[ hypothesis.mitre_attack_techniques.length ]] techniques
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-show="expandedHypotheses.includes(hypothesis.hypothesis_id)"
                             :id="'hypothesis-details-' + hypothesis.hypothesis_id"
                             class="hypothesis-details"
                             role="region"
                             aria-label="Hypothesis details">
                            <div class="hypothesis-details-content">
                                <div class="row">
                                    <div class="col-12">
                                        <h6><i class="bi bi-file-text me-2"></i>Description</h6>
                                        <p>[[ hypothesis.description ]]</p>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-md-6" v-if="hypothesis.threat_actors && hypothesis.threat_actors.length">
                                        <h6><i class="bi bi-person-badge me-2"></i>Threat Actors</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="actor in hypothesis.threat_actors" :key="actor" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ actor ]]
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6" v-if="hypothesis.industries_targeted && hypothesis.industries_targeted.length">
                                        <h6><i class="bi bi-building me-2"></i>Industries Targeted</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="industry in hypothesis.industries_targeted" :key="industry" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ industry ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div class="row mt-3" v-if="hypothesis.mitre_attack_techniques && hypothesis.mitre_attack_techniques.length">
                                    <div class="col-12">
                                        <h6><i class="bi bi-diagram-3 me-2"></i>MITRE ATT&CK Techniques</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="technique in hypothesis.mitre_attack_techniques" :key="technique" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>
                                                <code>[[ technique ]]</code>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div class="row mt-3" v-if="hypothesis.data_sources_needed && hypothesis.data_sources_needed.length">
                                    <div class="col-12">
                                        <h6><i class="bi bi-database me-2"></i>Data Sources Needed</h6>
                                        <div v-for="(source, index) in hypothesis.data_sources_needed" :key="index" class="card mb-2">
                                            <div class="card-body">
                                                <h6 class="card-title">
                                                    <span class="badge bg-primary me-2">[[ source.source_type ]]</span>
                                                </h6>
                                                <p class="card-text small mb-2">[[ source.specific_data ]]</p>
                                                <div v-if="source.tools && source.tools.length">
                                                    <strong class="small">Tools:</strong>
                                                    <div class="small text-muted">[[ source.tools.join(', ') ]]</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row mt-3" v-if="hypothesis.hunting_tactics && hypothesis.hunting_tactics.length">
                                    <div class="col-12">
                                        <h6><i class="bi bi-crosshair me-2"></i>Hunting Tactics</h6>
                                        <div v-for="(tactic, index) in hypothesis.hunting_tactics" :key="index" class="card mb-3">
                                            <div class="card-header">
                                                <strong>[[ tactic.tactic_name ]]</strong>
                                            </div>
                                            <div class="card-body">
                                                <p class="card-text small mb-2">[[ tactic.description ]]</p>
                                                <div v-if="tactic.look_for" class="alert alert-info small mb-2">
                                                    <strong>Look for:</strong> [[ tactic.look_for ]]
                                                </div>
                                                <div v-if="tactic.sample_queries && tactic.sample_queries.length">
                                                    <h6 class="small mt-2">Sample Queries:</h6>
                                                    <div v-for="(query, qIndex) in tactic.sample_queries" :key="qIndex" class="mb-2">
                                                        <pre class="query-code small p-2 rounded">[[ query ]]</pre>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row mt-3" v-if="hypothesis.iocs_and_patterns">
                                    <div class="col-12">
                                        <h6><i class="bi bi-flag me-2"></i>IOCs and Patterns</h6>
                                        <div class="row">
                                            <div class="col-md-6" v-if="hypothesis.iocs_and_patterns.domains && hypothesis.iocs_and_patterns.domains.length">
                                                <h6 class="small">Domains</h6>
                                                <ul class="list-unstyled">
                                                    <li v-for="domain in hypothesis.iocs_and_patterns.domains" :key="domain" class="mb-1 small">
                                                        <code>[[ domain ]]</code>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div class="col-md-6" v-if="hypothesis.iocs_and_patterns.ips && hypothesis.iocs_and_patterns.ips.length">
                                                <h6 class="small">IP Addresses</h6>
                                                <ul class="list-unstyled">
                                                    <li v-for="ip in hypothesis.iocs_and_patterns.ips" :key="ip" class="mb-1 small">
                                                        <code>[[ ip ]]</code>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6" v-if="hypothesis.iocs_and_patterns.file_hashes && hypothesis.iocs_and_patterns.file_hashes.length">
                                                <h6 class="small">File Hashes</h6>
                                                <ul class="list-unstyled">
                                                    <li v-for="hash in hypothesis.iocs_and_patterns.file_hashes" :key="hash" class="mb-1 small">
                                                        <code>[[ hash ]]</code>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div class="col-md-6" v-if="hypothesis.iocs_and_patterns.file_names && hypothesis.iocs_and_patterns.file_names.length">
                                                <h6 class="small">File Names</h6>
                                                <ul class="list-unstyled">
                                                    <li v-for="file in hypothesis.iocs_and_patterns.file_names" :key="file" class="mb-1 small">
                                                        <code>[[ file ]]</code>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6" v-if="hypothesis.iocs_and_patterns.registry_keys && hypothesis.iocs_and_patterns.registry_keys.length">
                                                <h6 class="small">Registry Keys</h6>
                                                <ul class="list-unstyled">
                                                    <li v-for="key in hypothesis.iocs_and_patterns.registry_keys" :key="key" class="mb-1 small">
                                                        <code>[[ key ]]</code>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div class="col-md-6" v-if="hypothesis.iocs_and_patterns.process_names && hypothesis.iocs_and_patterns.process_names.length">
                                                <h6 class="small">Process Names</h6>
                                                <ul class="list-unstyled">
                                                    <li v-for="process in hypothesis.iocs_and_patterns.process_names" :key="process" class="mb-1 small">
                                                        <code>[[ process ]]</code>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6" v-if="hypothesis.iocs_and_patterns.network_patterns && hypothesis.iocs_and_patterns.network_patterns.length">
                                                <h6 class="small">Network Patterns</h6>
                                                <ul class="list-unstyled">
                                                    <li v-for="pattern in hypothesis.iocs_and_patterns.network_patterns" :key="pattern" class="mb-1 small">
                                                        <i class="bi bi-chevron-right text-muted me-1"></i>[[ pattern ]]
                                                    </li>
                                                </ul>
                                            </div>
                                            <div class="col-md-6" v-if="hypothesis.iocs_and_patterns.user_agent_strings && hypothesis.iocs_and_patterns.user_agent_strings.length">
                                                <h6 class="small">User Agent Strings</h6>
                                                <ul class="list-unstyled">
                                                    <li v-for="ua in hypothesis.iocs_and_patterns.user_agent_strings" :key="ua" class="mb-1 small">
                                                        <code>[[ ua ]]</code>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div class="row" v-if="hypothesis.iocs_and_patterns.other_indicators && hypothesis.iocs_and_patterns.other_indicators.length">
                                            <div class="col-12">
                                                <h6 class="small">Other Indicators</h6>
                                                <ul class="list-unstyled">
                                                    <li v-for="indicator in hypothesis.iocs_and_patterns.other_indicators" :key="indicator" class="mb-1 small">
                                                        <i class="bi bi-chevron-right text-muted me-1"></i>[[ indicator ]]
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row mt-3">
                                    <div class="col-md-4">
                                        <div class="card">
                                            <div class="card-body text-center">
                                                <h6 class="small">Detection Rate</h6>
                                                <span class="badge" :class="'bg-' + getDetectionRateColor(hypothesis.estimated_detection_rate)">
                                                    [[ hypothesis.estimated_detection_rate ]]
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card">
                                            <div class="card-body text-center">
                                                <h6 class="small">False Positive Risk</h6>
                                                <span class="badge" :class="'bg-' + getFalsePositiveColor(hypothesis.false_positive_risk)">
                                                    [[ hypothesis.false_positive_risk ]]
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card">
                                            <div class="card-body text-center">
                                                <h6 class="small">Confidence</h6>
                                                <span class="badge" :class="'bg-' + getConfidenceColor(hypothesis.confidence)">
                                                    [[ hypothesis.confidence ]]
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row mt-3" v-if="hypothesis.recommended_actions && hypothesis.recommended_actions.length">
                                    <div class="col-12">
                                        <h6><i class="bi bi-shield-check me-2"></i>Recommended Actions</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="action in hypothesis.recommended_actions" :key="action" class="mb-2">
                                                <i class="bi bi-check-circle-fill text-success me-2"></i>[[ action ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <nav class="d-flex justify-content-between align-items-center mt-4" v-if="totalPages > 1" aria-label="Pagination navigation">
                    <div class="text-muted" aria-live="polite">
                        Showing [[ (currentPage - 1) * itemsPerPage + 1 ]] to [[ Math.min(currentPage * itemsPerPage, filteredHypotheses.length) ]]
                        of [[ filteredHypotheses.length ]] hypotheses
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
        hypothesesData: {
            type: Object,
            default: () => ({})
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
            priorityFilter: '',
            confidenceFilter: '',
            industryFilter: '',
            currentPage: 1,
            itemsPerPage: 10,
            expandedHypotheses: [],
            filteredHypotheses: []
        };
    },
    
    computed: {
        hypotheses() {
            return this.hypothesesData?.hypotheses || [];
        },
        
        paginatedHypotheses() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.filteredHypotheses.slice(start, end);
        },

        totalPages() {
            return Math.ceil(this.filteredHypotheses.length / this.itemsPerPage);
        },

        uniqueIndustries() {
            const industries = new Set();
            this.hypotheses.forEach(hypothesis => {
                if (hypothesis.industries_targeted) {
                    hypothesis.industries_targeted.forEach(industry => industries.add(industry));
                }
            });
            return Array.from(industries).sort();
        }
    },
    
    watch: {
        hypotheses: {
            handler() {
                this.filterHypotheses();
            },
            immediate: true
        }
    },

    created() {
        this.debouncedFilterHypotheses = Utils.debounce(this.filterHypotheses, 300);
    },

    methods: {
        filterHypotheses() {
            let filtered = [...(this.hypotheses || [])];
            
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(hypothesis => {
                    if (hypothesis.title && hypothesis.title.toLowerCase().includes(query)) return true;
                    if (hypothesis.description && hypothesis.description.toLowerCase().includes(query)) return true;
                    if (hypothesis.hypothesis_id && hypothesis.hypothesis_id.toLowerCase().includes(query)) return true;
                    if (hypothesis.threat_actors && hypothesis.threat_actors.some(actor => 
                        actor.toLowerCase().includes(query))) return true;
                    if (hypothesis.industries_targeted && hypothesis.industries_targeted.some(industry => 
                        industry.toLowerCase().includes(query))) return true;
                    if (hypothesis.mitre_attack_techniques && hypothesis.mitre_attack_techniques.some(technique => 
                        technique.toLowerCase().includes(query))) return true;
                    if (hypothesis.recommended_actions && hypothesis.recommended_actions.some(action => 
                        action.toLowerCase().includes(query))) return true;
                    return false;
                });
            }
            
            if (this.priorityFilter) {
                filtered = filtered.filter(hypothesis => hypothesis.priority === this.priorityFilter);
            }

            if (this.confidenceFilter) {
                filtered = filtered.filter(hypothesis => hypothesis.confidence === this.confidenceFilter);
            }

            if (this.industryFilter) {
                filtered = filtered.filter(hypothesis => 
                    hypothesis.industries_targeted && hypothesis.industries_targeted.includes(this.industryFilter)
                );
            }
            
            this.filteredHypotheses = this.sortHypotheses(filtered);
            this.currentPage = 1;
        },
        
        sortHypotheses(hypotheses) {
            const priorityOrder = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
            return hypotheses.sort((a, b) => {
                const priorityDiff = (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5);
                if (priorityDiff !== 0) return priorityDiff;
                return (a.hypothesis_id || '').localeCompare(b.hypothesis_id || '');
            });
        },

        clearAllFilters() {
            this.searchQuery = '';
            this.priorityFilter = '';
            this.confidenceFilter = '';
            this.industryFilter = '';
            this.filterHypotheses();
        },
        
        refreshHypotheses() {
            this.$emit('refresh');
        },
        
        toggleHypothesis(hypothesisId) {
            const index = this.expandedHypotheses.indexOf(hypothesisId);
            if (index > -1) {
                this.expandedHypotheses.splice(index, 1);
            } else {
                this.expandedHypotheses.push(hypothesisId);
            }
        },
        
        getPriorityColor(priority) {
            switch (priority?.toUpperCase()) {
                case 'CRITICAL': return 'danger';
                case 'HIGH': return 'warning';
                case 'MEDIUM': return 'info';
                case 'LOW': return 'success';
                default: return 'secondary';
            }
        },
        
        getConfidenceColor(confidence) {
            switch (confidence?.toUpperCase()) {
                case 'HIGH': return 'success';
                case 'MEDIUM': return 'warning';
                case 'LOW': return 'danger';
                default: return 'secondary';
            }
        },

        getDetectionRateColor(rate) {
            switch (rate?.toLowerCase()) {
                case 'high': return 'success';
                case 'medium': return 'warning';
                case 'low': return 'danger';
                default: return 'secondary';
            }
        },

        getFalsePositiveColor(risk) {
            switch (risk?.toLowerCase()) {
                case 'low': return 'success';
                case 'medium': return 'warning';
                case 'high': return 'danger';
                default: return 'secondary';
            }
        },
        
        formatDateTime(dateString) {
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
            this.filterHypotheses();
        }
    }
};
