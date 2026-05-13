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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [isAutoFilled, setIsAutoFilled] = useState(false); // Track if data is from auto-complete

  // Auto-complete state
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; position: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (existingDirective) {
      setDirectiveText(existingDirective.directiveText);
      setDirectiveDate(existingDirective.directiveDate);
      setIssuedByName(existingDirective.issuedByName);
      setIssuedByPosition(existingDirective.issuedByPosition || "");
      setIssuedById(existingDirective.issuedById);
      setIsAutoFilled(!!existingDirective.issuedById); // If has ID, it was auto-filled
    } else {
      // Set default date to today
      setDirectiveDate(new Date().toISOString().split("T")[0]);
      setIsAutoFilled(false);
    }
  }, [existingDirective, open]);

  // Search for personnel when name changes
  useEffect(() => {
    const searchPersonnel = async () => {
      if (searchTerm.length >= 2) {
        const results = await searchLeadershipPersonnel(searchTerm);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };

    const debounce = setTimeout(searchPersonnel, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSelectPerson = (person: { id: string; name: string; position: string }) => {
    setIssuedByName(person.name);
    setIssuedByPosition(person.position);
    setIssuedById(person.id);
    setSearchTerm("");
    setShowSuggestions(false);
    setIsAutoFilled(true); // Mark as auto-filled
  };

  const handleNameChange = (value: string) => {
    setIssuedByName(value);
    setSearchTerm(value);
    setShowSuggestions(true);
    
    // If user manually types, clear auto-fill state
    if (isAutoFilled) {
      setIsAutoFilled(false);
      setIssuedById(undefined);
      setIssuedByPosition(""); // Clear position when manually typing
    }
  };

  const handleClearAutoFill = () => {
    setIsAutoFilled(false);
    setIssuedById(undefined);
    setIssuedByPosition("");
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
      setSearchTerm("");
      setIsAutoFilled(false);

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
      setSearchTerm("");
      setIsAutoFilled(false);
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

          {/* Issued By Name with Auto-complete */}
          <div className="space-y-2">
            <Label htmlFor="issued-by-name" className="text-sm font-medium">
              Nama Pemberi Arahan <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="issued-by-name"
                value={issuedByName}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ketik nama untuk mencari..."
                required
                className="w-full"
              />
              {showSuggestions && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => handleSelectPerson(person)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col"
                    >
                      <span className="font-medium">{person.name}</span>
                      {person.position && (
                        <span className="text-sm text-muted-foreground">{person.position}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isAutoFilled ? (
              <div className="flex items-center gap-2">
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Data dari database
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAutoFill}
                  className="h-6 text-xs"
                >
                  Ketik Manual
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Mulai ketik untuk mencari dari database pegawai
              </p>
            )}
          </div>

          {/* Issued By Position */}
          <div className="space-y-2">
            <Label htmlFor="issued-by-position" className="text-sm font-medium">
              Jabatan Pemberi Arahan
            </Label>
            <div className="relative">
              <Input
                id="issued-by-position"
                value={issuedByPosition}
                onChange={(e) => setIssuedByPosition(e.target.value)}
                placeholder="Contoh: Direktur Jenderal, Kepala Biro, dll"
                className="w-full"
                readOnly={isAutoFilled}
                disabled={isAutoFilled}
              />
              {isAutoFilled && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {isAutoFilled ? (
              <p className="text-xs text-green-600 dark:text-green-400">
                Jabatan terisi otomatis dari database
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Opsional - akan terisi otomatis jika memilih dari database
              </p>
            )}
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
