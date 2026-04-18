// Re-export from shared with moderator-specific additions
export {
  formatNumber,
  formatTime,
  formatDuration,
  formatDate,
  randomInt,
  progressBar,
  xpForLevel,
  totalXpForLevel,
  isValidSnowflake,
  sanitizeDiscordName,
  CooldownManager,
} from '../../../shared/utils/helpers.js';

/**
 * Create embed footer text (moderator-specific)
 */
export function createFooter() {
  return `Angelss Moderator • ${new Date().toLocaleDateString('ru-RU')}`;
}
