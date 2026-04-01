-- Step 1: Add admin_pimpinan enum value to app_role type
-- This must be done in a separate transaction before using it in policies

DO $$ 
BEGIN
    -- Check if the value already exists
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_pimpinan' AND enumtypid = 'app_role'::regtype) THEN
        -- Add the new enum value
        ALTER TYPE app_role ADD VALUE 'admin_pimpinan';
    END IF;
END $$;

-- Add comment
COMMENT ON TYPE app_role IS 'Application roles: admin_unit (unit-level admin), admin_pusat (central admin with full access), admin_pimpinan (leadership with read-only access to all data)';
