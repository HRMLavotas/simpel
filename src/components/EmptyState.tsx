/**
 * Empty State Components
 * Display components for empty or no-data states
 */

import { FileQuestion, Search, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
}

/**
 * Generic empty state component
 */
export function EmptyState({
  icon,
  title = "Tidak ada data",
  message = "Belum ada data untuk ditampilkan",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 text-muted-foreground">
        {icon || <Inbox className="h-16 w-16" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
    </div>
  );
}

/**
 * No data state - when there's no data at all
 */
export function NoDataState({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={<Inbox className="h-16 w-16" />}
      title="Tidak ada data"
      message={message || "Belum ada data untuk ditampilkan"}
    />
  );
}

/**
 * Search state - when search returns no results
 */
export function SearchState({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={<Search className="h-16 w-16" />}
      title="Tidak ada hasil"
      message={
        message ||
        "Tidak ada data yang sesuai dengan pencarian Anda. Coba kata kunci lain."
      }
    />
  );
}

/**
 * Not found state - when specific item is not found
 */
export function NotFoundState({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={<FileQuestion className="h-16 w-16" />}
      title="Tidak ditemukan"
      message={message || "Data yang Anda cari tidak ditemukan"}
    />
  );
}
