"""
Log Classifier - NLP-based classification of MongoDB log entries
"""

import re
from typing import Dict, Any, List

from ..utils.config import Config
from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class LogClassifier:
    """NLP-based classification of MongoDB log entries"""
    
    # Classification patterns
    CLASSIFICATION_PATTERNS = {
        'slow_query': [
            r'slow\s+query',
            r'query\s+took',
            r'duration[:\s]+\d+',
            r'\d+ms',
            r'\d+s',
            r'planSummary.*COLLSCAN',
            r'documentsExamined',
            r'queryPlanner'
        ],
        'auth_failure': [
            r'authentication\s+failed',
            r'auth\s+failed',
            r'login\s+failed',
            r'invalid\s+credentials',
            r'access\s+denied',
            r'not\s+authorized',
            r'permission\s+denied',
            r'unauthorized'
        ],
        'unauthorized_access': [
            r'unauthorized',
            r'not\s+authorized\s+on',
            r'failed\s+to\s+authenticate',
            r'user\s+not\s+found',
            r'wrong\s+password',
            r'bad\s+credential'
        ],
        'replication_error': [
            r'replication\s+error',
            r'oplog',
            r'repl\s+.*error',
            r'sync\s+failed',
            r'replica\s+set',
            r'secondary',
            r'primary.*failover'
        ],
        'connection_spike': [
            r'connection\s+spike',
            r'too\s+many\s+connections',
            r'connection\s+pool',
            r'max\s+connections',
            r'connections?\s+exceeded'
        ],
        'memory_issue': [
            r'out\s+of\s+memory',
            r'OOM',
            r'memory\s+exhausted',
            r'cannot\s+allocate\s+memory',
            r'virtual\s+memory'
        ],
        'disk_issue': [
            r'disk\s+(full|space)',
            r'no\s+space\s+left',
            r'WiredTiger.*error',
            r'checkpoint.*failed',
            r'write.*failed.*disk'
        ]
    }
    
    def __init__(self, config: Config):
        self.config = config
        
    def classify(self, log: Dict[str, Any]) -> Dict[str, Any]:
        """Classify a log entry into categories"""
        
        message = log.get('message', '').lower()
        raw = log.get('raw', '').lower()
        severity = log.get('severity', 'INFO')
        component = log.get('component', '')
        
        # Check each classification pattern
        classifications = []
        scores = {}
        
        for category, patterns in self.CLASSIFICATION_PATTERNS.items():
            score = 0
            matched_patterns = []
            
            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    score += 1
                    matched_patterns.append(pattern)
            
            if score > 0:
                scores[category] = score
                if score >= 2:  # Strong match
                    classifications.append(category)
        
        # Determine primary classification
        if classifications:
            # Use highest scoring category
            primary = max(classifications, key=lambda c: scores.get(c, 0))
        else:
            # Check based on severity and component
            if severity in ['ERROR', 'FATAL']:
                if 'auth' in message or 'access' in message:
                    primary = 'auth_failure'
                elif 'repl' in message.lower():
                    primary = 'replication_error'
                else:
                    primary = 'normal'
            else:
                primary = 'normal'
        
        return {
            'primaryClassification': primary,
            'allClassifications': list(set(classifications)) if classifications else ['normal'],
            'scores': scores,
            'confidence': self._calculate_confidence(scores)
        }
    
    def _calculate_confidence(self, scores: Dict[str, float]) -> float:
        """Calculate classification confidence"""
        
        if not scores:
            return 0.5
        
        max_score = max(scores.values())
        total_score = sum(scores.values())
        
        if total_score == 0:
            return 0.5
        
        confidence = (max_score / total_score) * (max_score / 3)
        return min(confidence, 1.0)
    
    def extract_entities(self, log: Dict[str, Any]) -> Dict[str, Any]:
        """Extract named entities from log message"""
        
        message = log.get('message', '')
        
        entities = {
            'databases': [],
            'collections': [],
            'users': [],
            'commands': [],
            'errors': []
        }
        
        # Extract database.collection
        db_col_pattern = r'(\w+)\.(\w+)'
        matches = re.findall(db_col_pattern, message)
        for db, col in matches:
            if db not in ['db', 'this']:
                entities['databases'].append(db)
                entities['collections'].append(f"{db}.{col}")
        
        # Extract users
        user_pattern = r'user\s+(\w+)@|for\s+user\s+(\w+)'
        matches = re.findall(user_pattern, message)
        for match in matches:
            user = match[0] or match[1]
            if user and user not in ['admin', 'null']:
                entities['users'].append(user)
        
        # Extract commands
        command_pattern = r'command:\s*(\w+)|command\s+(\w+)'
        matches = re.findall(command_pattern, message)
        for match in matches:
            cmd = match[0] or match[1]
            if cmd:
                entities['commands'].append(cmd)
        
        # Extract error codes
        error_pattern = r'error[=:\s]+(\w+\d+|\d+)'
        matches = re.findall(error_pattern, message)
        for error in matches:
            if len(error) > 1:
                entities['errors'].append(error)
        
        return entities
    
    def get_severity_from_classification(self, classification: str) -> str:
        """Map classification to recommended severity"""
        
        severity_map = {
            'slow_query': 'info',
            'auth_failure': 'high',
            'unauthorized_access': 'critical',
            'replication_error': 'high',
            'connection_spike': 'medium',
            'memory_issue': 'high',
            'disk_issue': 'critical',
            'normal': 'info'
        }
        
        return severity_map.get(classification, 'info')
    
    def get_recommended_action(self, classification: str, log: Dict[str, Any]) -> str:
        """Get recommended action based on classification"""
        
        actions = {
            'slow_query': 'Review query execution plan and add appropriate indexes. Consider query optimization.',
            'auth_failure': 'Investigate the source IP and user account. Consider blocking repeated failures.',
            'unauthorized_access': 'Review user permissions and audit access patterns. Consider enabling audit logging.',
            'replication_error': 'Check replica set configuration and network connectivity between nodes.',
            'connection_spike': 'Review connection pooling settings and consider increasing connection limits.',
            'memory_issue': 'Check available RAM and consider adding memory or optimizing queries.',
            'disk_issue': 'Free up disk space or expand storage. Check for large collections or indexes.',
            'normal': 'No action required.'
        }
        
        # Customize based on context
        if classification == 'slow_query':
            duration = log.get('context', {}).get('duration', 0)
            if duration > 5000:
                actions['slow_query'] += ' This query is extremely slow (>5s).'
            elif duration > 1000:
                actions['slow_query'] += ' This query is very slow (>1s).'
        
        return actions.get(classification, 'Monitor the log for further issues.')

