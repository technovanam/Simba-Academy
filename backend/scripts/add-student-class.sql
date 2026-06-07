-- Add student class column for registration (Playgroup, Pre-KG, LKG, UKG)
ALTER TABLE `User` ADD COLUMN `studentClass` VARCHAR(191) NULL AFTER `phone`;
