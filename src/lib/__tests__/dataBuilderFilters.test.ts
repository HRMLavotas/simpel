import { describe, expect, it, vi } from 'vitest';
import {
  applyDataBuilderServerFilters,
  expandRankGroupFilterValues,
  type FilterableQuery,
} from '../dataBuilderFilters';
import type { FilterRule } from '@/components/data-builder/FilterBuilder';

function createMockQuery(): FilterableQuery & { calls: string[] } {
  const calls: string[] = [];
  const chain: FilterableQuery = {
    eq: (field, value) => {
      calls.push(`eq:${field}=${value}`);
      return chain;
    },
    ilike: (field, value) => {
      calls.push(`ilike:${field}=${value}`);
      return chain;
    },
    in: (field, values) => {
      calls.push(`in:${field}=[${values.join('|')}]`);
      return chain;
    },
    or: (filters) => {
      calls.push(`or:${filters}`);
      return chain;
    },
  };
  return Object.assign(chain, { calls });
}

describe('expandRankGroupFilterValues', () => {
  it('memperluas kode golongan singkat ke label database', () => {
    const expanded = expandRankGroupFilterValues(['IV/a', 'IV/b']);
    expect(expanded).toContain('Pembina (IV/a)');
    expect(expanded).toContain('Pembina Tk I (IV/b)');
  });
});

describe('applyDataBuilderServerFilters rank_group', () => {
  it('membangun OR valid untuk (Tidak Ada) + golongan lain', () => {
    const q = createMockQuery();
    const filters: FilterRule[] = [
      {
        id: '1',
        kind: 'general',
        field: 'rank_group',
        operator: 'in',
        value: '',
        values: ['(Tidak Ada)', 'Pembina (IV/a)'],
      },
    ];

    applyDataBuilderServerFilters(q, filters);

    const orCall = q.calls.find((c) => c.startsWith('or:'));
    expect(orCall).toBeDefined();
    expect(orCall).toContain('rank_group.in.');
    expect(orCall).toContain('rank_group.is.null');
    expect(orCall).toContain('Pembina (IV/a)');
    expect(orCall?.endsWith(',rank_group.is.null')).toBe(true);
  });

  it('hanya (Tidak Ada) — null dan nilai kosong', () => {
    const q = createMockQuery();
    applyDataBuilderServerFilters(q, [
      {
        id: '2',
        kind: 'general',
        field: 'rank_group',
        operator: 'in',
        value: '',
        values: ['(Tidak Ada)'],
      },
    ]);

    const orCall = q.calls.find((c) => c.startsWith('or:'));
    expect(orCall).toContain('Tenaga Alih Daya');
    expect(orCall).toContain('rank_group.is.null');
  });
});
