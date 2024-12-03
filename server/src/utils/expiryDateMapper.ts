const periods = {
  'd': 24 * 60 * 60 * 1000,  // days
  'h': 60 * 60 * 1000,       // hours
  'm': 60 * 1000,            // minutes
  's': 1000                  // seconds
} as const;

type Period = keyof typeof periods;

export const expiryDateMapper = (expiryDate = ' ', defaultValue = 20 * periods.m): number => {
  try {
    const periodMatch = expiryDate.match(/(d|h|m|s)/);
    const period = periodMatch ? periodMatch[0] as Period : 'm';

    const amountMatch = expiryDate.match(/\d{1,3}/);
    const amount = amountMatch ? Number(amountMatch[0]) : 15;
    if (!periods[period]) {
      console.warn(`Invalid period: ${period}. Using default.`);
      return defaultValue;
    }

    return amount * periods[period];
  } catch (error) {
    console.warn('Error parsing expiry date, using default:', error);
    return defaultValue;
  }
};

export const pgsqlDateAdapter = (date: Date, localeOffset = '+00') => (
  date.toISOString().split('T').join(' ').split('Z').join(localeOffset)
);
