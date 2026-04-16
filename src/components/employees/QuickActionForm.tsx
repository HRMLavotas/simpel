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
import { CheckCircle2, TrendingUp, MapPin, Briefcase } from 'lucide-react';
import { RANK_GROUPS_PNS, RANK_GROUPS_PPPK } from '@/lib/constants';
import { PositionAutocomplete } from '@/components/ui/position-autocomplete';
import type { HistoryEntry } from './EmployeeHistoryForm';

interface QuickActionFormProps {
  // Current values
  currentRank: string;
  currentPosition: string;
  currentDepartment: string;
  asnStatus: string;
  
  // Departments list
  departments: string[];

  // Position options from Peta Jabatan
  positionOptions?: string[];
  
  // Callbacks to update main form
  onRankChange: (newRank: string, entry: HistoryEntry) => void;
  onPositionChange: (newPosition: string, entry: HistoryEntry) => void;
  onDepartmentChange: (newDepartment: string, entry: HistoryEntry) => void;
}

export function QuickActionForm({
  currentRank,
  currentPosition,
  currentDepartment,
  asnStatus,
  departments,
  positionOptions = [],
  onRankChange,
  onPositionChange,
  onDepartmentChange,
}: QuickActionFormProps) {
  const [activeQuickTab, setActiveQuickTab] = useState<'rank' | 'mutation' | 'position'>('rank');
  
  // Rank promotion state
  const [newRank, setNewRank] = useState('');
  const [rankDate, setRankDate] = useState(new Date().toISOString().split('T')[0]);
  const [rankSK, setRankSK] = useState('');
  const [rankTMT, setRankTMT] = useState(new Date().toISOString().split('T')[0]);
  const [rankNotes, setRankNotes] = useState('');
  const [rankSuccess, setRankSuccess] = useState(false);
  
  // Mutation state
  const [newDepartment, setNewDepartment] = useState('');
  const [mutationDate, setMutationDate] = useState(new Date().toISOString().split('T')[0]);
  const [mutationSK, setMutationSK] = useState('');
  const [mutationNotes, setMutationNotes] = useState('');
  const [mutationSuccess, setMutationSuccess] = useState(false);
  
  // Position change state
  const [newPosition, setNewPosition] = useState('');
  const [positionDate, setPositionDate] = useState(new Date().toISOString().split('T')[0]);
  const [positionSK, setPositionSK] = useState('');
  const [positionNotes, setPositionNotes] = useState('');
  const [positionSuccess, setPositionSuccess] = useState(false);

  const getRankOptions = () => {
    if (asnStatus === 'PPPK') return RANK_GROUPS_PPPK as unknown as string[];
    if (asnStatus === 'PNS') return RANK_GROUPS_PNS as unknown as string[];
    return ['Tidak Ada'];
  };

  const handleRankPromotion = () => {
    if (!newRank) {
      alert('Pilih pangkat baru terlebih dahulu');
      return;
    }
    
    // Validate: new rank must be different from current
    if (newRank === currentRank) {
      alert('Pangkat baru harus berbeda dari pangkat saat ini');
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
      alert('Pilih unit kerja tujuan terlebih dahulu');
      return;
    }
    
    // Validate: new department must be different from current
    if (newDepartment === currentDepartment) {
      alert('Unit kerja tujuan harus berbeda dari unit kerja saat ini');
      return;
    }
    
    const entry: HistoryEntry = {
      tanggal: mutationDate,
      dari_unit: currentDepartment,
      ke_unit: newDepartment,
      nomor_sk: mutationSK,
      keterangan: mutationNotes || 'Mutasi - Quick Action',
    };
    
    onDepartmentChange(newDepartment, entry);
    
    // Show success message
    setMutationSuccess(true);
    setTimeout(() => setMutationSuccess(false), 3000);
    
    // Reset form
    setNewDepartment('');
    setMutationSK('');
    setMutationNotes('');
  };

  const handlePositionChange = () => {
    if (!newPosition) {
      alert('Isi nama jabatan baru terlebih dahulu');
      return;
    }
    
    // Validate: new position must be different from current
    if (newPosition.trim() === currentPosition.trim()) {
      alert('Jabatan baru harus berbeda dari jabatan saat ini');
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

      <Tabs value={activeQuickTab} onValueChange={(v) => setActiveQuickTab(v as 'rank' | 'mutation' | 'position')}>
        <TabsList className="grid w-full grid-cols-3">
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
                  <Select value={newDepartment} onValueChange={setNewDepartment}>
                    <SelectTrigger id="quick-new-department">
                      <SelectValue placeholder="Pilih unit kerja tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
      </Tabs>
    </div>
  );
}
