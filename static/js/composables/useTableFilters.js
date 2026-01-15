/**
 * useTableFilters Composable
 * Reusable filtering, sorting, and pagination logic for table components
 */

window.useTableFilters = function(options = {}) {
    const {
        searchFields = [],
        filterOptions = [],
        defaultSortField = 'published_date',
        defaultSortDirection = 'desc',
        defaultItemsPerPage = 20
    } = options;

    return {
        data() {
            return {
                searchQuery: '',
                filters: {},
                sortByField: defaultSortField,
                sortDirection: defaultSortDirection,
                currentPage: 1,
                itemsPerPage: defaultItemsPerPage,
                expandedItems: [],
                filteredData: [],
                debouncedFilter: null
            };
        },

        created() {
            this.debouncedFilter = Utils.debounce(this.applyFilters, 300);
        },

        computed: {
            paginatedData() {
                const start = (this.currentPage - 1) * this.itemsPerPage;
                const end = start + (this.itemsPerPage === 0 ? this.filteredData.length : this.itemsPerPage);
                return this.filteredData.slice(start, end);
            },

            totalPages() {
                if (this.itemsPerPage === 0) return 1;
                return Math.ceil(this.filteredData.length / this.itemsPerPage);
            }
        },

        methods: {
            applyFilters() {
                let filtered = [...(this.dataItems || [])];

                // Apply search filter
                if (this.searchQuery && searchFields.length > 0) {
                    const query = this.searchQuery.toLowerCase();
                    filtered = filtered.filter(item => {
                        return searchFields.some(field => {
                            const value = this.getNestedValue(item, field);
                            if (Array.isArray(value)) {
                                return value.some(v => String(v).toLowerCase().includes(query));
                            }
                            return value && String(value).toLowerCase().includes(query);
                        });
                    });
                }

                // Apply custom filters
                Object.entries(this.filters).forEach(([key, value]) => {
                    if (value) {
                        filtered = filtered.filter(item => {
                            const itemValue = this.getNestedValue(item, key);
                            return this.applyFilter(itemValue, value, key);
                        });
                    }
                });

                // Apply sorting
                this.filteredData = this.sortData(filtered);
                this.currentPage = 1;
            },

            sortData(data) {
                return data.sort((a, b) => {
                    let aVal = this.getNestedValue(a, this.sortByField);
                    let bVal = this.getNestedValue(b, this.sortByField);

                    // Handle date fields
                    if (this.isDateField(this.sortByField)) {
                        aVal = new Date(aVal) || new Date(0);
                        bVal = new Date(bVal) || new Date(0);
                    }

                    // Handle numeric fields
                    if (typeof aVal === 'number' && typeof bVal === 'number') {
                        return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                    }

                    // Handle string fields
                    aVal = String(aVal).toLowerCase();
                    bVal = String(bVal).toLowerCase();
                    if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
                    if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });
            },

            applyFilter(itemValue, filterValue, field) {
                // CVSS range filter (e.g., "9.0-10.0")
                if (field === 'cvssFilter' && filterValue.includes('-')) {
                    const [min, max] = filterValue.split('-').map(parseFloat);
                    const score = parseFloat(itemValue);
                    return score >= min && score <= max;
                }

                // Exploit status filter
                if (field === 'exploitFilter') {
                    if (filterValue === 'unknown') {
                        return !itemValue || itemValue === 'unknown';
                    }
                    return itemValue === filterValue;
                }

                // Standard equality filter
                return itemValue === filterValue;
            },

            sortBy(field) {
                if (this.sortByField === field) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortByField = field;
                    this.sortDirection = 'asc';
                }
                this.applyFilters();
            },

            toggleItem(itemId) {
                const index = this.expandedItems.indexOf(itemId);
                if (index > -1) {
                    this.expandedItems.splice(index, 1);
                } else {
                    this.expandedItems.push(itemId);
                }
            },

            clearSearch() {
                this.searchQuery = '';
                this.applyFilters();
            },

            changePage(page) {
                this.currentPage = page;
            },

            changeItemsPerPage(count) {
                this.itemsPerPage = count;
                this.currentPage = 1;
                this.applyFilters();
            },

            getNestedValue(obj, path) {
                const keys = path.split('.');
                return keys.reduce((current, key) => current && current[key], obj);
            },

            isDateField(field) {
                const dateFields = ['published_date', 'created_at', 'updated_at', 'date', 'timestamp', 'discovery_date'];
                return dateFields.includes(field);
            },

            getSortIcon(field) {
                if (this.sortByField !== field) return 'fa-sort';
                return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
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

            formatDate(dateString) {
                if (!dateString) return 'N/A';
                try {
                    const date = new Date(dateString);
                    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                } catch (error) {
                    return 'Invalid Date';
                }
            },

            truncateText(text, maxLength = 100) {
                if (!text) return '';
                return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
            },

            resetFilters() {
                this.searchQuery = '';
                Object.keys(this.filters).forEach(key => {
                    this.filters[key] = '';
                });
                this.sortByField = defaultSortField;
                this.sortDirection = defaultSortDirection;
                this.currentPage = 1;
                this.applyFilters();
            }
        },

        watch: {
            dataItems: {
                handler() {
                    this.applyFilters();
                },
                immediate: true
            },

            itemsPerPage() {
                this.currentPage = 1;
            }
        }
    };
};
