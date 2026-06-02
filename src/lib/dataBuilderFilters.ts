import type { FilterRule } from '@/components/data-builder/FilterBuilder';

export type FilterableQuery = {
  eq: (field: string, value: string) => FilterableQuery;
  ilike: (field: string, value: string) => FilterableQuery;
  in: (field: string, values: string[]) => FilterableQuery;
  or: (filters: string) => FilterableQuery;
};

/** Opsi pangkat lengkap — sinkron dengan FilterBuilder / DataBuilder */
export const RANK_GROUP_FILTER_OPTIONS = [
  'Juru (I/a)',
  'Juru Muda (I/b)',
  'Juru Muda Tk I (I/c)',
  'Juru Tk I (I/d)',
  'Pengatur Muda (II/a)',
  'Pengatur Muda Tk I (II/b)',
  'Pengatur (II/c)',
  'Pengatur Tk I (II/d)',
  'Penata Muda (III/a)',
  'Penata Muda Tk I (III/b)',
  'Penata (III/c)',
  'Penata Tk I (III/d)',
  'Pembina (IV/a)',
  'Pembina Tk I (IV/b)',
  'Pembina Muda (IV/c)',
  'Pembina Madya (IV/d)',
  'Pembina Utama (IV/e)',
  'III',
  'V',
  'VII',
  'IX',
  '(Tidak Ada)',
] as const;

const RANK_NULL_VALUES = ['Tenaga Alih Daya', 'Tidak Ada'] as const;

