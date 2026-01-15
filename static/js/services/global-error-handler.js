/**
 * Global Error Handler
 * Provides graceful error handling across the application
 */

window.GlobalErrorHandler = {
    errorLog: [],
    maxLogSize: 50,

    init(app) {
        // Handle Vue component errors
        app.config.errorHandler = (err, vm, info) => {
            this.logError(err, vm, info, 'Vue Error');
        };

        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            this.logError(event.error, null, event.message, 'Uncaught Error');
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError(event.reason, null, 'Unhandled Promise Rejection', 'Promise Rejection');
        });
    },

    logError(error, vm, info, type) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            message: error?.message || String(error),
            stack: error?.stack,
            component: vm?.$options?.name || 'Unknown',
            info: info
        };

        // Add to log
        this.errorLog.push(errorEntry);

        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Log to console
        console.error(`${type}:`, {
            error: error,
            component: errorEntry.component,
            info: info
        });

        // Show user notification
        this.showUserNotification(errorEntry);

        // Report to analytics (if available)
        this.reportToAnalytics(errorEntry);
    },

    showUserNotification(errorEntry) {
        // Use Utils.showNotification if available
        if (window.Utils && Utils.showNotification) {
            const message = `Error in ${errorEntry.component}: ${errorEntry.message.substring(0, 100)}`;
            Utils.showNotification(message, 'danger', 5000);
        } else {
            // Fallback: create toast manually
            this.createToast(errorEntry);
        }
    },

    createToast(errorEntry) {
        const containerId = 'global-error-toast-container';
        let container = document.getElementById(containerId);

        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

        const toastId = `error-toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = 'toast show mb-2';
        toast.style.minWidth = '300px';
        toast.innerHTML = `
            <div class="toast-header bg-danger text-white">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Error</strong>
                <button type="button" class="btn-close btn-close-white ms-auto" onclick="document.getElementById('${toastId}').remove()"></button>
            </div>
            <div class="toast-body">
                <small>${errorEntry.component}: ${errorEntry.message.substring(0, 150)}</small>
            </div>
        `;

        container.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) toastElement.remove();
        }, 5000);
    },

    reportToAnalytics(errorEntry) {
        if (window.simpleanalytics) {
            try {
                window.simpleanalytics.event('error', {
                    type: errorEntry.type,
                    component: errorEntry.component,
                    message: errorEntry.message.substring(0, 100)
                });
            } catch (error) {
                console.warn('Failed to report error to analytics:', error);
            }
        }
    },

    getRecentErrors(count = 10) {
        return this.errorLog.slice(-count);
    },

    clearErrorLog() {
        this.errorLog = [];
    },

    getErrorLog() {
        return [...this.errorLog];
    },

    downloadErrorLog() {
        const data = JSON.stringify(this.errorLog, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    getErrorSummary() {
        const summary = {
            total: this.errorLog.length,
            byType: {},
            byComponent: {},
            recentErrors: this.getRecentErrors(5)
        };

        this.errorLog.forEach(entry => {
            summary.byType[entry.type] = (summary.byType[entry.type] || 0) + 1;
            summary.byComponent[entry.component] = (summary.byComponent[entry.component] || 0) + 1;
        });

        return summary;
    }
};
