import { useState } from 'react';
import { Plus, Megaphone, Edit, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  useAllAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  type AnnouncementType,
} from '@/hooks/useAnnouncements';
import { useForm } from 'react-hook-form';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface AnnouncementFormData {
  title: string;
  message: string;
  type: AnnouncementType;
  priority: number;
  expires_at: string;
}

const typeLabels: Record<AnnouncementType, string> = {
  info: 'Informasi',
  success: 'Sukses',
  warning: 'Peringatan',
  error: 'Penting',
};

const typeBadgeVariants: Record<AnnouncementType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  info: 'default',
  success: 'secondary',
  warning: 'outline',
  error: 'destructive',
};

export default function Announcements() {
  const { isAdminPusat } = useAuth();
  const { data: announcements, isLoading } = useAllAnnouncements();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);

  const form = useForm<AnnouncementFormData>({
    defaultValues: {
      title: '',
      message: '',
      type: 'info',
      priority: 0,
      expires_at: '',
    },
  });

  // Redirect if not admin pusat
  if (!isAdminPusat) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Akses Ditolak</CardTitle>
              <CardDescription>
                Halaman ini hanya dapat diakses oleh Admin Pusat
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const handleCreate = () => {
    form.reset({
      title: '',
      message: '',
      type: 'info',
      priority: 0,
      expires_at: '',
    });
    setEditingAnnouncement(null);
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (announcement: any) => {
    form.reset({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      priority: announcement.priority,
      expires_at: announcement.expires_at ? format(new Date(announcement.expires_at), 'yyyy-MM-dd') : '',
    });
    setEditingAnnouncement(announcement);
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = async (data: AnnouncementFormData) => {
    const payload = {
      title: data.title,
      message: data.message,
      type: data.type,
      priority: data.priority,
      expires_at: data.expires_at || null,
    };

    if (editingAnnouncement) {
      await updateMutation.mutateAsync({ id: editingAnnouncement.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setIsCreateDialogOpen(false);
    form.reset();
  };

  const handleToggleActive = async (announcement: any) => {
    await updateMutation.mutateAsync({
      id: announcement.id,
      is_active: !announcement.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title flex items-center gap-2">
                <Megaphone className="h-7 w-7 text-primary" />
                Kelola Pengumuman
              </h1>
              <p className="page-description">
                Buat dan kelola pengumuman yang akan muncul di dashboard semua admin unit
              </p>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Buat Pengumuman
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : announcements && announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className={!announcement.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <Badge variant={typeBadgeVariants[announcement.type as AnnouncementType]}>
                          {typeLabels[announcement.type as AnnouncementType]}
                        </Badge>
                        {!announcement.is_active && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Nonaktif
                          </Badge>
                        )}
                        {announcement.priority > 0 && (
                          <Badge variant="secondary">
                            Prioritas: {announcement.priority}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex flex-col gap-1">
                        <span>
                          Dibuat oleh: {announcement.profiles?.full_name || 'Admin Pusat'}
                        </span>
                        <span>
                          {format(new Date(announcement.created_at), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
                        </span>
                        {announcement.expires_at && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Calendar className="h-3 w-3" />
                            Kadaluarsa: {format(new Date(announcement.expires_at), 'dd MMMM yyyy', { locale: idLocale })}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(announcement)}
                        title={announcement.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {announcement.is_active ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(announcement.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{announcement.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Belum ada pengumuman. Klik tombol "Buat Pengumuman" untuk membuat pengumuman pertama.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
            </DialogTitle>
            <DialogDescription>
              Pengumuman akan muncul di dashboard semua admin unit sampai mereka menutupnya
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                rules={{ required: 'Judul wajib diisi' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Pengumuman</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Pembaruan Sistem" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                rules={{ required: 'Pesan wajib diisi' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pesan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tulis pesan pengumuman di sini..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Anda bisa menggunakan enter untuk membuat baris baru
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="info">Informasi</SelectItem>
                          <SelectItem value="success">Sukses</SelectItem>
                          <SelectItem value="warning">Peringatan</SelectItem>
                          <SelectItem value="error">Penting</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioritas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Angka lebih tinggi = prioritas lebih tinggi
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Kadaluarsa (Opsional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Kosongkan jika pengumuman tidak memiliki batas waktu
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingAnnouncement ? 'Perbarui' : 'Buat'} Pengumuman
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
