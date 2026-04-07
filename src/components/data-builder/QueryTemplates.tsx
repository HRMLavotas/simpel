import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookmarkPlus, Bookmark, Trash2, Star, Clock } from 'lucide-react';
import { FilterRule } from './FilterBuilder';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export interface QueryTemplate {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'user';
  columns: string[];
  filters: FilterRule[];
  relatedTables: string[];
  createdAt?: string;
  updatedAt?: string;
}

// System preset templates (read-only)
export const SYSTEM_TEMPLATES: QueryTemplate[] = [
  {
    id: 'asn-aktif',
    name: 'ASN Aktif (PNS + PPPK)',
    description: 'Semua pegawai ASN aktif (PNS dan PPPK) dengan data lengkap',
    type: 'system',
    columns: ['name', 'nip', 'asn_status', 'department', 'position_name', 'position_type', 'rank_group'],
    filters: [
      {
        id: 'asn-filter',
        kind: 'general',
        field: 'asn_status',
        operator: 'in',
        value: '',
        values: ['PNS', 'PPPK'],
      },
    ],
    relatedTables: ['education_history', 'position_history', 'rank_history'],
  },
  {
    id: 'struktural',
    name: 'Jabatan Struktural',
    description: 'Pegawai dengan jabatan struktural beserta riwayat jabatan',
    type: 'system',
    columns: ['name', 'nip', 'department', 'position_name', 'rank_group', 'grade'],
    filters: [
      {
        id: 'position-filter',
        kind: 'general',
        field: 'position_type',
        operator: 'eq',
        value: 'Struktural',
        values: [],
      },
    ],
    relatedTables: ['position_history', 'rank_history'],
  },
  {
    id: 'fungsional',
    name: 'Jabatan Fungsional',
    description: 'Pegawai dengan jabatan fungsional dan kompetensi',
    type: 'system',
    columns: ['name', 'nip', 'department', 'position_name', 'rank_group', 'education_level'],
    filters: [
      {
        id: 'position-filter',
        kind: 'general',
        field: 'position_type',
        operator: 'eq',
        value: 'Fungsional',
        values: [],
      },
    ],
    relatedTables: ['education_history', 'training_history', 'competency_test_history'],
  },
  {
    id: 'golongan-iv',
    name: 'Golongan IV',
    description: 'Pegawai dengan golongan IV (semua tingkat)',
    type: 'system',
    columns: ['name', 'nip', 'department', 'position_name', 'rank_group', 'tmt_rank'],
    filters: [
      {
        id: 'rank-filter',
        kind: 'general',
        field: 'rank_group',
        operator: 'in',
        value: '',
        values: ['IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'],
      },
    ],
    relatedTables: ['rank_history'],
  },
  {
    id: 'non-asn',
    name: 'Non-ASN',
    description: 'Semua pegawai Non-ASN dengan keterangan penugasan',
    type: 'system',
    columns: ['name', 'department', 'position_name', 'keterangan_penugasan', 'gender'],
    filters: [
      {
        id: 'asn-filter',
        kind: 'general',
        field: 'asn_status',
        operator: 'eq',
        value: 'Non ASN',
        values: [],
      },
    ],
    relatedTables: [],
  },
];

interface QueryTemplatesProps {
  onApplyTemplate: (template: QueryTemplate) => void;
  currentColumns: string[];
  currentFilters: FilterRule[];
  currentRelatedTables: string[];
}

