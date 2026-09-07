CREATE TABLE `publications` (
	`sequence` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`owner_id` text NOT NULL,
	`shelter_id` text NOT NULL,
	`review_id` text NOT NULL,
	`previous_id` text NOT NULL,
	`created_at` text NOT NULL,
	`before` text NOT NULL,
	`after` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `publications_id_unique` ON `publications` (`id`);--> statement-breakpoint
CREATE INDEX `idx_publications_owner_shelter_sequence` ON `publications` (`owner_id`,`shelter_id`,`sequence`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_publications_owner_review` ON `publications` (`owner_id`,`review_id`);