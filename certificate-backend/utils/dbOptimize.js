const { ActivityLog } = require("./config/models");
const logger = require("./utils/logger");

/**
 * Prunes activity logs older than a certain number of days.
 * Helps keep the database size optimized.
 */
async function pruneLogs(daysRetention = 90) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysRetention);
        const isoCutoff = cutoffDate.toISOString();

        // Note: This assumes better-sqlite3 or similar via our models
        // If the model doesn't support a direct delete many, we might need a direct DB call
        const { getDB } = require("./config/db-sqlite");
        const db = getDB();

        const result = db.prepare('DELETE FROM activity_logs WHERE createdAt < ?').run(isoCutoff);

        logger.info(`🧹 DB Optimization: Pruned ${result.changes} logs older than ${daysRetention} days.`);
    } catch (err) {
        logger.error("❌ DB Pruning failed:", err);
    }
}

module.exports = { pruneLogs };