export function QueryTemplates({
  onApplyTemplate,
  currentColumns,
  currentFilters,
  currentRelatedTables,
}: QueryTemplatesProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [userTemplates, setUserTemplates] = useState<QueryTemplate[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QueryTemplate | null>(null);
  
  // Form state for saving
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  // Load user templates
  const loadUserTemplates = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('data_builder_templates')
        .eq('id', profile.id)
        .single();

      if (error) {
        // Column might not exist yet, ignore error
        logger.error('Error loading templates:', error);
        return;
      }

      if (data?.data_builder_templates) {
        setUserTemplates(data.data_builder_templates as QueryTemplate[]);
      }
    } catch (error) {
      logger.error('Error loading templates:', error);
    }
  }, [profile?.id]);

  // Save current query as template
  const saveCurrentQuery = async () => {
    if (!profile?.id || !templateName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Nama template wajib diisi',
      });
      return;
    }

    const newTemplate: QueryTemplate = {
      id: `user-${Date.now()}`,
      name: templateName.trim(),
      description: templateDescription.trim(),
      type: 'user',
      columns: currentColumns,
      filters: currentFilters,
      relatedTables: currentRelatedTables,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTemplates = [...userTemplates, newTemplate];

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ data_builder_templates: updatedTemplates })
        .eq('id', profile.id);

      if (error) {
        // Check if column doesn't exist
        if (error.message.includes('column') || error.code === '42703') {
          toast({
            variant: 'destructive',
            title: 'Database belum siap',
            description: 'Kolom data_builder_templates belum ada. Silakan apply migration terlebih dahulu.',
          });
          return;
        }
        throw error;
      }

      setUserTemplates(updatedTemplates);
      setSaveDialogOpen(false);
      setTemplateName('');
      setTemplateDescription('');

      toast({
        title: 'Berhasil',
        description: 'Template berhasil disimpan',
      });
    } catch (error) {
      logger.error('Error saving template:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menyimpan template',
      });
    }
  };

  // Delete user template
  const deleteTemplate = async (templateId: string) => {
    if (!profile?.id) return;

    const updatedTemplates = userTemplates.filter(t => t.id !== templateId);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ data_builder_templates: updatedTemplates })
        .eq('id', profile.id);

      if (error) throw error;

      setUserTemplates(updatedTemplates);

      toast({
        title: 'Berhasil',
        description: 'Template berhasil dihapus',
      });
    } catch (error) {
      logger.error('Error deleting template:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menghapus template',
      });
    }
  };

  // Load templates on mount
  useEffect(() => {
    loadUserTemplates();
  }, [loadUserTemplates]);

  const allTemplates = [...SYSTEM_TEMPLATES, ...userTemplates];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Query Templates</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Gunakan template untuk setup cepat atau simpan konfigurasi Anda
          </p>
        </div>
        <Button onClick={() => setSaveDialogOpen(true)} size="sm" className="gap-2">
          <BookmarkPlus className="h-4 w-4" />
          Simpan Query
        </Button>
      </div>

      {/* Template Selector */}
      <Select
        value={selectedTemplate?.id || ''}
        onValueChange={value => {
          const template = allTemplates.find(t => t.id === value);
          if (template) {
            setSelectedTemplate(template);
            onApplyTemplate(template);
            toast({
              title: 'Template diterapkan',
              description: `"${template.name}" berhasil dimuat`,
            });
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Pilih template..." />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            System Templates
          </div>
          {SYSTEM_TEMPLATES.map(template => (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 text-amber-500" />
                {template.name}
              </div>
            </SelectItem>
          ))}
          
          {userTemplates.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                My Templates
              </div>
              {userTemplates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-3 w-3 text-blue-500" />
                    {template.name}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>

      {/* Selected Template Info */}
      {selectedTemplate && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm flex items-center gap-2">
                  {selectedTemplate.type === 'system' ? (
                    <Star className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Bookmark className="h-4 w-4 text-blue-500" />
                  )}
                  {selectedTemplate.name}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {selectedTemplate.description}
                </CardDescription>
              </div>
              {selectedTemplate.type === 'user' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteTemplate(selectedTemplate.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {selectedTemplate.columns.length} kolom
              </Badge>
              <Badge variant="outline" className="text-xs">
                {selectedTemplate.filters.filter(f => f.operator === 'in' ? (f.values?.length || 0) > 0 : f.value.trim().length > 0).length} filter aktif
              </Badge>
              <Badge variant="outline" className="text-xs">
                {selectedTemplate.relatedTables.length} tabel relasi
              </Badge>
            </div>
            {selectedTemplate.type === 'user' && selectedTemplate.updatedAt && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Terakhir diupdate: {new Date(selectedTemplate.updatedAt).toLocaleDateString('id-ID')}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simpan Query sebagai Template</DialogTitle>
            <DialogDescription>
              Simpan konfigurasi kolom, filter, dan tabel relasi saat ini untuk digunakan kembali
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nama Template *</Label>
              <Input
                id="template-name"
                placeholder="Contoh: Laporan Bulanan ASN"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Deskripsi</Label>
              <Textarea
                id="template-description"
                placeholder="Deskripsi singkat tentang template ini..."
                value={templateDescription}
                onChange={e => setTemplateDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
              <div className="text-sm font-medium">Yang akan disimpan:</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{currentColumns.length} kolom</Badge>
                <Badge variant="secondary">
                  {currentFilters.filter(f => f.operator === 'in' ? (f.values?.length || 0) > 0 : f.value.trim().length > 0).length} filter aktif
                </Badge>
                <Badge variant="secondary">{currentRelatedTables.length} tabel relasi</Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveCurrentQuery} disabled={!templateName.trim()}>
              <BookmarkPlus className="mr-2 h-4 w-4" />
              Simpan Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
