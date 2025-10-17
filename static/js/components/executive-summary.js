/**
 * Executive Summary Component
 * Displays the executive summary from the JSON file
 */
window.ExecutiveSummaryComponent = {
    props: {
        summary: {
            type: String,
            required: true
        }
    },
    template: `
        <div class="executive-summary">
            <div class="d-flex align-items-center mb-3">
                <i class="bi bi-file-text me-2"></i>
                <h3 class="mb-0">Executive Summary</h3>
            </div>
            <div class="executive-summary-content" v-html="formattedSummary"></div>
        </div>
    `,
    computed: {
        formattedSummary() {
            return Utils.formatMarkdown(this.summary);
        }
    }
};