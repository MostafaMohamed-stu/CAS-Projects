-- Script to clean up existing users (as per user request to remove all existing users)
-- This will allow fresh registration with bcrypt hashed passwords

-- First, delete dependent records
DELETE FROM StudentExamAnswers;
DELETE FROM AccountRoles;
DELETE FROM StudentExtensions;
DELETE FROM SuperAdminExtension;
DELETE FROM Logins;

-- Then delete accounts
DELETE FROM Accounts;

-- Reset identity seed if needed (optional)
-- DBCC CHECKIDENT ('Accounts', RESEED, 0);

PRINT 'All existing users have been removed. You can now register new users with bcrypt-hashed passwords.';
