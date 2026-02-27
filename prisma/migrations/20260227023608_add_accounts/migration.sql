-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "initialBalance" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "underlying" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "optionType" TEXT,
    "strike" REAL,
    "expiry" TEXT,
    "quantity" REAL NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL NOT NULL,
    "commission" REAL NOT NULL,
    "fees" REAL NOT NULL,
    "pnl" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "entryTime" TEXT,
    "exitTime" TEXT,
    "rr" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "journalEntry" TEXT,
    "link" TEXT,
    "imageUrls" TEXT NOT NULL DEFAULT '[]',
    "accountId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trade" ("commission", "createdAt", "date", "direction", "entryPrice", "entryTime", "exitPrice", "exitTime", "expiry", "fees", "id", "imageUrls", "journalEntry", "link", "optionType", "pnl", "quantity", "rr", "status", "strike", "symbol", "tags", "type", "underlying") SELECT "commission", "createdAt", "date", "direction", "entryPrice", "entryTime", "exitPrice", "exitTime", "expiry", "fees", "id", "imageUrls", "journalEntry", "link", "optionType", "pnl", "quantity", "rr", "status", "strike", "symbol", "tags", "type", "underlying" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
