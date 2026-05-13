/**
 * useCaseAccess Hook
 * Manages access control for the case management system
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { checkUserAccess, CaseAccessControl } from "@/lib/employeeCaseStorage";

export function useCaseAccess() {
  const { user, role } = useAuth();
  const [canEdit, setCanEdit] = useState(false);
  const [canView, setCanView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState<CaseAccessControl | null>(null);

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setCanEdit(false);
        setCanView(false);
        setIsLoading(false);
        return;
      }

      // Admin Pusat has full access
      if (role === "admin_pusat") {
        setCanEdit(true);
        setCanView(true);
        setIsLoading(false);
        return;
      }

      // Check if user has been granted access
      try {
        const access = await checkUserAccess(user.id);
        if (access) {
          setCanEdit(access.canEdit);
          setCanView(access.canView);
          setAccessInfo(access);
        } else {
          setCanEdit(false);
          setCanView(false);
          setAccessInfo(null);
        }
      } catch (error) {
        console.error("Error checking case access:", error);
        setCanEdit(false);
        setCanView(false);
        setAccessInfo(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [user, role]);

  return {
    canEdit,
    canView,
    isLoading,
    accessInfo,
    isAdminPusat: role === "admin_pusat",
  };
}
