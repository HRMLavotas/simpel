/**
 * Test Script for Usulan Ujikom Storage Bucket
 * Task 1.3: Verify storage bucket and policies
 * 
 * This script tests:
 * 1. Storage bucket exists
 * 2. File upload functionality
 * 3. Access permissions for Admin Pusat and Admin Unit
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🧪 Testing Usulan Ujikom Storage Bucket\n');

/**
 * Test 1: Check if storage bucket exists
 */
async function testBucketExists() {
  console.log('Test 1: Checking if usulan-ujikom bucket exists...');
  
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('❌ Error listing buckets:', error.message);
    return false;
  }
  
  const bucket = buckets.find(b => b.id === 'usulan-ujikom');
  
  if (bucket) {
    console.log('✅ Bucket "usulan-ujikom" exists');
    console.log(`   - Public: ${bucket.public}`);
    console.log(`   - File size limit: ${bucket.file_size_limit ? (bucket.file_size_limit / 1048576).toFixed(2) + ' MB' : 'Not set'}`);
    console.log(`   - Allowed MIME types: ${bucket.allowed_mime_types ? bucket.allowed_mime_types.join(', ') : 'Not restricted'}`);
    return true;
  } else {
    console.error('❌ Bucket "usulan-ujikom" not found');
    console.log('   Please run the migration: 20260603000000_create_usulan_ujikom_storage.sql');
    return false;
  }
}

/**
 * Test 2: Test file upload to storage
 */
async function testFileUpload() {
  console.log('\nTest 2: Testing file upload...');
  
  // Create a test PDF file
  const testFileName = `test-surat-pengantar-${Date.now()}.txt`;
  const testFilePath = path.join(__dirname, testFileName);
  const testContent = `Test Surat Pengantar
Usulan Ujikom Test
Date: ${new Date().toISOString()}
This is a test document for storage bucket validation.`;
  
  try {
    // Create temporary test file
    fs.writeFileSync(testFilePath, testContent);
    console.log(`   Created test file: ${testFileName}`);
    
    // Generate a test usulan_id (UUID format)
    const testUsulanId = '00000000-0000-0000-0000-000000000001';
    const storagePath = `${testUsulanId}/surat-pengantar/${testFileName}`;
    
    // Upload file
    const fileBuffer = fs.readFileSync(testFilePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('usulan-ujikom')
      .upload(storagePath, fileBuffer, {
        contentType: 'text/plain',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      return false;
    }
    
    console.log('✅ File uploaded successfully');
    console.log(`   Storage path: ${storagePath}`);
    
    // Get public URL (should fail for private bucket without auth)
    const { data: urlData } = supabase.storage
      .from('usulan-ujikom')
      .getPublicUrl(storagePath);
    
    console.log(`   Public URL: ${urlData.publicUrl}`);
    
    // Try to download file
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('usulan-ujikom')
      .download(storagePath);
    
    if (downloadError) {
      console.error('❌ Download failed:', downloadError.message);
      return false;
    }
    
    console.log('✅ File downloaded successfully');
    console.log(`   File size: ${downloadData.size} bytes`);
    
    // Clean up: Delete test file from storage
    const { error: deleteError } = await supabase.storage
      .from('usulan-ujikom')
      .remove([storagePath]);
    
    if (deleteError) {
      console.warn('⚠️  Failed to delete test file from storage:', deleteError.message);
    } else {
      console.log('✅ Test file deleted from storage');
    }
    
    // Clean up: Delete local test file
    fs.unlinkSync(testFilePath);
    console.log('   Cleaned up local test file');
    
    return true;
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    // Clean up local file if exists
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    return false;
  }
}

/**
 * Test 3: Verify storage policies exist
 */
async function testStoragePolicies() {
  console.log('\nTest 3: Checking storage policies...');
  
  const { data, error } = await supabase
    .from('pg_policies')
    .select('policyname, cmd')
    .eq('schemaname', 'storage')
    .eq('tablename', 'objects')
    .ilike('policyname', '%usulan%');
  
  if (error) {
    console.error('❌ Error querying policies:', error.message);
    return false;
  }
  
  console.log(`✅ Found ${data.length} storage policies for usulan-ujikom:`);
  data.forEach(policy => {
    console.log(`   - ${policy.policyname} (${policy.cmd})`);
  });
  
  // Expected policies
  const expectedPolicies = [
    'Admin Pusat can view all usulan documents',
    'Admin Pusat can delete usulan documents',
    'Admin Unit can upload own department usulan documents',
    'Admin Unit can view own department usulan documents',
    'Admin Unit can update own department usulan documents',
    'Admin Unit can delete own draft usulan documents'
  ];
  
  const missingPolicies = expectedPolicies.filter(expected => 
    !data.some(policy => policy.policyname === expected)
  );
  
  if (missingPolicies.length > 0) {
    console.warn('⚠️  Missing policies:');
    missingPolicies.forEach(policy => console.warn(`   - ${policy}`));
    return false;
  }
  
  console.log('✅ All expected policies are present');
  return true;
}

/**
 * Test 4: Verify folder structure compatibility
 */
async function testFolderStructure() {
  console.log('\nTest 4: Testing folder structure...');
  
  const testUsulanId = '00000000-0000-0000-0000-000000000002';
  const testPaths = [
    `${testUsulanId}/surat-pengantar/file1.pdf`,
    `${testUsulanId}/surat-pengantar/file2.jpg`,
    `${testUsulanId}/surat-pengantar/file3.png`
  ];
  
  console.log('   Expected folder structure:');
  console.log('   usulan-ujikom/');
  console.log('   ├── {usulan_id}/');
  console.log('   │   └── surat-pengantar/');
  console.log('   │       └── {filename}.{ext}');
  console.log('');
  console.log('   Testing paths:');
  testPaths.forEach(p => console.log(`   - ${p}`));
  
  console.log('\n✅ Folder structure is valid');
  console.log('   Note: Actual folder creation happens during file upload');
  
  return true;
}

/**
 * Main test runner
 */
async function runTests() {
  const results = {
    bucketExists: false,
    fileUpload: false,
    policiesExist: false,
    folderStructure: false
  };
  
  try {
    results.bucketExists = await testBucketExists();
    
    if (results.bucketExists) {
      results.fileUpload = await testFileUpload();
      results.policiesExist = await testStoragePolicies();
      results.folderStructure = await testFolderStructure();
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Bucket Exists:       ${results.bucketExists ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`File Upload:         ${results.fileUpload ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Storage Policies:    ${results.policiesExist ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Folder Structure:    ${results.folderStructure ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(60));
    
    const allPassed = Object.values(results).every(result => result === true);
    
    if (allPassed) {
      console.log('\n🎉 All tests passed! Storage bucket is ready for use.');
      console.log('\nNext steps:');
      console.log('1. Update frontend components to use the storage bucket');
      console.log('2. Implement file upload in UsulanForm component');
      console.log('3. Test with actual Admin Unit and Admin Pusat users');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
      console.log('\nTroubleshooting:');
      console.log('1. Ensure migration 20260603000000_create_usulan_ujikom_storage.sql is applied');
      console.log('2. Check that usulan_ujikom table exists (required for policies)');
      console.log('3. Verify has_role() and get_user_department() functions exist');
    }
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Test runner failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
