/**
 * Utility to validate and fix employee case connections
 * Ensures all employee_cases have valid employee_id references
 */

import { supabase } from "@/integrations/supabase/client";

export interface ConnectionValidationResult {
  totalCases: number;
  connectedCases: number;
  disconnectedCases: number;
  invalidCases: Array<{
    caseId: string;
    caseNumber: string | null;
    employeeId: string;
    employeeName: string;
    employeeNip: string;
    caseType: string;
    status: string;
  }>;
}

/**
 * Validate all employee case connections
 * Returns statistics about connected and disconnected cases
 */
export async function validateCaseEmployeeConnections(): Promise<ConnectionValidationResult> {
  try {
    console.log("🔍 Validating employee case connections...");

    // Get all cases
    const { data: allCases, error: casesError } = await supabase
      .from("employee_cases")
      .select("id, case_number, employee_id, employee_name, employee_nip, case_type, status");

    if (casesError) throw casesError;

    if (!allCases || allCases.length === 0) {
      console.log("⚠️ No cases found");
      return {
        totalCases: 0,
        connectedCases: 0,
        disconnectedCases: 0,
        invalidCases: [],
      };
    }

    console.log(`📊 Found ${allCases.length} cases`);

    // Get all employee IDs with pagination
    const employeeIds = new Set<string>();
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: employeeBatch, error: employeesError } = await supabase
        .from("employees")
        .select("id")
        .range(offset, offset + batchSize - 1);

      if (employeesError) throw employeesError;

      if (!employeeBatch || employeeBatch.length === 0) {
        hasMore = false;
        break;
      }

      employeeBatch.forEach(e => employeeIds.add(e.id));
      
      if (employeeBatch.length < batchSize) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }

    console.log(`👥 Found ${employeeIds.size} employees`);

    // Check each case
    const invalidCases: ConnectionValidationResult["invalidCases"] = [];
    let connectedCount = 0;

    for (const caseItem of allCases) {
      if (employeeIds.has(caseItem.employee_id)) {
        connectedCount++;
      } else {
        invalidCases.push({
          caseId: caseItem.id,
          caseNumber: caseItem.case_number,
          employeeId: caseItem.employee_id,
          employeeName: caseItem.employee_name,
          employeeNip: caseItem.employee_nip,
          caseType: caseItem.case_type,
          status: caseItem.status,
        });
      }
    }

    const result: ConnectionValidationResult = {
      totalCases: allCases.length,
      connectedCases: connectedCount,
      disconnectedCases: invalidCases.length,
      invalidCases,
    };

    console.log("✅ Validation complete:", result);

    return result;
  } catch (error) {
    console.error("❌ Error validating connections:", error);
    throw error;
  }
}

/**
 * Attempt to fix disconnected cases by finding matching employees
 * Matches by NIP or name
 * Also handles manual entries (employee_id starts with "MANUAL_")
 */
