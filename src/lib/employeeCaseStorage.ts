/**
 * Employee Case Storage Layer
 * Handles all CRUD operations for employee cases using Supabase
 */

import {
  EmployeeCase,
  TimelineItem,
  CaseStatus,
  generateCaseNumber,
  validateCaseData,
  SupportingDocument,
  InvolvedParty,
} from "./employeeCaseTypes";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TYPE DEFINITIONS FOR DATABASE
// ============================================================================

interface DbEmployeeCase {
  id: string;
  case_number: string | null;
  employee_id: string;
  employee_name: string;
  employee_nip: string;
  case_type: string;
  status: string;
  severity: string | null;
  description: string;
  report_date: string;
  case_details: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DbCaseTimeline {
  id: string;
  case_id: string;
  date: string;
  description: string;
  status: string | null;
  involved_parties: string | null;
  document_link: string | null;
  document_name: string | null;
  involved_parties_list: any;
  documents: any;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapDbCaseToEmployeeCase(
  dbCase: DbEmployeeCase,
  timeline: DbCaseTimeline[] = []
): EmployeeCase {
  return {
    id: dbCase.id,
    caseNumber: dbCase.case_number || undefined,
    employeeId: dbCase.employee_id,
    employeeName: dbCase.employee_name,
    employeeNip: dbCase.employee_nip,
    caseType: dbCase.case_type as any,
    status: dbCase.status as CaseStatus,
    severity: dbCase.severity as any,
    description: dbCase.description,
    reportDate: dbCase.report_date,
    timeline: timeline.map(mapDbTimelineToTimelineItem),
    caseDetails: dbCase.case_details || undefined,
    createdBy: dbCase.created_by,
    createdAt: dbCase.created_at,
    updatedAt: dbCase.updated_at,
  };
}

function mapDbTimelineToTimelineItem(dbTimeline: DbCaseTimeline): TimelineItem {
  return {
    id: dbTimeline.id,
    date: dbTimeline.date,
    description: dbTimeline.description,
    status: dbTimeline.status || "",
    involvedParties: dbTimeline.involved_parties || undefined,
    involvedPartiesList: dbTimeline.involved_parties_list || [],
    documentLink: dbTimeline.document_link || undefined,
    documentName: dbTimeline.document_name || undefined,
    documents: dbTimeline.documents || [],
    createdAt: dbTimeline.created_at,
    updatedAt: dbTimeline.updated_at,
  };
}

// ============================================================================
// CASE CRUD OPERATIONS
// ============================================================================

/**
 * Get all cases
 */
export async function getAllCases(): Promise<EmployeeCase[]> {
  try {
    console.log("🔍 Fetching all cases...");
    
    const { data: cases, error: casesError } = await supabase
      .from("employee_cases")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("📊 Cases query result:", { cases, error: casesError });

    if (casesError) {
      console.error("❌ Error fetching cases:", casesError);
      throw casesError;
    }

    if (!cases || cases.length === 0) {
      console.log("⚠️ No cases found in database");
      return [];
    }

    console.log(`✅ Found ${cases.length} cases`);

    // Fetch timeline for all cases
    const caseIds = cases.map((c) => c.id);
    const { data: timelines, error: timelinesError } = await supabase
      .from("case_timeline")
      .select("*")
      .in("case_id", caseIds)
      .order("date", { ascending: false });

    if (timelinesError) {
      console.error("❌ Error fetching timelines:", timelinesError);
      throw timelinesError;
    }

    console.log(`📝 Found ${timelines?.length || 0} timeline items`);

    // Group timelines by case_id
    const timelinesByCase = (timelines || []).reduce((acc, timeline) => {
      if (!acc[timeline.case_id]) {
        acc[timeline.case_id] = [];
      }
      acc[timeline.case_id].push(timeline);
      return acc;
    }, {} as Record<string, DbCaseTimeline[]>);

    // Map to EmployeeCase objects
    const mappedCases = cases.map((c) =>
      mapDbCaseToEmployeeCase(c, timelinesByCase[c.id] || [])
    );
    
    console.log("✅ Mapped cases:", mappedCases);
    
    return mappedCases;
  } catch (error) {
    console.error("❌ Error in getAllCases:", error);
    throw error;
  }
}

/**
 * Get case by ID
 */
export async function getCaseById(id: string): Promise<EmployeeCase | null> {
  try {
    const { data: caseData, error: caseError } = await supabase
      .from("employee_cases")
      .select("*")
      .eq("id", id)
      .single();

    if (caseError) {
      if (caseError.code === "PGRST116") {
        // Not found
        return null;
      }
      throw caseError;
    }

    if (!caseData) return null;

    // Fetch timeline
    const { data: timelines, error: timelinesError } = await supabase
      .from("case_timeline")
      .select("*")
      .eq("case_id", id)
      .order("date", { ascending: false });

    if (timelinesError) throw timelinesError;

    return mapDbCaseToEmployeeCase(caseData, timelines || []);
  } catch (error) {
    console.error("Error fetching case:", error);
    throw error;
  }
}

/**
 * Create a new case
 */
export async function createCase(
  caseData: Omit<EmployeeCase, "id" | "createdAt" | "updatedAt" | "timeline">
): Promise<EmployeeCase> {
  try {
    console.log("📝 Creating new case with data:", caseData);
    
    // Validate data
    const errors = validateCaseData(caseData);
    if (errors.length > 0) {
      console.error("❌ Validation errors:", errors);
      throw new Error(errors.join(", "));
    }

    const insertData = {
      case_number: caseData.caseNumber || null,
      employee_id: String(caseData.employeeId), // Convert to string
      employee_name: caseData.employeeName,
      employee_nip: caseData.employeeNip,
      case_type: caseData.caseType,
      status: caseData.status,
      severity: caseData.severity || null,
      description: caseData.description,
      report_date: caseData.reportDate,
      case_details: caseData.caseDetails || {},
      created_by: caseData.createdBy,
    };

    console.log("📤 Inserting data:", insertData);

    const { data, error } = await supabase
      .from("employee_cases")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("❌ Insert error:", error);
      throw error;
    }

    console.log("✅ Case created successfully:", data);

    return mapDbCaseToEmployeeCase(data, []);
  } catch (error) {
    console.error("❌ Error in createCase:", error);
    throw error;
  }
}

/**
 * Update an existing case
 */
export async function updateCase(
  id: string,
  updates: Partial<Omit<EmployeeCase, "id" | "createdAt" | "timeline">>
): Promise<EmployeeCase> {
  try {
    const updateData: any = {};

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.severity !== undefined) updateData.severity = updates.severity;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.caseDetails !== undefined)
      updateData.case_details = updates.caseDetails;

