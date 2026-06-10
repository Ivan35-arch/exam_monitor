-- Run this in your SQLTools to create a default admin account
DO $$ 
DECLARE 
    new_user_id INT;
    admin_role_id INT;
BEGIN
    -- Get the role ID for faculty_admin
    SELECT role_id INTO admin_role_id FROM roles WHERE role_name = 'faculty_admin';

    -- Insert the user with a bcrypt-hashed password ('admin123')
    INSERT INTO users (email, password_hash, role_id, is_active) 
    VALUES ('admin@strathmore.edu', crypt('admin123', gen_salt('bf')), admin_role_id, true)
    RETURNING user_id INTO new_user_id;

    -- Create the associated faculty_admin profile
    INSERT INTO faculty_admins (user_id, full_name, department) 
    VALUES (new_user_id, 'Faculty Admin', 'Academic Registry');
END $$;
