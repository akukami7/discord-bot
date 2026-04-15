/**
 * Format number with spaces: 1000000 -> 1 000 000
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Format time from seconds to human-readable string
 */
export function formatTime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}д`);
  if (hours > 0) parts.push(`${hours}ч`);
  if (minutes > 0) parts.push(`${minutes}м`);

  return parts.length > 0 ? parts.join(' ') : '0м';
}

/**
 * Calculate XP needed for a level
 */
export function xpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

/**
 * Calculate total XP needed to reach a level from 0
 */
export function totalXpForLevel(level) {
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

/**
 * Generate a progress bar string
 */
export function progressBar(current, max, length = 10) {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
