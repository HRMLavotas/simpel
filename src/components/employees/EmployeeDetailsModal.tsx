import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { type AdditionalPositionHistoryEntry } from './AdditionalPositionHistoryForm';
import { getDisciplinaryActionsByEmployee, type DisciplinaryAction } from '@/lib/disciplinaryActionStorage';
import { Scale, Calendar, User, AlertCircle, FileText } from 'lucide-react';
import { DisciplinaryBadge } from './DisciplinaryBadge';
import { cn } from '@/lib/utils';

interface Employee {
  id: string;
  nip: string | null;
  name: string;
  front_title: string | null;
  back_title: string | null;
  birth_place: string | null;
  birth_date: string | null;
  gender: string | null;
  religion: string | null;
  position_type: string | null;
  position_name: string | null;
  additional_position: string | null;
  kejuruan: string | null;
  asn_status: string | null;
  rank_group: string | null;
  department: string;
  join_date: string | null;
  tmt_cpns: string | null;
  tmt_pns: string | null;
  tmt_pensiun: string | null;
  phone: string | null;
  mobile_phone: string | null;
  address: string | null;
}

interface EducationEntry {
  id?: string;
  level: string;
  institution_name?: string;
  major?: string;
  graduation_year?: string;
  front_title?: string;
  back_title?: string;
}

interface HistoryEntry {
  id?: string;
  [key: string]: string | undefined;
}

interface NoteEntry {
  id?: string;
  note: string;
}

interface EmployeeDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  education?: EducationEntry[];
  mutationHistory?: HistoryEntry[];
  positionHistory?: HistoryEntry[];
  rankHistory?: HistoryEntry[];
  competencyHistory?: HistoryEntry[];
  trainingHistory?: HistoryEntry[];
  placementNotes?: NoteEntry[];
  assignmentNotes?: NoteEntry[];
  changeNotes?: NoteEntry[];
  additionalPositionHistory?: AdditionalPositionHistoryEntry[];
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'd MMMM yyyy', { locale: id });
  } catch {
    return dateStr;
  }
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'PNS': return <Badge className="badge-pns">PNS</Badge>;
    case 'CPNS': return <Badge className="badge-cpns">CPNS</Badge>;
    case 'PPPK': return <Badge className="badge-pppk">PPPK</Badge>;
    case 'Non ASN': return <Badge className="badge-nonasn">Non ASN</Badge>;
    default: return <Badge variant="outline">-</Badge>;
  }
};

