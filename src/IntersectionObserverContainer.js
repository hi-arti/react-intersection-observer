import { parseRootMargin, shallowCompareOptions } from './utils';

export function getPooled(options = {}) {
    const root = options.root || null;
    const rootMargin = parseRootMargin(options.rootMargin);
    const threshold = Array.isArray(options.threshold)
        ? options.threshold
        : [typeof options.threshold !== 'undefined' ? options.threshold : 0];
    // eslint-disable-next-line no-restricted-syntax
    for (const observer of storage.keys()) {
        const unmatched = [
            [root, observer.root],
            [rootMargin, observer.rootMargin],
            [threshold, observer.thresholds],
        ].some(option => shallowCompareOptions(...option));

        if (!unmatched) {
            return observer;
        }
    }
    return null;
}

export const storage = new Map();

/**
 * If instances of a class can be reused because the options map,
 * we avoid creating instances of Intersection Observer by reusing them.
 */
export default class IntersectionObserverContainer {
    static create(callback, options) {
        return getPooled(options) || new IntersectionObserver(callback, options);
    }

    static findElement(entry, observer) {
        const elements = storage.get(observer);
        if (elements) {
            // eslint-disable-next-line no-restricted-syntax
            for (const element of elements.values()) {
                if (element.target === entry.target) {
                    return element;
                }
            }
        }
        return null;
    }

    static observe(element) {
        let targets;
        if (storage.has(element.observer)) {
            targets = storage.get(element.observer);
        } else {
            targets = new Set();
            storage.set(element.observer, targets);
        }
        targets.add(element);
        element.observer.observe(element.target);
    }

    static unobserve(element) {
        if (storage.has(element.observer)) {
            const targets = storage.get(element.observer);
            if (targets.delete(element)) {
                if (targets.size > 0) {
                    element.observer.unobserve(element.target);
                } else {
                    element.observer.disconnect();
                    storage.delete(element.observer);
                }
            }
        }
    }

    static clear() {
        storage.clear();
    }

    static count() {
        return storage.size;
    }
}
