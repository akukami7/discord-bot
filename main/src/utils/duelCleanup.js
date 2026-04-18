import Duel from '../models/Duel.js';

/**
 * Start periodic cleanup of expired duels
 * Runs every 60 seconds to expire stale duels that were missed by setTimeout
 */
export function startDuelCleanup(client) {
  const CLEANUP_INTERVAL_MS = 60000; // 1 minute

  async function cleanupExpiredDuels() {
    if (Duel.db.readyState !== 1) return; // Пропускаем, если БД не подключена

    try {
      const now = new Date();
      const result = await Duel.updateMany(
        { status: 'pending', expiresAt: { $lte: now } },
        { $set: { status: 'expired' } }
      );

      if (result.modifiedCount > 0) {
        console.log(`[DuelCleanup] Expired ${result.modifiedCount} stale duels`);
      }
    } catch (error) {
      console.error('[DuelCleanup] Error:', error);
    }
  }

  // Run immediately on start
  cleanupExpiredDuels();

  // Then run every minute
  const interval = setInterval(cleanupExpiredDuels, CLEANUP_INTERVAL_MS);
  interval.unref?.();

  console.log('[DuelCleanup] Periodic cleanup started');
}
