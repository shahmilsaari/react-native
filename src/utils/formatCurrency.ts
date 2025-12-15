/**
 * Global helper for formatting currency.
 * Using MYR (Ringgit Malaysia) as per user request.
 */
export const formatCurrency = (amount?: number | null): string => {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
        return '—';
    }

    // Format with commas, 0 decimals for whole numbers, 2 for floats if needed
    // But usually hotel prices are whole or straight numbers.
    // Using simplified "RM X" or "RM X.XX"

    return `RM ${amount.toLocaleString('en-MY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
};
