import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PositionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  allowFreeInput?: boolean; // Izinkan input bebas di luar daftar (untuk Non-ASN)
}

/**
 * Combobox jabatan - hanya bisa memilih dari daftar Peta Jabatan.
 * Tidak bisa input nilai bebas di luar daftar.
 */
export function PositionAutocomplete({
  value,
  onChange,
  options,
  placeholder = 'Pilih jabatan...',
  id,
  disabled,
  className,
  allowFreeInput = false,
}: PositionAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = search.trim()
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (option: string) => {
    onChange(option === value ? '' : option);
    setOpen(false);
    setSearch('');
  };

  // Mode input bebas: input teks + dropdown saran
  if (allowFreeInput) {
    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <Input
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            <ul className="max-h-56 overflow-auto py-1">
              {filtered.map((option) => (
                <li
                  key={option}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                    option === value && 'bg-accent text-accent-foreground'
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(option);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check className={cn('h-4 w-4 shrink-0', option === value ? 'opacity-100' : 'opacity-0')} />
                  {option}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <Button
        id={id}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full justify-between font-normal"
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>
          {value || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {/* Search box */}
          <div className="flex items-center border-b px-3 py-2 gap-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari jabatan..."
              className="h-7 border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-56 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground text-center">
                Jabatan tidak ditemukan di Peta Jabatan
              </li>
            ) : (
              filtered.map((option) => (
                <li
                  key={option}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                    option === value && 'bg-accent text-accent-foreground'
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(option);
                  }}
                >
                  <Check className={cn('h-4 w-4 shrink-0', option === value ? 'opacity-100' : 'opacity-0')} />
                  {option}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
