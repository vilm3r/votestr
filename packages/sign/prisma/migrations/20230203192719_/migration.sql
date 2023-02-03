-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "info" TEXT NOT NULL,
    "ends" DATETIME NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Auth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pubkey" TEXT NOT NULL,
    "signed_auth" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    CONSTRAINT "Auth_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "Poll" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Auth_pubkey_poll_id_key" ON "Auth"("pubkey", "poll_id");
