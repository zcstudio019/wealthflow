CREATE TABLE IF NOT EXISTS `financial_snapshots` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `user_id` TEXT NOT NULL,
  `month` TEXT NOT NULL,
  `data` TEXT NOT NULL,
  `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `financial_snapshots_user_month` ON `financial_snapshots` (`user_id`,`month`);
