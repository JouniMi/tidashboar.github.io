/**
 * Breaking News Component
 * Displays breaking cybersecurity news from the JSON file
 */
window.BreakingNewsComponent = {
    props: {
        breakingNews: {
            type: Object,
            default: () => ({})
        }
    },
    computed: {
        newsItems() {
            return this.breakingNews.breaking_news || [];
        },
        generatedAt() {
            if (!this.breakingNews.generated_at) return '';
            return new Date(this.breakingNews.generated_at).toLocaleString();
        },
        timeWindow() {
            return this.breakingNews.time_window || '';
        },
        totalArticles() {
            return this.breakingNews.total_articles_analyzed || 0;
        }
    },
    methods: {
        getSeverityClass(severity) {
            if (!severity) return '';
            return `severity-${severity.toLowerCase()}`;
        },
        getSeverityBadgeClass(severity) {
            switch(severity?.toLowerCase()) {
                case 'critical':
                    return 'bg-danger';
                case 'high':
                    return 'bg-warning text-dark';
                case 'medium':
                    return 'bg-info text-dark';
                case 'low':
                    return 'bg-success';
                default:
                    return 'bg-secondary';
            }
        },
        formatDate(dateString) {
            if (!dateString) return 'Unknown';
            return new Date(dateString).toLocaleDateString();
        }
    },
    template: `
        <div class="breaking-news-section" v-if="newsItems.length > 0">
            <div class="d-flex align-items-center mb-3">
                <i class="bi bi-broadcast me-2" style="color: #dc3545; font-size: 1.5rem;"></i>
                <h3 class="mb-0">Breaking News</h3>
                <span class="badge bg-danger ms-3 animate-pulse">LIVE</span>
            </div>
            
            <div class="news-meta mb-3">
                <small class="text-muted">
                    <i class="bi bi-clock me-1"></i>Time window: [[ timeWindow ]] |
                    <i class="bi bi-file-text me-1"></i>Analyzed [[ totalArticles ]] articles |
                    <i class="bi bi-calendar me-1"></i>Last updated: [[ generatedAt ]]
                </small>
            </div>

            <div class="row">
                <div v-for="(item, index) in newsItems" :key="index" class="col-md-6 mb-3">
                    <div class="card breaking-news-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="card-title mb-1">
                                    <i class="bi bi-exclamation-circle-fill" :class="getSeverityClass(item.severity)" style="margin-right: 8px;"></i>
                                    [[ item.title ]]
                                </h5>
                                <span :class="getSeverityBadgeClass(item.severity)" class="badge">
                                    [[ item.severity || 'Unknown' ]]
                                </span>
                            </div>
                            
                            <div class="news-summary text-truncate-3">
                                [[ item.summary ]]
                            </div>

                            <div class="news-meta mt-3">
                                <div class="mb-2">
                                    <strong><i class="bi bi-calendar-event me-1"></i>Date:</strong>
                                    [[ formatDate(item.date) ]]
                                </div>
                                
                                <div v-if="item.affected_entities && item.affected_entities.length > 0" class="mb-2">
                                    <strong><i class="bi bi-building me-1"></i>Affected Entities:</strong>
                                    <div class="mt-1">
                                        <span v-for="(entity, idx) in item.affected_entities" :key="idx" class="badge bg-secondary me-1 mb-1">
                                            [[ entity ]]
                                        </span>
                                    </div>
                                </div>

                                <div v-if="item.threat_actors && item.threat_actors.length > 0" class="mb-2">
                                    <strong><i class="bi bi-person-badge me-1"></i>Threat Actors:</strong>
                                    <div class="mt-1">
                                        <span v-for="(actor, idx) in item.threat_actors" :key="idx" class="badge bg-dark me-1 mb-1">
                                            [[ actor ]]
                                        </span>
                                    </div>
                                </div>

                                <div v-if="item.url">
                                    <a :href="item.url" target="_blank" class="btn btn-sm btn-outline-primary mt-2">
                                        <i class="bi bi-box-arrow-up-right me-1"></i>Read More
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};