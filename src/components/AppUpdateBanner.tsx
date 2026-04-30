import { useAppUpdate } from '@/hooks/useAppUpdate';
import { RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Banner yang muncul di bagian atas halaman ketika ada versi aplikasi baru.
 * User bisa klik "Perbarui Sekarang" untuk reload, atau tutup banner.
 */
export function AppUpdateBanner() {
  const { updateAvailable, applyUpdate } = useAppUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[100]',
        'flex items-center justify-between gap-3 px-4 py-2.5',
        'bg-primary text-primary-foreground text-sm',
        'shadow-md animate-in slide-in-from-top-2 duration-300'
      )}
      role="alert"
    >
      <div className="flex items-center gap-2 min-w-0">
        <RefreshCw className="h-4 w-4 flex-shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
        <span className="truncate">
          Versi baru aplikasi tersedia. Perbarui untuk mendapatkan fitur dan perbaikan terbaru.
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={applyUpdate}
          className="rounded-md bg-primary-foreground/20 hover:bg-primary-foreground/30 px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap"
        >
          Perbarui Sekarang
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 hover:bg-primary-foreground/20 transition-colors"
          aria-label="Tutup notifikasi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
