/**
 * DisciplinaryActionDialog Component
 * Dialog for adding disciplinary action (Hukuman Disiplin) to employee case
 * Based on PP 94/2021 tentang Disiplin Pegawai Negeri Sipil
 */

import { useState } from "react";
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
import { Scale, FileText, Calendar, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Jenis Hukuman Disiplin berdasarkan PP 94/2021
export const DISCIPLINARY_LEVELS = {
  ringan: "Ringan",
  sedang: "Sedang",
  berat: "Berat",
} as const;

export type DisciplinaryLevel = keyof typeof DISCIPLINARY_LEVELS;

// Jenis-jenis hukuman disiplin per tingkat
export const DISCIPLINARY_TYPES = {
  ringan: [
    { value: "teguran_lisan", label: "Teguran Lisan" },
    { value: "teguran_tertulis", label: "Teguran Tertulis" },
    { value: "pernyataan_tidak_puas_tertulis", label: "Pernyataan Tidak Puas Secara Tertulis" },
  ],
  sedang: [
    { value: "penundaan_kenaikan_gaji_berkala_6_bulan", label: "Penundaan Kenaikan Gaji Berkala 6 Bulan" },
    { value: "penundaan_kenaikan_gaji_berkala_12_bulan", label: "Penundaan Kenaikan Gaji Berkala 12 Bulan" },
    { value: "penurunan_gaji_1_tingkat_12_bulan", label: "Penurunan Gaji 1 Tingkat Selama 12 Bulan" },
  ],
  berat: [
    { value: "penurunan_jabatan_1_tingkat_12_bulan", label: "Penurunan Jabatan 1 Tingkat Selama 12 Bulan" },
    { value: "pembebasan_jabatan", label: "Pembebasan dari Jabatan" },
    { value: "pemberhentian_hormat_tidak_atas_permintaan", label: "Pemberhentian dengan Hormat Tidak Atas Permintaan Sendiri" },
    { value: "pemberhentian_tidak_hormat", label: "Pemberhentian Tidak dengan Hormat" },
  ],
};

export interface DisciplinaryAction {
  level: DisciplinaryLevel;
  type: string;
  decisionNumber: string;
  decisionDate: string;
  effectiveDate: string;
  endDate?: string;
  issuedBy: string;
  violation: string;
  notes?: string;
  documentLink?: string;
}

interface DisciplinaryActionDialogProps {
  employeeName: string;
  employeeNip: string;
  existingAction?: DisciplinaryAction | null;
  onClose: () => void;
  onSubmit: (data: DisciplinaryAction) => Promise<void>;
}

export default function DisciplinaryActionDialog({
  employeeName,
  employeeNip,
  existingAction,
  onClose,
  onSubmit,
}: DisciplinaryActionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with existing data if available
  const [formData, setFormData] = useState<DisciplinaryAction>(() => {
    if (existingAction) {
      return {
        level: existingAction.level,
        type: existingAction.type,
        decisionNumber: existingAction.decisionNumber,
        decisionDate: existingAction.decisionDate,
        effectiveDate: existingAction.effectiveDate,
        endDate: existingAction.endDate || "",
        issuedBy: existingAction.issuedBy,
        violation: existingAction.violation,
        notes: existingAction.notes || "",
        documentLink: existingAction.documentLink || "",
      };
    }
    
    return {
      level: "ringan",
      type: "",
      decisionNumber: "",
      decisionDate: new Date().toISOString().split("T")[0],
      effectiveDate: new Date().toISOString().split("T")[0],
      endDate: "",
      issuedBy: "",
      violation: "",
      notes: "",
      documentLink: "",
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.type) {
      toast.error("Pilih jenis hukuman disiplin");
      return;
    }
    if (!formData.decisionNumber.trim()) {
      toast.error("Nomor keputusan harus diisi");
      return;
    }
    if (!formData.issuedBy.trim()) {
      toast.error("Pejabat yang menetapkan harus diisi");
      return;
    }
    if (!formData.violation.trim()) {
      toast.error("Pelanggaran yang dilakukan harus diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success(existingAction 
        ? "Hukuman disiplin berhasil diupdate" 
        : "Hukuman disiplin berhasil ditambahkan"
      );
      onClose();
    } catch (error: any) {
      console.error("Error saving disciplinary action:", error);
      toast.error(error.message || "Gagal menyimpan hukuman disiplin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLevelColor = (level: DisciplinaryLevel) => {
    const colors = {
      ringan: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      sedang: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      berat: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[level];
  };

  const availableTypes = DISCIPLINARY_TYPES[formData.level];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Scale className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle>
                {existingAction ? "Edit Hukuman Disiplin" : "Tambah Hukuman Disiplin"}
              </DialogTitle>
              <DialogDescription>
                {existingAction 
                  ? `Edit informasi hukuman disiplin untuk ${employeeName} (NIP: ${employeeNip})`
                  : `Tambahkan informasi hukuman disiplin untuk ${employeeName} (NIP: ${employeeNip})`
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">Berdasarkan PP 94 Tahun 2021</p>
                <p className="text-xs">
                  Hukuman disiplin PNS terdiri dari 3 tingkat: Ringan, Sedang, dan Berat.
                  Setelah disimpan, timeline akan otomatis diperbarui.
                </p>
              </div>
            </div>
          </div>

          {/* Tingkat Hukuman */}
          <div className="space-y-2">
            <Label htmlFor="level">Tingkat Hukuman Disiplin *</Label>
            <Select
              value={formData.level}
              onValueChange={(val) =>
                setFormData({ ...formData, level: val as DisciplinaryLevel, type: "" })
              }
            >
              <SelectTrigger id="level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DISCIPLINARY_LEVELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Badge className={getLevelColor(key as DisciplinaryLevel)}>
                        {label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Jenis Hukuman */}
          <div className="space-y-2">
            <Label htmlFor="type">Jenis Hukuman *</Label>
            <Select
              value={formData.type}
              onValueChange={(val) => setFormData({ ...formData, type: val })}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Pilih jenis hukuman..." />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nomor Keputusan */}
            <div className="space-y-2">
              <Label htmlFor="decisionNumber">Nomor Keputusan *</Label>
              <Input
                id="decisionNumber"
                placeholder="Contoh: 123/SK/2026"
                value={formData.decisionNumber}
                onChange={(e) =>
                  setFormData({ ...formData, decisionNumber: e.target.value })
                }
                required
              />
            </div>

            {/* Tanggal Keputusan */}
            <div className="space-y-2">
              <Label htmlFor="decisionDate">Tanggal Keputusan *</Label>
              <Input
                id="decisionDate"
                type="date"
                value={formData.decisionDate}
                onChange={(e) =>
                  setFormData({ ...formData, decisionDate: e.target.value })
                }
                required
              />
            </div>

            {/* Tanggal Berlaku */}
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Tanggal Mulai Berlaku *</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) =>
                  setFormData({ ...formData, effectiveDate: e.target.value })
                }
                required
              />
            </div>

            {/* Tanggal Berakhir */}
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Berakhir (Opsional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan jika tidak ada batas waktu
              </p>
            </div>
          </div>

          {/* Pejabat yang Menetapkan */}
          <div className="space-y-2">
            <Label htmlFor="issuedBy">Pejabat yang Menetapkan *</Label>
            <Input
              id="issuedBy"
              placeholder="Contoh: Kepala BKN / Pejabat Pembina Kepegawaian"
              value={formData.issuedBy}
              onChange={(e) =>
                setFormData({ ...formData, issuedBy: e.target.value })
              }
              required
            />
          </div>

          {/* Pelanggaran */}
          <div className="space-y-2">
            <Label htmlFor="violation">Pelanggaran yang Dilakukan *</Label>
            <Textarea
              id="violation"
              placeholder="Jelaskan pelanggaran yang menjadi dasar hukuman disiplin..."
              value={formData.violation}
              onChange={(e) =>
                setFormData({ ...formData, violation: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          {/* Catatan Tambahan */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Catatan atau keterangan tambahan..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Link Dokumen */}
          <div className="space-y-2">
            <Label htmlFor="documentLink">Link Dokumen SK (Opsional)</Label>
            <Input
              id="documentLink"
              type="url"
              placeholder="https://..."
              value={formData.documentLink}
              onChange={(e) =>
                setFormData({ ...formData, documentLink: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Link ke dokumen Surat Keputusan hukuman disiplin
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting 
                ? "Menyimpan..." 
                : existingAction 
                  ? "Update Hukuman Disiplin" 
                  : "Simpan Hukuman Disiplin"
              }
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
