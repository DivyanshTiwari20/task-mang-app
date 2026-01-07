-- ============================================
-- CREATE USERS - Run in Supabase SQL Editor
-- ============================================

-- First, make sure we have a department
INSERT INTO departments (name) VALUES ('Engineering')
ON CONFLICT (name) DO NOTHING;

-- Get the department ID for Engineering
-- (Assuming it's ID 1, adjust if needed)

-- Create all users with employee role
INSERT INTO users (
    username, 
    email, 
    password, 
    full_name, 
    role, 
    department_id, 
    department_name, 
    salary,
    leave_taken
) VALUES 
    ('divyansh', 'divyansh@company.com', 'password123', 'Divyansh Tiwari', 'employee', 1, 'Engineering', 50000, 0),
    ('ayushmaan', 'ayushmaan@company.com', 'password123', 'Ayushmaan', 'employee', 1, 'Engineering', 50000, 0),
    ('ananya', 'ananya@company.com', 'password123', 'Ananya', 'employee', 1, 'Engineering', 50000, 0),
    ('ashish', 'ashish@company.com', 'password123', 'Ashish', 'employee', 1, 'Engineering', 50000, 0),
    ('priyansham', 'priyansham@company.com', 'password123', 'Priyansham', 'employee', 1, 'Engineering', 50000, 0),
    ('archita', 'archita@company.com', 'password123', 'Archita', 'employee', 1, 'Engineering', 50000, 0)
ON CONFLICT (username) DO UPDATE SET
    role = EXCLUDED.role,
    department_id = EXCLUDED.department_id,
    department_name = EXCLUDED.department_name,
    salary = COALESCE(users.salary, EXCLUDED.salary),
    leave_taken = COALESCE(users.leave_taken, EXCLUDED.leave_taken);

-- Also create an admin user if not exists
INSERT INTO users (
    username, 
    email, 
    password, 
    full_name, 
    role, 
    department_id, 
    department_name, 
    salary,
    leave_taken
) VALUES 
    ('admin', 'admin@company.com', 'admin123', 'System Admin', 'admin', 1, 'Engineering', 100000, 0)
ON CONFLICT (username) DO NOTHING;

-- Verify users were created
SELECT id, username, email, full_name, role, department_name, salary 
FROM users 
ORDER BY role, username;
