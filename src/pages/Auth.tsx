import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});
type LoginFormData = z.infer<typeof loginSchema>;

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message,
      });
      return;
    }
    toast({ title: 'Login Berhasil', description: 'Selamat datang kembali!' });
    navigate('/dashboard');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast({ variant: 'destructive', title: 'Gagal', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">SIMPEL</h1>
              <p className="text-sm text-sidebar-foreground/60">Sistem Manajemen Pegawai Lavotas</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-sidebar-foreground leading-tight">
            Kelola Data Nominatif<br />
            Pegawai dengan Mudah
          </h2>
          <p className="text-lg text-sidebar-foreground/70 max-w-md">
            Sistem terintegrasi untuk pengelolaan data pegawai di seluruh unit kerja
            Ditjen Binalavotas Kementerian Ketenagakerjaan.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-primary">28+</p>
              <p className="text-sm text-sidebar-foreground/60">Unit Kerja</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">2500+</p>
              <p className="text-sm text-sidebar-foreground/60">Pegawai</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">100%</p>
              <p className="text-sm text-sidebar-foreground/60">Terintegrasi</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/40">
          © 2024 Ditjen Binalavotas - Kementerian Ketenagakerjaan RI
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background min-h-screen lg:min-h-0">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">SIMPEL</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === 'login' ? 'Masuk ke Akun Anda' : 'Reset Password'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === 'login'
                ? 'Masukkan email dan password untuk melanjutkan'
                : 'Masukkan email Anda untuk menerima link reset password'}
            </p>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@kemenperin.go.id"
                    className="pl-10 input-focus"
                    {...loginForm.register('email')}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 input-focus"
                    {...loginForm.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Masuk <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-primary hover:underline"
                >
                  Lupa password?
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <div className="space-y-5">
              {forgotSent ? (
                <div className="rounded-xl border bg-card p-6 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Email Terkirim</h3>
                  <p className="text-sm text-muted-foreground">
                    Link reset password telah dikirim ke <strong>{forgotEmail}</strong>.
                    Periksa inbox atau folder spam Anda.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setMode('login'); setForgotSent(false); }}
                  >
                    Kembali ke Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="admin@kemenperin.go.id"
                        className="pl-10"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Kirim Link Reset <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      ← Kembali ke Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
