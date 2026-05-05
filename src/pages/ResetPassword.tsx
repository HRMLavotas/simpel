import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Lock, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const resetSchema = z.object({
  newPassword: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Password minimal 6 karakter'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    // Check if we have a valid recovery session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) {
          setIsValidSession(true);
        } else {
          toast({
            variant: 'destructive',
            title: 'Link Tidak Valid',
            description: 'Link reset password sudah kadaluarsa atau tidak valid.',
          });
          navigate('/auth');
        }
      })
      .catch((err) => {
        logger.error('Error checking session:', err);
        toast({
          variant: 'destructive',
          title: 'Terjadi Kesalahan',
          description: 'Gagal memverifikasi sesi. Silakan coba lagi.',
        });
        navigate('/auth');
      });
  }, [navigate, toast]);

  const handleReset = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.newPassword });
      if (error) throw error;
      setIsSuccess(true);
      setTimeout(() => navigate('/auth'), 3000);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error.message || 'Gagal mengubah password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">SIMPEL</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Buat Password Baru</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Masukkan password baru untuk akun Anda
          </p>
        </div>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Password Berhasil Diubah</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Anda akan diarahkan ke halaman login dalam beberapa detik...
              </p>
            </div>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Ke Halaman Login
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-8 shadow-sm">
            <form onSubmit={form.handleSubmit(handleReset)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    className="pl-10 pr-10"
                    {...form.register('newPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Ulangi password baru"
                    className="pl-10 pr-10"
                    {...form.register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !isValidSession}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Simpan Password Baru <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
