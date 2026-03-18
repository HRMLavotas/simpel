

## Plan: Fix Trigger, User Data, Import Parsing & Separate Import Functions

### Issue 1: Fix `handle_new_user` trigger not attached

The function `handle_new_user()` exists but has **no trigger attached** to `auth.users`. This is why creating users via edge functions doesn't auto-populate `profiles` and `user_roles`.

**Fix:**
- Run a migration to create the trigger on `auth.users`:
  ```sql
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

**Fix existing user data** (via data update tool):
- Update ali.coolz30@gmail.com profile: department from "Setditjen Binalavotas" → "Pusat" (to match auth metadata, since this is admin_pusat)
- The user_roles data looks correct already (admin_pusat role is set)

### Issue 2: Import Parsing — Separate into Two Functions

**My recommendation: Separate the import into two distinct imports.** Here's why:

1. **Peta Jabatan (position_references)** and **Data Pegawai (employees)** have fundamentally different data structures
2. A combined import relies on heuristics (e.g., "no name = position reference") which is fragile and causes parsing failures
3. Separate imports allow clearer templates, better validation, and easier debugging
4. Users can import jabatan structure first, then employee data — which is the natural workflow

**Implementation:**
- **Import Data Pegawai**: Template with columns: No, Nama, NIP, Kriteria ASN, Jabatan, Pangkat/Golongan, Pendidikan Terakhir, Jenis Kelamin, Unit Kerja, Keterangan fields
- **Import Peta Jabatan**: Template with columns: No, Jabatan Sesuai Kepmen 202/2024, Jenis Jabatan (Struktural/Fungsional/Pelaksana), Grade/Kelas Jabatan, Jumlah ABK, Unit Kerja

Add tab selection UI at the top of Import page to switch between the two import modes.

### Issue 3: Peta Jabatan Display

The Peta Jabatan page matches employees to positions via `position_name`. If imported data has slightly different names between employees and position_references, they won't match. The fix:
- Improve matching logic (case-insensitive, trimmed comparison)
- Ensure the separate import templates use consistent position naming

### Files to modify:
1. **Migration**: Attach trigger to `auth.users`
2. **Data fix**: Update profile department for admin user
3. **`src/pages/Import.tsx`**: Rewrite with two separate import modes (tabs), each with its own template, parser, and validation
4. **`src/pages/PetaJabatan.tsx`**: Fix employee-to-position matching (case-insensitive)

### Technical Details

The Import page will use a tab-based UI (`Tabs` component) with two tabs:
- "Import Data Pegawai" — employee-focused template and parser
- "Import Peta Jabatan" — position reference template and parser

Each tab has its own `downloadTemplate()`, `parseExcel()`, file upload, preview table, and import handler. This eliminates the ambiguous row_type detection logic.

For header parsing, implement dynamic column mapping using `normalizeHeader()` to handle variations in casing, spacing, and newlines in Excel headers.

