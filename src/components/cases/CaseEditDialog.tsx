import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateCase } from "@/lib/employeeCaseStorage";
import {
  CASE_TYPE_OPTIONS,
  CASE_STATUS_OPTIONS,
  CaseType,
  CaseStatus,
  CaseDetails,
  EmployeeCase,
} from "@/lib/employeeCaseTypes";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CaseEditDialogProps {
  caseData: EmployeeCase;
  employees: any[];
  onClose: () => void;
  onCaseUpdated: () => void;
}

export default function CaseEditDialog({
  caseData,
  employees,
  onClose,
  onCaseUpdated,
}: CaseEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(caseData.employeeId.startsWith('manual_'));

  const [formData, setFormData] = useState({
    employeeId: caseData.employeeId,
    employeeName: caseData.employeeName,
    employeeNip: caseData.employeeNip,
    caseType: caseData.caseType,
    status: caseData.status,
    description: caseData.description,
    reportDate: caseData.reportDate.split("T")[0],
    manualJabatan: caseData.caseDetails?.manualJabatan || "",
    manualUnitKerja: caseData.caseDetails?.manualUnitKerja || "",
    lainnyaKategori: caseData.caseDetails?.lainnyaKategori || "",
  });

  const [caseSpecificData, setCaseSpecificData] = useState<Partial<CaseDetails>>(caseData.caseDetails || {});

  useEffect(() => {
    // If it's not a manual entry, try to find the employee in the list to display details
    if (!isManualEntry) {
      const emp = employees.find(e => e.id === caseData.employeeId);
      if (emp) {
        setSelectedEmployee(emp);
      }
    }
  }, [caseData, employees, isManualEntry]);

  const filteredEmployees = employees.filter(
    (emp) =>
      (emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (emp.nip?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const handleEmployeeSelect = (employee: any) => {
    setSelectedEmployee(employee);
    setFormData({
      ...formData,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeNip: employee.nip,
    });
    setSearchQuery("");
    setIsManualEntry(false);
  };

  const handleManualEntry = () => {
    setIsManualEntry(true);
    setSelectedEmployee(null);
    setFormData({
      ...formData,
      // Keep existing ID if it was already manual, otherwise create new manual ID
      employeeId: formData.employeeId.startsWith('manual_') ? formData.employeeId : `manual_${Date.now()}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeName || !formData.employeeNip) {
      toast.error("Nama dan NIP pegawai harus diisi");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Deskripsi kasus harus diisi");
      return;
    }

    setIsSubmitting(true);

    try {
      const caseDetails: CaseDetails = {
        ...caseSpecificData,
      };

      if (isManualEntry) {
        caseDetails.isManualEntry = true;
        caseDetails.manualJabatan = formData.manualJabatan;
        caseDetails.manualUnitKerja = formData.manualUnitKerja;
      } else {
        // If switched from manual to selected employee
        delete caseDetails.isManualEntry;
        delete caseDetails.manualJabatan;
        delete caseDetails.manualUnitKerja;
      }

      // Add lainnya kategori if selected
      if (formData.caseType === "lainnya" && formData.lainnyaKategori) {
        caseDetails.lainnyaKategori = formData.lainnyaKategori;
      }

      await updateCase(caseData.id, {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        employeeNip: formData.employeeNip,
        caseType: formData.caseType,
        status: formData.status,
        description: formData.description,
        reportDate: formData.reportDate,
        caseDetails,
      });

      toast.success("Kasus berhasil diperbarui");
      onCaseUpdated();
    } catch (error: any) {
      console.error("Error updating case:", error);
      toast.error(error.message || "Gagal memperbarui kasus");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Kasus</DialogTitle>
          <DialogDescription>
            Perbarui informasi kasus pegawai di bawah ini
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label>Pegawai Bersangkutan</Label>
            {selectedEmployee ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                <div className="flex-1">
                  <p className="font-medium">{selectedEmployee.name}</p>
                  <p className="text-sm text-muted-foreground">
                    NIP: {selectedEmployee.nip}
                  </p>
                  {selectedEmployee.jabatan && selectedEmployee.jabatan !== '-' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Jabatan: {selectedEmployee.jabatan}
                    </p>
                  )}
                  {selectedEmployee.department && selectedEmployee.department !== '-' && (
                    <p className="text-xs text-muted-foreground">
                      Unit: {selectedEmployee.department}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedEmployee(null);
                  }}
                >
                  Ganti Pegawai
                </Button>
              </div>
            ) : isManualEntry ? (
              <div className="space-y-3 p-3 border rounded-lg bg-muted">
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">Input Manual</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsManualEntry(false);
                      setSelectedEmployee(null);
                    }}
                  >
                    Ganti ke Pencarian
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manualName">Nama Pegawai *</Label>
                  <Input
                    id="manualName"
                    value={formData.employeeName}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manualNip">NIP *</Label>
                  <Input
                    id="manualNip"
                    value={formData.employeeNip}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeNip: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manualJabatan">Jabatan</Label>
                  <Input
                    id="manualJabatan"
                    value={formData.manualJabatan}
                    onChange={(e) =>
                      setFormData({ ...formData, manualJabatan: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manualUnitKerja">Unit Kerja</Label>
                  <Input
                    id="manualUnitKerja"
                    value={formData.manualUnitKerja}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manualUnitKerja: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau NIP pegawai..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchQuery && (
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => handleEmployeeSelect(emp)}
                          className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0"
                        >
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-sm text-muted-foreground">
                            NIP: {emp.nip}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        Tidak ada pegawai ditemukan
                      </div>
                    )}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleManualEntry}
                  className="w-full"
                >
                  Gunakan Input Manual
                </Button>
              </div>
            )}
          </div>

          {/* Case Type */}
          <div className="space-y-2">
            <Label htmlFor="caseType">Jenis Kasus *</Label>
            <Select
              value={formData.caseType}
              onValueChange={(val) =>
                setFormData({ ...formData, caseType: val as CaseType })
              }
            >
              <SelectTrigger id="caseType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lainnya Kategori */}
          {formData.caseType === "lainnya" && (
            <div className="space-y-2">
              <Label htmlFor="lainnyaKategori">Kategori Lainnya (Opsional)</Label>
              <Input
                id="lainnyaKategori"
                placeholder="Sebutkan kategori kasus..."
                value={formData.lainnyaKategori}
                onChange={(e) =>
                  setFormData({ ...formData, lainnyaKategori: e.target.value })
                }
              />
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(val) =>
                setFormData({ ...formData, status: val as CaseStatus })
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASE_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Report Date */}
          <div className="space-y-2">
            <Label htmlFor="reportDate">Tanggal Laporan *</Label>
            <Input
              id="reportDate"
              type="date"
              value={formData.reportDate}
              onChange={(e) =>
                setFormData({ ...formData, reportDate: e.target.value })
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Kasus *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Memperbarui..." : "Perbarui Kasus"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
