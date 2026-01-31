import { useEffect, useCallback } from 'react';

/**
 * Custom hook to persist panel layout sizes to localStorage
 * This ensures user's panel preferences are maintained across sessions
 */
export const usePanelPersistence = (storageKey: string) => {
    /**
     * Save panel layout to localStorage
     * @param sizes - Array of panel sizes (percentages)
     */
    const saveLayout = useCallback((sizes: number[]) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(sizes));
        } catch (error) {
            console.warn(`Failed to save panel layout for ${storageKey}:`, error);
        }
    }, [storageKey]);

    /**
     * Load panel layout from localStorage
     * @returns Array of panel sizes or undefined if not found
     */
    const loadLayout = useCallback((): number[] | undefined => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate that it's an array of numbers
                if (Array.isArray(parsed) && parsed.every(n => typeof n === 'number')) {
                    return parsed;
                }
            }
        } catch (error) {
            console.warn(`Failed to load panel layout for ${storageKey}:`, error);
        }
        return undefined;
    }, [storageKey]);

    /**
     * Clear saved layout from localStorage
     */
    const clearLayout = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.warn(`Failed to clear panel layout for ${storageKey}:`, error);
        }
    }, [storageKey]);

    return { saveLayout, loadLayout, clearLayout };
};

/**
 * Debounce utility for panel resize events
 * Prevents excessive localStorage writes during drag
 */
export const debounce = <T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
