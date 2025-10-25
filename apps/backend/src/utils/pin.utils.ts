/**
 * Generate a random 6-digit PIN for game sessions
 */
export const generateGamePin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Validate if a PIN has the correct format
 */
export const isValidPin = (pin: string): boolean => {
  return /^\d{6}$/.test(pin);
};
