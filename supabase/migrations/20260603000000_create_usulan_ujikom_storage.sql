-- ============================================================================
-- TASK 1.3: Create Supabase Storage Bucket for Usulan Ujikom
-- ============================================================================
-- This migration creates:
-- 1. Storage bucket 'usulan-ujikom' for document uploads
-- 2. Storage policies for Admin Pusat (full access) and Admin Unit (department-scoped)
-- 3. Folder structure: {usulan_id}/surat-pengantar/{filename}
--
-- Requirements: 4 (Upload Persyaratan Usulan)
-- ============================================================================

-- ============================================================================
-- PART 1: Create Storage Bucket
-- ============================================================================

-- NOTE: Storage bucket must be created manually via Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: usulan-ujikom
-- 4. Public: OFF
-- 5. File size limit: 5242880 (5MB)
-- 6. Allowed MIME types: application/pdf, image/jpeg, image/jpg, image/png

-- Verify bucket exists (this will not fail if bucket doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'usulan-ujikom') THEN
    RAISE NOTICE 'Storage bucket "usulan-ujikom" not found. Please create it manually via Supabase Dashboard.';
    RAISE NOTICE 'Settings: Public=OFF, File size limit=5MB, MIME types=PDF,JPG,JPEG,PNG';
  ELSE
    RAISE NOTICE 'Storage bucket "usulan-ujikom" found. Continuing with policy creation...';
  END IF;
END $$;

-- ============================================================================
-- PART 2: Storage Policies for Admin Pusat
-- ============================================================================

-- Admin Pusat can view/download all files in usulan-ujikom bucket
CREATE POLICY "Admin Pusat can view all usulan documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'usulan-ujikom'
  AND public.has_role(auth.uid(), 'admin_pusat')
);

-- Admin Pusat can delete files (for data cleanup/management)
CREATE POLICY "Admin Pusat can delete usulan documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'usulan-ujikom'
  AND public.has_role(auth.uid(), 'admin_pusat')
);

-- ============================================================================
-- PART 3: Storage Policies for Admin Unit
-- ============================================================================

-- Admin Unit can upload files to their own department's usulan folders
-- Path format: {usulan_id}/surat-pengantar/{filename}
-- Validates that:
-- 1. User is Admin Unit
-- 2. The usulan belongs to their department
-- 3. They are the creator of the usulan
CREATE POLICY "Admin Unit can upload own department usulan documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'usulan-ujikom'
  AND public.has_role(auth.uid(), 'admin_unit')
  AND EXISTS (
    SELECT 1 FROM public.usulan_ujikom u
    WHERE u.id::text = (string_to_array(name, '/'))[1]
    AND u.department = public.get_user_department(auth.uid())
    AND u.creator_id = auth.uid()
  )
);

-- Admin Unit can view/download files from their own department's usulan
CREATE POLICY "Admin Unit can view own department usulan documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'usulan-ujikom'
  AND public.has_role(auth.uid(), 'admin_unit')
  AND EXISTS (
    SELECT 1 FROM public.usulan_ujikom u
    WHERE u.id::text = (string_to_array(name, '/'))[1]
    AND u.department = public.get_user_department(auth.uid())
  )
);

-- Admin Unit can update (replace) their own uploaded documents
-- Only for Draft and Waiting_List status
CREATE POLICY "Admin Unit can update own department usulan documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'usulan-ujikom'
  AND public.has_role(auth.uid(), 'admin_unit')
  AND EXISTS (
    SELECT 1 FROM public.usulan_ujikom u
    WHERE u.id::text = (string_to_array(name, '/'))[1]
    AND u.department = public.get_user_department(auth.uid())
    AND u.creator_id = auth.uid()
    AND u.status IN ('Draft', 'Waiting_List')
  )
);

-- Admin Unit can delete their own uploaded documents
-- Only for Draft status (before submission)
CREATE POLICY "Admin Unit can delete own draft usulan documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'usulan-ujikom'
  AND public.has_role(auth.uid(), 'admin_unit')
  AND EXISTS (
    SELECT 1 FROM public.usulan_ujikom u
    WHERE u.id::text = (string_to_array(name, '/'))[1]
    AND u.department = public.get_user_department(auth.uid())
    AND u.creator_id = auth.uid()
    AND u.status = 'Draft'
  )
);

-- ============================================================================
-- PART 4: Policy Notes (for documentation only)
-- ============================================================================

-- Policy descriptions:
-- 1. "Admin Pusat can view all usulan documents" - Admin Pusat has read access to all usulan ujikom documents
-- 2. "Admin Pusat can delete usulan documents" - Admin Pusat can delete documents for data management
-- 3. "Admin Unit can upload own department usulan documents" - Admin Unit can upload for their own usulan
-- 4. "Admin Unit can view own department usulan documents" - Admin Unit can view their department documents
-- 5. "Admin Unit can update own department usulan documents" - Admin Unit can replace documents for Draft/Waiting_List
-- 6. "Admin Unit can delete own draft usulan documents" - Admin Unit can delete documents for Draft status only

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the storage bucket and policies were created:

-- Check bucket exists
-- SELECT * FROM storage.buckets WHERE id = 'usulan-ujikom';

-- Check storage policies
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
-- AND tablename = 'objects' 
-- AND policyname LIKE '%usulan%'
-- ORDER BY policyname;

-- Count policies (should be 6 total)
-- SELECT COUNT(*) as policy_count
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
-- AND tablename = 'objects' 
-- AND policyname LIKE '%usulan%';

-- ============================================================================
-- FOLDER STRUCTURE DOCUMENTATION
-- ============================================================================
-- The storage bucket uses the following folder structure:
-- 
-- usulan-ujikom/
-- ├── {usulan_id}/
-- │   └── surat-pengantar/
-- │       └── {filename}.{ext}
-- 
-- Example:
-- usulan-ujikom/
-- ├── 123e4567-e89b-12d3-a456-426614174000/
-- │   └── surat-pengantar/
-- │       └── surat-pengantar-2026.pdf
-- 
-- File naming convention:
-- - Use descriptive names with timestamps to avoid conflicts
-- - Format: surat-pengantar-{timestamp}.{ext}
-- - Allowed extensions: .pdf, .jpg, .jpeg, .png
-- 
-- File size limits:
-- - Maximum: 5MB per file
-- - Enforced at bucket level
-- 
-- Access control:
-- - Admin Pusat: Full access (read, delete)
-- - Admin Unit: Department-scoped (upload, read, update, delete with restrictions)
-- - Anonymous: No access (private bucket)
-- ============================================================================

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
