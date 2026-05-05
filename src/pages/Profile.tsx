import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, Lock, User } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ROLE_LABELS } from '@/lib/constants';

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Password minimal 6 karakter'),
  newPassword: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Password minimal 6 karakter'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nama minimal 3 karakter'),
});
type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { profile, role, isAdminPusat, isAdminPimpinan, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name || '' },
  });

  // Reset form when profile loads
  useEffect(() => {
    if (profile?.full_name) {
      profileForm.reset({ full_name: profile.full_name });
    }
  }, [profile?.full_name]);

  const handleChangePassword = async (data: PasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Password berhasil diubah',
      });

      form.reset();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Gagal mengubah password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name })
        .eq('id', profile!.id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Nama berhasil diperbarui' });
      await refreshProfile();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 w-full max-w-2xl">
        <div className="page-header">
          <h1 className="page-title">Profil Saya</h1>
          <p className="page-description">Lihat dan kelola informasi akun Anda</p>
        </div>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Akun</CardTitle>
            <CardDescription>Data profil admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{profile?.full_name}</h3>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Unit Kerja</Label>
                <p className="mt-1 font-medium">{profile?.department}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Role</Label>
                <div className="mt-1">
                  <Badge variant={isAdminPusat ? 'default' : isAdminPimpinan ? 'default' : 'secondary'}>
                    {role ? ROLE_LABELS[role] : 'Admin Unit'}
                  </Badge>
                </div>
              </div>
              {user?.last_sign_in_at && (
                <div>
                  <Label className="text-xs text-muted-foreground">Login Terakhir</Label>
                  <p className="mt-1 font-medium text-sm">
                    {format(new Date(user.last_sign_in_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Edit Profil
            </CardTitle>
            <CardDescription>Perbarui informasi profil Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <Input
                  id="full_name"
                  placeholder="Nama lengkap"
                  {...profileForm.register('full_name')}
                />
                {profileForm.formState.errors.full_name && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.full_name.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />Simpan Perubahan</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Ubah Password
            </CardTitle>
            <CardDescription>Perbarui password akun Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleChangePassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  {...form.register('currentPassword')}
                />
                {form.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  {...form.register('newPassword')}
                />
                {form.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...form.register('confirmPassword')}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
