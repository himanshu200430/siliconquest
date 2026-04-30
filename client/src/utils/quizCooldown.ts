/**
 * Quiz Cooldown Manager
 * Manages progressive cooldown periods for wrong quiz answers
 * - First wrong answer: 60 seconds cooldown
 * - Each subsequent wrong answer for the same question: +30 seconds
 * - Cooldowns are question-specific (don't carry over to other questions)
 */

const STORAGE_KEY = 'quiz_cooldowns';
const INITIAL_COOLDOWN = 60; // 60 seconds
const COOLDOWN_INCREMENT = 30; // 30 seconds

interface CooldownData {
  [characterId: string]: {
    expiresAt: number; // Unix timestamp in milliseconds
    attempts: number; // Number of wrong attempts
  };
}

/**
 * Get all cooldown data from localStorage
 */
function getCooldownData(): CooldownData {
  if (typeof window === 'undefined') return {};
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading cooldown data:', error);
    return {};
  }
}

/**
 * Save cooldown data to localStorage
 */
function saveCooldownData(data: CooldownData): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving cooldown data:', error);
  }
}

/**
 * Check if a character is currently on cooldown
 * @returns null if no cooldown, or the remaining seconds if on cooldown
 */
export function getCooldownRemaining(characterId: string): number | null {
  const data = getCooldownData();
  const cooldown = data[characterId];
  
  if (!cooldown) return null;
  
  const now = Date.now();
  if (now >= cooldown.expiresAt) {
    // Cooldown expired, clean it up
    delete data[characterId];
    saveCooldownData(data);
    return null;
  }
  
  return Math.ceil((cooldown.expiresAt - now) / 1000);
}

/**
 * Set a cooldown for a character after a wrong answer
 * Progressive cooldown: 60s + (attempts * 30s)
 */
export function setWrongAnswerCooldown(characterId: string): number {
  const data = getCooldownData();
  const existing = data[characterId];
  
  // Calculate attempts (start at 0 if first wrong answer)
  const attempts = existing?.attempts || 0;
  const newAttempts = attempts + 1;
  
  // Calculate cooldown duration: 60s for first, +30s for each additional
  const cooldownSeconds = INITIAL_COOLDOWN + (attempts * COOLDOWN_INCREMENT);
  const expiresAt = Date.now() + (cooldownSeconds * 1000);
  
  data[characterId] = {
    expiresAt,
    attempts: newAttempts,
  };
  
  saveCooldownData(data);
  
  return cooldownSeconds;
}

/**
 * Clear cooldown for a character (called after correct answer)
 */
export function clearCooldown(characterId: string): void {
  const data = getCooldownData();
  delete data[characterId];
  saveCooldownData(data);
}

/**
 * Clear all expired cooldowns (cleanup utility)
 */
export function cleanupExpiredCooldowns(): void {
  const data = getCooldownData();
  const now = Date.now();
  let hasChanges = false;
  
  Object.keys(data).forEach(characterId => {
    if (now >= data[characterId].expiresAt) {
      delete data[characterId];
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    saveCooldownData(data);
  }
}

/**
 * Format remaining seconds into MM:SS format
 */
export function formatCooldownTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
