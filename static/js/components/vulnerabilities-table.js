// Vulnerabilities Table Component
window.VulnerabilitiesTableComponent = {
    template: `
        <div class="vulnerabilities-table" role="region" aria-labelledby="vulnerabilities-heading">
            <div class="table-header">
                <h3 id="vulnerabilities-heading"><span aria-hidden="true"><i class="bi bi-shield-exclamation me-2"></i></span>Vulnerabilities</h3>
                <div class="table-controls">
                    <div class="search-container">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text" aria-hidden="true">
                                <i class="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                v-model="searchQuery"
                                @input="debouncedFilterVulnerabilities"
                                @keydown.enter="filterVulnerabilities"
                                placeholder="Search vulnerabilities..."
                                class="form-control"
                                aria-label="Search vulnerabilities"
                                id="vulnerabilities-search"
                            >
                            <button v-if="searchQuery" @click="clearSearch" class="btn btn-outline-secondary" type="button" aria-label="Clear search">
                                <i class="bi bi-x" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    <select v-model="severityFilter" @change="filterVulnerabilities" class="form-select form-select-sm" aria-label="Filter by severity" id="vulnerability-severity-filter">
                        <option value="">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <select v-model="cvssFilter" @change="filterVulnerabilities" class="form-select form-select-sm" aria-label="Filter by CVSS score" id="cvss-filter">
                        <option value="">All CVSS Scores</option>
                        <option value="9.0-10.0">9.0 - 10.0 (Critical)</option>
                        <option value="7.0-8.9">7.0 - 8.9 (High)</option>
                        <option value="4.0-6.9">4.0 - 6.9 (Medium)</option>
                        <option value="0.1-3.9">0.1 - 3.9 (Low)</option>
                    </select>
                    <select v-model="exploitFilter" @change="filterVulnerabilities" class="form-select form-select-sm" aria-label="Filter by exploit status" id="exploit-filter">
                        <option value="">All Exploit Status</option>
                        <option value="true">Exploit Available</option>
                        <option value="false">No Exploit</option>
                        <option value="unknown">Unknown</option>
                    </select>
                    <select v-model="sourceFilter" @change="filterVulnerabilities" class="form-select form-select-sm" aria-label="Filter by source" id="source-filter">
                        <option value="">All Sources</option>
                        <option v-for="source in uniqueSources" :key="source" :value="source">[[ source ]]</option>
                    </select>
                    <input
                        type="date"
                        v-model="dateFrom"
                        @change="filterVulnerabilities"
                        class="form-control form-control-sm"
                        aria-label="Filter by date from"
                        id="date-from"
                        placeholder="From"
                    >
                    <input
                        type="date"
                        v-model="dateTo"
                        @change="filterVulnerabilities"
                        class="form-control form-control-sm"
                        aria-label="Filter by date to"
                        id="date-to"
                        placeholder="To"
                    >
                    <select v-model="itemsPerPage" @change="filterVulnerabilities" class="form-select form-select-sm" aria-label="Items per page" id="items-per-page">
                        <option :value="20">20 per page</option>
                        <option :value="50">50 per page</option>
                        <option :value="100">100 per page</option>
                        <option :value="0">Show All</option>
                    </select>
                    <button @click="refreshVulnerabilities" class="btn btn-sm btn-outline-primary" :disabled="loading" aria-label="Refresh vulnerabilities list">
                        <i class="bi bi-arrow-clockwise" :class="{ 'spin-icon': loading }" aria-hidden="true"></i>
                        <span class="visually-hidden">Refresh</span>
                    </button>
                </div>
                <div v-if="searchQuery || severityFilter || cvssFilter || exploitFilter || sourceFilter || dateFrom || dateTo" class="text-end mb-2">
                    <button @click="clearAllFilters" class="btn btn-sm btn-outline-secondary" aria-label="Clear all filters">
                        <i class="bi bi-x-circle me-1" aria-hidden="true"></i>Clear All Filters
                    </button>
                </div>
            </div>

            <div v-if="loading" class="text-center py-4" role="status" aria-live="polite" aria-busy="true">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading vulnerabilities...</span>
                </div>
                <div class="mt-2">Loading vulnerabilities...</div>
            </div>

            <div v-else-if="error" class="alert alert-danger" role="alert" aria-live="assertive">
                <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
                [[ error ]]
                <button @click="refreshVulnerabilities" class="btn btn-sm btn-outline-danger ms-2" aria-label="Retry loading vulnerabilities">Retry</button>
            </div>

            <div v-else-if="filteredVulnerabilities.length === 0" class="text-center py-4 text-muted" role="status" aria-live="polite">
                <i class="bi bi-info-circle me-2" aria-hidden="true"></i>
                <span v-if="vulnerabilities.length === 0">No vulnerabilities found</span>
                <span v-else>No vulnerabilities match selected filters</span>
            </div>

            <div v-else class="vulnerabilities-container" role="list" aria-label="Vulnerabilities list">
                <div class="vulnerability-list">
                    <div v-for="vuln in paginatedVulnerabilities" :key="vuln.id" class="vulnerability-item" role="listitem">
                        <div class="vulnerability-summary"
                             @click="toggleVulnerability(vuln.id)"
                             @keydown.enter="toggleVulnerability(vuln.id)"
                             @keydown.space.prevent="toggleVulnerability(vuln.id)"
                             :tabindex="0"
                             :aria-expanded="expandedVulnerabilities.includes(vuln.id)"
                             :aria-controls="'vulnerability-details-' + vuln.id">
                            <div class="vulnerability-main">
                                <div class="vulnerability-title-section">
                                    <h5 class="vulnerability-title">[[ vuln.cve_id ]]: [[ vuln.title ]]</h5>
                                    <div class="vulnerability-meta">
                                        <span class="badge bg-secondary me-2">[[ vuln.source ]]</span>
                                        <span class="text-muted">[[ formatDate(vuln.published_date) ]]</span>
                                    </div>
                                </div>
                                <div class="vulnerability-badges">
                                    <span :class="'severity-badge me-2 badge bg-' + getSeverityColor(vuln.severity)">
                                        [[ vuln.severity?.toUpperCase() || 'UNKNOWN' ]]
                                    </span>
                                    <span :class="'cvss-badge me-2 badge bg-' + getCvssColor(vuln.cvss_score)">
                                        CVSS [[ vuln.cvss_score ]]
                                    </span>
                                    <span v-if="vuln.exploit_available === 'true'" class="badge bg-danger me-2">
                                        <i class="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>EXPLOIT AVAILABLE
                                    </span>
                                    <i class="bi bi-chevron-down expand-icon" :class="{ 'expanded': expandedVulnerabilities.includes(vuln.id) }" aria-hidden="true"></i>
                                </div>
                            </div>
                            
                            <div class="vulnerability-preview">
                                <div class="row">
                                    <div class="col-md-3" v-if="vuln.affected_products && vuln.affected_products.length">
                                        <strong>Affected Products:</strong>
                                        <div class="small text-muted">
                                            [[ vuln.affected_products.slice(0, 2).join(', ') ]]
                                            <span v-if="vuln.affected_products.length > 2">+[[ vuln.affected_products.length - 2 ]] more</span>
                                        </div>
                                    </div>
                                    <div class="col-md-3" v-if="vuln.vendors && vuln.vendors.length">
                                        <strong>Vendors:</strong>
                                        <div class="small text-muted">
                                            [[ vuln.vendors.slice(0, 2).join(', ') ]]
                                            <span v-if="vuln.vendors.length > 2">+[[ vuln.vendors.length - 2 ]] more</span>
                                        </div>
                                    </div>
                                    <div class="col-md-3" v-if="vuln.attack_vector">
                                        <strong>Attack Vector:</strong>
                                        <div class="small text-muted">[[ vuln.attack_vector.toUpperCase() ]]</div>
                                    </div>
                                    <div class="col-md-3" v-if="vuln.complexity">
                                        <strong>Complexity:</strong>
                                        <div class="small text-muted">[[ vuln.complexity.toUpperCase() ]]</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-show="expandedVulnerabilities.includes(vuln.id)"
                             :id="'vulnerability-details-' + vuln.id"
                             class="vulnerability-details"
                             role="region"
                             aria-label="Vulnerability details">
                            <div class="vulnerability-details-content">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6><i class="bi bi-info-circle me-2"></i>Overview</h6>
                                        <p><strong>Summary:</strong> [[ vuln.summary || vuln.description ]]</p>
                                        <p v-if="vuln.url"><strong>Source URL:</strong> <a :href="vuln.url" target="_blank">[[ vuln.url ]]</a></p>
                                        <p v-if="vuln.discovery_date">
                                            <strong>Discovery Date:</strong> [[ formatDate(vuln.discovery_date) ]]
                                        </p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6><i class="bi bi-shield-exclamation me-2"></i>Risk Assessment</h6>
                                        <p v-if="vuln.overall_risk">
                                            <strong>Overall Risk:</strong> 
                                            <span :class="'badge bg-' + getRiskColor(vuln.overall_risk)">[[ vuln.overall_risk.toUpperCase() ]]</span>
                                        </p>
                                        <p v-if="vuln.confidence_level">
                                            <strong>Confidence:</strong> [[ vuln.confidence_level.toUpperCase() ]]
                                        </p>
                                        <p v-if="vuln.exploit_maturity">
                                            <strong>Exploit Maturity:</strong> [[ vuln.exploit_maturity.toUpperCase() ]]
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-md-6" v-if="vuln.affected_products && vuln.affected_products.length">
                                        <h6><i class="bi bi-box me-2"></i>Affected Products</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="product in vuln.affected_products" :key="product" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ product ]]
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6" v-if="vuln.vendors && vuln.vendors.length">
                                        <h6><i class="bi bi-building me-2"></i>Affected Vendors</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="vendor in vuln.vendors" :key="vendor" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ vendor ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-md-6">
                                        <h6><i class="bi bi-arrow-right-circle me-2"></i>Attack Characteristics</h6>
                                        <p v-if="vuln.attack_vector"><strong>Attack Vector:</strong> [[ vuln.attack_vector.toUpperCase() ]]</p>
                                        <p v-if="vuln.complexity"><strong>Complexity:</strong> [[ vuln.complexity.toUpperCase() ]]</p>
                                        <p v-if="vuln.privileges_required"><strong>Privileges Required:</strong> [[ vuln.privileges_required.toUpperCase() ]]</p>
                                        <p v-if="vuln.user_interaction"><strong>User Interaction:</strong> [[ vuln.user_interaction.toUpperCase() ]]</p>
                                        <p v-if="vuln.scope"><strong>Scope:</strong> [[ vuln.scope.toUpperCase() ]]</p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6><i class="bi bi-exclamation-diamond me-2"></i>Impact Assessment</h6>
                                        <p v-if="vuln.confidentiality_impact"><strong>Confidentiality Impact:</strong> [[ vuln.confidentiality_impact.toUpperCase() ]]</p>
                                        <p v-if="vuln.integrity_impact"><strong>Integrity Impact:</strong> [[ vuln.integrity_impact.toUpperCase() ]]</p>
                                        <p v-if="vuln.availability_impact"><strong>Availability Impact:</strong> [[ vuln.availability_impact.toUpperCase() ]]</p>
                                        <p v-if="vuln.exploit_available">
                                            <strong>Exploit Available:</strong> 
                                            <span :class="'badge bg-' + (vuln.exploit_available === 'true' ? 'danger' : 'secondary')">
                                                [[ vuln.exploit_available.toUpperCase() ]]
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-12" v-if="vuln.cvss_vector">
                                        <h6><i class="bi bi-calculator me-2"></i>CVSS Vector</h6>
                                        <div class="cvss-vector-display">
                                            <code>[[ vuln.cvss_vector ]]</code>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-md-6" v-if="vuln.remediation">
                                        <h6><i class="bi bi-shield-check me-2"></i>Remediation</h6>
                                        <p>[[ vuln.remediation ]]</p>
                                    </div>
                                    <div class="col-md-6" v-if="vuln.workarounds && vuln.workarounds.length">
                                        <h6><i class="bi bi-tools me-2"></i>Workarounds</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="workaround in vuln.workarounds" :key="workaround" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>[[ workaround ]]
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-12" v-if="vuln.references && vuln.references.length">
                                        <h6><i class="bi bi-link-45deg me-2"></i>References</h6>
                                        <ul class="list-unstyled">
                                            <li v-for="ref in vuln.references" :key="ref" class="mb-1">
                                                <i class="bi bi-chevron-right text-muted me-1"></i>
                                                <a :href="ref" target="_blank">[[ ref ]]</a>
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
                        Showing [[ (currentPage - 1) * itemsPerPage + 1 ]] to [[ Math.min(currentPage * itemsPerPage, filteredVulnerabilities.length) ]]
                        of [[ filteredVulnerabilities.length ]] vulnerabilities
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
        vulnerabilities: {
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
            cvssFilter: '',
            exploitFilter: '',
            sourceFilter: '',
            dateFrom: '',
            dateTo: '',
            sortByField: 'cvss_score',
            sortDirection: 'desc',
            currentPage: 1,
            itemsPerPage: 20,
            expandedVulnerabilities: [],
            filteredVulnerabilities: []
        };
    },
    
    computed: {
        paginatedVulnerabilities() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.filteredVulnerabilities.slice(start, end);
        },

        totalPages() {
            return Math.ceil(this.filteredVulnerabilities.length / this.itemsPerPage);
        },

        uniqueSources() {
            const sources = new Set(this.vulnerabilities.map(vuln => vuln.source).filter(Boolean));
            return Array.from(sources).sort();
        }
    },
    
    watch: {
        vulnerabilities: {
            handler() {
                this.filterVulnerabilities();
            },
            immediate: true
        }
    },

    created() {
        this.debouncedFilterVulnerabilities = Utils.debounce(this.filterVulnerabilities, 300);
    },

    methods: {
        filterVulnerabilities() {
            let filtered = [...(this.vulnerabilities || [])];
            
            // Apply search filter
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(vuln => {
                    // Search in CVE ID
                    if (vuln.cve_id && vuln.cve_id.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in title
                    if (vuln.title && vuln.title.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in description
                    if (vuln.description && vuln.description.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in summary
                    if (vuln.summary && vuln.summary.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in source
                    if (vuln.source && vuln.source.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in severity
                    if (vuln.severity && vuln.severity.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in affected products
                    if (vuln.affected_products && vuln.affected_products.some(product => 
                        product.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in vendors
                    if (vuln.vendors && vuln.vendors.some(vendor => 
                        vendor.toLowerCase().includes(query))) {
                        return true;
                    }
                    // Search in attack vector
                    if (vuln.attack_vector && vuln.attack_vector.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in complexity
                    if (vuln.complexity && vuln.complexity.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in remediation
                    if (vuln.remediation && vuln.remediation.toLowerCase().includes(query)) {
                        return true;
                    }
                    // Search in workarounds
                    if (vuln.workarounds && vuln.workarounds.some(workaround => 
                        workaround.toLowerCase().includes(query))) {
                        return true;
                    }
                    return false;
                });
            }
            
            if (this.severityFilter) {
                filtered = filtered.filter(vuln => vuln.severity === this.severityFilter);
            }
            
            if (this.cvssFilter) {
                const [min, max] = this.cvssFilter.split('-').map(parseFloat);
                filtered = filtered.filter(vuln => {
                    const score = parseFloat(vuln.cvss_score);
                    return score >= min && score <= max;
                });
            }
            
            if (this.exploitFilter) {
                filtered = filtered.filter(vuln => {
                    if (this.exploitFilter === 'unknown') {
                        return !vuln.exploit_available || vuln.exploit_available === 'unknown';
                    }
                    return vuln.exploit_available === this.exploitFilter;
                });
            }

            if (this.sourceFilter) {
                filtered = filtered.filter(vuln => vuln.source === this.sourceFilter);
            }

            if (this.dateFrom) {
                const fromDate = new Date(this.dateFrom);
                filtered = filtered.filter(vuln => {
                    const vulnDate = new Date(vuln.published_date);
                    return vulnDate >= fromDate;
                });
            }

            if (this.dateTo) {
                const toDate = new Date(this.dateTo);
                toDate.setHours(23, 59, 59, 999);
                filtered = filtered.filter(vuln => {
                    const vulnDate = new Date(vuln.published_date);
                    return vulnDate <= toDate;
                });
            }

            this.filteredVulnerabilities = this.sortVulnerabilities(filtered);
            this.currentPage = 1;
        },
        
        sortVulnerabilities(vulnerabilities) {
            return vulnerabilities.sort((a, b) => {
                let aVal = a[this.sortByField];
                let bVal = b[this.sortByField];
                
                // Handle different data types
                if (this.sortByField === 'cvss_score') {
                    aVal = parseFloat(aVal);
                    bVal = parseFloat(bVal);
                } else if (this.sortByField === 'published_date') {
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
            this.filterVulnerabilities();
        },

        clearAllFilters() {
            this.searchQuery = '';
            this.severityFilter = '';
            this.cvssFilter = '';
            this.exploitFilter = '';
            this.sourceFilter = '';
            this.dateFrom = '';
            this.dateTo = '';
            this.filterVulnerabilities();
        },
        
        getSortIcon(field) {
            if (this.sortByField !== field) return 'fa-sort';
            return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
        },
        
        refreshVulnerabilities() {
            this.$emit('refresh');
        },
        
        toggleVulnerability(vulnerabilityId) {
            const index = this.expandedVulnerabilities.indexOf(vulnerabilityId);
            if (index > -1) {
                this.expandedVulnerabilities.splice(index, 1);
            } else {
                this.expandedVulnerabilities.push(vulnerabilityId);
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
        
        getCvssColor(score) {
            const numScore = parseFloat(score);
            if (numScore >= 9.0) return 'danger';
            if (numScore >= 7.0) return 'warning';
            if (numScore >= 4.0) return 'info';
            return 'success';
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
        
        getCvssCategory(score) {
            const numScore = parseFloat(score);
            if (numScore >= 9.0) return 'critical';
            if (numScore >= 7.0) return 'high';
            if (numScore >= 4.0) return 'medium';
            return 'low';
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
            this.filterVulnerabilities();
        }
    }
};