/**
 * Document Upload Component
 * Task 5.4: File upload for Surat Pengantar and URL input for supporting documents
 * Created: 2026-06-02
 */

import { useState } from 'react';
import { Upload, X, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/lib/usulan-ujikom/types';
import { isValidFile } from '@/lib/usulan-ujikom/validation';

interface DocumentUploadProps {
  // Surat Pengantar
  suratPengantarFile?: File | null;
  onSuratPengantarChange: (file: File | null) => void;
  suratPengantarUrl?: string | null;
  
  // Link Dokumen Persyaratan
  linkDokumenPersyaratan?: string;
  onLinkDokumenChange: (url: string) => void;
  
  // Validation
  fileError?: string;
  linkError?: string;
  
  disabled?: boolean;
}

export function DocumentUpload({
  suratPengantarFile,
  onSuratPengantarChange,
  suratPengantarUrl,
  linkDokumenPersyaratan,
  onLinkDokumenChange,
  fileError,
  linkError,
  disabled,
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = isValidFile(file);
      if (validation.valid) {
        onSuratPengantarChange(file);
      } else {
        // Show error via parent component
        onSuratPengantarChange(null);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validation = isValidFile(file);
      if (validation.valid) {
        onSuratPengantarChange(file);
      }
    }
  };

  const handleRemoveFile = () => {
    onSuratPengantarChange(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Surat Pengantar Upload */}
      <div className="space-y-2">
        <Label htmlFor="surat-pengantar">
          Surat Pengantar <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Upload file PDF, JPG, atau PNG (maksimal {MAX_FILE_SIZE / (1024 * 1024)}MB)
        </p>

        {!suratPengantarFile && !suratPengantarUrl ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border'
            } ${fileError ? 'border-red-500' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              id="surat-pengantar"
              type="file"
              className="sr-only"
              accept={ALLOWED_FILE_TYPES.join(',')}
              onChange={handleFileChange}
              disabled={disabled}
            />
            <label
              htmlFor="surat-pengantar"
              className="flex flex-col items-center cursor-pointer"
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Klik untuk upload atau drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG (max. {MAX_FILE_SIZE / (1024 * 1024)}MB)
              </p>
            </label>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="flex-1 min-w-0">
              {suratPengantarFile ? (
                <>
                  <p className="text-sm font-medium truncate">
                    {suratPengantarFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(suratPengantarFile.size)}
                  </p>
                </>
              ) : (
                <a
                  href={suratPengantarUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  Lihat dokumen <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {fileError && (
          <p className="text-sm text-red-500">{fileError}</p>
        )}
      </div>

      {/* Link Dokumen Persyaratan */}
      <div className="space-y-2">
        <Label htmlFor="link-dokumen">
          Link Dokumen Persyaratan Lengkap <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Link ke folder dokumen persyaratan (Google Drive, OneDrive, dll)
        </p>
        <Input
          id="link-dokumen"
          type="url"
          placeholder="https://drive.google.com/..."
          value={linkDokumenPersyaratan || ''}
          onChange={(e) => onLinkDokumenChange(e.target.value)}
          disabled={disabled}
          className={linkError ? 'border-red-500' : ''}
        />
        {linkError && (
          <p className="text-sm text-red-500">{linkError}</p>
        )}

        {linkDokumenPersyaratan && !linkError && (
          <a
            href={linkDokumenPersyaratan}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Buka link
          </a>
        )}
      </div>

      <Alert>
        <AlertDescription className="text-sm">
          <strong>Dokumen yang diperlukan:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Surat Pengantar dari Pimpinan Unit Kerja</li>
            <li>SK Pengangkatan terakhir</li>
            <li>SK Pangkat terakhir</li>
            <li>Ijazah pendidikan terakhir</li>
            <li>Sertifikat kompetensi (jika ada)</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
