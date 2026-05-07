import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, TrendingUp, MapPin, Briefcase, UserX } from 'lucide-react';
import { RANK_GROUPS_PNS, RANK_GROUPS_PPPK } from '@/lib/constants';
import { PositionAutocomplete } from '@/components/ui/position-autocomplete';
import { usePositionOptions } from '@/hooks/usePositionOptions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { HistoryEntry } from './EmployeeHistoryForm';

interface QuickActionFormProps {
  // Current values
  currentRank: string;
  currentPosition: string;
  currentDepartment: string;
  asnStatus: string;
  
  // Departments list - untuk mutasi selalu semua unit
  departments: string[];
  // Semua unit kerja (untuk dropdown tujuan mutasi)
  allDepartments: string[];

  // Position options from Peta Jabatan (unit saat ini)
  positionOptions?: string[];
  
  // Callbacks to update main form
  onRankChange: (newRank: string, entry: HistoryEntry) => void;
  onPositionChange: (newPosition: string, entry: HistoryEntry) => void;
  onDepartmentChange: (newDepartment: string, newPosition: string, entry: HistoryEntry) => void;
  onInactiveChange: (isActive: boolean, inactiveDate: string, inactiveReason: string, entry: HistoryEntry) => void;
}

export function QuickActionForm({
  currentRank,
  currentPosition,
  currentDepartment,
  asnStatus,
  departments,
  allDepartments,
  positionOptions = [],
  onRankChange,
  onPositionChange,
  onDepartmentChange,
  onInactiveChange,
}: QuickActionFormProps) {
  const [activeQuickTab, setActiveQuickTab] = useState<'rank' | 'mutation' | 'position' | 'inactive'>('rank');
  const { toast } = useToast();

  // Rank promotion state
  const [newRank, setNewRank] = useState('');
  const [rankDate, setRankDate] = useState(new Date().toISOString().split('T')[0]);
  const [rankSK, setRankSK] = useState('');
  const [rankTMT, setRankTMT] = useState(new Date().toISOString().split('T')[0]);
  const [rankNotes, setRankNotes] = useState('');
  const [rankSuccess, setRankSuccess] = useState(false);
  
  // Mutation state
  const [newDepartment, setNewDepartment] = useState('');
  const [mutationPosition, setMutationPosition] = useState(''); // jabatan baru di unit tujuan
  const [mutationDate, setMutationDate] = useState(new Date().toISOString().split('T')[0]);
  const [mutationSK, setMutationSK] = useState('');
  const [mutationNotes, setMutationNotes] = useState('');
  const [mutationSuccess, setMutationSuccess] = useState(false);

  // Mutation confirmation state
  const [showMutationConfirm, setShowMutationConfirm] = useState(false);
  const [pendingMutation, setPendingMutation] = useState<{
    department: string;
    position: string;
    entry: HistoryEntry;
  } | null>(null);

  // Fetch jabatan dari unit tujuan mutasi
  const { positions: targetPositionOptions } = usePositionOptions(newDepartment || undefined);
  const targetPositionNames = targetPositionOptions.map((p) => p.position_name);
  
  // Position change state
  const [newPosition, setNewPosition] = useState('');
  const [positionDate, setPositionDate] = useState(new Date().toISOString().split('T')[0]);
  const [positionSK, setPositionSK] = useState('');
  const [positionNotes, setPositionNotes] = useState('');
  const [positionSuccess, setPositionSuccess] = useState(false);

  // Inactive status state
  const [inactiveDate, setInactiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [inactiveReason, setInactiveReason] = useState('');
  const [inactiveSK, setInactiveSK] = useState('');
  const [inactiveNotes, setInactiveNotes] = useState('');
  const [inactiveSuccess, setInactiveSuccess] = useState(false);
  const [showInactiveConfirm, setShowInactiveConfirm] = useState(false);

  const getRankOptions = () => {
    if (asnStatus === 'PPPK') return RANK_GROUPS_PPPK as unknown as string[];
    if (asnStatus === 'PNS') return RANK_GROUPS_PNS as unknown as string[];
    return ['Tidak Ada'];
  };

  const handleRankPromotion = () => {
    if (!newRank) {
      toast({ variant: 'destructive', title: 'Pilih pangkat baru terlebih dahulu' });
      return;
    }
    
    // Validate: new rank must be different from current
    if (newRank === currentRank) {
      toast({ variant: 'destructive', title: 'Pangkat baru harus berbeda dari pangkat saat ini' });
      return;
    }
    
    const entry: HistoryEntry = {
      tanggal: rankDate,
      pangkat_lama: currentRank,
      pangkat_baru: newRank,
      tmt: rankTMT,
      nomor_sk: rankSK,
      keterangan: rankNotes || 'Kenaikan pangkat - Quick Action',
    };
    
    onRankChange(newRank, entry);
    
    // Show success message
    setRankSuccess(true);
    setTimeout(() => setRankSuccess(false), 3000);
    
    // Reset form
    setNewRank('');
    setRankSK('');
    setRankNotes('');
  };

  const handleMutation = () => {
    if (!newDepartment) {
      toast({ variant: 'destructive', title: 'Pilih unit kerja tujuan terlebih dahulu' });
      return;
    }
    
    if (newDepartment === currentDepartment) {
      toast({ variant: 'destructive', title: 'Unit kerja tujuan harus berbeda dari unit kerja saat ini' });
      return;
    }
    
    const entry: HistoryEntry = {
      tanggal: mutationDate,
      dari_unit: currentDepartment,
      ke_unit: newDepartment,
      jabatan: mutationPosition || undefined,
      nomor_sk: mutationSK,
      keterangan: mutationNotes || 'Mutasi - Quick Action',
    };
    
    // Tampilkan konfirmasi sebelum apply
    setPendingMutation({ department: newDepartment, position: mutationPosition, entry });
    setShowMutationConfirm(true);
  };

  const confirmMutation = () => {
    if (!pendingMutation) return;
    onDepartmentChange(pendingMutation.department, pendingMutation.position, pendingMutation.entry);
    setShowMutationConfirm(false);
    setPendingMutation(null);
    setMutationSuccess(true);
    setTimeout(() => setMutationSuccess(false), 3000);
    setNewDepartment('');
    setMutationPosition('');
    setMutationSK('');
    setMutationNotes('');
  };

  const handlePositionChange = () => {
    if (!newPosition) {
      toast({ variant: 'destructive', title: 'Isi nama jabatan baru terlebih dahulu' });
      return;
    }
    
    // Validate: new position must be different from current
    if (newPosition.trim() === currentPosition.trim()) {
      toast({ variant: 'destructive', title: 'Jabatan baru harus berbeda dari jabatan saat ini' });
      return;
    }
    
    const entry: HistoryEntry = {
      tanggal: positionDate,
      jabatan_lama: currentPosition,
      jabatan_baru: newPosition,
      nomor_sk: positionSK,
      keterangan: positionNotes || 'Pergantian jabatan - Quick Action',
    };
    
    onPositionChange(newPosition, entry);
    
    // Show success message
    setPositionSuccess(true);
    setTimeout(() => setPositionSuccess(false), 3000);
    
    // Reset form
    setNewPosition('');
    setPositionSK('');
    setPositionNotes('');
  };

  const handleInactiveStatus = () => {
    if (!inactiveReason) {
      toast({ variant: 'destructive', title: 'Pilih alasan non-aktif terlebih dahulu' });
      return;
    }
    
    // Show confirmation dialog
    setShowInactiveConfirm(true);
  };

  const confirmInactiveStatus = () => {
    const entry: HistoryEntry = {
      tanggal: inactiveDate,
      nomor_sk: inactiveSK,
      keterangan: inactiveNotes || `Non-aktif: ${inactiveReason}`,
    };
    
    onInactiveChange(false, inactiveDate, inactiveReason, entry);
    
    // Show success message
    setInactiveSuccess(true);
    setTimeout(() => setInactiveSuccess(false), 3000);
    
    // Close confirmation and reset form
    setShowInactiveConfirm(false);
    setInactiveReason('');
    setInactiveSK('');
    setInactiveNotes('');
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          💡 <strong>Cara Kerja Quick Action:</strong><br/>
          1. Pilih aksi (Naik Pangkat/Mutasi/Ganti Jabatan)<br/>
          2. Isi form dan klik tombol "Terapkan" → Data diupdate di form (belum tersimpan)<br/>
          3. Klik tombol "Simpan Perubahan" di bawah → Data tersimpan ke database<br/>
          <br/>
          ⚠️ <strong>Penting:</strong> Tombol "Terapkan" hanya mengupdate form, belum menyimpan ke database!
        </AlertDescription>
      </Alert>

      <Tabs value={activeQuickTab} onValueChange={(v) => setActiveQuickTab(v as 'rank' | 'mutation' | 'position' | 'inactive')}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rank" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Naik Pangkat</span>
            <span className="sm:hidden">Pangkat</span>
          </TabsTrigger>
          <TabsTrigger value="mutation" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Pindah/Mutasi</span>
            <span className="sm:hidden">Mutasi</span>
          </TabsTrigger>
          <TabsTrigger value="position" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Ganti Jabatan</span>
            <span className="sm:hidden">Jabatan</span>
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            <span className="hidden sm:inline">Non-Aktifkan</span>
            <span className="sm:hidden">Non-Aktif</span>
          </TabsTrigger>
        </TabsList>

        {/* Rank Promotion Tab */}
        <TabsContent value="rank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Kenaikan Pangkat
              </CardTitle>
              <CardDescription>
                Update pangkat/golongan pegawai dengan cepat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rankSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ Pangkat berhasil diupdate di form! Klik "Simpan Perubahan" di bawah untuk menyimpan ke database.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pangkat Saat Ini</Label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    {currentRank || '-'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-new-rank">Pangkat Baru *</Label>
                  <Select value={newRank} onValueChange={setNewRank}>
                    <SelectTrigger id="quick-new-rank">
                      <SelectValue placeholder="Pilih pangkat baru" />
                    </SelectTrigger>
                    <SelectContent>
                      {getRankOptions().map((rank) => (
                        <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-rank-date">Tanggal *</Label>
                  <Input
                    id="quick-rank-date"
                    type="date"
                    value={rankDate}
                    onChange={(e) => setRankDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-rank-tmt">TMT *</Label>
                  <Input
                    id="quick-rank-tmt"
                    type="date"
                    value={rankTMT}
                    onChange={(e) => setRankTMT(e.target.value)}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-rank-sk">Nomor SK</Label>
                  <Input
                    id="quick-rank-sk"
                    placeholder="Contoh: 123/SK/2024"
                    value={rankSK}
                    onChange={(e) => setRankSK(e.target.value)}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-rank-notes">Keterangan</Label>
                  <Textarea
                    id="quick-rank-notes"
                    placeholder="Keterangan tambahan (opsional)"
                    value={rankNotes}
                    onChange={(e) => setRankNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <Button 
                onClick={handleRankPromotion} 
                className="w-full"
                disabled={!newRank}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Terapkan Kenaikan Pangkat
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mutation Tab */}
        <TabsContent value="mutation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Pindah/Mutasi
              </CardTitle>
              <CardDescription>
                Update unit kerja pegawai dengan cepat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mutationSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ Mutasi berhasil diupdate di form! Klik "Simpan Perubahan" di bawah untuk menyimpan ke database.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Unit Kerja Saat Ini</Label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    {currentDepartment || '-'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-new-department">Unit Kerja Tujuan *</Label>
                  <Select value={newDepartment} onValueChange={(v) => { setNewDepartment(v); setMutationPosition(''); }}>
                    <SelectTrigger id="quick-new-department">
                      <SelectValue placeholder="Pilih unit kerja tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {allDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-mutation-position">Jabatan Baru di Unit Tujuan</Label>
                  <PositionAutocomplete
                    id="quick-mutation-position"
                    value={mutationPosition}
                    onChange={setMutationPosition}
                    options={targetPositionNames}
                    placeholder={newDepartment ? 'Pilih jabatan di unit tujuan' : 'Pilih unit kerja tujuan dulu'}
                    disabled={!newDepartment}
                  />
                  {newDepartment && targetPositionNames.length > 0 && (
                    <p className="text-xs text-muted-foreground">💡 Pilih dari jabatan yang tersedia di Peta Jabatan unit tujuan</p>
                  )}
                  {newDepartment && targetPositionNames.length === 0 && (
                    <p className="text-xs text-amber-600">⚠️ Belum ada jabatan di Peta Jabatan untuk unit tujuan ini</p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-mutation-date">Tanggal Mutasi *</Label>
                  <Input
                    id="quick-mutation-date"
                    type="date"
                    value={mutationDate}
                    onChange={(e) => setMutationDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-mutation-sk">Nomor SK</Label>
                  <Input
                    id="quick-mutation-sk"
                    placeholder="Contoh: 456/SK/2024"
                    value={mutationSK}
                    onChange={(e) => setMutationSK(e.target.value)}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-mutation-notes">Keterangan</Label>
                  <Textarea
                    id="quick-mutation-notes"
                    placeholder="Keterangan tambahan (opsional)"
                    value={mutationNotes}
                    onChange={(e) => setMutationNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <Button 
                onClick={handleMutation} 
                className="w-full"
                disabled={!newDepartment}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Terapkan Mutasi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Position Change Tab */}
        <TabsContent value="position" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Pergantian Jabatan
              </CardTitle>
              <CardDescription>
                Update jabatan pegawai dengan cepat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {positionSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ Jabatan berhasil diupdate di form! Klik "Simpan Perubahan" di bawah untuk menyimpan ke database.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Jabatan Saat Ini</Label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    {currentPosition || '-'}
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-new-position">Jabatan Baru *</Label>
                  <PositionAutocomplete
                    id="quick-new-position"
                    value={newPosition}
                    onChange={setNewPosition}
                    options={positionOptions}
                    placeholder="Ketik atau pilih jabatan dari Peta Jabatan"
                  />
                  {positionOptions.length > 0 && (
                    <p className="text-xs text-muted-foreground">💡 Pilih dari daftar jabatan yang tersedia di Peta Jabatan unit ini</p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-position-date">Tanggal *</Label>
                  <Input
                    id="quick-position-date"
                    type="date"
                    value={positionDate}
                    onChange={(e) => setPositionDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-position-sk">Nomor SK</Label>
                  <Input
                    id="quick-position-sk"
                    placeholder="Contoh: 789/SK/2024"
                    value={positionSK}
                    onChange={(e) => setPositionSK(e.target.value)}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-position-notes">Keterangan</Label>
                  <Textarea
                    id="quick-position-notes"
                    placeholder="Keterangan tambahan (opsional)"
                    value={positionNotes}
                    onChange={(e) => setPositionNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <Button 
                onClick={handlePositionChange} 
                className="w-full"
                disabled={!newPosition}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Terapkan Pergantian Jabatan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inactive Status Tab */}
        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Non-Aktifkan Pegawai
              </CardTitle>
              <CardDescription>
                Tandai pegawai sebagai non-aktif (pensiun, resign, meninggal)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inactiveSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ Status non-aktif berhasil diupdate di form! Klik "Simpan Perubahan" di bawah untuk menyimpan ke database.
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-800">
                  ⚠️ <strong>Perhatian:</strong> Pegawai yang di-non-aktifkan tidak akan dihitung dalam statistik dan agregasi data.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-inactive-reason">Alasan Non-Aktif *</Label>
                  <Select value={inactiveReason} onValueChange={setInactiveReason}>
                    <SelectTrigger id="quick-inactive-reason">
                      <SelectValue placeholder="Pilih alasan non-aktif" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pensiun">Pensiun</SelectItem>
                      <SelectItem value="Resign">Resign / Mengundurkan Diri</SelectItem>
                      <SelectItem value="Meninggal">Meninggal Dunia</SelectItem>
                      <SelectItem value="Diberhentikan">Diberhentikan</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-inactive-date">Tanggal Non-Aktif *</Label>
                  <Input
                    id="quick-inactive-date"
                    type="date"
                    value={inactiveDate}
                    onChange={(e) => setInactiveDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-inactive-sk">Nomor SK</Label>
                  <Input
                    id="quick-inactive-sk"
                    placeholder="Contoh: 999/SK/2024"
                    value={inactiveSK}
                    onChange={(e) => setInactiveSK(e.target.value)}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quick-inactive-notes">Keterangan</Label>
                  <Textarea
                    id="quick-inactive-notes"
                    placeholder="Keterangan tambahan (opsional)"
                    value={inactiveNotes}
                    onChange={(e) => setInactiveNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <Button 
                onClick={handleInactiveStatus} 
                className="w-full"
                variant="destructive"
                disabled={!inactiveReason}
              >
                <UserX className="mr-2 h-4 w-4" />
                Non-Aktifkan Pegawai
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Konfirmasi Mutasi */}
      <Dialog open={showMutationConfirm} onOpenChange={setShowMutationConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Mutasi</DialogTitle>
            <DialogDescription>
              Pegawai akan dipindahkan ke unit kerja baru. Tindakan ini akan dicatat sebagai riwayat mutasi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dari Unit:</span>
              <span className="font-medium">{currentDepartment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ke Unit:</span>
              <span className="font-medium">{pendingMutation?.department}</span>
            </div>
            {pendingMutation?.position && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jabatan Baru:</span>
                <span className="font-medium">{pendingMutation.position}</span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowMutationConfirm(false); setPendingMutation(null); }}>
              Batal
            </Button>
            <Button onClick={confirmMutation}>
              Ya, Terapkan Mutasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi Non-Aktifkan Pegawai */}
      <Dialog open={showInactiveConfirm} onOpenChange={setShowInactiveConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Non-Aktifkan Pegawai</DialogTitle>
            <DialogDescription>
              Pegawai akan ditandai sebagai non-aktif dan tidak akan dihitung dalam statistik. Tindakan ini akan dicatat dalam riwayat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alasan:</span>
              <span className="font-medium">{inactiveReason}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal:</span>
              <span className="font-medium">{new Date(inactiveDate).toLocaleDateString('id-ID')}</span>
            </div>
            {inactiveSK && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nomor SK:</span>
                <span className="font-medium">{inactiveSK}</span>
              </div>
            )}
          </div>
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-800 text-xs">
              ⚠️ Pegawai tidak akan muncul di daftar pegawai aktif dan tidak dihitung dalam agregasi data.
            </AlertDescription>
          </Alert>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowInactiveConfirm(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmInactiveStatus}>
              Ya, Non-Aktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
