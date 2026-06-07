CREATE TABLE IF NOT EXISTS `LessonPlan` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NULL,
  `planDate` DATETIME(3) NULL,
  `content` TEXT NOT NULL,
  `materialsNeeded` TEXT NULL,
  `isPublished` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `LessonPlan_courseId_idx` (`courseId`),
  CONSTRAINT `LessonPlan_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
