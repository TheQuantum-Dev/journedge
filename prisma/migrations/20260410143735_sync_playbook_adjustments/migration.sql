-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Playbook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" TEXT NOT NULL DEFAULT '[]',
    "timeframes" TEXT,
    "instruments" TEXT,
    "entryTriggers" TEXT NOT NULL DEFAULT '[]',
    "exitRules" TEXT,
    "notes" TEXT,
    "imageUrls" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Playbook" ("createdAt", "description", "entryTriggers", "exitRules", "id", "imageUrls", "instruments", "name", "notes", "rules", "timeframes", "updatedAt") SELECT "createdAt", "description", "entryTriggers", "exitRules", "id", "imageUrls", "instruments", "name", "notes", "rules", "timeframes", "updatedAt" FROM "Playbook";
DROP TABLE "Playbook";
ALTER TABLE "new_Playbook" RENAME TO "Playbook";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
