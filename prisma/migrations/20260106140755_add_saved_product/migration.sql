-- CreateTable
CREATE TABLE "SavedProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "image" TEXT,
    "isAvailable" BOOLEAN NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "createdTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
