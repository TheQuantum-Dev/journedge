-- CreateTable TradePlan
CREATE TABLE "TradePlan" (
    "id"           TEXT NOT NULL PRIMARY KEY,
    "date"         TEXT NOT NULL,
    "symbol"       TEXT NOT NULL,
    "underlying"   TEXT NOT NULL,
    "direction"    TEXT NOT NULL,
    "setupType"    TEXT,
    "thesis"       TEXT,
    "entryZone"    TEXT,
    "stopLevel"    REAL,
    "targetLevel"  REAL,
    "plannedRR"    TEXT,
    "plannedSize"  REAL,
    "invalidation" TEXT,
    "status"       TEXT NOT NULL DEFAULT 'pending',
    "tradeId"      TEXT,
    "accountId"    TEXT,
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradePlan_tradeId_fkey"  FOREIGN KEY ("tradeId")  REFERENCES "Trade" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TradePlan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Unique index so one plan maps to at most one trade
CREATE UNIQUE INDEX "TradePlan_tradeId_key" ON "TradePlan"("tradeId");

-- CreateTable Playbook
CREATE TABLE "Playbook" (
    "id"            TEXT NOT NULL PRIMARY KEY,
    "name"          TEXT NOT NULL,
    "description"   TEXT,
    "rules"         TEXT NOT NULL DEFAULT '[]',
    "timeframes"    TEXT,
    "instruments"   TEXT,
    "entryTriggers" TEXT NOT NULL DEFAULT '[]',
    "exitRules"     TEXT,
    "notes"         TEXT,
    "imageUrls"     TEXT NOT NULL DEFAULT '[]',
    "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to Trade
ALTER TABLE "Trade" ADD COLUMN "playbookId" TEXT;
ALTER TABLE "Trade" ADD COLUMN "planId"     TEXT;
ALTER TABLE "Trade" ADD COLUMN "hourOfDay"  INTEGER;
