-- CreateTable
CREATE TABLE `User` (
    `user_id` CHAR(36) NOT NULL,
    `user_email` VARCHAR(255) NOT NULL,
    `user_pw` VARCHAR(255) NOT NULL,
    `user_name` VARCHAR(100) NOT NULL,
    `user_nickname` VARCHAR(50) NOT NULL,
    `user_gender` ENUM('MALE', 'FEMALE') NOT NULL,
    `user_birthday` DATETIME(3) NOT NULL,
    `user_phone` VARCHAR(20) NOT NULL,
    `user_profile` VARCHAR(255) NULL,
    `user_social` VARCHAR(50) NULL,
    `user_role` ENUM('USER', 'ADMIN') NOT NULL,
    `user_tier` ENUM('AMATEUR', 'SEMIPRO', 'PROFESSONAL', 'WOLRDCLASS', 'CHALLENGER', 'CHAMPIONS') NOT NULL,
    `user_status` ENUM('ACTIVE', 'INACTIVE', 'BANNED') NOT NULL,

    UNIQUE INDEX `User_user_email_key`(`user_email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
