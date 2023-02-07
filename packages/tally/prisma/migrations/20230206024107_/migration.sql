-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "info" TEXT NOT NULL,
    "ends" DATETIME NOT NULL,
    "results" TEXT,
    "pubkey" TEXT NOT NULL,
    "pubkey_auth" TEXT NOT NULL,
    "pubkey_vote" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nonce" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "unblinded_auth" TEXT,
    "unblinded_vote" TEXT,
    "timestamp" TEXT,
    "poll_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "Poll" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vote_nonce_poll_id_key" ON "Vote"("nonce", "poll_id");
