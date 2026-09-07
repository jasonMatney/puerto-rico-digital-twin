CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`shelter_id` text NOT NULL,
	`created_at` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_verifications_owner_shelter_time` ON `verifications` (`owner_id`,`shelter_id`,`created_at`);