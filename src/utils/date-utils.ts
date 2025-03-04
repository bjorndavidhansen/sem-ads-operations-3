/**
 * Date and time utility functions for formatting and manipulating dates
 */

/**
 * Format a date string or timestamp into a user-friendly date format
 * 
 * @param dateString - ISO date string or timestamp
 * @param format - Optional format type ('short', 'medium', 'long')
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string | number, 
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    console.error('Invalid date provided to formatDate:', dateString);
    return 'Invalid date';
  }
  
  try {
    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'long':
        return date.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'medium':
      default:
        return date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toISOString().split('T')[0]; // Fallback to YYYY-MM-DD
  }
};

/**
 * Format a date string or timestamp into a user-friendly time format
 * 
 * @param dateString - ISO date string or timestamp 
 * @param includeSeconds - Whether to include seconds in the output
 * @returns Formatted time string
 */
export const formatTime = (
  dateString: string | number,
  includeSeconds = false
): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    console.error('Invalid date provided to formatTime:', dateString);
    return 'Invalid time';
  }
  
  try {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return date.toISOString().split('T')[1].substring(0, includeSeconds ? 8 : 5); // Fallback to HH:MM(:SS)
  }
};

/**
 * Format a date string or timestamp into a user-friendly date and time format
 * 
 * @param dateString - ISO date string or timestamp
 * @param includeSeconds - Whether to include seconds in the time portion
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  dateString: string | number,
  includeSeconds = false
): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    console.error('Invalid date provided to formatDateTime:', dateString);
    return 'Invalid date/time';
  }
  
  try {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined
    });
  } catch (error) {
    console.error('Error formatting date and time:', error);
    // Fallback to YYYY-MM-DD HH:MM(:SS)
    const isoString = date.toISOString();
    return `${isoString.split('T')[0]} ${isoString.split('T')[1].substring(0, includeSeconds ? 8 : 5)}`;
  }
};

/**
 * Get a relative time string (e.g., "2 hours ago", "yesterday", etc.)
 * 
 * @param dateString - ISO date string or timestamp to compare against now
 * @returns Human-readable relative time string
 */
export const getRelativeTimeString = (dateString: string | number): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    console.error('Invalid date provided to getRelativeTimeString:', dateString);
    return 'Invalid date';
  }
  
  try {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else {
      return formatDate(date, 'medium');
    }
  } catch (error) {
    console.error('Error creating relative time string:', error);
    return formatDate(date, 'medium'); // Fallback to regular date format
  }
};

/**
 * Group data by date (day, week, month, etc.)
 * 
 * @param data - Array of objects with a timestamp property
 * @param timestampKey - Key in the data objects that contains the timestamp
 * @param groupBy - Type of grouping ('day', 'week', 'month')
 * @returns Object with dates as keys and arrays of matching data as values
 */
export const groupDataByDate = <T extends { [key: string]: any }>(
  data: T[],
  timestampKey: keyof T,
  groupBy: 'day' | 'week' | 'month' = 'day'
): { [key: string]: T[] } => {
  if (!data || !data.length) return {};
  
  const result: { [key: string]: T[] } = {};
  
  data.forEach(item => {
    const date = new Date(item[timestampKey] as string | number);
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date in groupDataByDate:', item[timestampKey]);
      return;
    }
    
    let groupKey: string;
    
    switch (groupBy) {
      case 'week':
        // Get the first day of the week (Sunday)
        const dayOfWeek = date.getDay();
        const firstDayOfWeek = new Date(date);
        firstDayOfWeek.setDate(date.getDate() - dayOfWeek);
        groupKey = firstDayOfWeek.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
        
      case 'month':
        groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
        
      case 'day':
      default:
        groupKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
    }
    
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    
    result[groupKey].push(item);
  });
  
  return result;
};

/**
 * Calculate the start date based on a timeframe
 * 
 * @param timeframe - Metrics timeframe (e.g., 'last24Hours', 'lastWeek')
 * @returns Date object representing the start of the timeframe
 */
export const getTimeframeStartDate = (timeframe: string): Date => {
  const now = new Date();
  
  switch (timeframe) {
    case 'last24Hours':
      const yesterday = new Date(now);
      yesterday.setHours(now.getHours() - 24);
      return yesterday;
      
    case 'lastWeek':
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      return lastWeek;
      
    case 'lastMonth':
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      return lastMonth;
      
    case 'lastQuarter':
      const lastQuarter = new Date(now);
      lastQuarter.setMonth(now.getMonth() - 3);
      return lastQuarter;
      
    default:
      console.warn(`Unknown timeframe: ${timeframe}, defaulting to last 7 days`);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return sevenDaysAgo;
  }
};
