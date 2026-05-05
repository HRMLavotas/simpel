import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/lib/constants';
import { logger } from '@/lib/logger';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  department: string;
  app_role: AppRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  isAdminPusat: boolean;
  isAdminPimpinan: boolean;
  canViewAll: boolean;
  canEdit: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Flag untuk mencegah double-fetch profile (race condition antara onAuthStateChange dan getSession)
    let isFetching = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer dengan setTimeout untuk mencegah deadlock Supabase
          setTimeout(() => {
            if (!isFetching) {
              isFetching = true;
              fetchUserData(session.user.id).finally(() => { isFetching = false; });
            }
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    // Cek existing session — hanya fetch jika onAuthStateChange belum trigger
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user && !isFetching) {
        isFetching = true;
        fetchUserData(session.user.id).finally(() => { isFetching = false; });
      } else if (!session?.user) {
        setIsLoading(false);
      }
    }).catch((err) => {
      logger.error('Error getting session:', err);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) throw roleError;
      
      const userRole = roleData?.role as AppRole ?? null;
      setRole(userRole);
      
      // Combine profile with role
      if (profileData && userRole) {
        setProfile({
          ...profileData,
          app_role: userRole
        });
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      logger.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchUserData(user.id);
  };

  const isAdminPusat = role === 'admin_pusat';
  const isAdminPimpinan = role === 'admin_pimpinan';
  // Admin Pimpinan hanya bisa lihat semua unit jika departmentnya 'Pusat'
  const canViewAll = role === 'admin_pusat' || (role === 'admin_pimpinan' && profile?.department === 'Pusat');
  const canEdit = role === 'admin_pusat' || role === 'admin_unit';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      isLoading,
      isAdminPusat,
      isAdminPimpinan,
      canViewAll,
      canEdit,
      signIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
