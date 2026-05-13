import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { LeadershipDirective, searchLeadershipPersonnel } from "@/lib/leadershipDirectiveStorage";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeadershipDirectiveDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (directive: Omit<LeadershipDirective, "id" | "caseId" | "createdBy" | "createdAt" | "updatedAt">) => Promise<void>;
  existingDirective?: LeadershipDirective | null;
}

export default function LeadershipDirectiveDialog({
  open,
  onClose,
  existingDirective,
  onSubmit,
}: LeadershipDirectiveDialogProps) {
  const [directiveText, setDirectiveText] = useState("");
  const [directiveDate, setDirectiveDate] = useState("");
  const [issuedByName, setIssuedByName] = useState("");
  const [issuedByPosition, setIssuedByPosition] = useState("");
  const [issuedById, setIssuedById] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; position: string }>>([]);

  useEffect(() => {
    if (existingDirective) {
      setDirectiveText(existingDirective.directiveText);
      setDirectiveDate(existingDirective.directiveDate);
      setIssuedByName(existingDirective.issuedByName);
      setIssuedByPosition(existingDirective.issuedByPosition || "");
      setIssuedById(existingDirective.issuedById);
      
      // If has ID, set as selected person
      if (existingDirective.issuedById) {
        setSelectedPerson({
          id: existingDirective.issuedById,
          name: existingDirective.issuedByName,
          position: existingDirective.issuedByPosition || "",
        });
        setIsManualEntry(false);
      } else {
        // Manual entry
        setIsManualEntry(true);
        setSelectedPerson(null);
      }
    } else {
      // Set default date to today
      setDirectiveDate(new Date().toISOString().split("T")[0]);
      setIsManualEntry(false);
      setSelectedPerson(null);
    }
  }, [existingDirective, open]);

  // Search for personnel when query changes
  useEffect(() => {
    const searchPersonnel = async () => {
      if (searchQuery.length >= 2) {
        const results = await searchLeadershipPersonnel(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };

    const debounce = setTimeout(searchPersonnel, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handlePersonSelect = (person: { id: string; name: string; position: string }) => {
    setSelectedPerson(person);
    setIssuedByName(person.name);
    setIssuedByPosition(person.position);
    setIssuedById(person.id);
    setSearchQuery("");
    setIsManualEntry(false);
  };

  const handleManualEntry = () => {
    setIsManualEntry(true);
    setSelectedPerson(null);
    setIssuedByName("");
    setIssuedByPosition("");
    setIssuedById(undefined);
  };

  const handleClearSelection = () => {
    setSelectedPerson(null);
    setIsManualEntry(false);
    setIssuedByName("");
    setIssuedByPosition("");
    setIssuedById(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!directiveText.trim()) {
      toast.error("Arahan tidak boleh kosong");
      return;
    }

    if (!directiveDate) {
      toast.error("Tanggal arahan harus diisi");
      return;
    }

    if (!issuedByName.trim()) {
      toast.error("Nama pemberi arahan harus diisi");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        directiveText: directiveText.trim(),
        directiveDate,
        issuedByName: issuedByName.trim(),
        issuedByPosition: issuedByPosition.trim() || undefined,
        issuedById,
      });

      // Reset form
      setDirectiveText("");
      setDirectiveDate(new Date().toISOString().split("T")[0]);
      setIssuedByName("");
      setIssuedByPosition("");
      setIssuedById(undefined);
      setSearchQuery("");
      setSelectedPerson(null);
      setIsManualEntry(false);

      onClose();
    } catch (error) {
      console.error("Error submitting directive:", error);
      toast.error("Gagal menyimpan arahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setDirectiveText("");
      setDirectiveDate(new Date().toISOString().split("T")[0]);
      setIssuedByName("");
      setIssuedByPosition("");
      setIssuedById(undefined);
      setSearchQuery("");
      setSelectedPerson(null);
      setIsManualEntry(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            {existingDirective ? "Edit Arahan Pimpinan" : "Tambah Arahan Pimpinan"}
          </DialogTitle>
          <DialogDescription>
            Masukkan arahan langsung dari pimpinan terkait penanganan kasus ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Directive Date */}
          <div className="space-y-2">
            <Label htmlFor="directive-date" className="text-sm font-medium">
              Tanggal Arahan <span className="text-destructive">*</span>
            </Label>
            <Input
              id="directive-date"
              type="date"
              value={directiveDate}
              onChange={(e) => setDirectiveDate(e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Issued By Name with Search */}
          <div className="space-y-2">
            <Label>Pilih Pemberi Arahan *</Label>
            {selectedPerson ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                <div className="flex-1">
                  <p className="font-medium">{selectedPerson.name}</p>
                  {selectedPerson.position && (
                    <p className="text-sm text-muted-foreground">
                      Jabatan: {selectedPerson.position}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : isManualEntry ? (
              <div className="space-y-3 p-3 border rounded-lg bg-muted">
                <Badge variant="secondary">Input Manual</Badge>
                <div className="space-y-2">
                  <Label htmlFor="manualName">Nama Pemberi Arahan *</Label>
                  <Input
                    id="manualName"
                    value={issuedByName}
                    onChange={(e) => setIssuedByName(e.target.value)}
                    placeholder="Masukkan nama..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manualPosition">Jabatan</Label>
                  <Input
                    id="manualPosition"
                    value={issuedByPosition}
                    onChange={(e) => setIssuedByPosition(e.target.value)}
                    placeholder="Contoh: Direktur Jenderal, Kepala Biro, dll"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsManualEntry(false);
                    setIssuedByName("");
                    setIssuedByPosition("");
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
                    placeholder="Cari nama pegawai..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchQuery && (
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {searchResults.length > 0 ? (
                      searchResults.map((person) => (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => handlePersonSelect(person)}
                          className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0"
                        >
                          <p className="font-medium">{person.name}</p>
                          {person.position && (
                            <p className="text-sm text-muted-foreground">
                              {person.position}
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
            <p className="text-xs text-muted-foreground">
              Cari dari database pegawai atau input manual
            </p>
          </div>

          {/* Directive Text */}
          <div className="space-y-2">
            <Label htmlFor="directive-text" className="text-sm font-medium">
              Isi Arahan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="directive-text"
              value={directiveText}
              onChange={(e) => setDirectiveText(e.target.value)}
              placeholder="Contoh: Buat surat panggilan, apa yang sudah dilakukan produktivitas?"
              rows={6}
              required
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Arahan ini akan ditampilkan di halaman detail kasus untuk panduan penanganan.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
