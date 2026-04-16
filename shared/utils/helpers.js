/**
 * Format number with spaces: 1000000 -> 1 000 000
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
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
 * Format time from milliseconds to human-readable string
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}д`);
  if (hours > 0) parts.push(`${hours}ч`);
  if (minutes > 0) parts.push(`${minutes}м`);

  return parts.length > 0 ? parts.join(' ') : '< 1м';
}

/**
 * Calculate XP needed for a level
 */
export function xpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

/**
 * Calculate total XP needed to reach a level from 0 (closed-form formula)
 * Sum of 5i^2 + 50i + 100 for i=0..level-1
 */
export function totalXpForLevel(level) {
  if (level <= 0) return 0;
  // Sum of 5i^2: (5/6) * n * (n-1) * (2n-1)
  // Sum of 50i: 25 * n * (n-1)
  // Sum of 100: 100 * n
  const n = level;
  return Math.round((5 / 6) * n * (n - 1) * (2 * n - 1) + 25 * n * (n - 1) + 100 * n);
}

/**
 * Generate a progress bar string
 */
export function progressBar(current, max, length = 10) {
  const ratio = Math.min(Math.max(current / max, 0), 1);
  const filled = Math.round(ratio * length);
  const empty = length - filled;
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Create a timestamp string
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Create embed footer text
 */
export function createFooter() {
  return `Angelss • ${new Date().toLocaleDateString('ru-RU')}`;
}

/**
 * Validate a Discord snowflake ID
 */
export function isValidSnowflake(id) {
  return /^\d{17,19}$/.test(String(id));
}

/**
 * Sanitize a string for use as a Discord channel/guild name
 */
export function sanitizeDiscordName(name, maxLength = 100) {
  if (!name || typeof name !== 'string') return '';
  return name.replace(/[<>@]/g, '').slice(0, maxLength);
}

/**
 * Create a TTL-based cooldown manager
 */
export class CooldownManager {
  constructor() {
    this.cooldowns = new Map();
    this._cleanupInterval = setInterval(() => this._cleanup(), 60000);
    this._cleanupInterval.unref?.();
  }

  isOnCooldown(key, cooldownMs) {
    const now = Date.now();
    const last = this.cooldowns.get(key);
    if (last && now - last < cooldownMs) {
      return true;
    }
    this.cooldowns.set(key, now);
    return false;
  }

  getRemainingTime(key, cooldownMs) {
    const last = this.cooldowns.get(key);
    if (!last) return 0;
    const elapsed = Date.now() - last;
    return Math.max(0, cooldownMs - elapsed);
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of this.cooldowns.entries()) {
      if (now - timestamp > 300000) { // 5 minutes
        this.cooldowns.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this._cleanupInterval);
    this.cooldowns.clear();
  }
}