    const { data, error } = await supabase
      .from("employee_cases")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Fetch timeline
    const { data: timelines } = await supabase
      .from("case_timeline")
      .select("*")
      .eq("case_id", id)
      .order("date", { ascending: false });

    return mapDbCaseToEmployeeCase(data, timelines || []);
  } catch (error) {
    console.error("Error updating case:", error);
    throw error;
  }
}

/**
 * Delete a case
 */
export async function deleteCase(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("employee_cases")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting case:", error);
    throw error;
  }
}

// ============================================================================
// TIMELINE OPERATIONS
// ============================================================================

/**
 * Add a timeline item to a case
 */
export async function addTimelineItem(
  caseId: string,
  date: string,
  description: string,
  status: string = "",
  involvedParties?: string, // Legacy
  documentLink?: string, // Legacy
  documentName?: string, // Legacy
  documents: SupportingDocument[] = [],
  involvedPartiesList: InvolvedParty[] = []
): Promise<TimelineItem> {
  try {
    const { data, error } = await supabase
      .from("case_timeline")
      .insert({
        case_id: caseId,
        date,
        description,
        status: status || null,
        involved_parties: involvedParties || null,
        document_link: documentLink || null,
        document_name: documentName || null,
        documents: documents.length > 0 ? documents : [],
        involved_parties_list:
          involvedPartiesList.length > 0 ? involvedPartiesList : [],
      })
      .select()
      .single();

    if (error) throw error;

    return mapDbTimelineToTimelineItem(data);
  } catch (error) {
    console.error("Error adding timeline item:", error);
    throw error;
  }
}

