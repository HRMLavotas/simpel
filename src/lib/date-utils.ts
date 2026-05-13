/**
 * Date Utility Functions
 * Provides date formatting functions for Indonesian locale
 */

/**
 * Format date to Indonesian locale with full options
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in Indonesian
 */
export function formatDateID(
  dateString: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return "-";
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...options,
    };

    return new Intl.DateTimeFormat("id-ID", defaultOptions).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
}

/**
 * Format date to short Indonesian format (DD/MM/YYYY)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDateShortID(dateString: string | Date): string {
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return "-";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
}

/**
 * Format date to ISO format (YYYY-MM-DD) for input fields
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateISO(dateString: string | Date): string {
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

/**
 * Get relative time string (e.g., "2 hari yang lalu")
 * @param dateString - ISO date string or Date object
 * @returns Relative time string in Indonesian
 */
export function getRelativeTime(dateString: string | Date): string {
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return "-";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return "Baru saja";
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    if (diffHour < 24) return `${diffHour} jam yang lalu`;
    if (diffDay < 30) return `${diffDay} hari yang lalu`;
    if (diffMonth < 12) return `${diffMonth} bulan yang lalu`;
    return `${diffYear} tahun yang lalu`;
  } catch (error) {
    console.error("Error getting relative time:", error);
    return "-";
  }
}

/**
 * Calculate age from birth date
 * @param birthDate - ISO date string or Date object
 * @returns Age in years
 */
export function calculateAge(birthDate: string | Date): number {
  try {
    const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
    
    if (isNaN(birth.getTime())) {
      return 0;
    }

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  } catch (error) {
    console.error("Error calculating age:", error);
    return 0;
  }
}

/**
 * Check if date is valid
 * @param dateString - Date string to validate
 * @returns True if valid date
 */
export function isValidDate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Get date range string
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: string | Date,
  endDate: string | Date
): string {
  try {
    const start = formatDateShortID(startDate);
    const end = formatDateShortID(endDate);
    return `${start} - ${end}`;
  } catch (error) {
    console.error("Error formatting date range:", error);
    return "-";
  }
}
