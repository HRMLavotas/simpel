/**
 * Usulan Ujikom Storage Layer
 * Handles all CRUD operations for usulan ujikom using Supabase
 * Created: 2026-06-02
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  UsulanUjikom,
  UsulanUjikomWithDetails,
  UsulanStatusHistory,
  FormasiInfo,
  WaitingListInfo,
  UsulanFilterOptions,
  PaginatedResponse,
  UsulanStatus,
  UsulanFormData,
  UsulanUpdateData,
  StatusChangeData,
} from './types';

// ============================================================================
// TYPE DEFINITIONS FOR DATABASE
// ============================================================================

interface DbUsulanUjikom {
  id: string;
  employee_id: string;
  position_reference_id: string;
  department_id: string;
  status: string;
  queue_position: number | null;
  surat_pengantar_url: string | null;
  link_dokumen_persyaratan: string | null;
  admin_notes: string | null;
  cancellation_reason: string | null;
  feedback_notes: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

interface DbUsulanStatusHistory {
  id: string;
  usulan_ujikom_id: string;
  previous_status: string | null;
  new_status: string;
  notes: string | null;
  cancellation_reason: string | null;
  feedback_notes: string | null;
  changed_at: string;
  changed_by: string | null;
}

// ============================================================================
// HELPER FUNCTIONS - MAPPING
// ============================================================================

function mapDbToUsulanUjikom(db: DbUsulanUjikom): UsulanUjikom {
  return {
    id: db.id,
    employee_id: db.employee_id,
    position_reference_id: db.position_reference_id,
    department_id: db.department_id,
    status: db.status as UsulanStatus,
    queue_position: db.queue_position,
    surat_pengantar_url: db.surat_pengantar_url,
    link_dokumen_persyaratan: db.link_dokumen_persyaratan,
    admin_notes: db.admin_notes,
    cancellation_reason: db.cancellation_reason,
    feedback_notes: db.feedback_notes,
    created_at: db.created_at,
    updated_at: db.updated_at,
    submitted_at: db.submitted_at,
    created_by: db.created_by,
    updated_by: db.updated_by,
  };
}

function mapDbToStatusHistory(db: DbUsulanStatusHistory): UsulanStatusHistory {
  return {
    id: db.id,
    usulan_ujikom_id: db.usulan_ujikom_id,
    previous_status: db.previous_status as UsulanStatus | null,
    new_status: db.new_status as UsulanStatus,
    notes: db.notes,
    cancellation_reason: db.cancellation_reason,
    feedback_notes: db.feedback_notes,
    changed_at: db.changed_at,
    changed_by: db.changed_by,
  };
}

// ============================================================================
// CRUD OPERATIONS - FETCH
// ============================================================================

/**
 * Fetch all usulan with filters
 * Task 3.1
 */
