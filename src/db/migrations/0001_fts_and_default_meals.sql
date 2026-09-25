-- Custom migration (hand-written): Drizzle can't model FTS5 virtual tables.
-- Every statement must be separated by a statement-breakpoint: the Expo
-- migrator runs them one at a time.

-- Full-text search over food names. A standalone table (not external-content)
-- because foods use UUID keys; foodId links back to foods.id.
-- Soft-deleted foods keep their row here, so search queries must join foods
-- and filter on deletedAt.
CREATE VIRTUAL TABLE `foods_fts` USING fts5(
	`foodId` UNINDEXED,
	`nameMk`,
	`nameEn`,
	`searchKey`,
	tokenize = 'unicode61 remove_diacritics 2',
	prefix = '2 3'
);
--> statement-breakpoint
CREATE TRIGGER `foods_fts_after_insert` AFTER INSERT ON `foods` BEGIN
	INSERT INTO `foods_fts` (`foodId`, `nameMk`, `nameEn`, `searchKey`)
	VALUES (new.`id`, new.`nameMk`, new.`nameEn`, new.`searchKey`);
END;
--> statement-breakpoint
CREATE TRIGGER `foods_fts_after_update` AFTER UPDATE OF `id`, `nameMk`, `nameEn`, `searchKey` ON `foods` BEGIN
	DELETE FROM `foods_fts` WHERE `foodId` = old.`id`;
	INSERT INTO `foods_fts` (`foodId`, `nameMk`, `nameEn`, `searchKey`)
	VALUES (new.`id`, new.`nameMk`, new.`nameEn`, new.`searchKey`);
END;
--> statement-breakpoint
CREATE TRIGGER `foods_fts_after_delete` AFTER DELETE ON `foods` BEGIN
	DELETE FROM `foods_fts` WHERE `foodId` = old.`id`;
END;
--> statement-breakpoint
-- Default meals. Fixed UUIDs so the prebuilt assets/db/app.db and fresh
-- installs agree (mirrored in src/db/defaults.ts).
INSERT INTO `meals` (`id`, `nameMk`, `nameEn`, `sortOrder`, `isDefault`, `isHidden`, `createdAt`, `updatedAt`) VALUES
	('f6962c1a-43bb-4104-be13-d1869387fb92', 'Појадок', 'Breakfast', 0, 1, 0, CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
	('4023e4f9-79e4-4ac7-9d70-c9d1a730ce72', 'Ручек', 'Lunch', 1, 1, 0, CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
	('9061e0b5-7c01-4fba-a7d5-404ec0767e5b', 'Вечера', 'Dinner', 2, 1, 0, CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
	('005aa7d7-9fca-457c-8c45-266da9aaddf5', 'Ужина', 'Snacks', 3, 1, 0, CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000);
