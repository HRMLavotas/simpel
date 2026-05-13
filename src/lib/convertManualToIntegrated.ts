/**
 * Convert Manual Employee Entries to Integrated Database Records
 * 
 * This utility finds employee cases with manual entries (employee_id starts with "MANUAL_")
 * and converts them to use actual employee records from the database when a match is found.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ManualEntry {
  caseId: string;
  caseNumber: string | null;
  currentEmployeeId: string;
  employeeName: string;
  employeeNip: string;
  caseType: string;
  status: string;
}

export interface ConversionResult {
  caseId: string;
  caseNumber: string | null;
  oldEmployeeId: string;
  newEmployeeId: string;
  matchedEmployee: {
    id: string;
    name: string;
    nip: string;
    position?: string;
    unitKerja?: string;
  };
  matchType: "nip" | "name";
  status: "converted" | "failed";
  error?: string;
}

export interface ConversionSummary {
  totalManualEntries: number;
  converted: number;
  failed: number;
  details: ConversionResult[];
}

/**
 * Find all manual entries in employee_cases
 */
export async function findManualEntries(): Promise<ManualEntry[]> {
  try {
    console.log("🔍 Searching for manual entries...");

    const { data: cases, error } = await supabase
      .from("employee_cases")
      .select("id, case_number, employee_id, employee_name, employee_nip, case_type, status")
      .like("employee_id", "MANUAL_%");

    if (error) throw error;

    console.log(`📊 Found ${cases?.length || 0} manual entries`);

    return (cases || []).map(c => ({
      caseId: c.id,
      caseNumber: c.case_number,
      currentEmployeeId: c.employee_id,
      employeeName: c.employee_name,
      employeeNip: c.employee_nip,
      caseType: c.case_type,
      status: c.status,
    }));
  } catch (error) {
    console.error("❌ Error finding manual entries:", error);
    throw error;
  }
}

/**
 * Convert a single manual entry to integrated database record
 */
