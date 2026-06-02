/**
 * React Hook for Usulan Ujikom Data Management
 * Task 4.1: useUsulanUjikom hook for listing and fetching
 * Created: 2026-06-02
 */

import { useQuery } from '@tanstack/react-query';
import type {
  UsulanUjikomWithDetails,
  UsulanFilterOptions,
  PaginatedResponse,
  UsulanStatusHistory,
  FormasiInfo,
  WaitingListInfo,
} from '@/lib/usulan-ujikom/types';
import {
  fetchUsulanList,
  fetchUsulanById,
  fetchStatusHistory,
  calculateFormasi,
  fetchWaitingListInfo,
  getUsulanStatistics,
} from '@/lib/usulan-ujikom/storage';
import { useAuth } from './useAuth';

/**
 * Hook to fetch usulan list with filters
 * Automatically filters by department for Admin Unit
 */
export function useUsulanList(filters?: UsulanFilterOptions) {
  const { profile, role } = useAuth();

  return useQuery<PaginatedResponse<UsulanUjikomWithDetails>>({
    queryKey: ['usulan-ujikom', 'list', filters, profile?.department_id],
    queryFn: async () => {
      // Add department filter for Admin Unit
      const finalFilters: UsulanFilterOptions = { ...filters };
      if (role === 'admin_unit' && profile?.department_id) {
        finalFilters.department_id = profile.department_id;
      }

      return await fetchUsulanList(finalFilters);
    },
    enabled: !!profile,
  });
}

/**
 * Hook to fetch single usulan by ID
 */
export function useUsulan(id: string | undefined) {
  return useQuery<UsulanUjikomWithDetails | null>({
    queryKey: ['usulan-ujikom', 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      return await fetchUsulanById(id);
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch status history for usulan
 */
export function useUsulanStatusHistory(usulanId: string | undefined) {
  return useQuery<UsulanStatusHistory[]>({
    queryKey: ['usulan-ujikom', 'status-history', usulanId],
    queryFn: async () => {
      if (!usulanId) return [];
      return await fetchStatusHistory(usulanId);
    },
    enabled: !!usulanId,
  });
}

/**
 * Hook to calculate formasi availability
 * Task 4.3
 */
export function useFormasi(positionReferenceId: string | undefined, departmentId: string | undefined) {
  return useQuery<FormasiInfo | null>({
    queryKey: ['usulan-ujikom', 'formasi', positionReferenceId, departmentId],
    queryFn: async () => {
      if (!positionReferenceId || !departmentId) return null;
      return await calculateFormasi(positionReferenceId, departmentId);
    },
    enabled: !!positionReferenceId && !!departmentId,
    staleTime: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook to fetch waiting list info
 */
export function useWaitingListInfo(usulanId: string | undefined) {
  return useQuery<WaitingListInfo | null>({
    queryKey: ['usulan-ujikom', 'waiting-list-info', usulanId],
    queryFn: async () => {
      if (!usulanId) return null;
      return await fetchWaitingListInfo(usulanId);
    },
    enabled: !!usulanId,
  });
}

/**
 * Hook to fetch statistics for Admin Unit dashboard
 */
export function useUsulanStatistics() {
  const { profile, role } = useAuth();

  return useQuery({
    queryKey: ['usulan-ujikom', 'statistics', profile?.department],
    queryFn: async () => {
      if (!profile?.department) return null;
      return await getUsulanStatistics(profile.department);
    },
    enabled: !!profile?.department && role === 'admin_unit',
  });
}
