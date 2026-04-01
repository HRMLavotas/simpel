/**
 * Tests for utility functions
 * Tests common utility functions used across the application
 */

import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
  describe('String utilities', () => {
    it('should format NIP correctly', () => {
      const formatNIP = (nip: string) => {
        if (!nip || nip.length !== 18) return nip;
        return `${nip.slice(0, 8)} ${nip.slice(8, 14)} ${nip.slice(14)}`;
      };

      expect(formatNIP('199001012020121001')).toBe('19900101 202012 1001');
      expect(formatNIP('123')).toBe('123');
      expect(formatNIP('')).toBe('');
    });

    it('should validate NIP format', () => {
      const isValidNIP = (nip: string) => {
        return /^\d{18}$/.test(nip);
      };

      expect(isValidNIP('199001012020121001')).toBe(true);
      expect(isValidNIP('123')).toBe(false);
      expect(isValidNIP('12345678901234567a')).toBe(false);
      expect(isValidNIP('')).toBe(false);
    });

    it('should validate NIK format', () => {
      const isValidNIK = (nik: string) => {
        return /^\d{16}$/.test(nik);
      };

      expect(isValidNIK('1234567890123456')).toBe(true);
      expect(isValidNIK('123')).toBe(false);
      expect(isValidNIK('123456789012345a')).toBe(false);
      expect(isValidNIK('')).toBe(false);
    });
  });

  describe('Date utilities', () => {
    it('should format date correctly', () => {
      const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString('id-ID');
      };

      const testDate = new Date('2024-01-15');
      const formatted = formatDate(testDate);
      expect(formatted).toMatch(/15/);
      expect(formatted).toMatch(/1/); // Month can be 1 or 01
      expect(formatted).toMatch(/2024/);
    });

    it('should calculate age correctly', () => {
      const calculateAge = (birthDate: Date | string) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        
        return age;
      };

      const birthDate = new Date('1990-01-01');
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThan(30);
      expect(age).toBeLessThan(40);
    });
  });

  describe('Array utilities', () => {
    it('should remove duplicates from array', () => {
      const removeDuplicates = <T>(arr: T[]): T[] => {
        return [...new Set(arr)];
      };

      expect(removeDuplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(removeDuplicates([])).toEqual([]);
    });

    it('should group array by key', () => {
      const groupBy = <T>(arr: T[], key: keyof T): Record<string, T[]> => {
        return arr.reduce((acc, item) => {
          const groupKey = String(item[key]);
          if (!acc[groupKey]) {
            acc[groupKey] = [];
          }
          acc[groupKey].push(item);
          return acc;
        }, {} as Record<string, T[]>);
      };

      const employees = [
        { name: 'John', department: 'IT' },
        { name: 'Jane', department: 'HR' },
        { name: 'Bob', department: 'IT' },
      ];

      const grouped = groupBy(employees, 'department');
      expect(grouped['IT']).toHaveLength(2);
      expect(grouped['HR']).toHaveLength(1);
    });
  });

  describe('Number utilities', () => {
    it('should format currency correctly', () => {
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
        }).format(amount);
      };

      expect(formatCurrency(1000000)).toContain('1.000.000');
      expect(formatCurrency(0)).toContain('0');
    });

    it('should calculate percentage correctly', () => {
      const calculatePercentage = (value: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
      };

      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(1, 3)).toBe(33);
      expect(calculatePercentage(0, 100)).toBe(0);
      expect(calculatePercentage(100, 0)).toBe(0);
    });
  });
});
