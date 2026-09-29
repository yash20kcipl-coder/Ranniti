/**
 * Formats a numeric price amount into a currency format with exactly two decimal places
 * (e.g., ₹20,725.00 or $1,480.00) using proper regional digit clustering.
 */
export const formatCurrencyWithDecimals = (amount: number, symbol: string = '₹'): string => {
  const numericAmount = Number(amount || 0);

  // formats the number with thousands/lakhs dividers and locks in 2 decimal points
  const formattedString = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);

  return `${symbol}${formattedString}`;
};
