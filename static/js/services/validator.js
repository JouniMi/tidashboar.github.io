/**
 * Data Validator Service
 * Provides validation utilities for API responses and data structures
 */

class Validator {
    constructor() {
        this.schemas = {};
    }

    /**
     * Define a schema for validation
     */
    defineSchema(name, schema) {
        this.schemas[name] = schema;
    }

    /**
     * Validate data against a schema
     */
    validate(data, schemaName) {
        const schema = this.schemas[schemaName];
        if (!schema) {
            console.warn(`Schema "${schemaName}" not found, skipping validation`);
            return { valid: true, errors: [] };
        }

        return this.validateAgainstSchema(data, schema);
    }

    /**
     * Validate data against a schema object
     */
    validateAgainstSchema(data, schema) {
        const errors = [];
        const required = schema.required || [];
        const fields = schema.fields || {};

        // Check required fields
        required.forEach(field => {
            if (this.isUndefined(data[field])) {
                errors.push(`Required field "${field}" is missing`);
            }
        });

        // Validate field types and formats
        Object.entries(fields).forEach(([fieldName, fieldSchema]) => {
            if (this.isUndefined(data[fieldName])) {
                if (required.includes(fieldName)) {
                    errors.push(`Required field "${fieldName}" is missing`);
                }
                return;
            }

            const value = data[fieldName];
            const fieldType = fieldSchema.type;

            // Type validation
            if (!this.validateType(value, fieldType)) {
                errors.push(`Field "${fieldName}" should be type "${fieldType}", got "${typeof value}"`);
            }

            // Array item validation
            if (fieldType === 'array' && fieldSchema.itemType && Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (!this.validateType(item, fieldSchema.itemType)) {
                        errors.push(`Array "${fieldName}" at index ${index} should contain items of type "${fieldSchema.itemType}"`);
                    }
                });
            }

            // Enum validation
            if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
                errors.push(`Field "${fieldName}" should be one of: ${fieldSchema.enum.join(', ')}`);
            }

            // Format validation
            if (fieldSchema.format && !this.validateFormat(value, fieldSchema.format)) {
                errors.push(`Field "${fieldName}" does not match format "${fieldSchema.format}"`);
            }

            // Min/max validation for arrays
            if (fieldType === 'array' && Array.isArray(value)) {
                if (fieldSchema.minItems !== undefined && value.length < fieldSchema.minItems) {
                    errors.push(`Array "${fieldName}" should have at least ${fieldSchema.minItems} items`);
                }
                if (fieldSchema.maxItems !== undefined && value.length > fieldSchema.maxItems) {
                    errors.push(`Array "${fieldName}" should have at most ${fieldSchema.maxItems} items`);
                }
            }

            // Min/max validation for numbers
            if (fieldType === 'number' && typeof value === 'number') {
                if (fieldSchema.min !== undefined && value < fieldSchema.min) {
                    errors.push(`Field "${fieldName}" should be at least ${fieldSchema.min}`);
                }
                if (fieldSchema.max !== undefined && value > fieldSchema.max) {
                    errors.push(`Field "${fieldName}" should be at most ${fieldSchema.max}`);
                }
            }

