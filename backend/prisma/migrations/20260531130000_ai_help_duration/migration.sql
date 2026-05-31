-- AlterTable: how long the AI hint message stays on screen in-game (parent-set)
ALTER TABLE `Child` ADD COLUMN `aiHelpDurationSec` INTEGER NOT NULL DEFAULT 15;
