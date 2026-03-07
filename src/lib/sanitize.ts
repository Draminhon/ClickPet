import xss from 'xss';

// Configuration for xss sanitizer
const xssOptions: any = {
    whiteList: {}, // empty means no tags are allowed at all (for plain text inputs)
    stripIgnoreTag: true, // filter out all html not in the whitelist
    stripIgnoreTagBody: ['script'] // the script tag is a special case, we need
    // to filter out its content
};

/**
 * Sanitizes a string input to prevent XSS attacks.
 * @param input The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string | undefined | null): string {
    if (!input) return '';
    return xss(input, xssOptions);
}

/**
 * Recursively sanitizes object properties to prevent XSS attacks.
 * @param obj The object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string') {
            return sanitizeInput(obj) as any;
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item)) as any;
    }

    const sanitizedObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            sanitizedObj[key] = sanitizeObject((obj as any)[key]);
        }
    }

    return sanitizedObj;
}