            // String length validation
            if (fieldType === 'string' && typeof value === 'string') {
                if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
                    errors.push(`Field "${fieldName}" should be at least ${fieldSchema.minLength} characters`);
                }
                if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
                    errors.push(`Field "${fieldName}" should be at most ${fieldSchema.maxLength} characters`);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate value type
     */
    validateType(value, expectedType) {
        if (this.isUndefined(value)) return false;

        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'date':
                return !isNaN(new Date(value).getTime());
            case 'any':
                return true;
            default:
                return true;
        }
    }

    /**
     * Validate value format
     */
    validateFormat(value, format) {
        if (!value) return true;

        switch (format) {
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case 'url':
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            case 'date':
                return !isNaN(new Date(value).getTime());
            case 'cvss':
                const score = parseFloat(value);
                return !isNaN(score) && score >= 0 && score <= 10;
            case 'cve':
                return /^CVE-\d{4}-\d{4,7}$/i.test(value);
            case 'severity':
                return ['critical', 'high', 'medium', 'low'].includes(String(value).toLowerCase());
            default:
                return true;
        }
    }

    /**
     * Check if value is undefined or null
     */
    isUndefined(value) {
        return value === undefined || value === null;
    }

    /**
     * Sanitize input to prevent XSS
     */
    sanitize(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    /**
     * Validate API response structure
     */
    validateApiResponse(response, expectedStructure) {
        const errors = [];

        if (typeof response !== 'object' || response === null) {
            errors.push('Response is not a valid object');
            return { valid: false, errors };
        }

        // Check for error field
        if (response.error) {
            errors.push(`API returned error: ${response.error}`);
        }

        // Validate expected structure
        if (expectedStructure) {
            Object.entries(expectedStructure).forEach(([key, type]) => {
                if (!this.validateType(response[key], type)) {
                    errors.push(`Response field "${key}" should be type "${type}"`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate incident object
     */
    validateIncident(incident) {
        return this.validate(incident, 'incident');
    }

    /**
     * Validate vulnerability object
     */
    validateVulnerability(vuln) {
        return this.validate(vuln, 'vulnerability');
    }

    /**
     * Validate threat actor object
     */
    validateThreatActor(actor) {
        return this.validate(actor, 'threatActor');
    }

    /**
     * Validate statistics data
     */
    validateStatistics(stats) {
        return this.validate(stats, 'statistics');
    }

    /**
     * Sanitize array of objects
     */
    sanitizeArray(data) {
        if (!Array.isArray(data)) return [];
        return data.map(item => this.sanitizeObject(item));
    }

    /**
     * Sanitize object (sanitize all string values)
     */
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        const sanitized = {};
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (typeof value === 'string') {
                sanitized[key] = this.sanitize(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        });

        return sanitized;
    }

    /**
     * Check if data is safe to render
     */
    isSafeToRender(data) {
        try {
            JSON.stringify(data);
            return true;
        } catch (error) {
            console.error('Data contains circular references or unserializable values:', error);
            return false;
        }
    }

    /**
     * Get validation summary for display
     */
    getValidationSummary(validationResult) {
        if (validationResult.valid) {
            return { type: 'success', message: 'Data is valid' };
        }
        return {
            type: 'error',
            message: `Validation failed: ${validationResult.errors.join(', ')}`,
            errors: validationResult.errors
        };
    }
}

// Define common schemas
window.validator = new Validator();

// Incident schema
window.validator.defineSchema('incident', {
    type: 'object',
    required: ['id', 'title', 'severity'],
    fields: {
        id: { type: 'string' },
        title: { type: 'string', minLength: 1, maxLength: 500 },
        severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        incident_type: { type: 'string' },
        published_date: { type: 'date' },
        source: { type: 'string' },
        content_snippet: { type: 'string' },
        url: { type: 'string', format: 'url' },
        attack_vectors: { type: 'array', itemType: 'string' },
        affected_companies: { type: 'array', itemType: 'string' },
        threat_actors: { type: 'array', itemType: 'string' },
        confirmed_breach: { type: 'string', enum: ['yes', 'no', 'unknown'] },
        overall_risk: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'unknown'] },
        financial_impact: { type: 'string' },
        customer_impact: { type: 'string' },
        data_compromised: { type: 'array', itemType: 'string' }
    }
});

// Vulnerability schema
window.validator.defineSchema('vulnerability', {
    type: 'object',
    required: ['id', 'cve_id'],
    fields: {
        id: { type: 'string' },
        cve_id: { type: 'string', format: 'cve' },
        title: { type: 'string', minLength: 1, maxLength: 500 },
        severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'unknown'] },
        cvss_score: { type: 'number', format: 'cvss' },
        cvss_vector: { type: 'string' },
        description: { type: 'string' },
        summary: { type: 'string' },
        published_date: { type: 'date' },
        discovery_date: { type: 'date' },
        source: { type: 'string' },
        url: { type: 'string', format: 'url' },
        exploit_available: { type: 'string', enum: ['true', 'false', 'unknown'] },
        affected_products: { type: 'array', itemType: 'string' },
        vendors: { type: 'array', itemType: 'string' },
        attack_vector: { type: 'string' },
        complex: { type: 'string' }
    }
});

// Threat Actor schema
window.validator.defineSchema('threatActor', {
    type: 'object',
    required: ['id'],
    fields: {
        id: { type: 'string' },
        name: { type: 'string', minLength: 1, maxLength: 200 },
        title: { type: 'string' },
        type: { type: 'string' },
        motivation: { type: 'string' },
        risk_level: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'unknown'] },
        overall_risk: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'unknown'] },
        country_of_origin: { type: 'string' },
        published_date: { type: 'date' },
        source: { type: 'string' },
        content_snippet: { type: 'string' },
        aliases: { type: 'array', itemType: 'string' },
        malware_families: { type: 'array', itemType: 'string' },
        targets: { type: 'array', itemType: 'string' },
        techniques: { type: 'array', itemType: 'string' }
    }
});

// Statistics schema
window.validator.defineSchema('statistics', {
    type: 'object',
    required: [],
    fields: {
        incidents: { type: 'object' },
        vulnerabilities: { type: 'object' },
        threat_actors: { type: 'object' },
        risk_assessment: { type: 'object' },
        overall_metrics: { type: 'object' },
        metadata: { type: 'object' }
    }
});
