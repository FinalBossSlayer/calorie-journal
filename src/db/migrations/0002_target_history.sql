CREATE TABLE `targetHistory` (
	`id` text PRIMARY KEY NOT NULL,
	`effectiveDate` text NOT NULL,
	`kcal` real NOT NULL,
	`protein` real NOT NULL,
	`carbs` real NOT NULL,
	`fat` real NOT NULL,
	`fiber` real NOT NULL,
	`sugar` real NOT NULL,
	`salt` real NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `target_history_date_idx` ON `targetHistory` (`effectiveDate`);