export const isFilterRuleActive = (filter: FilterRule): boolean => {
  if (filter.operator === 'in') {
    return (filter.values?.length || 0) > 0;
  }
  return filter.value.trim().length > 0;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const escapePostgrestValue = (value: string) => value.replace(/"/g, '\\"');

/** Perluas kode golongan singkat (mis. IV/a) ke label penuh di database */
export function expandRankGroupFilterValues(values: string[]): string[] {
  const expanded = new Set<string>();

  for (const raw of values) {
    const v = raw.trim();
    if (!v) continue;
    expanded.add(v);

    const shortMatch = v.match(/^(I{1,4}|IV)\/([a-e])$/i);
    if (shortMatch) {
      const token = `${shortMatch[1].toUpperCase()}/${shortMatch[2].toLowerCase()}`;
      for (const option of RANK_GROUP_FILTER_OPTIONS) {
        if (option === '(Tidak Ada)') continue;
        if (option.includes(`(${token})`) || option === token) {
          expanded.add(option);
        }
      }
    }
  }

  return [...expanded];
};

/**
 * Terapkan filter ke query Supabase employees.
 * Dipisahkan agar mudah diuji dan dirawat.
 */
export function applyDataBuilderServerFilters(
  query: FilterableQuery,
  filters: FilterRule[]
): FilterableQuery {
  let q = query;
  const activeFilters = filters.filter(isFilterRuleActive);

  const virtualFilters = activeFilters.filter((f) => f.field === 'position_name_or_plt');
  const regularFilters = activeFilters.filter((f) => f.field !== 'position_name_or_plt');

  for (const filter of virtualFilters) {
    const value = filter.value.trim();
    if (!value) continue;
    const escaped = escapePostgrestValue(value);

    if (filter.operator === 'ilike' || filter.operator === 'exact_word') {
      q = q.or(`position_name.ilike."%${escaped}%",additional_position.ilike."%${escaped}%"`);
    } else if (filter.operator === 'exact_match') {
      q = q.or(`position_name.ilike."${escaped}",additional_position.ilike."${escaped}"`);
    } else if (filter.operator === 'eq') {
      q = q.or(`position_name.eq."${escaped}",additional_position.eq."${escaped}"`);
    }
  }

  const inValuesByField = new Map<string, string[]>();
  for (const filter of regularFilters) {
    if (filter.operator !== 'in') continue;
    const vals = filter.values?.filter(Boolean) ?? [];
    if (vals.length === 0) continue;
    const existing = inValuesByField.get(filter.field) ?? [];
    inValuesByField.set(filter.field, [...new Set([...existing, ...vals])]);
  }

  const textFiltersByField = new Map<string, Array<{ operator: string; value: string }>>();
  for (const filter of regularFilters) {
    if (filter.operator === 'in') continue;
    const value = filter.value.trim();
    if (!value) continue;
    const existing = textFiltersByField.get(filter.field) ?? [];
    textFiltersByField.set(filter.field, [...existing, { operator: filter.operator, value }]);
  }

  const textConditionToOrPart = (field: string, operator: string, value: string): string => {
    const escaped = escapePostgrestValue(value);
    if (operator === 'exact_word' || operator === 'ilike') return `${field}.ilike."%${escaped}%"`;
    if (operator === 'exact_match') return `${field}.ilike."${escaped}"`;
    return `${field}.eq."${escaped}"`;
  };

  const posInVals = inValuesByField.get('position_name');
  const addInVals = inValuesByField.get('additional_position');
  const posTextConds = textFiltersByField.get('position_name') ?? [];
  const addTextConds = textFiltersByField.get('additional_position') ?? [];

  const hasPositionNameActive = (posInVals?.length ?? 0) > 0 || posTextConds.length > 0;
  const hasAdditionalPositionActive = (addInVals?.length ?? 0) > 0 || addTextConds.length > 0;

  if (hasPositionNameActive && hasAdditionalPositionActive) {
    const mergedOrParts: string[] = [];

    if (posInVals?.length) {
      mergedOrParts.push(
        `position_name.in.(${posInVals.map((v) => `"${escapePostgrestValue(v)}"`).join(',')})`
      );
      inValuesByField.delete('position_name');
    }
    if (addInVals?.length) {
      mergedOrParts.push(
        `additional_position.in.(${addInVals.map((v) => `"${escapePostgrestValue(v)}"`).join(',')})`
      );
      inValuesByField.delete('additional_position');
    }
    for (const { operator, value } of posTextConds) {
      mergedOrParts.push(textConditionToOrPart('position_name', operator, value));
    }
    for (const { operator, value } of addTextConds) {
      mergedOrParts.push(textConditionToOrPart('additional_position', operator, value));
    }

    if (mergedOrParts.length > 0) q = q.or(mergedOrParts.join(','));

    textFiltersByField.delete('position_name');
    textFiltersByField.delete('additional_position');
  }

  for (const [field, vals] of inValuesByField) {
    if (field === 'rank_group') {
      const expandedVals = expandRankGroupFilterValues(vals);
      const includesEmpty = expandedVals.includes('(Tidak Ada)');
      const rankInVals = expandedVals.filter((v) => v !== '(Tidak Ada)');

      if (includesEmpty) {
        const orParts: string[] = [];
        const allIn = [...new Set([...rankInVals, ...RANK_NULL_VALUES])];
        if (allIn.length > 0) {
          orParts.push(`${field}.in.(${allIn.map((v) => `"${escapePostgrestValue(v)}"`).join(',')})`);
        }
        orParts.push(`${field}.is.null`);
        q = q.or(orParts.join(','));
      } else if (rankInVals.length > 0) {
        q = q.in(field, rankInVals);
      }
      continue;
    }

    q = q.in(field, vals);
  }

  for (const [field, conditions] of textFiltersByField) {
    const includeAdditional = field === 'position_name';

    if (conditions.length === 1 && !includeAdditional) {
      const { operator, value } = conditions[0];
      if (operator === 'exact_word' || operator === 'ilike') {
        q = q.ilike(field, `%${value}%`);
      } else if (operator === 'exact_match') {
        q = q.ilike(field, value);
      } else if (operator === 'eq') {
        q = q.eq(field, value);
      }
    } else {
      const orParts: string[] = [];
      for (const { operator, value } of conditions) {
        const escaped = escapePostgrestValue(value);
        if (operator === 'exact_word' || operator === 'ilike') {
          orParts.push(`${field}.ilike."%${escaped}%"`);
          if (includeAdditional) orParts.push(`additional_position.ilike."%${escaped}%"`);
        } else if (operator === 'exact_match') {
          orParts.push(`${field}.ilike."${escaped}"`);
          if (includeAdditional) orParts.push(`additional_position.ilike."${escaped}"`);
        } else {
          orParts.push(`${field}.eq."${escaped}"`);
          if (includeAdditional) orParts.push(`additional_position.eq."${escaped}"`);
        }
      }
      q = q.or(orParts.join(','));
    }
  }

  return q;
}

/** Filter kata utuh & penyesuaian rank_group setelah data di-fetch */
export function applyDataBuilderClientFilters(
  rows: Record<string, unknown>[],
  filters: FilterRule[]
): Record<string, unknown> {
  let filtered = rows;

  const exactWordFilters = filters.filter(
    (filter) =>
      filter.operator === 'exact_word' &&
      filter.field !== 'position_name_or_plt' &&
      isFilterRuleActive(filter)
  );

  if (exactWordFilters.length === 0) return filtered;

  const byField = new Map<string, string[]>();
  for (const filter of exactWordFilters) {
    const existing = byField.get(filter.field) ?? [];
    byField.set(filter.field, [...existing, filter.value.trim()]);
  }

  const hasPositionNameExact = byField.has('position_name');
  const hasAdditionalPositionExact = byField.has('additional_position');

  if (hasPositionNameExact && hasAdditionalPositionExact) {
    const posRegexes = (byField.get('position_name') ?? []).map(
      (v) => new RegExp(`\\b${escapeRegExp(v.toLowerCase())}\\b`, 'i')
    );
    const addRegexes = (byField.get('additional_position') ?? []).map(
      (v) => new RegExp(`\\b${escapeRegExp(v.toLowerCase())}\\b`, 'i')
    );
    filtered = filtered.filter((row) => {
      const posValue = String(row.position_name || '').toLowerCase();
      const addValue = String(row.additional_position || '').toLowerCase();
      return posRegexes.some((r) => r.test(posValue)) || addRegexes.some((r) => r.test(addValue));
    });
    byField.delete('position_name');
    byField.delete('additional_position');
  }

  for (const [field, values] of byField) {
    const regexes = values.map((v) => new RegExp(`\\b${escapeRegExp(v.toLowerCase())}\\b`, 'i'));
    filtered = filtered.filter((row) => {
      const fieldValue = String(row[field] || '').toLowerCase();
      return regexes.some((regex) => regex.test(fieldValue));
    });
  }

  return filtered;
}
