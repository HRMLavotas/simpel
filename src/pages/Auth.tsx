import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DEPARTMENTS, type AppRole } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter')
});
const signupSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  fullName: z.string().min(3, 'Nama minimal 3 karakter'),
  department: z.string().min(1, 'Pilih unit kerja'),
  role: z.enum(['admin_unit', 'admin_pusat', 'admin_pimpinan'])
});
type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    signIn,
    signUp
  } = useAuth();
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      department: '',
      role: 'admin_unit'
    }
  });
  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const {
      error
    } = await signIn(data.email, data.password);
    setIsLoading(false);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message
      });
      return;
    }
    toast({
      title: 'Login Berhasil',
      description: 'Selamat datang kembali!'
    });
    navigate('/dashboard');
  };
  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    const {
      error
    } = await signUp(data.email, data.password, data.fullName, data.department, data.role as AppRole);
    setIsLoading(false);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Registrasi Gagal',
        description: error.message.includes('already registered') ? 'Email sudah terdaftar' : error.message
      });
      return;
    }
    toast({
      title: 'Registrasi Berhasil',
      description: 'Akun berhasil dibuat. Silakan login.'
    });
    navigate('/dashboard');
  };
  return <div className="min-h-screen flex">
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
            Ditjen Binalavotas Kementerian Perindustrian.
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
              {isLogin ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin ? 'Masukkan email dan password untuk melanjutkan' : 'Lengkapi data berikut untuk membuat akun admin'}
            </p>
          </div>

          {isLogin ? <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="admin@kemenperin.go.id" className="pl-10 input-focus" {...loginForm.register('email')} />
                </div>
                {loginForm.formState.errors.email && <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
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
                {loginForm.formState.errors.password && <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
                    Masuk <ArrowRight className="ml-2 h-4 w-4" />
                  </>}
              </Button>
            </form> : <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="fullName" placeholder="Nama lengkap" className="pl-10 input-focus" {...signupForm.register('fullName')} />
                </div>
                {signupForm.formState.errors.fullName && <p className="text-xs text-destructive">{signupForm.formState.errors.fullName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="signup-email" type="email" placeholder="admin@kemenperin.go.id" className="pl-10 input-focus" {...signupForm.register('email')} />
                </div>
                {signupForm.formState.errors.email && <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="signup-password" 
                    type={showSignupPassword ? "text" : "password"} 
                    placeholder="Minimal 6 karakter" 
                    className="pl-10 pr-10 input-focus" 
                    {...signupForm.register('password')} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {signupForm.formState.errors.password && <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Unit Kerja</Label>
                <Select onValueChange={value => signupForm.setValue('department', value)} defaultValue="">
                  <SelectTrigger className="input-focus">
                    <SelectValue placeholder="Pilih unit kerja" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                  </SelectContent>
                </Select>
                {signupForm.formState.errors.department && <p className="text-xs text-destructive">{signupForm.formState.errors.department.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select onValueChange={value => signupForm.setValue('role', value as AppRole)} defaultValue="admin_unit">
                  <SelectTrigger className="input-focus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_unit">Admin Unit</SelectItem>
                    <SelectItem value="admin_pusat">Admin Pusat</SelectItem>
                    <SelectItem value="admin_pimpinan">Admin Pimpinan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
                    Daftar <ArrowRight className="ml-2 h-4 w-4" />
                  </>}
              </Button>
            </form>}

          <div className="text-center">
            
          </div>
        </div>
      </div>
    </div>;
}