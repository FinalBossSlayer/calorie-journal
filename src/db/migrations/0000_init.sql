CREATE TABLE `foods` (
	`id` text PRIMARY KEY NOT NULL,
	`nameMk` text,
	`nameEn` text,
	`searchKey` text NOT NULL,
	`kind` text NOT NULL,
	`kcal` real,
	`protein` real,
	`carbs` real,
	`fat` real,
	`fiber` real,
	`sugar` real,
	`salt` real,
	`source` text NOT NULL,
	`sourceRef` text,
	`basedOnFoodId` text,
	`isEstimate` integer DEFAULT false NOT NULL,
	`cookedWeightG` real,
	`incompleteNutrients` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`basedOnFoodId`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "foods_has_name" CHECK("foods"."nameMk" is not null or "foods"."nameEn" is not null)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `foods_source_ref_idx` ON `foods` (`source`,`sourceRef`);--> statement-breakpoint
CREATE TABLE `logEntries` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`mealId` text NOT NULL,
	`foodId` text NOT NULL,
	`grams` real NOT NULL,
	`portionId` text,
	`quantity` real,
	`kcal` real,
	`protein` real,
	`carbs` real,
	`fat` real,
	`fiber` real,
	`sugar` real,
	`salt` real,
	`incompleteNutrients` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`mealId`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`foodId`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`portionId`) REFERENCES `portions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "log_entries_grams_positive" CHECK("logEntries"."grams" > 0)
);
--> statement-breakpoint
CREATE INDEX `log_entries_date_idx` ON `logEntries` (`date`);--> statement-breakpoint
CREATE TABLE `meals` (
	`id` text PRIMARY KEY NOT NULL,
	`nameMk` text NOT NULL,
	`nameEn` text NOT NULL,
	`sortOrder` integer NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`isHidden` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE `portions` (
	`id` text PRIMARY KEY NOT NULL,
	`foodId` text NOT NULL,
	`nameMk` text,
	`nameEn` text,
	`grams` real NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`foodId`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "portions_has_name" CHECK("portions"."nameMk" is not null or "portions"."nameEn" is not null),
	CONSTRAINT "portions_grams_positive" CHECK("portions"."grams" > 0)
);
--> statement-breakpoint
CREATE INDEX `portions_food_idx` ON `portions` (`foodId`);--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`sex` text NOT NULL,
	`birthDate` text NOT NULL,
	`heightCm` real NOT NULL,
	`weightKg` real NOT NULL,
	`activityLevel` text NOT NULL,
	`goal` text NOT NULL,
	`goalRateKgPerWeek` real DEFAULT 0 NOT NULL,
	`language` text NOT NULL,
	`ringMode` text DEFAULT 'eaten' NOT NULL,
	`targetOverrides` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE `recipeIngredients` (
	`id` text PRIMARY KEY NOT NULL,
	`recipeFoodId` text NOT NULL,
	`ingredientFoodId` text NOT NULL,
	`grams` real NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`recipeFoodId`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ingredientFoodId`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "recipe_ingredients_grams_nonnegative" CHECK("recipeIngredients"."grams" >= 0)
);
--> statement-breakpoint
CREATE INDEX `recipe_ingredients_recipe_idx` ON `recipeIngredients` (`recipeFoodId`);