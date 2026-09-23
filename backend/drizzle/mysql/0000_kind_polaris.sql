CREATE TABLE `financial_snapshots` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`month` char(7) NOT NULL,
	`data` json NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `financial_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `financial_snapshots_user_month` UNIQUE(`user_id`,`month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
