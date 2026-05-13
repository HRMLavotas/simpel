/**
 * Disciplinary Action Storage Layer
 * Handles all CRUD operations for disciplinary actions using dedicated table
 */

import { supabase } from "@/integrations/supabase/client";

export interface DisciplinaryAction {
  id?: string;
  caseId: string;
  employeeId: string;
  employeeName: string;
  employeeNip: string;
  level: "ringan" | "sedang" | "berat";
  type: string;
  decisionNumber: string;
  decisionDate: string;
  effectiveDate: string;
  endDate?: string;
  issuedBy: string;
  violation: string;
  notes?: string;
  documentLink?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DbDisciplinaryAction {
  id: string;
  case_id: string;
  employee_id: string;
  employee_name: string;
  employee_nip: string;
  level: string;
  type: string;
  decision_number: string;
  decision_date: string;
  effective_date: string;
  end_date: string | null;
  issued_by: string;
  violation: string;
  notes: string | null;
  document_link: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapDbToDisciplinaryAction(db: DbDisciplinaryAction): DisciplinaryAction {
  return {
    id: db.id,
    caseId: db.case_id,
    employeeId: db.employee_id,
    employeeName: db.employee_name,
    employeeNip: db.employee_nip,
    level: db.level as "ringan" | "sedang" | "berat",
    type: db.type,
    decisionNumber: db.decision_number,
    decisionDate: db.decision_date,
    effectiveDate: db.effective_date,
    endDate: db.end_date || undefined,
    issuedBy: db.issued_by,
    violation: db.violation,
    notes: db.notes || undefined,
    documentLink: db.document_link || undefined,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all disciplinary actions for a case
 */
export async function getDisciplinaryActionsByCase(
  caseId: string
): Promise<DisciplinaryAction[]> {
  try {
    const { data, error } = await supabase
      .from("disciplinary_actions")
      .select("*")
      .eq("case_id", caseId)
      .order("decision_date", { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDbToDisciplinaryAction);
  } catch (error) {
    console.error("Error fetching disciplinary actions:", error);
    throw error;
  }
}

/**
 * Get all disciplinary actions for an employee
 */
export async function getDisciplinaryActionsByEmployee(
  employeeId: string
): Promise<DisciplinaryAction[]> {
  try {
    const { data, error } = await supabase
      .from("disciplinary_actions")
      .select("*")
      .eq("employee_id", employeeId)
      .order("decision_date", { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDbToDisciplinaryAction);
  } catch (error) {
    console.error("Error fetching disciplinary actions by employee:", error);
    throw error;
  }
}

/**
 * Get a single disciplinary action by ID
 */
export async function getDisciplinaryActionById(
  id: string
): Promise<DisciplinaryAction | null> {
  try {
    const { data, error } = await supabase
      .from("disciplinary_actions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }

    return mapDbToDisciplinaryAction(data);
  } catch (error) {
    console.error("Error fetching disciplinary action:", error);
    throw error;
  }
}

/**
 * Create a new disciplinary action
 */
export async function createDisciplinaryAction(
  action: Omit<DisciplinaryAction, "id" | "createdAt" | "updatedAt">
): Promise<DisciplinaryAction> {
  try {
    console.log("📝 Creating disciplinary action:", action);

    const { data, error } = await supabase
      .from("disciplinary_actions")
      .insert({
        case_id: action.caseId,
        employee_id: action.employeeId,
        employee_name: action.employeeName,
        employee_nip: action.employeeNip,
        level: action.level,
        type: action.type,
        decision_number: action.decisionNumber,
        decision_date: action.decisionDate,
        effective_date: action.effectiveDate,
        end_date: action.endDate || null,
        issued_by: action.issuedBy,
        violation: action.violation,
        notes: action.notes || null,
        document_link: action.documentLink || null,
        created_by: action.createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating disciplinary action:", error);
      throw error;
    }

    console.log("✅ Disciplinary action created:", data);

    return mapDbToDisciplinaryAction(data);
  } catch (error) {
    console.error("❌ Error in createDisciplinaryAction:", error);
    throw error;
  }
}

/**
 * Update a disciplinary action
 */
export async function updateDisciplinaryAction(
  id: string,
  updates: Partial<Omit<DisciplinaryAction, "id" | "caseId" | "createdAt" | "updatedAt">>
): Promise<DisciplinaryAction> {
  try {
    const updateData: any = {};

    if (updates.level !== undefined) updateData.level = updates.level;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.decisionNumber !== undefined)
      updateData.decision_number = updates.decisionNumber;
    if (updates.decisionDate !== undefined)
      updateData.decision_date = updates.decisionDate;
    if (updates.effectiveDate !== undefined)
      updateData.effective_date = updates.effectiveDate;
    if (updates.endDate !== undefined)
      updateData.end_date = updates.endDate || null;
    if (updates.issuedBy !== undefined)
      updateData.issued_by = updates.issuedBy;
    if (updates.violation !== undefined)
      updateData.violation = updates.violation;
    if (updates.notes !== undefined)
      updateData.notes = updates.notes || null;
    if (updates.documentLink !== undefined)
      updateData.document_link = updates.documentLink || null;

    const { data, error } = await supabase
      .from("disciplinary_actions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return mapDbToDisciplinaryAction(data);
  } catch (error) {
    console.error("Error updating disciplinary action:", error);
    throw error;
  }
}

/**
 * Delete a disciplinary action
 */
export async function deleteDisciplinaryAction(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("disciplinary_actions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting disciplinary action:", error);
    throw error;
  }
}

/**
 * Get active disciplinary actions (not expired)
 */
export async function getActiveDisciplinaryActions(
  employeeId?: string
): Promise<DisciplinaryAction[]> {
  try {
    let query = supabase
      .from("disciplinary_actions")
      .select("*")
      .or("end_date.is.null,end_date.gte." + new Date().toISOString().split("T")[0]);

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data, error } = await query.order("decision_date", {
      ascending: false,
    });

    if (error) throw error;

    return (data || []).map(mapDbToDisciplinaryAction);
  } catch (error) {
    console.error("Error fetching active disciplinary actions:", error);
    throw error;
  }
}

/**
 * Get disciplinary actions statistics
 */
export async function getDisciplinaryActionsStats() {
  try {
    const { data, error } = await supabase
      .from("disciplinary_actions")
      .select("level");

    if (error) throw error;

    const stats = {
      total: data.length,
      ringan: data.filter((d) => d.level === "ringan").length,
      sedang: data.filter((d) => d.level === "sedang").length,
      berat: data.filter((d) => d.level === "berat").length,
    };

    return stats;
  } catch (error) {
    console.error("Error fetching disciplinary actions stats:", error);
    throw error;
  }
}
