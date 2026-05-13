/**
 * Chart Helper Utilities
 * Functions for preparing data for Recharts
 */

import { CHART_COLORS, SEVERITY_COLORS } from './constants.js';

/**
 * Prepare data for pie chart
 * @param {array} data - Raw data array
 * @param {string} nameKey - Key for labels
 * @param {string} valueKey - Key for values
 * @returns {array}
 */
export const preparePieChartData = (data, nameKey = 'name', valueKey = 'value') => {
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    name: item[nameKey],
    value: item[valueKey],
  }));
};

/**
 * Prepare data for line chart
 * @param {array} data - Raw data array
 * @param {string} timeKey - Key for time/date
 * @param {array} valueKeys - Keys for values to plot
 * @returns {array}
 */
export const prepareLineChartData = (data, timeKey = 'timestamp', valueKeys = ['value']) => {
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const chartItem = { [timeKey]: item[timeKey] };
    valueKeys.forEach((key) => {
      chartItem[key] = item[key] || 0;
    });
    return chartItem;
  });
};

/**
 * Prepare data for bar chart
 * @param {array} data - Raw data array
 * @param {string} categoryKey - Key for categories
 * @param {array} valueKeys - Keys for values
 * @returns {array}
 */
export const prepareBarChartData = (data, categoryKey = 'name', valueKeys = ['value']) => {
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const chartItem = { [categoryKey]: item[categoryKey] };
    valueKeys.forEach((key) => {
      chartItem[key] = item[key] || 0;
    });
    return chartItem;
  });
};

/**
 * Get severity distribution data
 * @param {object} severityData - Object with severity counts
 * @returns {array}
 */
export const getSeverityDistributionData = (severityData = {}) => {
  const severities = ['critical', 'high', 'medium', 'low', 'info'];
  return severities.map((severity) => ({
    name: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: severityData[severity] || 0,
    fill: SEVERITY_COLORS[severity],
  }));
};

/**
 * Get time series data for logs
 * @param {array} logs - Array of log objects
 * @returns {array}
 */
export const getTimeSeriesData = (logs = []) => {
  const grouped = {};

  logs.forEach((log) => {
    const date = new Date(log.timestamp).toLocaleDateString();
    grouped[date] = (grouped[date] || 0) + 1;
  });

  return Object.entries(grouped)
    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
    .map(([date, count]) => ({
      date,
      logs: count,
    }));
};

/**
 * Get anomaly categories data
 * @param {array} anomalies - Array of anomaly objects
 * @returns {array}
 */
export const getAnomalyCategoriesData = (anomalies = []) => {
  const grouped = {};

  anomalies.forEach((anomaly) => {
    const category = anomaly.category || 'unknown';
    grouped[category] = (grouped[category] || 0) + 1;
  });

  return Object.entries(grouped)
    .map(([category, count]) => ({
      name: category,
      value: count,
    }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Get system metrics data
 * @param {array} metrics - Array of metric objects
 * @returns {array}
 */
export const getSystemMetricsData = (metrics = []) => {
  if (!Array.isArray(metrics)) return [];
  return metrics.map((metric) => ({
    timestamp: new Date(metric.timestamp).toLocaleTimeString(),
    cpu: metric.cpu || 0,
    memory: metric.memory || 0,
    disk: metric.disk || 0,
  }));
};

/**
 * Get top alert sources
 * @param {array} alerts - Array of alert objects
 * @param {number} limit - Number of top items
 * @returns {array}
 */
export const getTopAlertSources = (alerts = [], limit = 10) => {
  const grouped = {};

  alerts.forEach((alert) => {
    const source = alert.source || 'unknown';
    grouped[source] = (grouped[source] || 0) + 1;
  });

  return Object.entries(grouped)
    .map(([source, count]) => ({
      name: source,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

/**
 * Get threat trend data
 * @param {array} data - Array of data with dates
 * @returns {array}
 */
export const getThreatTrendData = (data = []) => {
  const grouped = {};

  data.forEach((item) => {
    const date = new Date(item.timestamp).toLocaleDateString();
    grouped[date] = (grouped[date] || 0) + 1;
  });

  return Object.entries(grouped)
    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
    .map(([date, count]) => ({
      date,
      threats: count,
    }));
};

/**
 * Get color for data item
 * @param {number} index - Item index
 * @returns {string}
 */
export const getChartColor = (index) => {
  const colors = Object.values(CHART_COLORS);
  return colors[index % colors.length];
};

/**
 * Get colors array for multi-series chart
 * @param {number} count - Number of series
 * @returns {array}
 */
export const getChartColors = (count) => {
  const colors = Object.values(CHART_COLORS);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

/**
 * Format chart tooltip
 * @param {object} payload - Tooltip payload from Recharts
 * @param {string} label - Label for tooltip
 * @returns {string}
 */
export const formatChartTooltip = (payload, label = 'Value') => {
  if (!payload || !payload.length) return '';
  return `${label}: ${payload[0].value}`;
};

/**
 * Get chart dimensions based on container
 * @param {HTMLElement} container - Container element
 * @returns {object}
 */
export const getChartDimensions = (container) => {
  if (!container) return { width: 400, height: 300 };
  return {
    width: container.offsetWidth,
    height: container.offsetHeight,
  };
};

export default {
  preparePieChartData,
  prepareLineChartData,
  prepareBarChartData,
  getSeverityDistributionData,
  getTimeSeriesData,
  getAnomalyCategoriesData,
  getSystemMetricsData,
  getTopAlertSources,
  getThreatTrendData,
  getChartColor,
  getChartColors,
  formatChartTooltip,
  getChartDimensions,
};
