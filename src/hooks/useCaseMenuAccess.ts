/**
 * useCaseMenuAccess Hook
 * Check if current user has access to Case Management menu
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useCaseMenuAccess() {
  const { user, isAdminPusat } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      // Only admin_pusat can potentially have access
      if (!isAdminPusat || !user) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user is in case_access_control table
        const { data, error } = await supabase
          .from('case_access_control')
          .select('user_id, can_view')
          .eq('user_id', user.id)
          .eq('can_view', true)
          .maybeSingle();

        if (error) {
          console.error('Error checking case access:', error);
          setHasAccess(false);
        } else {
          // User has access if they exist in the table with can_view = true
          setHasAccess(!!data);
        }
      } catch (error) {
        console.error('Error in checkAccess:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [user, isAdminPusat]);

  return { hasAccess, isLoading };
}