export async function fetchUsulanList(
  filters?: UsulanFilterOptions
): Promise<PaginatedResponse<UsulanUjikomWithDetails>> {
  try {
    let query = supabase
      .from('usulan_ujikom')
      .select(`
        *,
        employee:employees!inner(
          id,
          nip,
          name,
          position_name,
          rank,
          rank_group,
          asn_status,
          is_active
        ),
        position_reference:position_references!inner(
          id,
          position_name,
          position_category,
          grade,
          abk_count
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.department_id) {
      query = query.eq('department', filters.department_id);
    }

    if (filters?.position_reference_id) {
      query = query.eq('position_reference_id', filters.position_reference_id);
    }

    if (filters?.employee_name) {
      query = query.ilike('employee.name', `%${filters.employee_name}%`);
    }

    if (filters?.employee_nip) {
      query = query.ilike('employee.nip', `%${filters.employee_nip}%`);
    }

    if (filters?.submitted_from) {
      query = query.gte('submitted_at', filters.submitted_from);
    }

    if (filters?.submitted_to) {
      query = query.lte('submitted_at', filters.submitted_to);
    }

    // Apply sorting
    const sortBy = filters?.sort_by || 'created_at';
    const sortOrder = filters?.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const page = filters?.page || 1;
    const pageSize = filters?.page_size || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return {
      data: (data || []) as UsulanUjikomWithDetails[],
      total: count || 0,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    };
  } catch (error) {
    console.error('Error fetching usulan list:', error);
    throw error;
  }
}

/**
 * Fetch usulan by ID with full details
 * Task 3.1
 */
export async function fetchUsulanById(id: string): Promise<UsulanUjikomWithDetails | null> {
  try {
    const { data, error } = await supabase
      .from('usulan_ujikom')
      .select(`
        *,
        employee:employees!inner(
          id,
          nip,
          name,
          position_name,
          rank,
          rank_group,
          asn_status,
          is_active
        ),
        position_reference:position_references!inner(
          id,
          position_name,
          position_category,
          grade,
          abk_count
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Return data with department as simple object
    return {
      ...data,
      department: {
        id: data.department,
        name: data.department,
      }
    } as UsulanUjikomWithDetails;
  } catch (error) {
    console.error('Error fetching usulan by ID:', error);
    throw error;
  }
}

// ============================================================================
// FORMASI CALCULATION
// ============================================================================

/**
 * Calculate formasi availability for a position
 * Task 3.2
 */
export async function calculateFormasi(
  positionReferenceId: string,
  departmentId: string
): Promise<FormasiInfo> {
  try {
    // Get position reference data
    const { data: positionRef, error: posRefError } = await supabase
      .from('position_references')
      .select('id, position_name, abk_count')
      .eq('id', positionReferenceId)
      .single();

    if (posRefError) throw posRefError;
    if (!positionRef) throw new Error('Position reference not found');

    // Count occupied positions (Lulus_Ujikom status)
    const { count: occupiedCount, error: countError } = await supabase
      .from('usulan_ujikom')
      .select('*', { count: 'exact', head: true })
      .eq('position_reference_id', positionReferenceId)
      .eq('department', departmentId)
      .eq('status', 'Lulus_Ujikom');

    if (countError) throw countError;

    // Count waiting list
    const { count: waitingCount, error: waitingError } = await supabase
      .from('usulan_ujikom')
      .select('*', { count: 'exact', head: true })
      .eq('position_reference_id', positionReferenceId)
      .eq('department', departmentId)
      .eq('status', 'Waiting_List');

    if (waitingError) throw waitingError;

    const totalQuota = positionRef.abk_count || 0;
    const occupied = occupiedCount || 0;
    const available = Math.max(0, totalQuota - occupied);

    return {
      position_reference_id: positionReferenceId,
      position_name: positionRef.position_name,
      department_id: departmentId,
      total_quota: totalQuota,
      occupied_count: occupied,
      available_count: available,
      is_available: available > 0,
      waiting_list_count: waitingCount || 0,
    };
  } catch (error) {
    console.error('Error calculating formasi:', error);
    throw error;
  }
}

// ============================================================================
// DOCUMENT STORAGE OPERATIONS
// ============================================================================

/**
 * Upload surat pengantar to Supabase Storage
 * Task 3.3
 */
export async function uploadSuratPengantar(
  usulanId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${usulanId}/surat-pengantar/${fileName}`;

    const { data, error } = await supabase.storage
      .from('usulan-ujikom')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('usulan-ujikom')
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Error uploading surat pengantar:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete surat pengantar from storage
 * Task 3.3
 */
export async function deleteSuratPengantar(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from('usulan-ujikom').remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting surat pengantar:', error);
    throw error;
  }
}

/**
 * Get public URL for surat pengantar
 * Task 3.3
 */
export async function getSuratPengantarUrl(filePath: string): Promise<string> {
  const { data } = supabase.storage.from('usulan-ujikom').getPublicUrl(filePath);
  return data.publicUrl;
}

// ============================================================================
// CRUD OPERATIONS - CREATE
// ============================================================================

/**
 * Create new usulan
 * Task 3.1
 */
export async function createUsulan(
  formData: UsulanFormData,
  createdBy: string
): Promise<UsulanUjikomWithDetails> {
  try {
    // Calculate formasi to determine initial status
    const formasiInfo = await calculateFormasi(
      formData.position_reference_id,
      formData.department_id
    );

    const initialStatus: UsulanStatus = formasiInfo.is_available ? 'Draft' : 'Draft';

    // Create usulan record
    const { data: usulan, error: usulanError } = await supabase
      .from('usulan_ujikom')
      .insert({
        employee_id: formData.employee_id,
        position_reference_id: formData.position_reference_id,
        department: formData.department_id,
        status: initialStatus,
        link_dokumen_persyaratan: formData.link_dokumen_persyaratan,
        admin_notes: formData.admin_notes || null,
        creator_id: createdBy,
      })
      .select()
      .single();

    if (usulanError) throw usulanError;

    // Upload surat pengantar if provided
    let suratPengantarUrl: string | undefined;
    if (formData.surat_pengantar_file) {
      const uploadResult = await uploadSuratPengantar(usulan.id, formData.surat_pengantar_file);
      if (uploadResult.success) {
        suratPengantarUrl = uploadResult.url;
      }
    }

    // Update with file URL if uploaded
    if (suratPengantarUrl) {
      await supabase
        .from('usulan_ujikom')
        .update({ surat_pengantar_url: suratPengantarUrl })
        .eq('id', usulan.id);
    }

    // Fetch full details
    const fullUsulan = await fetchUsulanById(usulan.id);
    if (!fullUsulan) throw new Error('Failed to fetch created usulan');

    return fullUsulan;
  } catch (error) {
    console.error('Error creating usulan:', error);
    throw error;
  }
}

// ============================================================================
// CRUD OPERATIONS - UPDATE
// ============================================================================

/**
 * Update existing usulan
 * Task 3.1
 */
export async function updateUsulan(
  usulanId: string,
  updates: UsulanUpdateData,
  updatedBy: string
): Promise<UsulanUjikomWithDetails> {
  try {
    const updateData: any = {};

    if (updates.position_reference_id !== undefined) {
      updateData.position_reference_id = updates.position_reference_id;
    }

    if (updates.link_dokumen_persyaratan !== undefined) {
      updateData.link_dokumen_persyaratan = updates.link_dokumen_persyaratan;
    }

    if (updates.admin_notes !== undefined) {
      updateData.admin_notes = updates.admin_notes;
    }

    // Upload new file if provided
    if (updates.surat_pengantar_file) {
      const uploadResult = await uploadSuratPengantar(usulanId, updates.surat_pengantar_file);
      if (uploadResult.success) {
        updateData.surat_pengantar_url = uploadResult.url;
      }
    }

    const { error } = await supabase
      .from('usulan_ujikom')
      .update(updateData)
      .eq('id', usulanId);

    if (error) throw error;

    const fullUsulan = await fetchUsulanById(usulanId);
    if (!fullUsulan) throw new Error('Failed to fetch updated usulan');

    return fullUsulan;
  } catch (error) {
    console.error('Error updating usulan:', error);
    throw error;
  }
}

/**
 * Delete usulan
 * Task 3.1
 */
export async function deleteUsulan(usulanId: string): Promise<void> {
  try {
    const { error } = await supabase.from('usulan_ujikom').delete().eq('id', usulanId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting usulan:', error);
    throw error;
  }
}

// ============================================================================
// STATUS CHANGE OPERATIONS
// ============================================================================

/**
 * Change usulan status and record history
 * Task 3.4
 */
export async function changeUsulanStatus(
  statusData: StatusChangeData,
  changedBy: string
): Promise<UsulanUjikomWithDetails> {
  try {
    // Fetch current usulan
    const current = await fetchUsulanById(statusData.usulan_id);
    if (!current) throw new Error('Usulan not found');

    const previousStatus = current.status;

    // Prepare update data
    const updateData: any = {
      status: statusData.new_status,
    };

    if (statusData.new_status === 'Dibatalkan' && statusData.cancellation_reason) {
      updateData.cancellation_reason = statusData.cancellation_reason;
    }

    if (statusData.new_status === 'Tidak_Lulus_Ujikom' && statusData.feedback_notes) {
      updateData.feedback_notes = statusData.feedback_notes;
    }

    if (statusData.notes) {
      updateData.admin_notes = statusData.notes;
    }

    // Update usulan
    const { error: updateError } = await supabase
      .from('usulan_ujikom')
      .update(updateData)
      .eq('id', statusData.usulan_id);

    if (updateError) throw updateError;

    // Record status history
    await recordStatusChange({
      usulan_id: statusData.usulan_id,
      previous_status: previousStatus,
      new_status: statusData.new_status,
      notes: statusData.notes,
      cancellation_reason: statusData.cancellation_reason,
      feedback_notes: statusData.feedback_notes,
      changed_by: changedBy,
    });

    // Create notification
    await createUsulanNotification(statusData.usulan_id, previousStatus, statusData.new_status);

    // Check if we need to promote from waiting list
    if (statusData.new_status === 'Tidak_Lulus_Ujikom' || statusData.new_status === 'Dibatalkan') {
      await promoteFromWaitingList(current.position_reference_id, current.department.id);
    }

    const updatedUsulan = await fetchUsulanById(statusData.usulan_id);
    if (!updatedUsulan) throw new Error('Failed to fetch updated usulan');

    return updatedUsulan;
  } catch (error) {
    console.error('Error changing usulan status:', error);
    throw error;
  }
}

/**
 * Submit usulan (change from Draft to Diajukan or Waiting_List)
 * Task 3.4
 */
export async function submitUsulan(
  usulanId: string,
  submittedBy: string
): Promise<UsulanUjikomWithDetails> {
  try {
    const current = await fetchUsulanById(usulanId);
    if (!current) throw new Error('Usulan not found');

    if (current.status !== 'Draft') {
      throw new Error('Only Draft usulan can be submitted');
    }

    // Calculate formasi availability
    const formasiInfo = await calculateFormasi(
      current.position_reference_id,
      current.department.id
    );

    const newStatus: UsulanStatus = formasiInfo.is_available ? 'Diajukan' : 'Waiting_List';

    // Get next queue position if going to waiting list
    let queuePosition: number | null = null;
    if (newStatus === 'Waiting_List') {
      const { count } = await supabase
        .from('usulan_ujikom')
        .select('*', { count: 'exact', head: true })
        .eq('position_reference_id', current.position_reference_id)
        .eq('department', current.department.id)
        .eq('status', 'Waiting_List');

      queuePosition = (count || 0) + 1;
    }

    return await changeUsulanStatus(
      {
        usulan_id: usulanId,
        new_status: newStatus,
      },
      submittedBy
    );
  } catch (error) {
    console.error('Error submitting usulan:', error);
    throw error;
  }
}

// ============================================================================
// STATUS HISTORY OPERATIONS
// ============================================================================

/**
 * Record status change in history
 * Task 3.4
 */
async function recordStatusChange(data: {
  usulan_id: string;
  previous_status: UsulanStatus;
  new_status: UsulanStatus;
  notes?: string;
  cancellation_reason?: string;
  feedback_notes?: string;
  changed_by: string;
}): Promise<void> {
  try {
    const { error } = await supabase.from('usulan_ujikom_status_history').insert({
      usulan_ujikom_id: data.usulan_id,
      previous_status: data.previous_status,
      new_status: data.new_status,
      notes: data.notes || null,
      cancellation_reason: data.cancellation_reason || null,
      feedback_notes: data.feedback_notes || null,
      changed_by: data.changed_by,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error recording status change:', error);
    throw error;
  }
}

/**
 * Fetch status history for usulan
 * Task 3.1
 */
export async function fetchStatusHistory(usulanId: string): Promise<UsulanStatusHistory[]> {
  try {
    const { data, error } = await supabase
      .from('usulan_ujikom_status_history')
      .select(`
        *,
        changed_by_profile:profiles!usulan_ujikom_status_history_changed_by_fkey(
          id,
          full_name,
          role
        )
      `)
      .eq('usulan_ujikom_id', usulanId)
      .order('changed_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...mapDbToStatusHistory(item),
      changed_by_profile: item.changed_by_profile,
    }));
  } catch (error) {
    console.error('Error fetching status history:', error);
    throw error;
  }
}

// ============================================================================
// AUTOMATIC PROMOTION ALGORITHM
// ============================================================================

/**
 * Promote oldest waiting usulan to Diajukan when formasi becomes available
 * Task 3.5
 */
export async function promoteFromWaitingList(
  positionReferenceId: string,
  departmentId: string
): Promise<void> {
  try {
    // Calculate formasi availability
    const formasiInfo = await calculateFormasi(positionReferenceId, departmentId);

    if (!formasiInfo.is_available) {
      console.log('No formasi available, skipping promotion');
      return;
    }

    // Get oldest waiting usulan (FIFO)
    const { data: waitingUsulan, error: fetchError } = await supabase
      .from('usulan_ujikom')
      .select('id, queue_position')
      .eq('position_reference_id', positionReferenceId)
      .eq('department', departmentId)
      .eq('status', 'Waiting_List')
      .order('submitted_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        console.log('No waiting usulan found');
        return;
      }
      throw fetchError;
    }

    if (!waitingUsulan) return;

    // Update status to Diajukan
    const { error: updateError } = await supabase
      .from('usulan_ujikom')
      .update({
        status: 'Diajukan',
        queue_position: null,
      })
      .eq('id', waitingUsulan.id);

    if (updateError) throw updateError;

    // Record status change
    await recordStatusChange({
      usulan_id: waitingUsulan.id,
      previous_status: 'Waiting_List',
      new_status: 'Diajukan',
      notes: 'Promoted automatically from waiting list due to formasi availability',
      changed_by: 'system',
    });

    // Create notification
    await createUsulanNotification(waitingUsulan.id, 'Waiting_List', 'Diajukan');

    // Reorder remaining waiting list
    await reorderWaitingList(positionReferenceId, departmentId);

    console.log(`Successfully promoted usulan ${waitingUsulan.id} from waiting list`);
  } catch (error) {
    console.error('Error promoting from waiting list:', error);
    throw error;
  }
}

/**
 * Reorder queue positions in waiting list
 * Task 3.5
 */
async function reorderWaitingList(
  positionReferenceId: string,
  departmentId: string
): Promise<void> {
  try {
    // Get all waiting usulan ordered by submitted_at
    const { data: waitingList, error } = await supabase
      .from('usulan_ujikom')
      .select('id')
      .eq('position_reference_id', positionReferenceId)
      .eq('department', departmentId)
      .eq('status', 'Waiting_List')
      .order('submitted_at', { ascending: true });

    if (error) throw error;
    if (!waitingList || waitingList.length === 0) return;

    // Update queue positions
    for (let i = 0; i < waitingList.length; i++) {
      await supabase
        .from('usulan_ujikom')
        .update({ queue_position: i + 1 })
        .eq('id', waitingList[i].id);
    }
  } catch (error) {
    console.error('Error reordering waiting list:', error);
    throw error;
  }
}

// ============================================================================
// WAITING LIST OPERATIONS
// ============================================================================

/**
 * Fetch waiting list info for a usulan
 */
export async function fetchWaitingListInfo(usulanId: string): Promise<WaitingListInfo | null> {
  try {
    const usulan = await fetchUsulanById(usulanId);
    if (!usulan || usulan.status !== 'Waiting_List') return null;

    const { data: waitingList, error } = await supabase
      .from('usulan_ujikom')
      .select(`
        id,
        queue_position,
        submitted_at,
        employee:employees!inner(name)
      `)
      .eq('position_reference_id', usulan.position_reference_id)
      .eq('department', usulan.department.id)
      .eq('status', 'Waiting_List')
      .order('queue_position', { ascending: true });

    if (error) throw error;

    const totalWaiting = waitingList?.length || 0;
    const queuePosition = usulan.queue_position || 0;

    return {
      usulan_id: usulanId,
      queue_position: queuePosition,
      total_waiting: totalWaiting,
      estimated_wait_message: `Anda berada di posisi ${queuePosition} dari ${totalWaiting} usulan yang menunggu`,
      other_waiting_usulan: waitingList?.map((item: any) => ({
        id: item.id,
        employee_name: item.employee.name,
        queue_position: item.queue_position,
        submitted_at: item.submitted_at,
      })) || [],
    };
  } catch (error) {
    console.error('Error fetching waiting list info:', error);
    throw error;
  }
}

// ============================================================================
// NOTIFICATION OPERATIONS
// ============================================================================

/**
 * Create notification for status change
 * Task 3.4
 */
async function createUsulanNotification(
  usulanId: string,
  previousStatus: UsulanStatus,
  newStatus: UsulanStatus
): Promise<void> {
  try {
    const usulan = await fetchUsulanById(usulanId);
    if (!usulan) return;

    // Determine recipient (Admin Unit from department)
    // Note: Simplified to get all profiles from the same department
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('department', usulan.department.name);

    if (profileError) throw profileError;
    if (!profiles || profiles.length === 0) return;

    // Generate notification message
    let message = '';
    switch (newStatus) {
      case 'Diajukan':
        message = previousStatus === 'Waiting_List'
          ? `Usulan ujikom untuk ${usulan.employee.name} telah dipromosikan dari daftar tunggu ke status Diajukan`
          : `Usulan ujikom untuk ${usulan.employee.name} telah diajukan`;
        break;
      case 'Verifikasi_Berkas':
        message = `Usulan ujikom untuk ${usulan.employee.name} sedang dalam proses verifikasi berkas`;
        break;
      case 'Proses_Ujikom':
        message = `Usulan ujikom untuk ${usulan.employee.name} telah masuk tahap proses ujikom`;
        break;
      case 'Lulus_Ujikom':
        message = `Selamat! ${usulan.employee.name} telah lulus ujikom untuk jabatan ${usulan.position_reference.position_name}`;
        break;
      case 'Tidak_Lulus_Ujikom':
        message = `Usulan ujikom untuk ${usulan.employee.name} dinyatakan tidak lulus`;
        break;
      case 'Dibatalkan':
        message = `Usulan ujikom untuk ${usulan.employee.name} telah dibatalkan`;
        break;
      default:
        message = `Status usulan ujikom untuk ${usulan.employee.name} telah berubah`;
    }

    // Insert notification for each admin unit in department
    for (const profile of profiles) {
      await supabase.from('notifications').insert({
        user_id: profile.id,
        type: 'usulan_ujikom_status_change',
        title: 'Perubahan Status Usulan Ujikom',
        message,
        data: {
          usulan_id: usulanId,
          employee_name: usulan.employee.name,
          position_name: usulan.position_reference.position_name,
          previous_status: previousStatus,
          new_status: newStatus,
          cancellation_reason: usulan.cancellation_reason,
          feedback_notes: usulan.feedback_notes,
        },
        is_read: false,
      });
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw - notification failure shouldn't block main operation
  }
}

// ============================================================================
// STATISTICS OPERATIONS
// ============================================================================

/**
 * Get statistics for Admin Unit dashboard
 */
export async function getUsulanStatistics(departmentId: string) {
  try {
    // Get count by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('usulan_ujikom')
      .select('status')
      .eq('department', departmentId);

    if (statusError) throw statusError;

    const byStatus = (statusCounts || []).reduce((acc, item) => {
      acc[item.status as UsulanStatus] = (acc[item.status as UsulanStatus] || 0) + 1;
      return acc;
    }, {} as Record<UsulanStatus, number>);

    // Get full positions (formasi penuh)
    const { data: positions, error: posError } = await supabase
      .from('position_references')
      .select('id, position_name, abk_count')
      .eq('department', departmentId)
      .eq('position_category', 'Jabatan Fungsional');

    if (posError) throw posError;

    const fullPositions = [];
    for (const pos of positions || []) {
      const formasi = await calculateFormasi(pos.id, departmentId);
      if (!formasi.is_available) {
        fullPositions.push({
          position_name: pos.position_name,
          position_reference_id: pos.id,
          total_quota: formasi.total_quota,
          occupied_count: formasi.occupied_count,
        });
      }
    }

    // Get recent lulus
    const { data: recentLulus, error: lulusError } = await supabase
      .from('usulan_ujikom')
      .select(`
        employee:employees!inner(id, name),
        position_reference:position_references!inner(position_name),
        updated_at
      `)
      .eq('department', departmentId)
      .eq('status', 'Lulus_Ujikom')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (lulusError) throw lulusError;

    return {
      total_usulan: statusCounts?.length || 0,
      by_status: byStatus,
      full_positions: fullPositions,
      recent_lulus: (recentLulus || []).map((item: any) => ({
        employee_id: item.employee.id,
        employee_name: item.employee.name,
        position_name: item.position_reference.position_name,
        completed_at: item.updated_at,
      })),
    };
  } catch (error) {
    console.error('Error getting usulan statistics:', error);
    throw error;
  }
}
