-- Run against simbapre_simbaacademy after deploying user-management changes.
-- Maps legacy isActive (if present) to status, then drops isActive.

ALTER TABLE `User`
  ADD COLUMN IF NOT EXISTS `firstName` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `lastName` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `employeeId` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `status` ENUM('ACTIVE', 'DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `isDeleted` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `deletedAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `createdBy` VARCHAR(191) NULL;

-- If upgrading from isActive column (MySQL 8 may not support IF NOT EXISTS on all hosts — adjust as needed):
-- UPDATE `User` SET `status` = IF(`isActive` = 1, 'ACTIVE', 'DEACTIVATED');
-- ALTER TABLE `User` DROP COLUMN `isActive`;

CREATE UNIQUE INDEX IF NOT EXISTS `User_employeeId_key` ON `User`(`employeeId`);

CREATE TABLE IF NOT EXISTS `PasswordResetToken` (
  `id` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `PasswordResetToken_token_key`(`token`),
  INDEX `PasswordResetToken_userId_idx`(`userId`),
  INDEX `PasswordResetToken_expiresAt_idx`(`expiresAt`),
  CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
