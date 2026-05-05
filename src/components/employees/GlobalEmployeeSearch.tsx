import { useState, useCallback } from 'react';
import { Search, X, User, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect } from 'react';

interface SearchResult {
  id: string;
  name: string;
  front_title: string | null;
  back_title: string | null;
  nip: string | null;
  department: string;
  position_name: string | null;
  asn_status: string | null;
  rank_group: string | null;
}

interface GlobalEmployeeSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEmployee?: (employee: SearchResult) => void;
}

export function GlobalEmployeeSearch({ open, onOpenChange, onSelectEmployee }: GlobalEmployeeSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 400);

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const trimmed = q.trim();
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, front_title, back_title, nip, department, position_name, asn_status, rank_group')
        .or(`name.ilike.%${trimmed}%,nip.ilike.%${trimmed}%`)
        .order('department')
        .order('name')
        .limit(30);

      if (error) throw error;
      setResults((data || []) as SearchResult[]);
    } catch (err) {
      console.error('[GlobalEmployeeSearch] error:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    doSearch(debouncedQuery);
  }, [debouncedQuery, doSearch]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setHasSearched(false);
    }
  }, [open]);

  const formatName = (emp: SearchResult) => {
    const parts: string[] = [];
    if (emp.front_title) parts.push(emp.front_title);
    parts.push(emp.name);
    if (emp.back_title) parts.push(emp.back_title);
    return parts.join(' ');
  };

  const getAsnStatusColor = (status: string | null) => {
    if (status === 'PNS') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    if (status === 'PPPK') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    if (status === 'CPNS') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    if (status === 'Non ASN') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-primary" />
            Pencarian Global Pegawai
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Cari nama atau NIP pegawai di semua unit kerja..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {query.length > 0 && query.length < 2 && (
            <p className="text-xs text-muted-foreground mt-1.5">Ketik minimal 2 karakter untuk mencari</p>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Mencari...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y">
              {results.map((emp) => (
                <button
                  key={emp.id}
                  className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    onSelectEmployee?.(emp);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{formatName(emp)}</p>
                        {emp.nip && (
                          <p className="text-xs text-muted-foreground">NIP: {emp.nip}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{emp.department}</span>
                          </div>
                          {emp.position_name && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              · {emp.position_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {emp.asn_status && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0 ${getAsnStatusColor(emp.asn_status)}`}>
                        {emp.asn_status}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {results.length === 30 && (
                <p className="text-xs text-center text-muted-foreground py-3 px-4">
                  Menampilkan 30 hasil pertama. Perjelas pencarian untuk hasil lebih spesifik.
                </p>
              )}
            </div>
          ) : hasSearched && query.length >= 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">Tidak ada hasil</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tidak ditemukan pegawai dengan nama atau NIP "<strong>{query}</strong>"
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Cari pegawai berdasarkan nama atau NIP di seluruh unit kerja
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
