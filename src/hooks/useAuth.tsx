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
    let hasFetchedForUser: string | null = null;
    let isFetching = false;

    const loadProfile = async (userId: string) => {
      // Cegah infinite loop refresh token dan double fetch
      if (isFetching || hasFetchedForUser === userId) return;
      
      isFetching = true;
      try {
        await fetchUserData(userId);
        hasFetchedForUser = userId;
      } finally {
        isFetching = false;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer execution lightly to prevent React render locks
          setTimeout(() => loadProfile(session.user.id), 0);
        } else {
          hasFetchedForUser = null;
          setProfile(null);
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    // Gunakan Promise.race untuk mendeteksi hanging request akibat infinite loop Rate Limit
    let timeoutId: ReturnType<typeof setTimeout>;
    const sessionTimeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('SESSION_TIMEOUT'));
      }, 5000); // 5 detik batas tunggu sebelum force logout
    });

    Promise.race([
      supabase.auth.getSession(),
      sessionTimeout
    ]).then((result: any) => {
      clearTimeout(timeoutId);
      const { data: { session }, error } = result;
      if (error) throw error;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    }).catch((err) => {
      clearTimeout(timeoutId);
      logger.error('Error getting session:', err);
      // Jika error rate limit / timeout karena hanging loop, paksa bersihkan agar keluar dari cycle 429
      const errorMsg = err.message || '';
      if (errorMsg.includes('Too Many Requests') || errorMsg.includes('FetchError') || errorMsg === 'SESSION_TIMEOUT' || err.status === 429) {
        logger.warn('Force clearing auth tokens due to unrecoverable auth state');
        // Bersihkan spesifik key supabase terlebih dahulu untuk kepastian
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
        localStorage.clear(); // Hapus sisa cache
        window.location.href = '/auth'; // Redirect paksa
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