/**
 * Update a timeline item
 */
export async function updateTimelineItem(
  caseId: string,
  timelineId: string,
  updates: Partial<Omit<TimelineItem, "id" | "createdAt">>
): Promise<TimelineItem> {
  try {
    const updateData: any = {};

    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.involvedPartiesList !== undefined)
      updateData.involved_parties_list = updates.involvedPartiesList;
    if (updates.documents !== undefined) updateData.documents = updates.documents;

    const { data, error } = await supabase
      .from("case_timeline")
      .update(updateData)
      .eq("id", timelineId)
      .eq("case_id", caseId)
      .select()
      .single();

    if (error) throw error;

    return mapDbTimelineToTimelineItem(data);
  } catch (error) {
    console.error("Error updating timeline item:", error);
    throw error;
  }
}

/**
 * Delete a timeline item
 */
export async function deleteTimelineItem(
  caseId: string,
  timelineId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("case_timeline")
      .delete()
      .eq("id", timelineId)
      .eq("case_id", caseId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting timeline item:", error);
    throw error;
  }
}

// ============================================================================
// ACCESS CONTROL
// ============================================================================

export interface CaseAccessControl {
  userId: string;
  userName: string;
  userRole: string;
  canEdit: boolean;
  canView: boolean;
  grantedBy: string;
  grantedAt: string;
}

/**
 * Get all access control entries
 */
export async function getAllAccessControl(): Promise<CaseAccessControl[]> {
  try {
    const { data, error } = await supabase
      .from("case_access_control")
      .select("*")
      .order("granted_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      userId: item.user_id,
      userName: item.user_name,
      userRole: item.user_role,
      canEdit: item.can_edit,
      canView: item.can_view,
      grantedBy: item.granted_by,
      grantedAt: item.granted_at,
    }));
  } catch (error) {
    console.error("Error fetching access control:", error);
    throw error;
  }
}

/**
 * Grant access to a user
 */
export async function grantAccess(
  userId: string,
  userName: string,
  userRole: string,
  canEdit: boolean,
  grantedBy: string
): Promise<CaseAccessControl> {
  try {
    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from("case_access_control")
      .upsert(
        {
          user_id: userId,
          user_name: userName,
          user_role: userRole,
          can_edit: canEdit,
          can_view: true,
          granted_by: grantedBy,
          granted_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) throw error;

    return {
      userId: data.user_id,
      userName: data.user_name,
      userRole: data.user_role,
      canEdit: data.can_edit,
      canView: data.can_view,
      grantedBy: data.granted_by,
      grantedAt: data.granted_at,
    };
  } catch (error) {
    console.error("Error granting access:", error);
    throw error;
  }
}

/**
 * Revoke access from a user
 */
export async function revokeAccess(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("case_access_control")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error revoking access:", error);
    throw error;
  }
}

/**
 * Check if a user has access
 */
export async function checkUserAccess(
  userId: string
): Promise<CaseAccessControl | null> {
  try {
    const { data, error } = await supabase
      .from("case_access_control")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    return {
      userId: data.user_id,
      userName: data.user_name,
      userRole: data.user_role,
      canEdit: data.can_edit,
      canView: data.can_view,
      grantedBy: data.granted_by,
      grantedAt: data.granted_at,
    };
  } catch (error) {
    console.error("Error checking user access:", error);
    throw error;
  }
}
