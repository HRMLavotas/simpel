import { describe, it, expect } from 'vitest';
import {
  nipSchema,
  nikSchema,
  birthDateSchema,
  asnEmployeeSchema,
  nonAsnEmployeeSchema,
  validateNipFormat,
  validateNikFormat,
  validateBirthDate,
  validateDateLogic,
} from '../employee-schemas';

describe('Employee Validation Schemas', () => {
  describe('NIP Schema', () => {
    it('should accept valid 18-digit NIP', () => {
      const result = nipSchema.safeParse('123456789012345678');
      expect(result.success).toBe(true);
    });

    it('should reject NIP with less than 18 digits', () => {
      const result = nipSchema.safeParse('12345');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('NIP harus 18 digit');
      }
    });

    it('should reject NIP with more than 18 digits', () => {
      const result = nipSchema.safeParse('1234567890123456789');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('NIP harus 18 digit');
      }
    });

    it('should reject NIP with non-numeric characters', () => {
      const result = nipSchema.safeParse('12345678901234567A');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('NIP hanya boleh berisi angka');
      }
    });

    it('should accept empty string', () => {
      const result = nipSchema.safeParse('');
      expect(result.success).toBe(true);
    });
  });

  describe('NIK Schema', () => {
    it('should accept valid 16-digit NIK', () => {
      const result = nikSchema.safeParse('1234567890123456');
      expect(result.success).toBe(true);
    });

    it('should reject NIK with less than 16 digits', () => {
      const result = nikSchema.safeParse('12345');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('NIK harus 16 digit');
      }
    });

    it('should reject NIK with more than 16 digits', () => {
      const result = nikSchema.safeParse('12345678901234567');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('NIK harus 16 digit');
      }
    });

    it('should reject NIK with non-numeric characters', () => {
      const result = nikSchema.safeParse('123456789012345A');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('NIK hanya boleh berisi angka');
      }
    });
  });

  describe('Birth Date Schema', () => {
    it('should accept past dates', () => {
      const pastDate = '1990-01-01';
      const result = birthDateSchema.safeParse(pastDate);
      expect(result.success).toBe(true);
    });

    it('should accept today', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = birthDateSchema.safeParse(today);
      expect(result.success).toBe(true);
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const result = birthDateSchema.safeParse(futureDateStr);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Tanggal lahir tidak boleh di masa depan');
      }
    });

    it('should accept empty string', () => {
      const result = birthDateSchema.safeParse('');
      expect(result.success).toBe(true);
    });
  });

  describe('ASN Employee Schema - Cross-field Validation', () => {
    it('should accept valid employee data', () => {
      const validData = {
        nip: '123456789012345678',
        name: 'Ahmad Suryadi',
        front_title: 'Dr.',
        back_title: 'M.Kom',
        birth_place: 'Jakarta',
        birth_date: '1990-01-01',
        gender: 'Laki-laki',
        religion: 'Islam',
        position_type: 'Struktural',
        position_name: 'Kepala Seksi',
        asn_status: 'PNS',
        rank_group: 'III/a',
        department: 'Setditjen Binalavotas',
        join_date: '2015-01-01',
        tmt_cpns: '2015-01-01',
        tmt_pns: '2017-01-01',
        tmt_pensiun: '2050-01-01',
      };

      const result = asnEmployeeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject when join date is before birth date', () => {
      const invalidData = {
        nip: '123456789012345678',
        name: 'Ahmad Suryadi',
        birth_date: '1990-01-01',
        join_date: '1989-01-01', // Before birth date
        asn_status: 'PNS',
        department: 'Setditjen Binalavotas',
      };

      const result = asnEmployeeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.errors.find(e => e.path.includes('join_date'));
        expect(error?.message).toBe('Tanggal masuk tidak boleh sebelum tanggal lahir');
      }
    });

    it('should reject when TMT CPNS is before birth date', () => {
      const invalidData = {
        nip: '123456789012345678',
        name: 'Ahmad Suryadi',
        birth_date: '1990-01-01',
        tmt_cpns: '1989-01-01', // Before birth date
        asn_status: 'PNS',
        department: 'Setditjen Binalavotas',
      };

      const result = asnEmployeeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.errors.find(e => e.path.includes('tmt_cpns'));
        expect(error?.message).toBe('TMT CPNS tidak boleh sebelum tanggal lahir');
      }
    });

    it('should reject when TMT PNS is before TMT CPNS', () => {
      const invalidData = {
        nip: '123456789012345678',
        name: 'Ahmad Suryadi',
        birth_date: '1990-01-01',
        tmt_cpns: '2015-01-01',
        tmt_pns: '2014-01-01', // Before TMT CPNS
        asn_status: 'PNS',
        department: 'Setditjen Binalavotas',
      };

      const result = asnEmployeeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.errors.find(e => e.path.includes('tmt_pns'));
        expect(error?.message).toBe('TMT PNS tidak boleh sebelum TMT CPNS');
      }
    });

    it('should require name with minimum 3 characters', () => {
      const invalidData = {
        nip: '123456789012345678',
        name: 'AB', // Too short
        asn_status: 'PNS',
        department: 'Setditjen Binalavotas',
      };

      const result = asnEmployeeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.errors.find(e => e.path.includes('name'));
        expect(error?.message).toBe('Nama minimal 3 karakter');
      }
    });

    it('should require department', () => {
      const invalidData = {
        nip: '123456789012345678',
        name: 'Ahmad Suryadi',
        asn_status: 'PNS',
        department: '', // Empty
      };

      const result = asnEmployeeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.errors.find(e => e.path.includes('department'));
        expect(error?.message).toBe('Unit kerja wajib dipilih');
      }
    });

    it('should require ASN status', () => {
      const invalidData = {
        nip: '123456789012345678',
        name: 'Ahmad Suryadi',
        asn_status: '', // Empty
        department: 'Setditjen Binalavotas',
      };

      const result = asnEmployeeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.errors.find(e => e.path.includes('asn_status'));
        expect(error?.message).toBe('Status ASN wajib dipilih');
      }
    });
  });

  describe('Non-ASN Employee Schema', () => {
    it('should accept valid Non-ASN employee data', () => {
      const validData = {
        nip: '1234567890123456', // NIK (16 digits)
        name: 'Budi Santoso',
        position_name: 'Tenaga Administrasi',
        birth_place: 'Bandung',
        birth_date: '1995-05-15',
        gender: 'Laki-laki',
        religion: 'Islam',
        department: 'Setditjen Binalavotas',
        rank_group: 'Tenaga Alih Daya',
        keterangan_penugasan: 'Penugasan di bagian administrasi',
        keterangan_perubahan: '',
      };

      const result = nonAsnEmployeeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require NIK (16 digits)', () => {
      const invalidData = {
        nip: '12345', // Too short
        name: 'Budi Santoso',
        position_name: 'Tenaga Administrasi',
        department: 'Setditjen Binalavotas',
        rank_group: 'Tenaga Alih Daya',
      };

      const result = nonAsnEmployeeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.errors.find(e => e.path.includes('nip'));
        expect(error?.message).toBe('NIK harus 16 digit');
      }
    });

    it('should require position name', () => {
      const invalidData = {
        nip: '1234567890123456',
        name: 'Budi Santoso',
        position_name: '', // Empty
        department: 'Setditjen Binalavotas',
        rank_group: 'Tenaga Alih Daya',
      };

      const result = nonAsnEmployeeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.errors.find(e => e.path.includes('position_name'));
        expect(error?.message).toBe('Jabatan wajib diisi');
      }
    });

    it('should require rank group (Non-ASN type)', () => {
      const invalidData = {
        nip: '1234567890123456',
        name: 'Budi Santoso',
        position_name: 'Tenaga Administrasi',
        department: 'Setditjen Binalavotas',
        rank_group: '', // Empty
      };

      const result = nonAsnEmployeeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.errors.find(e => e.path.includes('rank_group'));
        expect(error?.message).toBe('Jenis Non-ASN wajib dipilih');
      }
    });
  });

  describe('Helper Functions', () => {
    describe('validateNipFormat', () => {
      it('should return valid for correct NIP', () => {
        const result = validateNipFormat('123456789012345678');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should return invalid for incorrect NIP', () => {
        const result = validateNipFormat('12345');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIP harus 18 digit');
      });
    });

    describe('validateNikFormat', () => {
      it('should return valid for correct NIK', () => {
        const result = validateNikFormat('1234567890123456');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should return invalid for incorrect NIK', () => {
        const result = validateNikFormat('12345');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIK harus 16 digit');
      });
    });

    describe('validateBirthDate', () => {
      it('should return valid for past date', () => {
        const result = validateBirthDate('1990-01-01');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should return invalid for future date', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const futureDateStr = futureDate.toISOString().split('T')[0];
        
        const result = validateBirthDate(futureDateStr);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Tanggal lahir tidak boleh di masa depan');
      });
    });

    describe('validateDateLogic', () => {
      it('should return valid when join date is after birth date', () => {
        const result = validateDateLogic('1990-01-01', '2015-01-01');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should return invalid when join date is before birth date', () => {
        const result = validateDateLogic('1990-01-01', '1989-01-01');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Tanggal masuk tidak boleh sebelum tanggal lahir');
      });

      it('should return valid for empty dates', () => {
        const result = validateDateLogic('', '');
        expect(result.valid).toBe(true);
      });
    });
  });
});
