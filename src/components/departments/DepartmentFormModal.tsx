import { useState, useEffect } from 'react';
import { Loader2, Plus, X, Building, Wrench, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

interface Department {
  id: string;
  name: string;
  sarpras?: string;
  created_at: string;
}

interface DepartmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  onSuccess: () => void;
}

interface SarprasData {
  bangunan: string[];
  alat: string[];
  fasilitas: string[];
}

const departmentSchema = z.object({
  name: z.string().trim().min(1, 'Nama unit kerja harus diisi').max(255, 'Nama terlalu panjang'),
});

export function DepartmentFormModal({ open, onOpenChange, department, onSuccess }: DepartmentFormModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [name, setName] = useState('');
  
  // Structured Sarpras State
  const [sarprasData, setSarprasData] = useState<SarprasData>({ bangunan: [], alat: [], fasilitas: [] });
  const [sarprasInput, setSarprasInput] = useState({ bangunan: '', alat: '', fasilitas: '' });

  useEffect(() => {
    if (department) {
      setName(department.name);
      
      // Parse Sarpras if it exists
      if (department.sarpras) {
        try {
          const parsed = JSON.parse(department.sarpras);
          setSarprasData({
            bangunan: Array.isArray(parsed.bangunan) ? parsed.bangunan : [],
            alat: Array.isArray(parsed.alat) ? parsed.alat : [],
            fasilitas: Array.isArray(parsed.fasilitas) ? parsed.fasilitas : []
          });
        } catch {
          // If it's old legacy plain text, put it in fasilitas or bangunan as fallback
          setSarprasData({
            bangunan: [],
            alat: [],
            fasilitas: [department.sarpras]
          });
        }
      } else {
        setSarprasData({ bangunan: [], alat: [], fasilitas: [] });
      }
    } else {
      setName('');
      setSarprasData({ bangunan: [], alat: [], fasilitas: [] });
    }
    
    setSarprasInput({ bangunan: '', alat: '', fasilitas: '' });
    setErrors({});
  }, [department, open]);

  const handleClose = () => {
    setName('');
    setSarprasData({ bangunan: [], alat: [], fasilitas: [] });
    setErrors({});
    onOpenChange(false);
  };

  const handleAddItem = (category: keyof SarprasData) => {
    const val = sarprasInput[category].trim();
    if (!val) return;
    setSarprasData(prev => ({ ...prev, [category]: [...prev[category], val] }));
    setSarprasInput(prev => ({ ...prev, [category]: '' }));
  };

  const handleRemoveItem = (category: keyof SarprasData, index: number) => {
    setSarprasData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, category: keyof SarprasData) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem(category);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = departmentSchema.safeParse({ name });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    // Convert SarprasData to string, or null if totally empty
    const isEmpty = 
      sarprasData.bangunan.length === 0 && 
      sarprasData.alat.length === 0 && 
      sarprasData.fasilitas.length === 0;
      
    const payload = { 
      name: name.trim(),
      sarpras: isEmpty ? null : JSON.stringify(sarprasData)
    };

    try {
      if (department) {
        // Update existing department
        const { error } = await supabase
          .from('departments')
          .update(payload)
          .eq('id', department.id);

        if (error) {
          if (error.code === '23505') {
            throw new Error('Nama unit kerja sudah digunakan');
          }
          throw error;
        }

        toast({
          title: 'Berhasil',
          description: 'Unit kerja dan profil sarpras berhasil diperbarui',
        });
      } else {
        // Create new department
        const { error } = await supabase
          .from('departments')
          .insert(payload);

        if (error) {
          if (error.code === '23505') {
            throw new Error('Nama unit kerja sudah digunakan');
          }
          throw error;
        }

        toast({
          title: 'Berhasil',
          description: 'Unit kerja berhasil ditambahkan',
        });
      }

      handleClose();
      onSuccess();
    } catch (err: any) {
      const errorMessage = err?.message || err?.details || String(err);
      logger.error('Error saving department:', err);
      toast({
        variant: 'destructive',
        title: 'Gagal menyimpan',
        description: errorMessage || 'Terjadi kesalahan saat menyimpan unit kerja',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryTab = (
    title: string, 
    category: keyof SarprasData, 
    placeholder: string, 
    icon: React.ReactNode
  ) => (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col space-y-1.5">
        <Label className="flex items-center text-sm font-semibold text-primary">
          {icon} <span className="ml-1.5">{title}</span>
        </Label>
        <p className="text-xs text-muted-foreground">Ketik item lalu tekan Enter atau klik tombol (+)</p>
      </div>
      
      <div className="flex space-x-2">
        <Input
          placeholder={placeholder}
          value={sarprasInput[category]}
          onChange={(e) => setSarprasInput(prev => ({ ...prev, [category]: e.target.value }))}
          onKeyDown={(e) => handleKeyDown(e, category)}
          disabled={isSubmitting}
        />
        <Button 
          type="button" 
          size="icon" 
          onClick={() => handleAddItem(category)}
          disabled={!sarprasInput[category].trim() || isSubmitting}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 rounded-md border min-h-[100px] p-2 space-y-2 max-h-[180px] overflow-y-auto">
        {sarprasData[category].length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 italic">
            Belum ada item ditambahkan.
          </p>
        ) : (
          sarprasData[category].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-950 border px-3 py-2 rounded-md text-sm group">
              <span className="truncate pr-4">{item}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveItem(category, idx)}
                disabled={isSubmitting}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-[550px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{department ? 'Edit Unit & Sarpras' : 'Tambah Unit Baru'}</DialogTitle>
          <DialogDescription>
            Kelola profil unit kerja dan spesifikasi sarana prasarana penunjang.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="space-y-6">
              
              {/* Unit Name */}
              <div className="space-y-2 bg-primary/5 p-4 rounded-lg border border-primary/10">
                <Label htmlFor="name" className="text-sm font-semibold">Nama Unit Kerja</Label>
                <Input
                  id="name"
                  placeholder="Contoh: BBPVP Jakarta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-background"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Structured Sarpras section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <Label className="text-base font-semibold">Inventaris Sarpras Unit</Label>
                </div>
                
                <Tabs defaultValue="bangunan" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bangunan">Bangunan</TabsTrigger>
                    <TabsTrigger value="alat">Peralatan</TabsTrigger>
                    <TabsTrigger value="fasilitas">Lainnya</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="bangunan">
                    {renderCategoryTab(
                      'Bangunan & Gedung',
                      'bangunan',
                      'Contoh: Bengkel Otomotif Lt. 2',
                      <Building className="w-4 h-4" />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="alat">
                    {renderCategoryTab(
                      'Alat Pelatihan Utama',
                      'alat',
                      'Contoh: Mesin CNC Bubut 5 Axis',
                      <Wrench className="w-4 h-4" />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="fasilitas">
                    {renderCategoryTab(
                      'Fasilitas Penunjang',
                      'fasilitas',
                      'Contoh: Ruang Asrama Kapasitas 50',
                      <Warehouse className="w-4 h-4" />
                    )}
                  </TabsContent>
                </Tabs>
              </div>

            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t bg-muted/20">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Profil Unit'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
