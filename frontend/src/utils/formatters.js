/**
 * Data Formatting Utilities
 * Format various types of data for display
 */

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Include time in output
 * @returns {string}
 */
export const formatDate = (date, includeTime = true) => {
  if (!date) return '-';
  const d = new Date(date);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
  }
  return d.toLocaleDateString('en-US', options);
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Size in bytes
 * @returns {string}
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string}
 */
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '-';
  return parseFloat(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format percentage
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string}
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return '-';
  return formatNumber(value * 100, decimals) + '%';
};

/**
 * Format duration in milliseconds to readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string}
 */
export const formatDuration = (ms) => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
};

/**
 * Format IP address (truncate for readability if needed)
 * @param {string} ip - IP address
 * @returns {string}
 */
export const formatIP = (ip) => {
  if (!ip) return '-';
  return ip;
};

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
export const truncateString = (str, maxLength = 50) => {
  if (!str) return '-';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
};

/**
 * Format JSON for display
 * @param {object} obj - Object to format
 * @param {number} spaces - Number of spaces for indentation
 * @returns {string}
 */
export const formatJSON = (obj, spaces = 2) => {
  try {
    return JSON.stringify(obj, null, spaces);
  } catch (e) {
    return JSON.stringify(obj);
  }
};

/**
 * Format severity badge
 * @param {string} severity - Severity level
 * @returns {object}
 */
export const formatSeverity = (severity) => {
  const severityMap = {
    critical: { label: 'Critical', className: 'bg-red-500 text-white' },
    high: { label: 'High', className: 'bg-orange-500 text-white' },
    medium: { label: 'Medium', className: 'bg-yellow-500 text-black' },
    low: { label: 'Low', className: 'bg-cyan-500 text-white' },
    info: { label: 'Info', className: 'bg-blue-500 text-white' },
  };
  return severityMap[severity] || { label: 'Unknown', className: 'bg-gray-500 text-white' };
};

/**
 * Format status with badge styling
 * @param {string} status - Status value
 * @returns {object}
 */
export const formatStatus = (status) => {
  const statusMap = {
    open: { label: 'Open', className: 'bg-blue-500 text-white' },
    acknowledged: { label: 'Acknowledged', className: 'bg-yellow-500 text-black' },
    resolved: { label: 'Resolved', className: 'bg-green-500 text-white' },
    escalated: { label: 'Escalated', className: 'bg-red-500 text-white' },
    healthy: { label: 'Healthy', className: 'bg-green-500 text-white' },
    warning: { label: 'Warning', className: 'bg-yellow-500 text-black' },
    critical: { label: 'Critical', className: 'bg-red-500 text-white' },
    offline: { label: 'Offline', className: 'bg-gray-500 text-white' },
  };
  return statusMap[status] || { label: status, className: 'bg-gray-500 text-white' };
};

/**
 * Format user name
 * @param {object} user - User object with firstName, lastName, or name
 * @returns {string}
 */
export const formatUserName = (user) => {
  if (!user) return '-';
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.name || user.email || '-';
};

/**
 * Format email (masked for privacy)
 * @param {string} email - Email address
 * @param {boolean} masked - Mask email
 * @returns {string}
 */
export const formatEmail = (email, masked = false) => {
  if (!email) return '-';
  if (!masked) return email;
  const [local, domain] = email.split('@');
  return `${local.substring(0, 2)}***@${domain}`;
};

/**
 * Format array of items as comma-separated string
 * @param {array} items - Items to format
 * @returns {string}
 */
export const formatArray = (items) => {
  if (!Array.isArray(items)) return '-';
  return items.join(', ');
};

export default {
  formatDate,
  formatRelativeTime,
  formatBytes,
  formatNumber,
  formatPercentage,
  formatDuration,
  formatIP,
  truncateString,
  formatJSON,
  formatSeverity,
  formatStatus,
  formatUserName,
  formatEmail,
  formatArray,
};
