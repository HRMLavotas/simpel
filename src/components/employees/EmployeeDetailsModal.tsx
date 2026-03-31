import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Briefcase, Calendar, MapPin, Award, Building2, GraduationCap, History, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';

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
  asn_status: string | null;
  rank_group: string | null;
  department: string;
  join_date: string | null;
  tmt_cpns: string | null;
  tmt_pns: string | null;
  tmt_pensiun: string | null;
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
}

const formatDisplayName = (emp: Employee) => {
  const parts: string[] = [];
  if (emp.front_title) parts.push(emp.front_title);
  parts.push(emp.name);
  if (emp.back_title) parts.push(emp.back_title);
  return parts.join(' ');
};

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
    case 'PPPK': return <Badge className="badge-pppk">PPPK</Badge>;
    case 'Non ASN': return <Badge className="badge-nonasn">Non ASN</Badge>;
    default: return <Badge variant="outline">-</Badge>;
  }
};

const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | React.ReactNode }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
    <div className="mt-0.5 text-muted-foreground">
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  </div>
);

const CollapsibleSection = ({ 
  icon: Icon, 
  title, 
  count, 
  isExpanded, 
  onToggle, 
  children,
  preview 
}: { 
  icon: any; 
  title: string; 
  count: number; 
  isExpanded: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
  preview?: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge variant="secondary" className="text-xs">{count}</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="mr-1 h-3 w-3" />
              Sembunyikan
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-3 w-3" />
              Lihat Semua
            </>
          )}
        </Button>
      </div>
      
      {!isExpanded && preview && (
        <div className="p-3 rounded-lg border bg-muted/30 text-sm text-muted-foreground">
          {preview}
        </div>
      )}
      
      {isExpanded && children}
    </CardContent>
  </Card>
);

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
}: EmployeeDetailsModalProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    education: false,
    position: false,
    rank: false,
    mutation: false,
    competency: false,
    training: false,
    placementNotes: false,
    assignmentNotes: false,
    changeNotes: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!employee) return null;

  console.log('=== EMPLOYEE DETAILS MODAL ===');
  console.log('Placement notes count:', placementNotes.length);
  console.log('Assignment notes count:', assignmentNotes.length);
  console.log('Change notes count:', changeNotes.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl">{formatDisplayName(employee)}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {getStatusBadge(employee.asn_status)}
            {employee.nip && (
              <Badge variant="outline" className="font-mono text-xs">
                NIP: {employee.nip}
              </Badge>
            )}
            {employee.department && (
              <Badge variant="secondary" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                {employee.department}
              </Badge>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <div className="space-y-6">
            {/* Data Pribadi */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Data Pribadi</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <InfoItem icon={User} label="Nama Lengkap" value={employee.name} />
                  {employee.front_title && (
                    <InfoItem icon={Award} label="Gelar Depan" value={employee.front_title} />
                  )}
                  {employee.back_title && (
                    <InfoItem icon={Award} label="Gelar Belakang" value={employee.back_title} />
                  )}
                  <InfoItem 
                    icon={MapPin} 
                    label="Tempat, Tanggal Lahir" 
                    value={`${employee.birth_place || '-'}, ${formatDate(employee.birth_date)}`} 
                  />
                  <InfoItem icon={User} label="Jenis Kelamin" value={employee.gender || '-'} />
                  <InfoItem icon={User} label="Agama" value={employee.religion || '-'} />
                </div>
              </CardContent>
            </Card>

            {/* Data Kepegawaian */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Data Kepegawaian</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <InfoItem icon={Award} label="Status ASN" value={employee.asn_status || '-'} />
                  <InfoItem icon={Award} label="Golongan/Pangkat" value={employee.rank_group || '-'} />
                  <InfoItem icon={Briefcase} label="Jenis Jabatan" value={employee.position_type || '-'} />
                  <InfoItem icon={Briefcase} label="Nama Jabatan" value={employee.position_name || '-'} />
                  <InfoItem icon={Building2} label="Unit Kerja" value={employee.department} />
                </div>
              </CardContent>
            </Card>

            {/* Tanggal Penting */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Tanggal Penting</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <InfoItem icon={Calendar} label="Tanggal Masuk" value={formatDate(employee.join_date)} />
                  <InfoItem icon={Calendar} label="TMT CPNS" value={formatDate(employee.tmt_cpns)} />
                  <InfoItem icon={Calendar} label="TMT PNS" value={formatDate(employee.tmt_pns)} />
                  <InfoItem icon={Calendar} label="TMT Pensiun" value={formatDate(employee.tmt_pensiun)} />
                </div>
              </CardContent>
            </Card>

            {/* Riwayat Pendidikan */}
            {education.length > 0 && (
              <CollapsibleSection
                icon={GraduationCap}
                title="Riwayat Pendidikan"
                count={education.length}
                isExpanded={expandedSections.education}
                onToggle={() => toggleSection('education')}
                preview={`Terbaru: ${education[education.length - 1]?.level || '-'} ${education[education.length - 1]?.major || ''}`}
              >
                <div className="space-y-3">
                  {education.map((edu, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="mt-0.5">{edu.level}</Badge>
                        <div className="flex-1">
                          <p className="font-medium">{edu.major || 'Tidak Ada'}</p>
                          {edu.institution_name && (
                            <p className="text-sm text-muted-foreground">{edu.institution_name}</p>
                          )}
                          {edu.graduation_year && (
                            <p className="text-xs text-muted-foreground mt-1">Lulus: {edu.graduation_year}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Riwayat Jabatan */}
            {positionHistory.length > 0 && (
              <CollapsibleSection
                icon={History}
                title="Riwayat Jabatan"
                count={positionHistory.length}
                isExpanded={expandedSections.position}
                onToggle={() => toggleSection('position')}
                preview={`Terbaru: ${positionHistory[positionHistory.length - 1]?.jabatan_baru || '-'}`}
              >
                <div className="space-y-3">
                  {positionHistory.map((hist, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{formatDate(hist.tanggal || null)}</Badge>
                        {hist.unit_kerja && (
                          <Badge variant="secondary" className="text-xs">{hist.unit_kerja}</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        {hist.jabatan_lama && (
                          <p><span className="text-muted-foreground">Dari:</span> {hist.jabatan_lama}</p>
                        )}
                        {hist.jabatan_baru && (
                          <p><span className="text-muted-foreground">Ke:</span> <span className="font-medium">{hist.jabatan_baru}</span></p>
                        )}
                        {hist.nomor_sk && (
                          <p className="text-xs text-muted-foreground">SK: {hist.nomor_sk}</p>
                        )}
                        {hist.keterangan && (
                          <p className="text-xs text-muted-foreground italic">{hist.keterangan}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Riwayat Kenaikan Pangkat */}
            {rankHistory.length > 0 && (
              <CollapsibleSection
                icon={Award}
                title="Riwayat Kenaikan Pangkat"
                count={rankHistory.length}
                isExpanded={expandedSections.rank}
                onToggle={() => toggleSection('rank')}
                preview={`Terbaru: ${rankHistory[rankHistory.length - 1]?.pangkat_baru || '-'}`}
              >
                <div className="space-y-3">
                  {rankHistory.map((hist, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{formatDate(hist.tanggal || null)}</Badge>
                        {hist.tmt && (
                          <Badge variant="secondary" className="text-xs">TMT: {formatDate(hist.tmt)}</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        {hist.pangkat_lama && (
                          <p><span className="text-muted-foreground">Dari:</span> {hist.pangkat_lama}</p>
                        )}
                        {hist.pangkat_baru && (
                          <p><span className="text-muted-foreground">Ke:</span> <span className="font-medium">{hist.pangkat_baru}</span></p>
                        )}
                        {hist.nomor_sk && (
                          <p className="text-xs text-muted-foreground">SK: {hist.nomor_sk}</p>
                        )}
                        {hist.keterangan && (
                          <p className="text-xs text-muted-foreground italic">{hist.keterangan}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Riwayat Mutasi */}
            {mutationHistory.length > 0 && (
              <CollapsibleSection
                icon={Building2}
                title="Riwayat Mutasi"
                count={mutationHistory.length}
                isExpanded={expandedSections.mutation}
                onToggle={() => toggleSection('mutation')}
                preview={`Terbaru: ${mutationHistory[mutationHistory.length - 1]?.ke_unit || '-'}`}
              >
                <div className="space-y-3">
                  {mutationHistory.map((hist, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{formatDate(hist.tanggal || null)}</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        {hist.dari_unit && (
                          <p><span className="text-muted-foreground">Dari:</span> {hist.dari_unit}</p>
                        )}
                        {hist.ke_unit && (
                          <p><span className="text-muted-foreground">Ke:</span> <span className="font-medium">{hist.ke_unit}</span></p>
                        )}
                        {hist.nomor_sk && (
                          <p className="text-xs text-muted-foreground">SK: {hist.nomor_sk}</p>
                        )}
                        {hist.keterangan && (
                          <p className="text-xs text-muted-foreground italic">{hist.keterangan}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Catatan Penempatan */}
            {placementNotes.length > 0 && (
              <CollapsibleSection
                icon={FileText}
                title="Keterangan Penempatan"
                count={placementNotes.length}
                isExpanded={expandedSections.placementNotes}
                onToggle={() => toggleSection('placementNotes')}
                preview={
                  placementNotes[placementNotes.length - 1]?.note 
                    ? (placementNotes[placementNotes.length - 1].note.substring(0, 60) + 
                       (placementNotes[placementNotes.length - 1].note.length > 60 ? '...' : ''))
                    : 'Tidak ada preview'
                }
              >
                <div className="space-y-2">
                  {placementNotes.map((note, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/30 text-sm">
                      {note.note}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Catatan Penugasan Tambahan */}
            {assignmentNotes.length > 0 && (
              <CollapsibleSection
                icon={FileText}
                title="Keterangan Penugasan Tambahan"
                count={assignmentNotes.length}
                isExpanded={expandedSections.assignmentNotes}
                onToggle={() => toggleSection('assignmentNotes')}
                preview={
                  assignmentNotes[assignmentNotes.length - 1]?.note 
                    ? (assignmentNotes[assignmentNotes.length - 1].note.substring(0, 60) + 
                       (assignmentNotes[assignmentNotes.length - 1].note.length > 60 ? '...' : ''))
                    : 'Tidak ada preview'
                }
              >
                <div className="space-y-2">
                  {assignmentNotes.map((note, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/30 text-sm">
                      {note.note}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Catatan Perubahan */}
            {changeNotes.length > 0 && (
              <CollapsibleSection
                icon={FileText}
                title="Keterangan Perubahan"
                count={changeNotes.length}
                isExpanded={expandedSections.changeNotes}
                onToggle={() => toggleSection('changeNotes')}
                preview={
                  changeNotes[changeNotes.length - 1]?.note 
                    ? (changeNotes[changeNotes.length - 1].note.substring(0, 60) + 
                       (changeNotes[changeNotes.length - 1].note.length > 60 ? '...' : ''))
                    : 'Tidak ada preview'
                }
              >
                <div className="space-y-2">
                  {changeNotes.map((note, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/30 text-sm">
                      {note.note}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
