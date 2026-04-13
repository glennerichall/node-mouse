export function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function setNestedValue(target, dottedPath, value) {
    const segments = String(dottedPath || '').split('.').filter(Boolean);
    if (!segments.length) {
        return;
    }

    let cursor = target;
    for (let index = 0; index < segments.length - 1; index += 1) {
        const segment = segments[index];
        if (!isPlainObject(cursor[segment])) {
            cursor[segment] = {};
        }
        cursor = cursor[segment];
    }

    cursor[segments[segments.length - 1]] = value;
}

export function toFlatMap(value, prefix = '', target = new Map()) {
    if (!isPlainObject(value)) {
        if (prefix) {
            target.set(prefix, value);
        }
        return target;
    }

    for (const [key, nestedValue] of Object.entries(value)) {
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        if (isPlainObject(nestedValue)) {
            toFlatMap(nestedValue, nextPrefix, target);
        } else {
            target.set(nextPrefix, nestedValue);
        }
    }

    return target;
}

export function deepMerge(base, override) {
    if (!override || typeof override !== 'object' || Array.isArray(override)) {
        return base;
    }

    const result = Array.isArray(base) ? [...base] : {...base};
    for (const [key, value] of Object.entries(override)) {
        const current = result[key];
        if (
            current
            && typeof current === 'object'
            && !Array.isArray(current)
            && value
            && typeof value === 'object'
            && !Array.isArray(value)
        ) {
            result[key] = deepMerge(current, value);
        } else if (value !== undefined && value !== null && value !== ''){
            result[key] = value;
        }
    }
    return result;
}

export function compactObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return value;
    }

    const compacted = Object.fromEntries(
        Object.entries(value)
            .map(([key, nestedValue]) => [key, compactObject(nestedValue)])
            .filter(([, nestedValue]) => nestedValue !== undefined)
    );

    return Object.keys(compacted).length ? compacted : undefined;
}