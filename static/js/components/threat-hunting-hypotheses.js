// Threat Hunting Hypotheses Table Component
window.ThreatHuntingHypothesesComponent = {
    template: `
        <div class="threat-hunting-hypotheses" role="region" aria-labelledby="hypotheses-heading">
            <div class="table-header">
                <h3 id="hypotheses-heading"><span aria-hidden="true"><i class="bi bi-bullseye me-2"></i></span>Threat Hunting Hypotheses</h3>
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

            <div v-else-if="hypotheses.length === 0" class="text-center py-4 text-muted" role="status" aria-live="polite">
                <i class="bi bi-info-circle me-2" aria-hidden="true"></i>
                No threat hunting hypotheses found
            </div>

            <div v-else class="hypotheses-container">
                <div class="row mb-3">
                    <div class="col-12">
                        <div class="hypotheses-summary-bar">
                            <span class="badge bg-secondary me-2">
                                <i class="bi bi-calendar me-1"></i>[[ formatDateTime(hypothesesData.generated_at) ]]
                            </span>
                            <span class="badge bg-info me-2">
                                <i class="bi bi-clock me-1"></i>[[ hypothesesData.time_window ]] window
                            </span>
                            <span class="badge bg-primary me-2">
                                <i class="bi bi-file-text me-1"></i>[[ hypothesesData.total_articles_analyzed ]] articles
                            </span>
                            <button @click="refreshHypotheses" class="btn btn-sm btn-outline-light ms-auto" :disabled="loading" aria-label="Refresh">
                                <i class="bi bi-arrow-clockwise" :class="{ 'spin-icon': loading }" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="hypothesis-list">
                    <div v-for="(hypothesis, index) in hypotheses" :key="hypothesis.hypothesis_id" class="hypothesis-item" :class="'hypothesis-priority-' + (hypothesis.priority || 'medium').toLowerCase()" role="listitem">
                        <div class="hypothesis-summary"
                             @click="toggleHypothesis(hypothesis.hypothesis_id)"
                             @keydown.enter="toggleHypothesis(hypothesis.hypothesis_id)"
                             @keydown.space.prevent="toggleHypothesis(hypothesis.hypothesis_id)"
                             :tabindex="0"
                             :aria-expanded="expandedHypotheses.includes(hypothesis.hypothesis_id)"
                             :aria-controls="'hypothesis-details-' + hypothesis.hypothesis_id">
                            <div class="hypothesis-main">
                                <div class="hypothesis-title-section">
                                    <div class="d-flex align-items-center flex-wrap">
                                        <span class="hypothesis-id-badge">[[ hypothesis.hypothesis_id ]]</span>
                                        <span :class="'hypothesis-priority-badge priority-' + (hypothesis.priority || 'medium').toLowerCase()">
                                            [[ hypothesis.priority ]]
                                        </span>
                                        <span :class="'hypothesis-confidence-badge confidence-' + (hypothesis.confidence || 'medium').toLowerCase()">
                                            [[ hypothesis.confidence ]] Confidence
                                        </span>
                                    </div>
                                    <h5 class="hypothesis-title mt-2">[[ hypothesis.title ]]</h5>
                                </div>
                                <div class="hypothesis-toggle">
                                    <i class="bi bi-chevron-down expand-icon" :class="{ 'expanded': expandedHypotheses.includes(hypothesis.hypothesis_id) }" aria-hidden="true"></i>
                                </div>
                            </div>
                            
                            <div class="hypothesis-preview">
                                <p class="mb-2 hypothesis-description-preview">[[ truncateText(hypothesis.description, 180) ]]</p>
                                <div class="hypothesis-tags">
                                    <span v-for="actor in hypothesis.threat_actors?.slice(0, 3)" :key="actor" class="hypothesis-tag tag-actor">
                                        <i class="bi bi-person-badge me-1"></i>[[ actor ]]
                                    </span>
                                    <span v-for="industry in hypothesis.industries_targeted?.slice(0, 2)" :key="industry" class="hypothesis-tag tag-industry">
                                        <i class="bi bi-building me-1"></i>[[ industry ]]
                                    </span>
                                    <span v-if="hypothesis.mitre_attack_techniques?.length" class="hypothesis-tag tag-mitre">
                                        <i class="bi bi-diagram-3 me-1"></i>[[ hypothesis.mitre_attack_techniques.length ]] MITRE
                                    </span>
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
                                        <div class="metric-card">
                                            <div class="metric-label">Detection Rate</div>
                                            <span class="metric-value" :class="'metric-' + getDetectionRateClass(hypothesis.estimated_detection_rate)">
                                                [[ hypothesis.estimated_detection_rate ]]
                                            </span>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="metric-card">
                                            <div class="metric-label">False Positive Risk</div>
                                            <span class="metric-value" :class="'metric-' + getFalsePositiveClass(hypothesis.false_positive_risk)">
                                                [[ hypothesis.false_positive_risk ]]
                                            </span>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="metric-card">
                                            <div class="metric-label">Confidence</div>
                                            <span class="metric-value" :class="'metric-' + getConfidenceClass(hypothesis.confidence)">
                                                [[ hypothesis.confidence ]]
                                            </span>
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
            expandedHypotheses: []
        };
    },
    
    computed: {
        hypotheses() {
            return this.hypothesesData?.hypotheses || [];
        }
    },

    methods: {
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
        
        getDetectionRateClass(rate) {
            switch (rate?.toLowerCase()) {
                case 'high': return 'success';
                case 'medium': return 'warning';
                case 'low': return 'danger';
                default: return 'secondary';
            }
        },

        getFalsePositiveClass(risk) {
            switch (risk?.toLowerCase()) {
                case 'low': return 'success';
                case 'medium': return 'warning';
                case 'high': return 'danger';
                default: return 'secondary';
            }
        },

        getConfidenceClass(confidence) {
            switch (confidence?.toLowerCase()) {
                case 'high': return 'success';
                case 'medium': return 'warning';
                case 'low': return 'danger';
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
        }
    }
};
