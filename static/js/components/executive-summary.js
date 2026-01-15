/**
 * Executive Summary Component
 * Displays the executive summary from the JSON file
 */
window.ExecutiveSummaryComponent = {
    props: {
        summary: {
            type: String,
            required: true
        },
        industry: {
            type: String,
            default: ''
        }
    },
    computed: {
        title() {
            return this.industry ? `${this.industry} - Executive Summary` : 'Executive Summary';
        },
        formattedSummary() {
            let html = Utils.formatMarkdown(this.summary);
            // Wrap tables in responsive containers
            html = html.replace(/<table([^>]*)>/gi, '<div class="table-responsive"><table$1>');
            html = html.replace(/<\/table>/gi, '</table></div>');
            return html;
        }
    },
    template: `
        <div class="executive-summary">
            <div class="d-flex align-items-center mb-3">
                <i class="bi bi-file-text me-2"></i>
                <h3 class="mb-0">[[ title ]]</h3>
            </div>
            <div class="executive-summary-content" ref="content" v-html="formattedSummary"></div>
        </div>
    `,
    mounted() {
        this.$nextTick(() => {
            this.checkTableOverflow();
        });
        // Add resize listener to check overflow on window resize
        window.addEventListener('resize', this.checkTableOverflow);
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.checkTableOverflow);
    },
    methods: {
        checkTableOverflow() {
            if (!this.$refs.content) return;
            
            const responsiveContainers = this.$refs.content.querySelectorAll('.table-responsive');
            responsiveContainers.forEach(container => {
                const table = container.querySelector('table');
                if (table) {
                    // Check if table is wider than container
                    if (table.scrollWidth > container.clientWidth) {
                        container.classList.add('scrollable');
                    } else {
                        container.classList.remove('scrollable');
                    }
                }
            });
        }
    }
};