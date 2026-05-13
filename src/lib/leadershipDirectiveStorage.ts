/**
 * Leadership Directive Storage Layer
 * Handles all CRUD operations for leadership directives using dedicated table
 */

import { supabase } from "@/integrations/supabase/client";

export interface LeadershipDirective {
  id?: string;
  caseId: string;
  directiveText: string;
  directiveDate: string;
  issuedById?: string;
  issuedByName: string;
  issuedByPosition?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DbLeadershipDirective {
  id: string;
  case_id: string;
  directive_text: string;
  directive_date: string;
  issued_by_id: string | null;
  issued_by_name: string;
  issued_by_position: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapDbToLeadershipDirective(db: DbLeadershipDirective): LeadershipDirective {
  return {
    id: db.id,
    caseId: db.case_id,
    directiveText: db.directive_text,
    directiveDate: db.directive_date,
    issuedById: db.issued_by_id || undefined,
    issuedByName: db.issued_by_name,
    issuedByPosition: db.issued_by_position || undefined,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all directives for a case
 */
export async function getDirectivesByCase(caseId: string): Promise<LeadershipDirective[]> {
  try {
    const { data, error } = await supabase
      .from("leadership_directives")
      .select("*")
      .eq("case_id", caseId)
      .order("directive_date", { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDbToLeadershipDirective);
  } catch (error) {
    console.error("Error fetching leadership directives:", error);
    throw error;
  }
}

/**
 * Get a single directive by ID
 */
export async function getDirectiveById(id: string): Promise<LeadershipDirective | null> {
  try {
    const { data, error } = await supabase
      .from("leadership_directives")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapDbToLeadershipDirective(data);
  } catch (error) {
    console.error("Error fetching leadership directive:", error);
    throw error;
  }
}

/**
 * Create a new directive
 */
export async function createDirective(
  directive: Omit<LeadershipDirective, "id" | "createdAt" | "updatedAt">
): Promise<LeadershipDirective> {
  try {
    const { data, error } = await supabase
      .from("leadership_directives")
      .insert({
        case_id: directive.caseId,
        directive_text: directive.directiveText,
        directive_date: directive.directiveDate,
        issued_by_id: directive.issuedById || null,
        issued_by_name: directive.issuedByName,
        issued_by_position: directive.issuedByPosition || null,
        created_by: directive.createdBy,
      })
      .select()
      .single();

    if (error) throw error;

    return mapDbToLeadershipDirective(data);
  } catch (error) {
    console.error("Error creating leadership directive:", error);
    throw error;
  }
}

/**
 * Update a directive
 */
export async function updateDirective(
  id: string,
  updates: Partial<Omit<LeadershipDirective, "id" | "caseId" | "createdBy" | "createdAt" | "updatedAt">>
): Promise<LeadershipDirective> {
  try {
    const updateData: any = {};

    if (updates.directiveText !== undefined) updateData.directive_text = updates.directiveText;
    if (updates.directiveDate !== undefined) updateData.directive_date = updates.directiveDate;
    if (updates.issuedById !== undefined) updateData.issued_by_id = updates.issuedById || null;
    if (updates.issuedByName !== undefined) updateData.issued_by_name = updates.issuedByName;
    if (updates.issuedByPosition !== undefined) updateData.issued_by_position = updates.issuedByPosition || null;

    const { data, error } = await supabase
      .from("leadership_directives")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return mapDbToLeadershipDirective(data);
  } catch (error) {
    console.error("Error updating leadership directive:", error);
    throw error;
  }
}

/**
 * Delete a directive
 */
export async function deleteDirective(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("leadership_directives")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting leadership directive:", error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR AUTO-FILL
// ============================================================================

/**
 * Search for leadership/management personnel by name
 */
export async function searchLeadershipPersonnel(searchTerm: string): Promise<Array<{
  id: string;
  name: string;
  position: string;
}>> {
  try {
    if (!searchTerm || searchTerm.length < 2) return [];

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, jabatan")
      .or(`name.ilike.%${searchTerm}%,jabatan.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) throw error;

    return (data || []).map(p => ({
      id: p.id,
      name: p.name || "",
      position: p.jabatan || "",
    }));
  } catch (error) {
    console.error("Error searching leadership personnel:", error);
    return [];
  }
}

/**
 * Get common leadership positions for suggestions
 */
export async function getCommonLeadershipPositions(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("jabatan")
      .not("jabatan", "is", null)
      .limit(100);

    if (error) throw error;

    // Extract unique positions that contain leadership keywords
    const leadershipKeywords = [
      "direktur", "kepala", "sekretaris", "kasubdit", "kabid", "kasubag",
      "pimpinan", "manajer", "koordinator", "supervisor"
    ];

    const positions = new Set<string>();
    (data || []).forEach(p => {
      const jabatan = p.jabatan?.toLowerCase() || "";
      if (leadershipKeywords.some(keyword => jabatan.includes(keyword))) {
        positions.add(p.jabatan!);
      }
    });

    return Array.from(positions).slice(0, 20);
  } catch (error) {
    console.error("Error fetching leadership positions:", error);
    return [];
  }
}
