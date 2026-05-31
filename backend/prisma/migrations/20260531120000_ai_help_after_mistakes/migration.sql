-- AlterTable: AI in-game help config on Child
ALTER TABLE `Child`
    ADD COLUMN `aiHelpEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `aiHelpThreshold` INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN `aiHelpMode` VARCHAR(191) NOT NULL DEFAULT 'streak';

-- CreateTable: AiHelpEvent (log of every AI hint shown to a child after the mistake threshold)
CREATE TABLE `AiHelpEvent` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NULL,
    `question` TEXT NULL,
    `userAnswer` TEXT NULL,
    `correctAnswer` TEXT NULL,
    `options` JSON NULL,
    `mode` VARCHAR(191) NULL,
    `triggerCount` INTEGER NULL,
    `hint` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiHelpEvent_childId_createdAt_idx`(`childId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AiHelpEvent` ADD CONSTRAINT `AiHelpEvent_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
