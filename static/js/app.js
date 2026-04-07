const { createApp } = Vue;

const themeService = {
    init() {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    },
    toggle() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    },
    isDark() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }
};

themeService.init();

var app = createApp({
    data: function () {
        return {
            loading: true,
            error: null,
            report: {
                metadata: {},
                sources: [],
                executive_brief: '',
                threat_stories: [],
                actor_profiles: [],
                critical_vulnerabilities: [],
                hunting_leads: [],
                statistics: {}
            },
            activeTab: 'brief',
            tabs: [
                { id: 'brief', label: 'Brief', icon: 'bi bi-file-earmark-text' },
                { id: 'stories', label: 'Stories', icon: 'bi bi-lightning' },
                { id: 'actors', label: 'Actors', icon: 'bi bi-person-fill' },
                { id: 'vulns', label: 'Vulnerabilities', icon: 'bi bi-shield-exclamation' },
                { id: 'hunting', label: 'Hunting', icon: 'bi bi-crosshair' },
                { id: 'sources', label: 'Sources', icon: 'bi bi-link-45deg' },
                { id: 'statistics', label: 'Statistics', icon: 'bi bi-bar-chart' }
            ],
            expandedStories: {},
            sourceSearch: ''
        };
    },

    computed: {
        filteredSources: function () {
            if (!this.sourceSearch) return this.report.sources;
            var q = this.sourceSearch.toLowerCase();
            return this.report.sources.filter(function (s) {
                return s.title.toLowerCase().indexOf(q) !== -1 ||
                    (s.source_type && s.source_type.toLowerCase().indexOf(q) !== -1);
            });
        }
    },

    mounted: function () {
        this.loadReport();
    },

    methods: {
        loadReport: function () {
            var self = this;
            self.loading = true;
            self.error = null;
            fetch('./gui/unified_report.json')
                .then(function (res) {
                    if (!res.ok) throw new Error('Failed to load report: ' + res.status);
                    return res.json();
                })
                .then(function (data) {
                    self.report = data;
                })
                .catch(function (e) {
                    console.error('Failed to load report:', e);
                    self.error = 'Failed to load threat intelligence report. Please try again.';
                })
                .finally(function () {
                    self.loading = false;
                });
        },

        formatDate: function (dateStr) {
            if (!dateStr) return '';
            try {
                var d = new Date(dateStr);
                return d.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                return dateStr;
            }
        },

        toggleStory: function (idx) {
            this.expandedStories[idx] = !this.expandedStories[idx];
            this.expandedStories = Object.assign({}, this.expandedStories);
        },

        getSourceUrl: function (id) {
            var src = this.report.sources.find(function (s) { return s.id === id; });
            return src ? src.url : '#';
        },

        formatMarkdown: function (text) {
            if (!text) return '';
            return marked.parse(text, { breaks: true });
        },

        impactClass: function (impact) {
            if (!impact) return '';
            var s = impact.toLowerCase();
            if (s.indexOf('critical') !== -1) return 'severity-critical';
            if (s.indexOf('high') !== -1) return 'severity-high';
            if (s.indexOf('medium') !== -1) return 'severity-medium';
            return '';
        },

        severityClass: function (severity) {
            if (!severity) return '';
            var s = severity.toLowerCase();
            if (s === 'critical') return 'severity-critical';
            if (s === 'high') return 'severity-high';
            if (s === 'medium') return 'severity-medium';
            return '';
        },

        cvssClass: function (score) {
            if (score >= 9) return 'cvss-critical';
            if (score >= 7) return 'cvss-high';
            if (score >= 4) return 'cvss-medium';
            return 'cvss-low';
        },

        motivationClass: function (motivation) {
            if (!motivation) return '';
            var s = motivation.toLowerCase();
            if (s.indexOf('espionage') !== -1) return 'motivation-Espionage';
            if (s.indexOf('financial') !== -1) return 'motivation-Financial';
            if (s.indexOf('disruption') !== -1 || s.indexOf('political') !== -1) return 'motivation-Disruption';
            return '';
        },

        exploitClass: function (status) {
            if (!status) return '';
            var s = status.toLowerCase();
            if (s.indexOf('active') !== -1) return 'exploit-active';
            if (s.indexOf('confirmed') !== -1 || s.indexOf('functional') !== -1) return 'exploit-functional';
            return 'exploit-unknown';
        }
    }
});

app.config.compilerOptions.delimiters = ['[[', ']]'];
app.mount('#app');

var themeToggleBtn = document.getElementById('themeToggleBtn');
if (themeToggleBtn) {
    var updateIcon = function () {
        var icon = themeToggleBtn.querySelector('i');
        if (icon) {
            icon.className = themeService.isDark() ? 'bi bi-sun' : 'bi bi-moon-stars';
        }
        themeToggleBtn.setAttribute('aria-label', themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode');
    };
    themeToggleBtn.addEventListener('click', function () {
        themeService.toggle();
        updateIcon();
    });
    updateIcon();
}
