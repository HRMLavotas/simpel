import { formatDateID, formatDateShortID } from "@/lib/date-utils";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft, FileText, Plus, Trash2, Edit2, Calendar, Users,
  Link as LinkIcon, Clock, Building2, Briefcase, User,
} from "lucide-react";
import {
  getCaseById, updateCase, addTimelineItem, updateTimelineItem, deleteTimelineItem,
} from "@/lib/employeeCaseStorage";
import {
  CASE_STATUS_LABELS, CASE_SEVERITY_LABELS, getCaseTypeLabel,
  EmployeeCase, TimelineItem, CaseStatus, SupportingDocument,
  InvolvedParty, PARTY_ROLE_OPTIONS, PARTY_ROLE_LABELS,
} from "@/lib/employeeCaseTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { useCaseAccess } from "@/hooks/useCaseAccess";
import CaseDetailCard from "@/components/cases/CaseDetailCard";
import { supabase } from "@/integrations/supabase/client";

interface TimelineFormState {
  date: string;
  description: string;
  status: string;
  involvedPartiesList: InvolvedParty[];
  documents: SupportingDocument[];
}

const emptyTimelineForm: TimelineFormState = {
  date: "", description: "", status: "", involvedPartiesList: [], documents: [],
};

interface EmployeeExtraInfo {
  jabatan?: string;
  unitKerja?: string;
  createdByName?: string;
}

