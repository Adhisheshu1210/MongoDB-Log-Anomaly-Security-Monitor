/**
 * Role-based dataset view sanitizer.
 */

const SENSITIVE_KEY_PATTERN = /(password|passwd|secret|token|api[_-]?key|session|cookie|credential|private|email|phone|ssn|ip|user(name)?|account|auth)/i;

const CORE_VIEWER_FIELDS = [
  'timestamp',
  'severity',
  'source',
  'component',
  'classification',
  'is_anomaly',
  'isAnomaly',
  'anomaly_score',
  'anomalyScore',
  'event_type',
  'eventType',
  'action',
  'status',
  'message'
];

const maskValue = (value) => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    if (value.length <= 4) return '****';
    return `${value.slice(0, 2)}***${value.slice(-2)}`;
  }

  if (typeof value === 'number') {
    return -1;
  }

  if (Array.isArray(value)) {
    return value.map(maskValue);
  }

  if (typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = SENSITIVE_KEY_PATTERN.test(key) ? '***MASKED***' : maskValue(value[key]);
      return acc;
    }, {});
  }

  return '***MASKED***';
};

const sanitizeForUser = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  return Object.keys(obj).reduce((acc, key) => {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      acc[key] = maskValue(obj[key]);
      return acc;
    }

    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      acc[key] = sanitizeForUser(value);
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
};

const sanitizeForViewer = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const filtered = {};
  for (const key of CORE_VIEWER_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      filtered[key] = obj[key];
    }
  }

  return filtered;
};

const sanitizeByRole = (record, role) => {
  if (role === 'admin') return record;
  if (role === 'user') return sanitizeForUser(record);
  return sanitizeForViewer(record);
};

module.exports = {
  sanitizeByRole
};