export async function fixDisconnectedCases(): Promise<{
  fixed: number;
  failed: number;
  details: Array<{
    caseId: string;
    oldEmployeeId: string;
    newEmployeeId?: string;
    matchType?: "nip" | "name";
    status: "fixed" | "failed";
    reason?: string;
    isManualEntry?: boolean;
  }>;
}> {
  try {
    console.log("🔧 Attempting to fix disconnected cases and manual entries...");

    // Get disconnected cases
    const validation = await validateCaseEmployeeConnections();

    // Also get manual entries
    const { data: manualCases, error: manualError } = await supabase
      .from("employee_cases")
      .select("id, case_number, employee_id, employee_name, employee_nip, case_type, status")
      .like("employee_id", "MANUAL_%");

    if (manualError) throw manualError;

    const manualEntries = (manualCases || []).map(c => ({
      caseId: c.id,
      caseNumber: c.case_number,
      employeeId: c.employee_id,
      employeeName: c.employee_name,
      employeeNip: c.employee_nip,
      caseType: c.case_type,
      status: c.status,
    }));

    const totalToFix = validation.disconnectedCases + manualEntries.length;

    if (totalToFix === 0) {
      console.log("✅ No disconnected cases or manual entries to fix");
      return { fixed: 0, failed: 0, details: [] };
    }

    console.log(`🔍 Found ${validation.disconnectedCases} disconnected cases`);
    console.log(`🔍 Found ${manualEntries.length} manual entries`);
    console.log(`📋 Total to fix: ${totalToFix}`);

    const details: Array<{
      caseId: string;
      oldEmployeeId: string;
      newEmployeeId?: string;
      matchType?: "nip" | "name";
      status: "fixed" | "failed";
      reason?: string;
      isManualEntry?: boolean;
    }> = [];

    let fixedCount = 0;
    let failedCount = 0;

    // Combine both disconnected cases and manual entries
    const allCasesToFix = [
      ...validation.invalidCases,
      ...manualEntries,
    ];

    for (const invalidCase of allCasesToFix) {
      const isManualEntry = invalidCase.employeeId.startsWith("MANUAL_");
      const caseLabel = isManualEntry ? "manual entry" : "disconnected case";
      
      console.log(`🔍 Trying to fix ${caseLabel} ${invalidCase.caseNumber || invalidCase.caseId}...`);

      // Try to find employee by NIP first
      let matchedEmployee = null;
      let matchType: "nip" | "name" | undefined;

      if (invalidCase.employeeNip && invalidCase.employeeNip !== "-") {
        // Check if NIP contains multiple NIPs (for divorce cases with spouse)
        const nips = invalidCase.employeeNip.split(/[,;\/\s]+/).map(n => n.trim()).filter(n => n.length > 0);
        
        console.log(`🔍 Case ${invalidCase.caseNumber}: Trying ${nips.length} NIP(s): [${nips.join(', ')}]`);
        
        // Try each NIP
        for (const nip of nips) {
          console.log(`  → Checking NIP: "${nip}"`);
          const { data: empByNip } = await supabase
            .from("employees")
            .select("id, name, nip")
            .eq("nip", nip)
            .maybeSingle();

          if (empByNip) {
            matchedEmployee = empByNip;
            matchType = "nip";
            console.log(`  ✅ Found match by NIP (${nip}): ${empByNip.name}`);
            break; // Use first match
          } else {
            console.log(`  ❌ No match for NIP: "${nip}"`);
          }
        }
      }

      // If not found by NIP, try by name
      if (!matchedEmployee && invalidCase.employeeName) {
        console.log(`  → Trying to match by name: "${invalidCase.employeeName}"`);
        const { data: empByName } = await supabase
          .from("employees")
          .select("id, name, nip")
          .ilike("name", invalidCase.employeeName)
          .maybeSingle();

        if (empByName) {
          matchedEmployee = empByName;
          matchType = "name";
          console.log(`  ✅ Found match by name: ${empByName.name} (NIP: ${empByName.nip})`);
        } else {
          console.log(`  ❌ No match by name for: "${invalidCase.employeeName}"`);
        }
      }

      if (matchedEmployee) {
        // Update the case with the correct employee_id
        const updateData: any = {
          employee_id: matchedEmployee.id,
          employee_name: matchedEmployee.name,
          employee_nip: matchedEmployee.nip,
        };

        // If this was a manual entry, also update case_details to remove manual flags
        if (isManualEntry) {
          const { data: currentCase } = await supabase
            .from("employee_cases")
            .select("case_details")
            .eq("id", invalidCase.caseId)
            .single();

          if (currentCase?.case_details) {
            const caseDetails = currentCase.case_details as any;
            
            // Remove manual entry flag
            delete caseDetails.isManualEntry;
            
            // Keep manualJabatan and manualUnitKerja if they exist (they might have useful info)
            // but they're no longer "manual" - they're from the database
            
            updateData.case_details = caseDetails;
          }
        }

        const { error: updateError } = await supabase
          .from("employee_cases")
          .update(updateData)
          .eq("id", invalidCase.caseId);

        if (updateError) {
          console.error(`❌ Failed to update case ${invalidCase.caseId}:`, updateError);
          failedCount++;
          details.push({
            caseId: invalidCase.caseId,
            oldEmployeeId: invalidCase.employeeId,
            status: "failed",
            reason: updateError.message,
            isManualEntry,
          });
        } else {
          const successMsg = isManualEntry 
            ? `✅ Converted manual entry ${invalidCase.caseNumber || invalidCase.caseId} to integrated employee`
            : `✅ Fixed case ${invalidCase.caseNumber || invalidCase.caseId}`;
          console.log(successMsg);
          fixedCount++;
          details.push({
            caseId: invalidCase.caseId,
            oldEmployeeId: invalidCase.employeeId,
            newEmployeeId: matchedEmployee.id,
            matchType,
            status: "fixed",
            isManualEntry,
          });
        }
      } else {
        console.log(`❌ No matching employee found for ${caseLabel} ${invalidCase.caseNumber || invalidCase.caseId}`);
        failedCount++;
        details.push({
          caseId: invalidCase.caseId,
          oldEmployeeId: invalidCase.employeeId,
          status: "failed",
          reason: "No matching employee found",
          isManualEntry,
        });
      }
    }

    console.log(`✅ Fix complete: ${fixedCount} fixed, ${failedCount} failed`);
    console.log(`   - Manual entries converted: ${details.filter(d => d.isManualEntry && d.status === "fixed").length}`);
    console.log(`   - Disconnected cases fixed: ${details.filter(d => !d.isManualEntry && d.status === "fixed").length}`);

    return { fixed: fixedCount, failed: failedCount, details };
  } catch (error) {
    console.error("❌ Error fixing disconnected cases:", error);
    throw error;
  }
}

