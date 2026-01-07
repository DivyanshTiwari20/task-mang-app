-- ============================================
-- ALTER TABLES - ADD MISSING COLUMNS
-- ============================================
-- Run this script if you already created the tables
-- but are missing some columns
-- ============================================

-- Add missing columns to USERS table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS join_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add missing columns to ATTENDANCE table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS cycle_start_date DATE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS cycle_end_date DATE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS attendance_type VARCHAR(20) DEFAULT 'full_day';

-- Add check constraint for attendance_type (run separately if needed)
-- ALTER TABLE attendance ADD CONSTRAINT attendance_type_check CHECK (attendance_type IN ('full_day', 'half_day'));

-- Create index for attendance_type
CREATE INDEX IF NOT EXISTS idx_attendance_type ON attendance(attendance_type);

-- Verify changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
ORDER BY ordinal_position;