async function convertSingleEntry(entry: ManualEntry): Promise<ConversionResult> {
  console.log(`\n🔄 Converting case ${entry.caseNumber || entry.caseId}...`);
  console.log(`   Current: ${entry.currentEmployeeId}`);
  console.log(`   Name: ${entry.employeeName}`);
  console.log(`   NIP: ${entry.employeeNip}`);

  let matchedEmployee = null;
  let matchType: "nip" | "name" | undefined;

  // Strategy 1: Try to match by NIP (most reliable)
  if (entry.employeeNip && entry.employeeNip !== "-") {
    // Handle multiple NIPs (e.g., divorce cases with spouse)
    const nips = entry.employeeNip
      .split(/[,;\/\s]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    console.log(`   → Trying ${nips.length} NIP(s): [${nips.join(", ")}]`);

    for (const nip of nips) {
      console.log(`     • Checking NIP: "${nip}"`);
      
      const { data: empByNip, error } = await supabase
        .from("employees")
        .select(`
          id,
          name,
          nip,
          position_sk,
          unit_kerja
        `)
        .eq("nip", nip)
        .maybeSingle();

      if (error) {
        console.error(`     ❌ Error querying NIP: ${error.message}`);
        continue;
      }

      if (empByNip) {
        matchedEmployee = {
          id: empByNip.id,
          name: empByNip.name,
          nip: empByNip.nip || "-",
          position: empByNip.position_sk,
          unitKerja: empByNip.unit_kerja,
        };
        matchType = "nip";
        console.log(`     ✅ Match found: ${empByNip.name}`);
        break;
      } else {
        console.log(`     ❌ No match for NIP: "${nip}"`);
      }
    }
  }

  // Strategy 2: Try to match by name (fallback)
  if (!matchedEmployee && entry.employeeName) {
    console.log(`   → Trying to match by name: "${entry.employeeName}"`);

    // For cases with multiple names (e.g., "Name1 / Name2"), try first name
    const names = entry.employeeName
      .split(/[\/]/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    for (const name of names) {
      console.log(`     • Checking name: "${name}"`);

      const { data: empByName, error } = await supabase
        .from("employees")
        .select(`
          id,
          name,
          nip,
          position_sk,
          unit_kerja
        `)
        .ilike("name", name)
        .maybeSingle();

      if (error) {
        console.error(`     ❌ Error querying name: ${error.message}`);
        continue;
      }

      if (empByName) {
        matchedEmployee = {
          id: empByName.id,
          name: empByName.name,
          nip: empByName.nip || "-",
          position: empByName.position_sk,
          unitKerja: empByName.unit_kerja,
        };
        matchType = "name";
        console.log(`     ✅ Match found: ${empByName.name} (NIP: ${empByName.nip})`);
        break;
      } else {
        console.log(`     ❌ No match for name: "${name}"`);
      }
    }
  }

  // If no match found, return failed result
  if (!matchedEmployee) {
    console.log(`   ❌ No matching employee found in database`);
    return {
      caseId: entry.caseId,
      caseNumber: entry.caseNumber,
      oldEmployeeId: entry.currentEmployeeId,
      newEmployeeId: entry.currentEmployeeId, // Keep old ID
      matchedEmployee: {
        id: entry.currentEmployeeId,
        name: entry.employeeName,
        nip: entry.employeeNip,
      },
      matchType: "nip",
      status: "failed",
      error: "No matching employee found in database",
    };
  }

  // Update the case with integrated employee data
  console.log(`   💾 Updating case with employee ID: ${matchedEmployee.id}`);

  const updateData: any = {
    employee_id: matchedEmployee.id,
    employee_name: matchedEmployee.name,
    employee_nip: matchedEmployee.nip,
  };

  // Update case_details if position or unit_kerja available
  if (matchedEmployee.position || matchedEmployee.unitKerja) {
    const { data: currentCase } = await supabase
      .from("employee_cases")
      .select("case_details")
      .eq("id", entry.caseId)
      .single();

    const caseDetails = (currentCase?.case_details as any) || {};
    
    // Remove manual entry flags and update with database values
    delete caseDetails.isManualEntry;
    
    if (matchedEmployee.position) {
      caseDetails.manualJabatan = matchedEmployee.position;
    }
    
    if (matchedEmployee.unitKerja) {
      caseDetails.manualUnitKerja = matchedEmployee.unitKerja;
    }

    updateData.case_details = caseDetails;
  }

  const { error: updateError } = await supabase
    .from("employee_cases")
    .update(updateData)
    .eq("id", entry.caseId);

  if (updateError) {
    console.error(`   ❌ Failed to update case: ${updateError.message}`);
    return {
      caseId: entry.caseId,
      caseNumber: entry.caseNumber,
      oldEmployeeId: entry.currentEmployeeId,
      newEmployeeId: entry.currentEmployeeId,
      matchedEmployee,
      matchType: matchType!,
      status: "failed",
      error: updateError.message,
    };
  }

  console.log(`   ✅ Successfully converted to integrated employee`);

  return {
    caseId: entry.caseId,
    caseNumber: entry.caseNumber,
    oldEmployeeId: entry.currentEmployeeId,
    newEmployeeId: matchedEmployee.id,
    matchedEmployee,
    matchType: matchType!,
    status: "converted",
  };
}

/**
 * Convert all manual entries to integrated database records
 */
export async function convertManualToIntegrated(): Promise<ConversionSummary> {
  try {
    console.log("🚀 Starting manual to integrated conversion...");

    const manualEntries = await findManualEntries();

    if (manualEntries.length === 0) {
      console.log("✅ No manual entries found");
      return {
        totalManualEntries: 0,
        converted: 0,
        failed: 0,
        details: [],
      };
    }

    console.log(`📋 Processing ${manualEntries.length} manual entries...`);

    const results: ConversionResult[] = [];
    let convertedCount = 0;
    let failedCount = 0;

    for (const entry of manualEntries) {
      const result = await convertSingleEntry(entry);
      results.push(result);

      if (result.status === "converted") {
        convertedCount++;
      } else {
        failedCount++;
      }
    }

    const summary: ConversionSummary = {
      totalManualEntries: manualEntries.length,
      converted: convertedCount,
      failed: failedCount,
      details: results,
    };

    console.log("\n" + "=".repeat(60));
    console.log("📊 CONVERSION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Manual Entries: ${summary.totalManualEntries}`);
    console.log(`✅ Converted: ${summary.converted}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`Success Rate: ${summary.totalManualEntries > 0 ? ((summary.converted / summary.totalManualEntries) * 100).toFixed(1) : 0}%`);
    console.log("=".repeat(60));

    return summary;
  } catch (error) {
    console.error("❌ Error in conversion process:", error);
    throw error;
  }
}

/**
 * Get detailed report of manual entries with match analysis
 */
export async function getManualEntriesReport(): Promise<{
  summary: {
    totalManualEntries: number;
    canMatchByNip: number;
    canMatchByName: number;
    cannotMatch: number;
  };
  entries: Array<{
    caseId: string;
    caseNumber: string | null;
    currentEmployeeId: string;
    employeeName: string;
    employeeNip: string;
    caseType: string;
    status: string;
    canMatchByNip: boolean;
    canMatchByName: boolean;
    matchedEmployeeByNip?: {
      id: string;
      name: string;
      nip: string;
    };
    matchedEmployeeByName?: {
      id: string;
      name: string;
      nip: string;
    };
  }>;
}> {
  try {
    console.log("📊 Generating manual entries report...");

    const manualEntries = await findManualEntries();

    const enrichedEntries = await Promise.all(
      manualEntries.map(async (entry) => {
        let canMatchByNip = false;
        let canMatchByName = false;
        let matchedEmployeeByNip = undefined;
        let matchedEmployeeByName = undefined;

        // Check NIP matching
        if (entry.employeeNip && entry.employeeNip !== "-") {
          const nips = entry.employeeNip
            .split(/[,;\/\s]+/)
            .map(n => n.trim())
            .filter(n => n.length > 0);

          for (const nip of nips) {
            const { data: empByNip } = await supabase
              .from("employees")
              .select("id, name, nip")
              .eq("nip", nip)
              .maybeSingle();

            if (empByNip) {
              canMatchByNip = true;
              matchedEmployeeByNip = {
                id: empByNip.id,
                name: empByNip.name,
                nip: empByNip.nip || "-",
              };
              break;
            }
          }
        }

        // Check name matching
        if (!canMatchByNip && entry.employeeName) {
          const names = entry.employeeName
            .split(/[\/]/)
            .map(n => n.trim())
            .filter(n => n.length > 0);

          for (const name of names) {
            const { data: empByName } = await supabase
              .from("employees")
              .select("id, name, nip")
              .ilike("name", name)
              .maybeSingle();

            if (empByName) {
              canMatchByName = true;
              matchedEmployeeByName = {
                id: empByName.id,
                name: empByName.name,
                nip: empByName.nip || "-",
              };
              break;
            }
          }
        }

        return {
          ...entry,
          canMatchByNip,
          canMatchByName,
          matchedEmployeeByNip,
          matchedEmployeeByName,
        };
      })
    );

    const summary = {
      totalManualEntries: manualEntries.length,
      canMatchByNip: enrichedEntries.filter(e => e.canMatchByNip).length,
      canMatchByName: enrichedEntries.filter(e => e.canMatchByName).length,
      cannotMatch: enrichedEntries.filter(e => !e.canMatchByNip && !e.canMatchByName).length,
    };

    console.log("✅ Report generated:", summary);

    return {
      summary,
      entries: enrichedEntries,
    };
  } catch (error) {
    console.error("❌ Error generating report:", error);
    throw error;
  }
}
