/**
 * @fileoverview Provides a utility function for debouncing function calls.
 * @module lib/debounce
 */

/**
 * Creates a debounced version of a function that delays execution until
 * after the specified wait time has elapsed since the last time it was invoked.
 * Useful for limiting the rate at which a function can fire, such as with search inputs
 * or resize events.
 *
 * @function debounce
 * @param {Function} func - The function to debounce
 * @param {number} [wait=300] - The number of milliseconds to delay
 * @returns {Function} A debounced version of the original function
 * @example
 * // Create a debounced search function that only executes 300ms after last keystroke
 * const debouncedSearch = debounce(performSearch, 300);
 * searchInput.addEventListener('input', () => debouncedSearch(searchInput.value));
 */
export function debounce(func, wait = 300) {
    let timeout;
    
    return function(...args) {
      const context = this;
      
      clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }