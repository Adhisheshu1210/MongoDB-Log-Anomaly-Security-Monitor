"""
Log Processor - Parses and processes MongoDB log entries
"""

import re
from datetime import datetime
from typing import Dict, Any, Optional

from ..utils.config import Config
from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class LogProcessor:
    """Processes and parses MongoDB log entries"""
    
    # MongoDB log severity levels
    SEVERITY_MAP = {
        'F': 'FATAL',
        'E': 'ERROR',
        'W': 'WARNING',
        'I': 'INFO',
        'D': 'DEBUG',
        'T': 'TRACE'
    }
    
    # MongoDB components
    COMPONENTS = [
        'NETWORK', 'STORAGE', 'REPL', 'SHARDING', 'COMMAND', 
        'QUERY', 'WRITE', 'ACCESS', 'FTDC', 'INDEX', 'GEO', 
        'QUERY', 'SOCKET', 'MSG', 'REPL', 'ROLLUP'
    ]
    
    def __init__(self, config: Config):
        self.config = config
        
    def parse_log(self, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse raw log data into structured format"""
        
        raw = log_data.get('raw', '')
        
        # Extract timestamp
        timestamp = self._extract_timestamp(log_data.get('timestamp', ''), raw)
        
        # Extract severity
        severity = self._extract_severity(log_data.get('severity', ''), raw)
        
        # Extract component
        component = self._extract_component(log_data.get('component', ''), raw)
        
        # Extract context (duration, connection info, etc.)
        context = self._extract_context(raw)
        
        # Extract message
        message = self._extract_message(log_data.get('message', ''), raw)
        
        return {
            'timestamp': timestamp,
            'severity': severity,
            'component': component,
            'message': message,
            'context': context,
            'raw': raw
        }
    
    def _extract_timestamp(self, timestamp: str, raw: str) -> Optional[datetime]:
        """Extract timestamp from log entry"""
        
        # Try provided timestamp first
        if timestamp:
            try:
                return datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except:
                pass
        
        # Try to parse from raw log
        # Format: 2024-01-15T10:00:01.123+0000
        patterns = [
            r'(\d{4}-\d{2}-\d{2}T[\d:\.]+\+\d{4})',
            r'(\d{4}-\d{2}-\d{2}T[\d:\.]+Z)',
            r'(\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, raw)
            if match:
                try:
                    ts_str = match.group(1)
                    if 'Z' in ts_str:
                        ts_str = ts_str.replace('Z', '+00:00')
                    return datetime.fromisoformat(ts_str)
                except:
                    pass
        
        return datetime.utcnow()
    
    def _extract_severity(self, severity: str, raw: str) -> str:
        """Extract severity level from log entry"""
        
        if severity and severity in self.SEVERITY_MAP.values():
            return severity
        
        # Try to extract from raw log
        # Format: 2024-01-15T10:00:01.123+0000 I NETWORK ...
        match = re.match(r'^\S+\s+([FEWI DT])\s+', raw)
        if match:
            char = match.group(1).strip()
            return self.SEVERITY_MAP.get(char, 'INFO')
        
        return 'INFO'
    
    def _extract_component(self, component: str, raw: str) -> str:
        """Extract component from log entry"""
        
        if component and component.upper() in self.COMPONENTS:
            return component.upper()
        
        # Try to extract from raw log
        # Format: 2024-01-15T10:00:01.123+0000 I COMPONENT [thread] ...
        match = re.match(r'^\S+\s+\w+\s+(\w+)\s+\[', raw)
        if match:
            comp = match.group(1).upper()
            if comp in self.COMPONENTS:
                return comp
        
        return 'UNKNOWN'
    
    def _extract_context(self, raw: str) -> Dict[str, Any]:
        """Extract additional context from log entry"""
        
        context = {}
        
        # Extract duration (for queries)
        duration_match = re.search(r'(\d+)ms', raw)
        if duration_match:
            context['duration'] = int(duration_match.group(1))
        
        # Extract connection ID
        conn_match = re.search(r'conn(\d+)', raw)
        if conn_match:
            context['connectionId'] = int(conn_match.group(1))
        
        # Extract remote IP
        remote_match = re.search(r'from\s+(\d+\.\d+\.\d+\.\d+)', raw)
        if remote_match:
            context['remote'] = remote_match.group(1)
        
        # Extract PID
        pid_match = re.search(r'pid[=:]?\s*(\d+)', raw, re.IGNORECASE)
        if pid_match:
            context['pid'] = int(pid_match.group(1))
        
        # Extract database/collection
        db_match = re.search(r'(?:command|find|insert|update|delete)\s+(\w+\.\w+)', raw)
        if db_match:
            context['namespace'] = db_match.group(1)
        
        # Extract error codes
        error_match = re.search(r'error[=\s:]+(\w+)', raw, re.IGNORECASE)
        if error_match:
            context['errorCode'] = error_match.group(1)
        
        return context
    
    def _extract_message(self, message: str, raw: str) -> str:
        """Extract message from log entry"""
        
        if message:
            return message
        
        # Try to extract from raw log
        # Format: 2024-01-15T10:00:01.123+0000 I COMPONENT [thread] message
        match = re.match(r'^\S+\s+\w+\s+\w+\s+\[.*?\]\s*(.*)$', raw)
        if match:
            return match.group(1).strip()
        
        return raw
    
    def extract_features(self, log: Dict[str, Any]) -> list:
        """Extract numerical features for ML model"""
        
        features = []
        
        # Severity encoding
        severity_order = {'FATAL': 5, 'ERROR': 4, 'WARNING': 3, 'INFO': 2, 'DEBUG': 1, 'TRACE': 0}
        features.append(severity_order.get(log.get('severity', 'INFO'), 2))
        
        # Component encoding (simplified)
        component = log.get('component', 'UNKNOWN')
        features.append(hash(component) % 100 / 100)
        
        # Duration (if available)
        context = log.get('context', {})
        duration = context.get('duration', 0)
        features.append(min(duration / 10000, 1))  # Normalize to 0-1
        
        # Has error code
        features.append(1 if context.get('errorCode') else 0)
        
        # Has remote connection
        features.append(1 if context.get('remote') else 0)
        
        # Message length
        message = log.get('message', '')
        features.append(min(len(message) / 500, 1))  # Normalize
        
        # Hour of day (for time-based patterns)
        timestamp = log.get('timestamp')
        if timestamp:
            if isinstance(timestamp, str):
                try:
                    ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    features.append(ts.hour / 24)
                except:
                    features.append(0)
            else:
                features.append(timestamp.hour / 24)
        else:
            features.append(0)
        
        return features