// Read-only field component
const ReadOnlyField = ({ 
  label, 
  value 
}: { 
  label: string | React.ReactNode; 
  value: string | React.ReactNode;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {label}
    </label>
    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
      {value || '-'}
    </div>
  </div>
);

// Read-only history table
const ReadOnlyHistoryTable = ({ 
  title,
  headers,
  data,
  fields
}: {
  title: string;
  headers: string[];
  data: HistoryEntry[];
  fields: string[];
}) => {
  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-base font-semibold">{title}</label>
        </div>
        <p className="text-sm text-muted-foreground">Belum ada {title.toLowerCase()}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-base font-semibold">{title}</label>
        <Badge variant="secondary">{data.length} entri</Badge>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto scroll-container">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx} className="px-4 py-3 text-left font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((entry, idx) => (
                <tr key={idx} className="hover:bg-muted/50">
                  {fields.map((field, fieldIdx) => (
                    <td key={fieldIdx} className="px-4 py-3">
                      {field === 'tanggal' || field === 'tmt' || field === 'tanggal_mulai' || field === 'tanggal_selesai'
                        ? formatDate(entry[field] || null)
                        : entry[field] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Read-only education table
const ReadOnlyEducationTable = ({ data }: { data: EducationEntry[] }) => {
  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-base font-semibold">Riwayat Pendidikan</label>
        </div>
        <p className="text-sm text-muted-foreground">Belum ada riwayat pendidikan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-base font-semibold">Riwayat Pendidikan</label>
        <Badge variant="secondary">{data.length} entri</Badge>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto scroll-container">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Jenjang</th>
                <th className="px-4 py-3 text-left font-medium">Nama Institusi</th>
                <th className="px-4 py-3 text-left font-medium">Jurusan</th>
                <th className="px-4 py-3 text-left font-medium">Tahun Lulus</th>
                <th className="px-4 py-3 text-left font-medium">Gelar Depan</th>
                <th className="px-4 py-3 text-left font-medium">Gelar Belakang</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((entry, idx) => (
                <tr key={idx} className="hover:bg-muted/50">
                  <td className="px-4 py-3">{entry.level || '-'}</td>
                  <td className="px-4 py-3">{entry.institution_name || '-'}</td>
                  <td className="px-4 py-3">{entry.major || '-'}</td>
                  <td className="px-4 py-3">{entry.graduation_year || '-'}</td>
                  <td className="px-4 py-3">{entry.front_title || '-'}</td>
                  <td className="px-4 py-3">{entry.back_title || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Read-only notes
const ReadOnlyNotes = ({ title, data }: { title: string; data: NoteEntry[] }) => {
  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-base font-semibold">{title}</label>
        </div>
        <p className="text-sm text-muted-foreground">Belum ada {title.toLowerCase()}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-base font-semibold">{title}</label>
        <Badge variant="secondary">{data.length} catatan</Badge>
      </div>
      <div className="space-y-2">
        {data.map((note, idx) => (
          <div key={idx} className="p-3 rounded-md border bg-muted/30 text-sm">
            {note.note}
          </div>
        ))}
      </div>
    </div>
  );
};

// Read-only disciplinary actions
const ReadOnlyDisciplinaryActions = ({ 
  data, 
  isActionExpired 
}: { 
  data: DisciplinaryAction[];
  isActionExpired: (endDate?: string) => boolean;
}) => {
  const getLevelColor = (level: string) => {
    const colors = {
      ringan: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      sedang: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      berat: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getLevelLabel = (level: string) => {
    const labels = {
      ringan: "Ringan",
      sedang: "Sedang",
      berat: "Berat",
    };
    return labels[level as keyof typeof labels] || level;
  };

  const activeCount = data.filter(a => !isActionExpired(a.endDate)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-red-600" />
          <label className="text-base font-semibold text-red-900 dark:text-red-100">
            Riwayat Hukuman Disiplin
          </label>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{data.length} Total</Badge>
          {activeCount > 0 && <Badge variant="destructive">{activeCount} Aktif</Badge>}
        </div>
      </div>
      
      <div className="space-y-4">
        {data.map((action, idx) => {
          const expired = isActionExpired(action.endDate);
          return (
            <div
              key={idx}
              className={cn(
                "p-4 border-2 rounded-lg space-y-3",
                expired 
                  ? "border-muted bg-muted/30 opacity-80" 
                  : "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getLevelColor(action.level)}>
                      {getLevelLabel(action.level)}
                    </Badge>
                    {expired ? (
                      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">Selesai / Kadaluwarsa</Badge>
                    ) : (
                      <Badge className="bg-green-600 text-white">Sedang Berjalan</Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      SK No. {action.decisionNumber}
                    </span>
                  </div>
                <h4 className="font-semibold text-foreground">{action.type}</h4>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-xs">Tanggal Keputusan</p>
                  <p className="font-medium text-foreground">
                    {formatDate(action.decisionDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-xs">Mulai Berlaku</p>
                  <p className="font-medium text-foreground">
                    {formatDate(action.effectiveDate)}
                  </p>
                </div>
              </div>
              {action.endDate && (
                <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Berakhir</p>
                    <p className="font-medium text-foreground">
                      {formatDate(action.endDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Issued By */}
            <div className="flex items-start gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Ditetapkan oleh</p>
                <p className="font-medium text-foreground">{action.issuedBy}</p>
              </div>
            </div>

            {/* Violation */}
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Pelanggaran</p>
                <p className="text-foreground">{action.violation}</p>
              </div>
            </div>

            {/* Notes */}
            {action.notes && (
              <div className="pt-2 border-t border-red-200 dark:border-red-900/50">
                <p className="text-xs text-muted-foreground mb-1">Catatan</p>
                <p className="text-sm text-foreground">{action.notes}</p>
              </div>
            )}

            {/* Document Link */}
            {action.documentLink && (
              <div className="pt-2 border-t border-red-200 dark:border-red-900/50">
                <a
                  href={action.documentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <FileText className="h-4 w-4" />
                  Lihat Dokumen
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
};

export function EmployeeDetailsModal({ 
  open, 
  onOpenChange, 
  employee,
  education = [],
  mutationHistory = [],
  positionHistory = [],
  rankHistory = [],
  competencyHistory = [],
  trainingHistory = [],
  placementNotes = [],
  assignmentNotes = [],
  changeNotes = [],
  additionalPositionHistory = [],
}: EmployeeDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'history' | 'notes'>('main');
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryAction[]>([]);
  const [isLoadingDisciplinary, setIsLoadingDisciplinary] = useState(false);

  const isActionExpired = (endDate?: string) => {
    if (!endDate) return false;
    try {
      return new Date(endDate) < new Date();
    } catch {
      return false;
    }
  };

  const activeCount = disciplinaryActions.filter(a => !isActionExpired(a.endDate)).length;

  // Reset tab ke 'main' saat employee berubah
  useEffect(() => {
    if (employee) {
      setActiveTab('main');
      logger.debug('=== EMPLOYEE DETAILS MODAL ===', employee.name);
      loadDisciplinaryActions();
    }
  }, [employee]);

  // Load active disciplinary actions for this employee
  const loadDisciplinaryActions = async () => {
    if (!employee?.id) return;
    
    setIsLoadingDisciplinary(true);
    try {
      const actions = await getDisciplinaryActionsByEmployee(employee.id);
      setDisciplinaryActions(actions);
    } catch (error) {
      console.error('Error loading disciplinary actions:', error);
    } finally {
      setIsLoadingDisciplinary(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[90vw] md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>Detail Data Pegawai</DialogTitle>
              <DialogDescription>
                Informasi lengkap pegawai (mode tampilan)
              </DialogDescription>
            </div>
            {activeCount > 0 && (
              <DisciplinaryBadge count={activeCount} />
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'main' | 'history' | 'notes')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="main">Data Utama</TabsTrigger>
              <TabsTrigger value="history">Riwayat</TabsTrigger>
              <TabsTrigger value="notes">Keterangan</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="space-y-6 focus:outline-none focus-visible:outline-none">
              {/* Identity Section */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Data Pribadi</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyField label={employee.asn_status === 'Non ASN' ? 'NIK' : 'NIP'} value={employee.nip || '-'} />
                  <ReadOnlyField label="Nama Lengkap" value={employee.name} />
                  <ReadOnlyField label="Gelar Depan" value={employee.front_title || '-'} />
                  <ReadOnlyField label="Gelar Belakang" value={employee.back_title || '-'} />
                  <ReadOnlyField label="Tempat Lahir" value={employee.birth_place || '-'} />
                  <ReadOnlyField label="Tanggal Lahir" value={formatDate(employee.birth_date)} />
                  <ReadOnlyField label="Jenis Kelamin" value={employee.gender || '-'} />
                  <ReadOnlyField label="Agama" value={employee.religion || '-'} />
                </div>
              </div>

              <Separator />

              {/* Position Section */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Data Kepegawaian</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyField label="Status ASN" value={getStatusBadge(employee.asn_status)} />
                  <ReadOnlyField label="Golongan/Pangkat" value={employee.rank_group || '-'} />
                  <ReadOnlyField label="Jenis Jabatan" value={employee.position_type || '-'} />
                  <ReadOnlyField label="Nama Jabatan" value={employee.position_name || '-'} />
                  <ReadOnlyField 
                    label={
                      <span>
                        Jabatan Tambahan <span className="text-xs text-muted-foreground ml-2">(Opsional)</span>
                      </span>
                    } 
                    value={employee.additional_position || '-'} 
                  />
                  <ReadOnlyField 
                    label={
                      <span>
                        Kejuruan <span className="text-xs text-muted-foreground ml-2">(Instruktur)</span>
                      </span>
                    } 
                    value={employee.kejuruan || '-'} 
                  />
                  <ReadOnlyField label="Unit Kerja" value={employee.department} />
                </div>
              </div>

              <Separator />

              {/* Dates Section */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tanggal Penting</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyField label="Tanggal Masuk" value={formatDate(employee.join_date)} />
                  <ReadOnlyField label="TMT CPNS" value={formatDate(employee.tmt_cpns)} />
                  <ReadOnlyField label="TMT PNS" value={formatDate(employee.tmt_pns)} />
                  <ReadOnlyField label="TMT Pensiun" value={formatDate(employee.tmt_pensiun)} />
                </div>
              </div>

              <Separator />

              {/* Contact & Address Section */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Kontak &amp; Alamat</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyField label="Nomor HP" value={employee.mobile_phone || '-'} />
                  <ReadOnlyField label="Nomor Telepon" value={employee.phone || '-'} />
                  <div className="sm:col-span-2">
                    <ReadOnlyField label="Alamat" value={employee.address || '-'} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6 focus:outline-none focus-visible:outline-none">
              {/* Disciplinary Actions - Show first if exists */}
              {isLoadingDisciplinary ? (
                <div className="text-sm text-muted-foreground">Memuat data hukuman disiplin...</div>
              ) : disciplinaryActions.length > 0 ? (
                <>
                  <ReadOnlyDisciplinaryActions 
                    data={disciplinaryActions} 
                    isActionExpired={isActionExpired}
                  />
                  <Separator />
                </>
              ) : null}

              {/* Mutation History */}
              <ReadOnlyHistoryTable
                title="Riwayat Mutasi"
                headers={['Tanggal', 'Dari Unit', 'Ke Unit', 'Jabatan', 'Nomor SK', 'Keterangan']}
                data={mutationHistory}
                fields={['tanggal', 'dari_unit', 'ke_unit', 'jabatan', 'nomor_sk', 'keterangan']}
              />

              <Separator />

              {/* Position History */}
              <ReadOnlyHistoryTable
                title="Riwayat Jabatan"
                headers={['Tanggal', 'Jabatan Lama', 'Jabatan Baru', 'Unit Kerja', 'Nomor SK', 'Keterangan']}
                data={positionHistory}
                fields={['tanggal', 'jabatan_lama', 'jabatan_baru', 'unit_kerja', 'nomor_sk', 'keterangan']}
              />

              <Separator />

              {/* Additional Position History */}
              <ReadOnlyHistoryTable
                title="Riwayat Jabatan Tambahan"
                headers={['Tanggal', 'Jabatan Lama', 'Jabatan Baru', 'Nomor SK', 'TMT', 'Keterangan']}
                data={additionalPositionHistory}
                fields={['tanggal', 'jabatan_tambahan_lama', 'jabatan_tambahan_baru', 'nomor_sk', 'tmt', 'keterangan']}
              />

              <Separator />

              {/* Rank History */}
              <ReadOnlyHistoryTable
                title="Riwayat Kenaikan Pangkat"
                headers={['Tanggal', 'Pangkat Lama', 'Pangkat Baru', 'Nomor SK', 'TMT', 'Keterangan']}
                data={rankHistory}
                fields={['tanggal', 'pangkat_lama', 'pangkat_baru', 'nomor_sk', 'tmt', 'keterangan']}
              />

              <Separator />

              {/* Education Section */}
              <ReadOnlyEducationTable data={education} />

              <Separator />

              {/* Competency Test History */}
              <ReadOnlyHistoryTable
                title="Riwayat Uji Kompetensi"
                headers={['Tanggal', 'Jenis Uji', 'Hasil', 'Keterangan']}
                data={competencyHistory}
                fields={['tanggal', 'jenis_uji', 'hasil', 'keterangan']}
              />

              <Separator />

              {/* Training History */}
              <ReadOnlyHistoryTable
                title="Riwayat Diklat"
                headers={['Tanggal Mulai', 'Tanggal Selesai', 'Nama Diklat', 'Penyelenggara', 'Sertifikat', 'Keterangan']}
                data={trainingHistory}
                fields={['tanggal_mulai', 'tanggal_selesai', 'nama_diklat', 'penyelenggara', 'sertifikat', 'keterangan']}
              />
            </TabsContent>

            <TabsContent value="notes" className="space-y-6 focus:outline-none focus-visible:outline-none">
              {/* Keterangan Penempatan */}
              <ReadOnlyNotes title="Keterangan Penempatan" data={placementNotes} />

              <Separator />

              {/* Keterangan Penugasan Tambahan */}
              <ReadOnlyNotes title="Keterangan Penugasan Tambahan" data={assignmentNotes} />

              <Separator />

              {/* Keterangan Perubahan */}
              <ReadOnlyNotes title="Keterangan Perubahan" data={changeNotes} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