export default function EmployeeCaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { canEdit } = useCaseAccess();
  const [employeeCase, setEmployeeCase] = useState<EmployeeCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [timelineToDelete, setTimelineToDelete] = useState<TimelineItem | null>(null);
  const [extraInfo, setExtraInfo] = useState<EmployeeExtraInfo>({});

  const [formData, setFormData] = useState({ status: "baru" as CaseStatus, description: "" });
  const [timelineForm, setTimelineForm] = useState<TimelineFormState>({ ...emptyTimelineForm });

  useEffect(() => { loadCase(); }, [caseId]);

  const loadCase = async () => {
    if (!caseId) return;
    setIsLoading(true);
    try {
      const data = await getCaseById(caseId);
      if (data) {
        setEmployeeCase(data);
        setFormData({ status: data.status, description: data.description });
        // Load extra info
        loadExtraInfo(data);
      } else {
        toast.error("Kasus tidak ditemukan");
        navigate("/admin/kasus-pegawai");
      }
    } catch (error) {
      console.error("Error loading case:", error);
      toast.error("Gagal memuat kasus");
    } finally {
      setIsLoading(false);
    }
  };

  const loadExtraInfo = async (c: EmployeeCase) => {
    const info: EmployeeExtraInfo = {};
    
    // Check structured caseDetails first, then legacy JSONB
    const manualData = c.caseDetails?.isManualEntry ? c.caseDetails : (c as any).manualEmployeeData;
    
    // Get employee profile for jabatan & unit kerja
    const { data: profile } = await supabase
      .from('profiles')
      .select('jabatan, work_unit_id')
      .eq('id', c.employeeId)
      .maybeSingle();
    if (profile) {
      info.jabatan = profile.jabatan || undefined;
      if (profile.work_unit_id) {
        const { data: unit } = await supabase
          .from('work_units')
          .select('name')
          .eq('id', profile.work_unit_id)
          .maybeSingle();
        info.unitKerja = unit?.name || undefined;
      }
    } else if (manualData) {
      // Fallback to manual employee data (structured or legacy)
      info.jabatan = manualData.manualJabatan || manualData.jabatan || undefined;
      info.unitKerja = manualData.manualUnitKerja || manualData.unitKerja || undefined;
    }
    // Get creator name
    const creatorId = c.createdBy;
    if (creatorId) {
      const { data: creator } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', creatorId)
        .maybeSingle();
      info.createdByName = creator?.name || undefined;
    }
    setExtraInfo(info);
  };

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCase) return;
    try {
      await updateCase(employeeCase.id, { status: formData.status, description: formData.description });
      setEmployeeCase({ ...employeeCase, status: formData.status, description: formData.description });
      setIsEditing(false);
      toast.success("Kasus berhasil diperbarui");
    } catch (error) {
      console.error("Error updating case:", error);
      toast.error("Gagal memperbarui kasus");
    }
  };

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCase || !timelineForm.date || !timelineForm.description) {
      toast.error("Silakan isi bidang yang wajib");
      return;
    }
    try {
      const validDocs = timelineForm.documents.filter(d => d.link.trim());
      const validParties = timelineForm.involvedPartiesList.filter(p => p.name.trim());
      if (editingTimelineId) {
        await updateTimelineItem(employeeCase.id, editingTimelineId, {
          date: timelineForm.date,
          description: timelineForm.description,
          status: timelineForm.status,
          involvedPartiesList: validParties,
          documents: validDocs,
        });
        toast.success("Timeline berhasil diperbarui");
      } else {
        await addTimelineItem(
          employeeCase.id, timelineForm.date, timelineForm.description,
          timelineForm.status, undefined,
          undefined, undefined, validDocs, validParties
        );
        toast.success("Timeline berhasil ditambahkan");
      }
      await loadCase();
      setShowTimelineForm(false);
      setEditingTimelineId(null);
      setTimelineForm({ ...emptyTimelineForm });
    } catch (error) {
      console.error("Error adding timeline:", error);
      toast.error("Gagal menambahkan timeline");
    }
  };

  const handleDeleteTimeline = async () => {
    if (!employeeCase || !timelineToDelete) return;
    try {
      await deleteTimelineItem(employeeCase.id, timelineToDelete.id);
      toast.success("Timeline berhasil dihapus");
      setTimelineToDelete(null);
      await loadCase();
    } catch (error) {
      console.error("Error deleting timeline:", error);
      toast.error("Gagal menghapus timeline");
    }
  };

  const handleEditTimeline = (item: TimelineItem) => {
    setEditingTimelineId(item.id);
    setTimelineForm({
      date: item.date,
      description: item.description,
      status: item.status,
      involvedPartiesList: item.involvedPartiesList?.length
        ? [...item.involvedPartiesList]
        : item.involvedParties
          ? [{ name: item.involvedParties, role: 'lainnya' }]
          : [],
      documents: item.documents.length > 0 ? [...item.documents] : [],
    });
    setShowTimelineForm(true);
  };

  // Document management
  const addDocument = () => {
    setTimelineForm(prev => ({
      ...prev,
      documents: [...prev.documents, { name: "", link: "" }],
    }));
  };
  const updateDocument = (index: number, field: 'name' | 'link', value: string) => {
    setTimelineForm(prev => {
      const docs = [...prev.documents];
      docs[index] = { ...docs[index], [field]: value };
      return { ...prev, documents: docs };
    });
  };
  const removeDocument = (index: number) => {
    setTimelineForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  // Involved parties management
  const addParty = () => {
    setTimelineForm(prev => ({
      ...prev,
      involvedPartiesList: [...prev.involvedPartiesList, { name: "", role: "lainnya" }],
    }));
  };
  const updateParty = (index: number, field: 'name' | 'role', value: string) => {
    setTimelineForm(prev => {
      const parties = [...prev.involvedPartiesList];
      parties[index] = { ...parties[index], [field]: value };
      return { ...prev, involvedPartiesList: parties };
    });
  };
  const removeParty = (index: number) => {
    setTimelineForm(prev => ({
      ...prev,
      involvedPartiesList: prev.involvedPartiesList.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!employeeCase) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Button variant="ghost" onClick={() => navigate("/admin/kasus-pegawai")}>
              <ChevronLeft className="h-4 w-4 mr-2" />Kembali
            </Button>
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">Kasus tidak ditemukan</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: CaseStatus) => {
    const colors: Record<CaseStatus, string> = {
      baru: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      diproses: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      tertunda: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      selesai: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      ditutup: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };
    return colors[status];
  };

  const getPartyRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      pelapor: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
      terlapor: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
      saksi: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
      mediator: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
      penyidik: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
      atasan_langsung: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
      pihak_ketiga: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
    };
    return colors[role] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  // Calculate case duration
  const caseDurationDays = Math.floor(
    (new Date().getTime() - new Date(employeeCase.reportDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/admin/kasus-pegawai")} className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-2" />Kembali
            </Button>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-400 p-6 md:p-8 text-white shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{employeeCase.employeeName}</h1>
                    <p className="text-white/90 mt-1 text-sm md:text-base">NIP: {employeeCase.employeeNip}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className="bg-white/20 text-white border-white/30">{getCaseTypeLabel(employeeCase.caseType)}</Badge>
                      <Badge className={`${getStatusColor(employeeCase.status)} border-0`}>{CASE_STATUS_LABELS[employeeCase.status]}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canEdit && !isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)} className="bg-white/20 hover:bg-white/30 border-white/50 text-white">
                      <Edit2 className="h-4 w-4 mr-2" />Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Case Info */}
              <Card className="border-primary/10 shadow-lg">
                <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle>Informasi Kasus</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">NIP</p>
                      <p className="font-semibold">{employeeCase.employeeNip}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Jenis Kasus</p>
                      <Badge variant="outline" className="mt-1">{getCaseTypeLabel(employeeCase.caseType)}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal Laporan</p>
                      <p className="font-semibold">{formatDateShortID(employeeCase.reportDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tingkat Keparahan</p>
                      <Badge variant="outline" className="mt-1">{employeeCase.severity && CASE_SEVERITY_LABELS[employeeCase.severity]}</Badge>
                    </div>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleUpdateCase} className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as CaseStatus })}>
                          <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(CASE_STATUS_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi Kasus</Label>
                        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Simpan</Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Batal</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="pt-4 border-t space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={`${getStatusColor(employeeCase.status)} mt-1`}>{CASE_STATUS_LABELS[employeeCase.status]}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Deskripsi Kasus</p>
                        <p className="mt-2 text-foreground">{employeeCase.description}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Case-specific Detail Card */}
              <CaseDetailCard employeeCase={employeeCase} />

              {/* Timeline */}
              <Card className="border-primary/10 shadow-lg">
                <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent flex flex-row items-center justify-between">
                  <CardTitle>Timeline Tindak Lanjut</CardTitle>
                  {canEdit && (
                    <Button size="sm" onClick={() => { setEditingTimelineId(null); setTimelineForm({ ...emptyTimelineForm }); setShowTimelineForm(!showTimelineForm); }}>
                      <Plus className="h-4 w-4 mr-2" />Tambah Timeline
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-6">
                  {showTimelineForm && canEdit && (
                    <form onSubmit={handleAddTimeline} className="mb-6 p-4 bg-muted rounded-lg space-y-4">
                      <h4 className="font-semibold">{editingTimelineId ? "Edit Timeline" : "Tambah Timeline Baru"}</h4>
                      <div className="space-y-2">
                        <Label htmlFor="timeline-date">Tanggal Tindak Lanjut *</Label>
                        <Input id="timeline-date" type="date" value={timelineForm.date} onChange={(e) => setTimelineForm({ ...timelineForm, date: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timeline-description">Deskripsi Tindakan *</Label>
                        <Textarea id="timeline-description" value={timelineForm.description} onChange={(e) => setTimelineForm({ ...timelineForm, description: e.target.value })} rows={3} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timeline-status">Status Singkat</Label>
                        <Input id="timeline-status" placeholder='Contoh: "di proses ke Biro"' value={timelineForm.status} onChange={(e) => setTimelineForm({ ...timelineForm, status: e.target.value })} />
                      </div>

                      {/* Structured Involved Parties */}
                      <div className="space-y-3">
                        <Label>Pihak yang Terlibat (Opsional)</Label>
                        {timelineForm.involvedPartiesList.map((party, idx) => (
                          <div key={idx} className="p-3 border rounded-lg space-y-2 bg-background">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Nama</Label>
                                <Input
                                  placeholder="Nama pihak terlibat"
                                  value={party.name}
                                  onChange={(e) => updateParty(idx, 'name', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Peran / Kapasitas</Label>
                                <Select value={party.role} onValueChange={(val) => updateParty(idx, 'role', val)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {PARTY_ROLE_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeParty(idx)} className="text-destructive text-xs">
                                <Trash2 className="h-3 w-3 mr-1" />Hapus
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addParty}>
                          <Plus className="h-3 w-3 mr-1" />Tambah Pihak
                        </Button>
                      </div>

                      {/* Multiple Documents Section */}
                      <div className="space-y-3">
                        <Label>Dokumen Pendukung (Opsional)</Label>
                        {timelineForm.documents.map((doc, idx) => (
                          <div key={idx} className="p-3 border rounded-lg space-y-2 bg-background">
                            <div className="space-y-1">
                              <Label className="text-xs">Nama Bukti Dukung</Label>
                              <Input placeholder="Contoh: Surat Keputusan No. 123" value={doc.name} onChange={(e) => updateDocument(idx, 'name', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Link</Label>
                              <Input placeholder="https://..." value={doc.link} onChange={(e) => updateDocument(idx, 'link', e.target.value)} />
                            </div>
                            <div className="flex justify-end">
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument(idx)} className="text-destructive text-xs">
                                <Trash2 className="h-3 w-3 mr-1" />Hapus
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addDocument}>
                          <Plus className="h-3 w-3 mr-1" />Tambah Dokumen
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit">{editingTimelineId ? "Perbarui" : "Tambahkan"}</Button>
                        <Button type="button" variant="outline" onClick={() => { setShowTimelineForm(false); setEditingTimelineId(null); }}>Batal</Button>
                      </div>
                    </form>
                  )}

                  {employeeCase.timeline.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Belum ada timeline. Tambahkan tindak lanjut pertama.</p>
                  ) : (
                    <div className="space-y-4">
                      {employeeCase.timeline
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((item) => (
                          <div key={item.id} className="pb-6 border-b last:border-b-0 relative pl-6">
                            <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-primary mt-1" />
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {formatDateID(item.date, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                </p>
                                {item.status && <Badge variant="secondary" className="mt-2">{item.status}</Badge>}
                              </div>
                              {canEdit && (
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditTimeline(item)}><Edit2 className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="sm" onClick={() => setTimelineToDelete(item)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                              )}
                            </div>
                            <p className="font-semibold mb-3">{item.description}</p>

                            {/* Structured Involved Parties Display */}
                            {item.involvedPartiesList && item.involvedPartiesList.length > 0 ? (
                              <div className="mb-3">
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                                  <Users className="h-4 w-4" />
                                  <span className="font-medium">Pihak yang Terlibat:</span>
                                </p>
                                <div className="ml-6 flex flex-wrap gap-2">
                                  {item.involvedPartiesList.map((party, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <span className="text-sm font-medium text-foreground">{party.name}</span>
                                      <Badge className={`text-[10px] px-1.5 py-0 ${getPartyRoleColor(party.role)}`}>
                                        {PARTY_ROLE_LABELS[party.role] || party.role}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : item.involvedParties ? (
                              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
                                <Users className="h-4 w-4" />
                                <span className="font-medium">Pihak yang Terlibat:</span> {item.involvedParties}
                              </p>
                            ) : null}

                            {/* Documents display */}
                            {(() => {
                              const validDocuments = Array.isArray(item.documents)
                                ? item.documents.filter(doc => doc && doc.link && typeof doc.link === 'string' && doc.link.trim())
                                : [];
                              if (validDocuments.length > 0) {
                                return (
                                  <div className="space-y-2 mt-2">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <span className="font-medium">Dokumen Pendukung ({validDocuments.length}):</span>
                                    </p>
                                    <ul className="ml-6 space-y-2">
                                      {validDocuments.map((doc, idx) => (
                                        <li key={`${item.id}-doc-${idx}`} className="flex items-center gap-2">
                                          <LinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                          <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all"
                                            onClick={(e) => { try { new URL(doc.link); } catch { e.preventDefault(); toast.error("Link dokumen tidak valid"); } }}>
                                            {doc.name || doc.link || 'Dokumen'}
                                          </a>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              } else if (item.documentLink && item.documentLink.trim() && !item.documentLink.startsWith('__JSON__:')) {
                                return (
                                  <div className="space-y-1 mt-2">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <span className="font-medium">Dokumen Pendukung:</span>
                                    </p>
                                    <div className="ml-6">
                                      <a href={item.documentLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2"
                                        onClick={(e) => { try { new URL(item.documentLink!); } catch { e.preventDefault(); toast.error("Link dokumen tidak valid"); } }}>
                                        <LinkIcon className="h-3 w-3" />
                                        {item.documentName || item.documentLink || 'Dokumen'}
                                      </a>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Enriched Sidebar */}
            <div className="space-y-6">
              <Card className="border-primary/10 shadow-lg bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader><CardTitle>Ringkasan Kasus</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {employeeCase.caseNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Nomor Kasus</p>
                      <p className="font-mono font-semibold mt-1">{employeeCase.caseNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Timeline</p>
                    <p className="text-3xl font-bold mt-2">{employeeCase.timeline.length}</p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Status Terkini</p>
                    <Badge className={getStatusColor(employeeCase.status)}>{CASE_STATUS_LABELS[employeeCase.status]}</Badge>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Keparahan</p>
                    <Badge variant="outline">{employeeCase.severity && CASE_SEVERITY_LABELS[employeeCase.severity]}</Badge>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Durasi Kasus
                    </p>
                    <p className="text-sm font-medium">{caseDurationDays} hari sejak laporan</p>
                  </div>
                  {employeeCase.timeline.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Update Terakhir</p>
                      <p className="text-sm">{formatDateID(employeeCase.timeline[0].date)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Employee Info Card */}
              <Card className="border-primary/10 shadow-lg">
                <CardHeader><CardTitle className="text-base">Informasi Pegawai</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {extraInfo.jabatan && (
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Jabatan</p>
                        <p className="text-sm font-medium">{extraInfo.jabatan}</p>
                      </div>
                    </div>
                  )}
                  {extraInfo.unitKerja && (
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Unit Kerja</p>
                        <p className="text-sm font-medium">{extraInfo.unitKerja}</p>
                      </div>
                    </div>
                  )}
                  {extraInfo.createdByName && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Dibuat oleh</p>
                        <p className="text-sm font-medium">{extraInfo.createdByName}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={!!timelineToDelete} onOpenChange={(open) => !open && setTimelineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Timeline?</AlertDialogTitle>
            <AlertDialogDescription>Anda akan menghapus entry timeline. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTimeline} className="bg-destructive">Hapus</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
