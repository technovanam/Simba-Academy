-- Run once when migrating from Razorpay column names to Zoho Payments fields.
-- Example: mysql -u USER -p DATABASE < backend/scripts/rename-payment-columns.sql

ALTER TABLE `Payment`
  CHANGE COLUMN `razorpayOrderId` `paymentSessionId` VARCHAR(191) NULL,
  CHANGE COLUMN `razorpayPaymentId` `gatewayPaymentId` VARCHAR(191) NULL,
  CHANGE COLUMN `razorpaySignature` `paymentSignature` VARCHAR(191) NULL;
