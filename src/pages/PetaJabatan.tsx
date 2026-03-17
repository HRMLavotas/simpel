import { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Pencil, Trash2, Save, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS, POSITION_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface PositionReference {
  id: string;
  department: string;
  position_category: string;
  position_order: number;
  position_name: string;
  grade: number | null;
  abk_count: number;
}

interface EmployeeMatch {
  id: string;
  name: string;
  front_title: string | null;
  back_title: string | null;
  nip: string | null;
  asn_status: string | null;
  rank_group: string | null;
  gender: string | null;
  position_name: string | null;
}

const POSITION_CATEGORIES = ['Struktural', 'Fungsional', 'Pelaksana'] as const;

export default function PetaJabatan() {
  const { profile, isAdminPusat } = useAuth();
  const { toast } = useToast();

  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    isAdminPusat ? DEPARTMENTS[0] : (profile?.department || '')
  );
  const [positions, setPositions] = useState<PositionReference[]>([]);
  const [employees, setEmployees] = useState<EmployeeMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionReference | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState<string>('Struktural');
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formAbk, setFormAbk] = useState('0');
  const [formOrder, setFormOrder] = useState('0');

  useEffect(() => {
    if (!isAdminPusat && profile?.department) {
      setSelectedDepartment(profile.department);
    }
  }, [profile, isAdminPusat]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchData();
    }
  }, [selectedDepartment]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [posRes, empRes] = await Promise.all([
        supabase
          .from('position_references')
          .select('*')
          .eq('department', selectedDepartment)
          .order('position_category')
          .order('position_order'),
        supabase
          .from('employees')
          .select('id, name, front_title, back_title, nip, asn_status, rank_group, gender, position_name')
          .eq('department', selectedDepartment),
      ]);

      if (posRes.error) throw posRes.error;
      if (empRes.error) throw empRes.error;

      setPositions(posRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Group positions by category
  const groupedPositions = useMemo(() => {
    const groups: Record<string, PositionReference[]> = {
      Struktural: [],
      Fungsional: [],
      Pelaksana: [],
    };
    positions.forEach(p => {
      if (groups[p.position_category]) {
        groups[p.position_category].push(p);
      }
    });
    return groups;
  }, [positions]);

  // Match employees to positions
  const getMatchingEmployees = (positionName: string) => {
    return employees.filter(e => e.position_name === positionName);
  };

  const openAddModal = () => {
    setEditingPosition(null);
    setFormCategory('Struktural');
    setFormName('');
    setFormGrade('');
    setFormAbk('0');
    setFormOrder('0');
    setShowModal(true);
  };

  const openEditModal = (pos: PositionReference) => {
    setEditingPosition(pos);
    setFormCategory(pos.position_category);
    setFormName(pos.position_name);
    setFormGrade(pos.grade?.toString() || '');
    setFormAbk(pos.abk_count.toString());
    setFormOrder(pos.position_order.toString());
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Nama jabatan wajib diisi' });
      return;
    }

    const data = {
      department: selectedDepartment,
      position_category: formCategory,
      position_name: formName.trim(),
      grade: formGrade ? parseInt(formGrade) : null,
      abk_count: parseInt(formAbk) || 0,
      position_order: parseInt(formOrder) || 0,
    };

    try {
      if (editingPosition) {
        const { error } = await supabase
          .from('position_references')
          .update(data)
          .eq('id', editingPosition.id);
        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Jabatan berhasil diperbarui' });
      } else {
        const { error } = await supabase
          .from('position_references')
          .insert(data);
        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Jabatan berhasil ditambahkan' });
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('position_references').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Jabatan berhasil dihapus' });
      fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleExport = () => {
    const rows: Record<string, string | number>[] = [];
    let no = 1;

    POSITION_CATEGORIES.forEach(category => {
      // Category header row
      rows.push({ 'No': '', 'Jabatan Sesuai Kepmen 202 Tahun 2024': category.toUpperCase(), 'Grade/Kelas Jabatan': '', 'Jumlah ABK': '', 'Jumlah Existing': '', 'Nama Pemangku': '', 'Kriteria ASN': '', 'NIP': '', 'Pangkat Golongan': '', 'Jenis Kelamin': '', 'Keterangan Formasi': '' });

      const catPositions = groupedPositions[category] || [];
      catPositions.forEach(pos => {
        const matched = getMatchingEmployees(pos.position_name);
        const existing = matched.length;
        const ketFormasi = pos.abk_count - existing;

        if (matched.length === 0) {
          rows.push({
            'No': no++,
            'Jabatan Sesuai Kepmen 202 Tahun 2024': pos.position_name,
            'Grade/Kelas Jabatan': pos.grade || '',
            'Jumlah ABK': pos.abk_count,
            'Jumlah Existing': 0,
            'Nama Pemangku': '-',
            'Kriteria ASN': '-',
            'NIP': '-',
            'Pangkat Golongan': '-',
            'Jenis Kelamin': '-',
            'Keterangan Formasi': ketFormasi > 0 ? `Kurang ${ketFormasi}` : 'Sesuai',
          });
        } else {
          matched.forEach((emp, idx) => {
            const fullName = [emp.front_title, emp.name, emp.back_title].filter(Boolean).join(' ');
            rows.push({
              'No': idx === 0 ? no++ : '',
              'Jabatan Sesuai Kepmen 202 Tahun 2024': idx === 0 ? pos.position_name : '',
              'Grade/Kelas Jabatan': idx === 0 ? (pos.grade || '') : '',
              'Jumlah ABK': idx === 0 ? pos.abk_count : '',
              'Jumlah Existing': idx === 0 ? existing : '',
              'Nama Pemangku': fullName,
              'Kriteria ASN': emp.asn_status || '-',
              'NIP': emp.nip || '-',
              'Pangkat Golongan': emp.rank_group || '-',
              'Jenis Kelamin': emp.gender || '-',
              'Keterangan Formasi': idx === 0 ? (ketFormasi > 0 ? `Kurang ${ketFormasi}` : (ketFormasi < 0 ? `Lebih ${Math.abs(ketFormasi)}` : 'Sesuai')) : '',
            });
          });
        }
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 }, { wch: 40 }, { wch: 15 }, { wch: 12 }, { wch: 14 },
      { wch: 30 }, { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 14 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Peta Jabatan');
    XLSX.writeFile(wb, `Peta_Jabatan_${selectedDepartment.replace(/\s/g, '_')}.xlsx`);
  };

  // Build table rows for display
  const tableRows = useMemo(() => {
    const result: {
      type: 'category' | 'position';
      category?: string;
      position?: PositionReference;
      employee?: EmployeeMatch;
      isFirst?: boolean;
      existing?: number;
      rowSpan?: number;
    }[] = [];

    POSITION_CATEGORIES.forEach(category => {
      result.push({ type: 'category', category });
      const catPositions = groupedPositions[category] || [];
      catPositions.forEach(pos => {
        const matched = getMatchingEmployees(pos.position_name);
        if (matched.length === 0) {
          result.push({ type: 'position', position: pos, isFirst: true, existing: 0, rowSpan: 1 });
        } else {
          matched.forEach((emp, idx) => {
            result.push({
              type: 'position',
              position: pos,
              employee: emp,
              isFirst: idx === 0,
              existing: matched.length,
              rowSpan: matched.length,
            });
          });
        }
      });
    });

    return result;
  }, [groupedPositions, employees]);

  let positionNo = 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Peta Jabatan</h1>
            <p className="page-description">Jabatan Sesuai Kepmen 202 Tahun 2024</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdminPusat && (
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Pilih Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.filter(d => d !== 'Pusat').map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" onClick={handleExport} disabled={positions.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Jabatan
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDepartment}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({positions.length} jabatan)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Jabatan Sesuai Kepmen 202/2024</TableHead>
                      <TableHead className="w-20 text-center">Grade</TableHead>
                      <TableHead className="w-16 text-center">ABK</TableHead>
                      <TableHead className="w-20 text-center">Existing</TableHead>
                      <TableHead>Nama Pemangku</TableHead>
                      <TableHead>Kriteria ASN</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Pangkat</TableHead>
                      <TableHead className="w-16">JK</TableHead>
                      <TableHead>Ket. Formasi</TableHead>
                      <TableHead className="w-20">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((row, idx) => {
                      if (row.type === 'category') {
                        return (
                          <TableRow key={`cat-${row.category}`} className="bg-muted/60">
                            <TableCell colSpan={12} className="font-semibold text-sm py-2">
                              {row.category}
                            </TableCell>
                          </TableRow>
                        );
                      }

                      const pos = row.position!;
                      const emp = row.employee;
                      const existing = row.existing || 0;
                      const ketFormasi = pos.abk_count - existing;

                      if (row.isFirst) positionNo++;

                      const fullName = emp
                        ? [emp.front_title, emp.name, emp.back_title].filter(Boolean).join(' ')
                        : '-';

                      return (
                        <TableRow key={`pos-${idx}`} className={cn(!emp && 'text-muted-foreground')}>
                          {row.isFirst && (
                            <>
                              <TableCell rowSpan={row.rowSpan} className="text-center align-top border-r">
                                {positionNo}
                              </TableCell>
                              <TableCell rowSpan={row.rowSpan} className="font-medium align-top border-r">
                                {pos.position_name}
                              </TableCell>
                              <TableCell rowSpan={row.rowSpan} className="text-center align-top border-r">
                                {pos.grade || '-'}
                              </TableCell>
                              <TableCell rowSpan={row.rowSpan} className="text-center align-top border-r">
                                {pos.abk_count}
                              </TableCell>
                              <TableCell rowSpan={row.rowSpan} className="text-center align-top border-r">
                                {existing}
                              </TableCell>
                            </>
                          )}
                          <TableCell>{fullName}</TableCell>
                          <TableCell>{emp?.asn_status || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{emp?.nip || '-'}</TableCell>
                          <TableCell className="text-xs">{emp?.rank_group || '-'}</TableCell>
                          <TableCell>{emp?.gender ? (emp.gender === 'Laki-laki' ? 'L' : 'P') : '-'}</TableCell>
                          {row.isFirst && (
                            <>
                              <TableCell rowSpan={row.rowSpan} className="align-top border-l text-xs">
                                {ketFormasi > 0
                                  ? <span className="text-orange-500">Kurang {ketFormasi}</span>
                                  : ketFormasi < 0
                                  ? <span className="text-blue-500">Lebih {Math.abs(ketFormasi)}</span>
                                  : <span className="text-green-500">Sesuai</span>}
                              </TableCell>
                              <TableCell rowSpan={row.rowSpan} className="align-top border-l">
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(pos)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(pos.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })}
                    {positions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                          Belum ada data jabatan. Klik "Tambah Jabatan" untuk menambahkan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPosition ? 'Edit Jabatan' : 'Tambah Jabatan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kategori Jabatan</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POSITION_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nama Jabatan (Kepmen 202/2024)</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: Direktur Jenderal" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Grade/Kelas</Label>
                <Input type="number" value={formGrade} onChange={e => setFormGrade(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Jumlah ABK</Label>
                <Input type="number" value={formAbk} onChange={e => setFormAbk(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input type="number" value={formOrder} onChange={e => setFormOrder(e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
