import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateNipFormat,
  validateNikFormat,
  validateBirthDate,
  validateDateLogic,
  nipSchema,
  nikSchema,
  birthDateSchema,
  asnEmployeeSchema,
} from '../employee-schemas';

/**
 * Property-Based Tests for Employee ID Validation
 * 
 * These tests use fast-check to generate many test cases and verify
 * that validation properties hold across all inputs.
 */

describe('Employee ID Format Validation - Property Tests', () => {
  /**
   * Property 1: ID Format Validation
   * **Validates: Requirements 1.1, 1.2**
   * 
   * For any employee ID field (NIP or NIK), when an invalid format is provided
   * (wrong length or non-numeric characters), the validation system should reject
   * the input and display a specific error message explaining the correct format
   * (18 digits for NIP, 16 digits for NIK).
   */
  describe('Property 1: ID Format Validation', () => {
    it('should reject NIP with wrong length and provide specific error message', () => {
      // Generator for strings with wrong length (not 18 digits)
      const wrongLengthNipGenerator = fc.oneof(
        fc.string({ minLength: 1, maxLength: 17 }), // Too short (exclude empty string)
        fc.string({ minLength: 19, maxLength: 30 })  // Too long
      );

      fc.assert(
        fc.property(wrongLengthNipGenerator, (invalidNip) => {
          const result = validateNipFormat(invalidNip);
          
          // Property: All wrong-length NIPs should be rejected
          expect(result.valid).toBe(false);
          
          // Property: Error message should be in Indonesian and mention "18 digit"
          expect(result.error).toBeDefined();
          expect(result.error).toContain('NIP');
          expect(result.error).toContain('18 digit');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject NIP with non-numeric characters and provide specific error message', () => {
      // Generator for 18-character strings containing at least one non-digit
      const nonNumericNipGenerator = fc.tuple(
        fc.string({ minLength: 0, maxLength: 17 }),
        fc.constantFrom('A', 'B', 'X', 'Z', '!', '@', '#', '-', ' '), // Non-digit character
        fc.string({ minLength: 0, maxLength: 17 })
      ).map(([prefix, nonDigit, suffix]) => {
        const combined = prefix + nonDigit + suffix;
        // Pad or trim to exactly 18 characters
        if (combined.length < 18) {
          return (combined + 'A'.repeat(18)).substring(0, 18);
        }
        return combined.substring(0, 18);
      });

      fc.assert(
        fc.property(nonNumericNipGenerator, (invalidNip) => {
          // Skip if somehow we got all digits (shouldn't happen with our generator)
          fc.pre(/\D/.test(invalidNip));
          
          const result = validateNipFormat(invalidNip);
          
          // Property: All non-numeric NIPs should be rejected
          expect(result.valid).toBe(false);
          
          // Property: Error message should be in Indonesian and mention "angka"
          expect(result.error).toBeDefined();
          expect(result.error).toContain('NIP');
          expect(result.error).toContain('angka');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject NIK with wrong length and provide specific error message', () => {
      // Generator for strings with wrong length (not 16 digits)
      const wrongLengthNikGenerator = fc.oneof(
        fc.string({ minLength: 0, maxLength: 15 }), // Too short
        fc.string({ minLength: 17, maxLength: 30 })  // Too long
      );

      fc.assert(
        fc.property(wrongLengthNikGenerator, (invalidNik) => {
          const result = validateNikFormat(invalidNik);
          
          // Property: All wrong-length NIKs should be rejected
          expect(result.valid).toBe(false);
          
          // Property: Error message should be in Indonesian and mention "16 digit"
          expect(result.error).toBeDefined();
          expect(result.error).toContain('NIK');
          expect(result.error).toContain('16 digit');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject NIK with non-numeric characters and provide specific error message', () => {
      // Generator for 16-character strings containing at least one non-digit
      const nonNumericNikGenerator = fc.tuple(
        fc.string({ minLength: 0, maxLength: 15 }),
        fc.constantFrom('A', 'B', 'X', 'Z', '!', '@', '#', '-', ' '), // Non-digit character
        fc.string({ minLength: 0, maxLength: 15 })
      ).map(([prefix, nonDigit, suffix]) => {
        const combined = prefix + nonDigit + suffix;
        // Pad or trim to exactly 16 characters
        if (combined.length < 16) {
          return (combined + 'A'.repeat(16)).substring(0, 16);
        }
        return combined.substring(0, 16);
      });

      fc.assert(
        fc.property(nonNumericNikGenerator, (invalidNik) => {
          // Skip if somehow we got all digits (shouldn't happen with our generator)
          fc.pre(/\D/.test(invalidNik));
          
          const result = validateNikFormat(invalidNik);
          
          // Property: All non-numeric NIKs should be rejected
          expect(result.valid).toBe(false);
          
          // Property: Error message should be in Indonesian and mention "angka"
          expect(result.error).toBeDefined();
          expect(result.error).toContain('NIK');
          expect(result.error).toContain('angka');
        }),
        { numRuns: 100 }
      );
    });

    it('should accept valid NIP format (18 numeric digits)', () => {
      // Generator for valid 18-digit numeric strings
      const validNipGenerator = fc.array(fc.integer({ min: 0, max: 9 }), {
        minLength: 18,
        maxLength: 18,
      }).map(digits => digits.join(''));

      fc.assert(
        fc.property(validNipGenerator, (validNip) => {
          const result = validateNipFormat(validNip);
          
          // Property: All 18-digit numeric strings should be accepted
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should accept valid NIK format (16 numeric digits)', () => {
      // Generator for valid 16-digit numeric strings
      const validNikGenerator = fc.array(fc.integer({ min: 0, max: 9 }), {
        minLength: 16,
        maxLength: 16,
      }).map(digits => digits.join(''));

      fc.assert(
        fc.property(validNikGenerator, (validNik) => {
          const result = validateNikFormat(validNik);
          
          // Property: All 16-digit numeric strings should be accepted
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases: empty strings and special characters', () => {
      // Generator for edge case strings
      const edgeCaseGenerator = fc.oneof(
        fc.constant(''),
        fc.constant('   '),
        fc.constant('----------------'),
        fc.constant('AAAAAAAAAAAAAAAA'),
        fc.constant('1234567890123456789012345678'), // Very long
        fc.constant('!@#$%^&*()_+{}[]'),
      );

      fc.assert(
        fc.property(edgeCaseGenerator, (edgeCase) => {
          const nipResult = validateNipFormat(edgeCase);
          const nikResult = validateNikFormat(edgeCase);
          
          // Property: Edge cases should be rejected with error messages
          // Exception: empty string is allowed for optional NIP field
          if (edgeCase === '') {
            expect(nipResult.valid).toBe(true); // NIP is optional
          } else {
            expect(nipResult.valid).toBe(false);
            expect(nipResult.error).toBeDefined();
          }
          
          // NIK is always required, so empty should fail
          expect(nikResult.valid).toBe(false);
          expect(nikResult.error).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should provide Indonesian error messages for all invalid formats', () => {
      // Generator for various invalid formats
      const invalidFormatGenerator = fc.oneof(
        fc.string({ minLength: 1, maxLength: 10 }), // Too short
        fc.string({ minLength: 20, maxLength: 30 }), // Too long
        fc.array(fc.constantFrom('A', 'B', 'X', 'Z', '!', '@', '#', '-', ' '), {
          minLength: 16,
          maxLength: 18,
        }).map(chars => chars.join('')), // Non-numeric
      );

      fc.assert(
        fc.property(invalidFormatGenerator, (invalidFormat) => {
          const nipResult = nipSchema.safeParse(invalidFormat);
          const nikResult = nikSchema.safeParse(invalidFormat);
          
          // Property: All error messages should be in Indonesian
          if (!nipResult.success) {
            const errorMessage = nipResult.error.errors[0]?.message || '';
            // Check for Indonesian keywords
            const hasIndonesianKeywords = 
              errorMessage.includes('harus') ||
              errorMessage.includes('digit') ||
              errorMessage.includes('angka') ||
              errorMessage.includes('boleh');
            expect(hasIndonesianKeywords).toBe(true);
          }
          
          if (!nikResult.success) {
            const errorMessage = nikResult.error.errors[0]?.message || '';
            // Check for Indonesian keywords
            const hasIndonesianKeywords = 
              errorMessage.includes('harus') ||
              errorMessage.includes('digit') ||
              errorMessage.includes('angka') ||
              errorMessage.includes('boleh');
            expect(hasIndonesianKeywords).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});

describe('Date Validation - Property Tests', () => {
  /**
   * Property 3: Future Date Rejection
   * **Validates: Requirements 1.5**
   * 
   * For any birth date input, if the date is in the future (after the current date),
   * the validation system should reject the input and display an error message.
   */
  describe('Property 3: Future Date Rejection', () => {
    it('should reject future birth dates with Indonesian error message', () => {
      // Generator for dates in the future (tomorrow onwards, up to 10 years ahead)
      const futureDateGenerator = fc.date({
        min: new Date(Date.now() + 86400000), // Tomorrow
        max: new Date(Date.now() + 10 * 365 * 86400000), // 10 years ahead
      }).map(date => date.toISOString().split('T')[0]); // Format as YYYY-MM-DD

      fc.assert(
        fc.property(futureDateGenerator, (futureDate) => {
          // Skip invalid dates
          fc.pre(!isNaN(new Date(futureDate).getTime()));
          
          const result = validateBirthDate(futureDate);
          
          // Property: All future dates should be rejected
          expect(result.valid).toBe(false);
          
          // Property: Error message should be in Indonesian and mention "masa depan"
          expect(result.error).toBeDefined();
          expect(result.error).toContain('Tanggal lahir');
          expect(result.error).toContain('masa depan');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject future dates using birthDateSchema directly', () => {
      // Generator for future date strings
      const futureDateGenerator = fc.date({
        min: new Date(Date.now() + 86400000), // Tomorrow
        max: new Date(Date.now() + 10 * 365 * 86400000), // 10 years ahead
      }).map(date => date.toISOString().split('T')[0]);

      fc.assert(
        fc.property(futureDateGenerator, (futureDate) => {
          const result = birthDateSchema.safeParse(futureDate);
          
          // Property: Schema should reject all future dates
          expect(result.success).toBe(false);
          
          if (!result.success) {
            const errorMessage = result.error.errors[0]?.message || '';
            expect(errorMessage).toContain('masa depan');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should accept past and present birth dates', () => {
      // Generator for dates in the past (from 100 years ago to today)
      const pastDateGenerator = fc.date({
        min: new Date(Date.now() - 100 * 365 * 86400000), // 100 years ago
        max: new Date(), // Today
      }).map(date => date.toISOString().split('T')[0]);

      fc.assert(
        fc.property(pastDateGenerator, (pastDate) => {
          const result = validateBirthDate(pastDate);
          
          // Property: All past and present dates should be accepted
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should accept empty string for optional birth date field', () => {
      const result = validateBirthDate('');
      
      // Property: Empty string should be accepted (optional field)
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case: today\'s date as birth date', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = validateBirthDate(today);
      
      // Property: Today's date should be accepted (not in the future)
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  /**
   * Property 4: Date Logic Validation
   * **Validates: Requirements 1.6**
   * 
   * For any employee record with both birth date and join date, if the join date
   * is before the birth date, the validation system should reject the input and
   * display an error message.
   */
  describe('Property 4: Date Logic Validation', () => {
    it('should reject join dates before birth dates with Indonesian error message', () => {
      // Generator for birth dates (from 80 years ago to 18 years ago - working age)
      const birthDateGenerator = fc.date({
        min: new Date(Date.now() - 80 * 365 * 86400000), // 80 years ago
        max: new Date(Date.now() - 18 * 365 * 86400000), // 18 years ago
      });

      fc.assert(
        fc.property(birthDateGenerator, (birthDate) => {
          // Skip invalid dates
          fc.pre(!isNaN(birthDate.getTime()));
          
          // Generate join date before birth date (1 day to 1 year before)
          const daysBeforeBirth = Math.floor(Math.random() * 365) + 1;
          const joinDate = new Date(birthDate.getTime() - daysBeforeBirth * 86400000);
          
          const birthDateStr = birthDate.toISOString().split('T')[0];
          const joinDateStr = joinDate.toISOString().split('T')[0];
          
          const result = validateDateLogic(birthDateStr, joinDateStr);
          
          // Property: Join date before birth date should be rejected
          expect(result.valid).toBe(false);
          
          // Property: Error message should be in Indonesian
          expect(result.error).toBeDefined();
          expect(result.error).toContain('Tanggal masuk');
          expect(result.error).toContain('sebelum');
          expect(result.error).toContain('tanggal lahir');
        }),
        { numRuns: 100 }
      );
    });

    it('should accept join dates on or after birth dates', () => {
      // Generator for birth dates
      const birthDateGenerator = fc.date({
        min: new Date(Date.now() - 80 * 365 * 86400000), // 80 years ago
        max: new Date(Date.now() - 18 * 365 * 86400000), // 18 years ago
      });

      fc.assert(
        fc.property(birthDateGenerator, (birthDate) => {
          // Generate join date after birth date (18 to 60 years after birth)
          const daysAfterBirth = Math.floor(Math.random() * (60 - 18) * 365) + 18 * 365;
          const joinDate = new Date(birthDate.getTime() + daysAfterBirth * 86400000);
          
          const birthDateStr = birthDate.toISOString().split('T')[0];
          const joinDateStr = joinDate.toISOString().split('T')[0];
          
          const result = validateDateLogic(birthDateStr, joinDateStr);
          
          // Property: Join date after birth date should be accepted
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid date logic in full employee schema', () => {
      // Generator for employee data with invalid date logic
      const invalidEmployeeGenerator = fc.record({
        nip: fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 18, maxLength: 18 })
          .map(digits => digits.join('')),
        name: fc.string({ minLength: 3, maxLength: 50 }),
        birth_date: fc.date({
          min: new Date(Date.now() - 80 * 365 * 86400000),
          max: new Date(Date.now() - 18 * 365 * 86400000),
        }).map(date => date.toISOString().split('T')[0]),
        department: fc.constant('Test Department'),
        asn_status: fc.constant('PNS'),
      }).chain(base => {
        // Skip invalid dates
        const birthDate = new Date(base.birth_date);
        if (isNaN(birthDate.getTime())) {
          return fc.constant(null);
        }
        
        // Generate join date before birth date
        const daysBeforeBirth = Math.floor(Math.random() * 365) + 1;
        const joinDate = new Date(birthDate.getTime() - daysBeforeBirth * 86400000);
        
        return fc.constant({
          ...base,
          join_date: joinDate.toISOString().split('T')[0],
        });
      });

      fc.assert(
        fc.property(invalidEmployeeGenerator, (employee) => {
          // Skip null values from invalid dates
          fc.pre(employee !== null);
          
          const result = asnEmployeeSchema.safeParse(employee);
          
          // Property: Schema should reject employees with join date before birth date
          expect(result.success).toBe(false);
          
          if (!result.success) {
            const joinDateError = result.error.errors.find(
              err => err.path.includes('join_date')
            );
            expect(joinDateError).toBeDefined();
            expect(joinDateError?.message).toContain('sebelum tanggal lahir');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should accept valid date logic in full employee schema', () => {
      // Generator for employee data with valid date logic
      const validEmployeeGenerator = fc.record({
        nip: fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 18, maxLength: 18 })
          .map(digits => digits.join('')),
        name: fc.string({ minLength: 3, maxLength: 50 }),
        birth_date: fc.date({
          min: new Date(Date.now() - 80 * 365 * 86400000),
          max: new Date(Date.now() - 18 * 365 * 86400000),
        }).map(date => date.toISOString().split('T')[0]),
        department: fc.constant('Test Department'),
        asn_status: fc.constant('PNS'),
      }).chain(base => {
        // Generate join date after birth date (18 to 60 years after)
        const birthDate = new Date(base.birth_date);
        const daysAfterBirth = Math.floor(Math.random() * (60 - 18) * 365) + 18 * 365;
        const joinDate = new Date(birthDate.getTime() + daysAfterBirth * 86400000);
        
        return fc.constant({
          ...base,
          join_date: joinDate.toISOString().split('T')[0],
        });
      });

      fc.assert(
        fc.property(validEmployeeGenerator, (employee) => {
          const result = asnEmployeeSchema.safeParse(employee);
          
          // Property: Schema should accept employees with valid date logic
          // Note: May fail for other validation reasons, but not for date logic
          if (!result.success) {
            const joinDateError = result.error.errors.find(
              err => err.path.includes('join_date') && err.message.includes('sebelum')
            );
            expect(joinDateError).toBeUndefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle empty date strings gracefully', () => {
      // Property: Empty strings should be accepted (optional fields)
      const result1 = validateDateLogic('', '2024-01-01');
      expect(result1.valid).toBe(true);
      
      const result2 = validateDateLogic('2024-01-01', '');
      expect(result2.valid).toBe(true);
      
      const result3 = validateDateLogic('', '');
      expect(result3.valid).toBe(true);
    });

    it('should handle same date for birth and join (edge case)', () => {
      // Generator for dates
      const dateGenerator = fc.date({
        min: new Date(Date.now() - 80 * 365 * 86400000),
        max: new Date(Date.now() - 18 * 365 * 86400000),
      }).map(date => date.toISOString().split('T')[0]);

      fc.assert(
        fc.property(dateGenerator, (dateStr) => {
          // Skip invalid dates
          fc.pre(!isNaN(new Date(dateStr).getTime()));
          
          const result = validateDateLogic(dateStr, dateStr);
          
          // Property: Same date should be accepted (join date >= birth date)
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should validate date logic with various time gaps', () => {
      // Generator for birth dates and time gaps
      const dateWithGapGenerator = fc.record({
        birthDate: fc.date({
          min: new Date(Date.now() - 80 * 365 * 86400000),
          max: new Date(Date.now() - 18 * 365 * 86400000),
        }),
        daysGap: fc.integer({ min: -365, max: 60 * 365 }), // -1 year to +60 years
      });

      fc.assert(
        fc.property(dateWithGapGenerator, ({ birthDate, daysGap }) => {
          // Skip invalid dates
          fc.pre(!isNaN(birthDate.getTime()));
          
          const joinDate = new Date(birthDate.getTime() + daysGap * 86400000);
          
          // Skip if join date is also invalid
          fc.pre(!isNaN(joinDate.getTime()));
          
          const birthDateStr = birthDate.toISOString().split('T')[0];
          const joinDateStr = joinDate.toISOString().split('T')[0];
          
          const result = validateDateLogic(birthDateStr, joinDateStr);
          
          // Property: Result should match expected validation based on gap
          if (daysGap < 0) {
            // Join date before birth date - should be rejected
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          } else {
            // Join date on or after birth date - should be accepted
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
