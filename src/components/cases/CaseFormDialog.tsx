/**
 * CaseFormDialog Component
 * Dialog form for creating new employee cases
 */

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
import { createCase } from "@/lib/employeeCaseStorage";
import {
  CASE_TYPE_OPTIONS,
  CASE_STATUS_OPTIONS,
  CaseType,
  CaseStatus,
  CaseDetails,
} from "@/lib/employeeCaseTypes";
import { useAuth } from "@/hooks/useAuth";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CaseFormDialogProps {
  employees: any[];
  onClose: () => void;
  onCaseCreated: () => void;
}

export default function CaseFormDialog({
  employees,
  onClose,
  onCaseCreated,
}: CaseFormDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    employeeNip: "",
    caseType: "perceraian" as CaseType,
    status: "baru" as CaseStatus,
    description: "",
    reportDate: new Date().toISOString().split("T")[0],
    manualJabatan: "",
    manualUnitKerja: "",
    lainnyaKategori: "", // For "Lainnya" category
  });

  const [caseSpecificData, setCaseSpecificData] = useState<Partial<CaseDetails>>({});

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nip.toLowerCase().includes(searchQuery.toLowerCase())
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
      employeeId: `manual_${Date.now()}`,
      employeeName: "",
      employeeNip: "",
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
      }

      // Add lainnya kategori if selected
      if (formData.caseType === "lainnya" && formData.lainnyaKategori) {
        caseDetails.lainnyaKategori = formData.lainnyaKategori;
      }

      await createCase({
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        employeeNip: formData.employeeNip,
        caseType: formData.caseType,
        status: formData.status,
        severity: undefined, // Remove severity
        description: formData.description,
        reportDate: formData.reportDate,
        caseDetails,
        createdBy: user?.id || "unknown",
      });

      toast.success("Kasus berhasil dibuat");
      onCaseCreated();
    } catch (error: any) {
      console.error("Error creating case:", error);
      toast.error(error.message || "Gagal membuat kasus");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCaseSpecificFields = () => {
    // Only show additional field for "Lainnya" category
    if (formData.caseType === "lainnya") {
      return (
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
          <p className="text-xs text-muted-foreground">
            Contoh: Masalah Keluarga, Konflik Internal, dll.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Kasus Baru</DialogTitle>
          <DialogDescription>
            Isi formulir di bawah untuk membuat kasus pegawai baru
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label>Pilih Pegawai</Label>
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
                    setFormData({
                      ...formData,
                      employeeId: "",
                      employeeName: "",
                      employeeNip: "",
                    });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : isManualEntry ? (
              <div className="space-y-3 p-3 border rounded-lg bg-muted">
                <Badge variant="secondary">Input Manual</Badge>
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsManualEntry(false);
                    setFormData({
                      ...formData,
                      employeeId: "",
                      employeeName: "",
                      employeeNip: "",
                      manualJabatan: "",
                      manualUnitKerja: "",
                    });
                  }}
                >
                  Kembali ke Pencarian
                </Button>
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
                          {emp.jabatan && emp.jabatan !== '-' && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {emp.jabatan} • {emp.department}
                            </p>
                          )}
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
                  Atau Input Manual
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

          {/* Case-specific fields */}
          {renderCaseSpecificFields()}

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
              placeholder="Jelaskan detail kasus..."
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Menyimpan..." : "Simpan Kasus"}
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
