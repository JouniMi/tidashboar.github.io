/**
 * Error Boundary Component
 * Catches component errors and provides graceful fallback UI
 */

window.ErrorBoundaryComponent = {
    template: `
        <div v-if="hasError" class="error-boundary">
            <div class="alert alert-danger" role="alert">
                <h5><i class="bi bi-exclamation-triangle me-2"></i>Something went wrong</h5>
                <p>We encountered an unexpected error. You can try refreshing the page or using the options below.</p>
                
                <div class="mt-3">
                    <button @click="retry" class="btn btn-primary me-2">
                        <i class="bi bi-arrow-clockwise me-1"></i> Retry
                    </button>
                    <button @click="reload" class="btn btn-outline-secondary me-2">
                        <i class="bi bi-arrow-repeat me-1"></i> Reload Page
                    </button>
                    <button @click="clearError" class="btn btn-outline-secondary">
                        <i class="bi bi-eye-slash me-1"></i> Dismiss
                    </button>
                </div>
                
                <div v-if="errorDetails" class="mt-3">
                    <button @click="showDetails = !showDetails" class="btn btn-sm btn-link text-decoration-none">
                        <i class="bi bi-chevron-{{ showDetails ? 'up' : 'down' }} me-1"></i>
                        {{ showDetails ? 'Hide' : 'Show' }} Error Details
                    </button>
                    
                    <div v-if="showDetails" class="mt-2">
                        <div class="card bg-dark text-light">
                            <div class="card-body">
                                <h6 class="text-danger mb-2">{{ errorDetails.name }}</h6>
                                <pre class="mb-0 text-white" style="white-space: pre-wrap; word-break: break-word;">{{ errorDetails.message }}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            <slot></slot>
        </div>
    `,

    data() {
        return {
            hasError: false,
            error: null,
            errorDetails: null,
            showDetails: false
        };
    },

    errorCaptured(error, vm, info) {
        this.hasError = true;
        this.error = error;
        this.errorDetails = {
            name: error.name || 'Error',
            message: error.message || String(error),
            stack: error.stack,
            info: info,
            componentName: vm?.$options?.name || 'Unknown'
        };

        // Log error for debugging
        console.error('Error boundary caught:', {
            error: this.errorDetails,
            component: this.errorDetails.componentName,
            info: info
        });

        // Report to analytics (if available)
        if (window.simpleanalytics) {
            window.simpleanalytics.event('error', {
                component: this.errorDetails.componentName,
                message: this.errorDetails.message
            });
        }

        // Return false to prevent error propagation
        return false;
    },

    methods: {
        retry() {
            this.hasError = false;
            this.error = null;
            this.errorDetails = null;
            this.showDetails = false;

            // Trigger a re-render by forcing a key change
            this.$forceUpdate();
        },

        reload() {
            window.location.reload();
        },

        clearError() {
            this.hasError = false;
            this.error = null;
            this.errorDetails = null;
            this.showDetails = false;
        }
    }
};