/**
 * Get detailed report of case-employee connections
 * Includes both disconnected cases and manual entries
 */
export async function getCaseEmployeeConnectionReport(): Promise<{
  summary: {
    totalCases: number;
    connectedCases: number;
    disconnectedCases: number;
    manualEntries: number;
    casesWithDisciplinary: number;
  };
  invalidCases: Array<{
    caseId: string;
    caseNumber: string | null;
    employeeId: string;
    employeeName: string;
    employeeNip: string;
    caseType: string;
    status: string;
    disciplinaryCount: number;
    isManualEntry: boolean;
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
    const validation = await validateCaseEmployeeConnections();

    // Get manual entries
    const { data: manualCases, error: manualError } = await supabase
      .from("employee_cases")
      .select("id, case_number, employee_id, employee_name, employee_nip, case_type, status")
      .like("employee_id", "MANUAL_%");

    if (manualError) throw manualError;

    const manualEntries = (manualCases || []).map(c => ({
      caseId: c.id,
      caseNumber: c.case_number,
      employeeId: c.employee_id,
      employeeName: c.employee_name,
      employeeNip: c.employee_nip,
      caseType: c.case_type,
      status: c.status,
    }));

    // Combine disconnected cases and manual entries
    const allInvalidCases = [
      ...validation.invalidCases,
      ...manualEntries,
    ];

    // Get disciplinary action counts for invalid cases
    const invalidCaseIds = allInvalidCases.map(c => c.caseId);
    
    let disciplinaryCountMap = new Map<string, number>();
    
    if (invalidCaseIds.length > 0) {
      const { data: disciplinaryActions } = await supabase
        .from("disciplinary_actions")
        .select("case_id")
        .in("case_id", invalidCaseIds);

      if (disciplinaryActions) {
        disciplinaryActions.forEach(da => {
          const current = disciplinaryCountMap.get(da.case_id) || 0;
          disciplinaryCountMap.set(da.case_id, current + 1);
        });
      }
    }

    // Get total cases with disciplinary actions
    const { data: allDisciplinary } = await supabase
      .from("disciplinary_actions")
      .select("case_id");

    const casesWithDisciplinary = new Set(
      (allDisciplinary || []).map(da => da.case_id)
    ).size;

    // Check each invalid case for potential matches
    const enrichedInvalidCases = await Promise.all(
      allInvalidCases.map(async (c) => {
        const isManualEntry = c.employeeId.startsWith("MANUAL_");
        let canMatchByNip = false;
        let canMatchByName = false;
        let matchedEmployeeByNip = undefined;
        let matchedEmployeeByName = undefined;

        // Check if can match by NIP
        if (c.employeeNip && c.employeeNip !== "-") {
          // Check if NIP contains multiple NIPs (for divorce cases with spouse)
          const nips = c.employeeNip.split(/[,;\/\s]+/).map(n => n.trim()).filter(n => n.length > 0);
          
          console.log(`📋 Analyzing case ${c.caseNumber}: ${nips.length} NIP(s) found: [${nips.join(', ')}]`);
          
          // Try each NIP
          for (const nip of nips) {
            console.log(`  → Checking NIP: "${nip}"`);
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
              console.log(`  ✅ Match found: ${empByNip.name}`);
              break; // Use first match
            } else {
              console.log(`  ❌ No match for: "${nip}"`);
            }
          }
        }

        // Check if can match by name
        if (!canMatchByNip) {
          console.log(`  → Trying to match by name: "${c.employeeName}"`);
          const { data: empByName } = await supabase
            .from("employees")
            .select("id, name, nip")
            .ilike("name", c.employeeName)
            .maybeSingle();

          if (empByName) {
            canMatchByName = true;
            matchedEmployeeByName = {
              id: empByName.id,
              name: empByName.name,
              nip: empByName.nip || "-",
            };
            console.log(`  ✅ Match by name found: ${empByName.name} (NIP: ${empByName.nip})`);
          } else {
            console.log(`  ❌ No match by name for: "${c.employeeName}"`);
          }
        }

        return {
          ...c,
          disciplinaryCount: disciplinaryCountMap.get(c.caseId) || 0,
          isManualEntry,
          canMatchByNip,
          canMatchByName,
          matchedEmployeeByNip,
          matchedEmployeeByName,
        };
      })
    );

    return {
      summary: {
        totalCases: validation.totalCases,
        connectedCases: validation.connectedCases,
        disconnectedCases: validation.disconnectedCases,
        manualEntries: manualEntries.length,
        casesWithDisciplinary,
      },
      invalidCases: enrichedInvalidCases,
    };
  } catch (error) {
    console.error("❌ Error generating report:", error);
    throw error;
  }
}
