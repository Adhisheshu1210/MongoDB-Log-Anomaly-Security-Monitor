"""
Anomaly Detector - ML-based anomaly detection for MongoDB logs
"""

import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler

from ..utils.config import Config
from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class AnomalyDetector:
    """Machine learning-based anomaly detection"""
    
    def __init__(self, config: Config):
        self.config = config
        self.algorithm = config.anomaly_algorithm
        self.contamination = config.contamination
        self.n_estimators = config.n_estimators
        
        self.model: Optional[Any] = None
        self.scaler = StandardScaler()
        self.is_ready = False
        
        # Initialize model
        self._initialize_model()
        
    def _initialize_model(self):
        """Initialize the ML model based on configuration"""
        
        if self.algorithm == 'isolation_forest':
            self.model = IsolationForest(
                n_estimators=self.n_estimators,
                contamination=self.contamination,
                random_state=42,
                n_jobs=-1
            )
        elif self.algorithm == 'lof':
            self.model = LocalOutlierFactor(
                n_neighbors=20,
                contamination=self.contamination,
                novelty=True,
                n_jobs=-1
            )
        else:
            # Default to Isolation Forest
            self.model = IsolationForest(
                n_estimators=self.n_estimators,
                contamination=self.contamination,
                random_state=42,
                n_jobs=-1
            )
        
        logger.info(f"Initialized {self.algorithm} anomaly detector")
    
    async def train(self, training_data: Optional[List[List[float]]] = None):
        """Train the anomaly detection model"""
        
        if training_data is None:
            # Generate synthetic training data
            training_data = self._generate_synthetic_data(1000)
        
        # Scale the data
        scaled_data = self.scaler.fit_transform(training_data)
        
        # Train the model
        self.model.fit(scaled_data)
        
        self.is_ready = True
        logger.info("Anomaly detection model trained successfully")
    
    def _generate_synthetic_data(self, n_samples: int) -> List[List[float]]:
        """Generate synthetic training data"""
        
        np.random.seed(42)
        
        # Generate normal samples
        normal_samples = np.random.randn(n_samples, 6)
        normal_samples[:, 0] = normal_samples[:, 0] * 0.5 + 2  # severity
        normal_samples[:, 1] = normal_samples[:, 1] * 0.1 + 0.3  # component
        normal_samples[:, 2] = normal_samples[:, 2] * 0.05  # duration
        normal_samples[:, 3] = np.random.randint(0, 2, n_samples)  # has error
        normal_samples[:, 4] = np.random.randint(0, 2, n_samples)  # has remote
        normal_samples[:, 5] = normal_samples[:, 5] * 0.1 + 0.1  # message length
        
        return normal_samples.tolist()
    
    def detect(self, log: Dict[str, Any]) -> Dict[str, Any]:
        """Detect if a log entry is anomalous"""
        
        # Extract features from log
        features = self._extract_features(log)
        
        if not self.is_ready:
            # Use rule-based detection if model not trained
            return self._rule_based_detection(log, features)
        
        try:
            # Scale features
            scaled_features = self.scaler.transform([features])
            
            # Get anomaly score
            if self.algorithm == 'isolation_forest':
                score = self.model.score_samples(scaled_features)[0]
                # Convert to 0-1 range (lower score = more anomalous)
                anomaly_score = 1 - (score + 1) / 2
            else:
                score = self.model.score_samples(scaled_features)[0]
                anomaly_score = 1 - (score + 1) / 2
            
            # Determine if anomalous
            is_anomaly = anomaly_score > (1 - self.contamination)
            
            return {
                'isAnomaly': is_anomaly,
                'anomalyScore': float(anomaly_score),
                'algorithm': self.algorithm,
                'confidence': float(min(anomaly_score * 1.5, 1.0))
            }
            
        except Exception as e:
            logger.error(f"Error in anomaly detection: {e}")
            return self._rule_based_detection(log, features)
    
    def _extract_features(self, log: Dict[str, Any]) -> List[float]:
        """Extract features from log entry"""
        
        features = []
        
        # Severity encoding
        severity_order = {'FATAL': 5, 'ERROR': 4, 'WARNING': 3, 'INFO': 2, 'DEBUG': 1, 'TRACE': 0}
        severity = log.get('severity', 'INFO')
        features.append(severity_order.get(severity, 2) / 5)
        
        # Component encoding
        component = log.get('component', 'UNKNOWN')
        features.append(hash(component) % 100 / 100)
        
        # Duration
        context = log.get('context', {})
        duration = context.get('duration', 0)
        features.append(min(duration / 10000, 1))
        
        # Has error code
        features.append(1 if context.get('errorCode') else 0)
        
        # Has remote connection
        features.append(1 if context.get('remote') else 0)
        
        # Message length
        message = log.get('message', '')
        features.append(min(len(message) / 500, 1))
        
        return features
    
    def _rule_based_detection(self, log: Dict[str, Any], features: List[float]) -> Dict[str, Any]:
        """Rule-based anomaly detection as fallback"""
        
        is_anomaly = False
        anomaly_score = 0.0
        reasons = []
        
        severity = log.get('severity', 'INFO')
        context = log.get('context', {})
        message = log.get('message', '').lower()
        
        # Check severity
        if severity in ['FATAL', 'ERROR']:
            is_anomaly = True
            anomaly_score += 0.5
            reasons.append('High severity level')
        
        # Check for specific error patterns
        error_patterns = [
            'authentication failed', 'unauthorized', 'access denied',
            'connection refused', 'timeout', 'out of memory',
            'disk full', 'replication error', 'checkpoint failed'
        ]
        
        for pattern in error_patterns:
            if pattern in message:
                is_anomaly = True
                anomaly_score += 0.3
                reasons.append(f'Error pattern: {pattern}')
        
        # Check for slow queries
        if context.get('duration', 0) > 1000:
            is_anomaly = True
            anomaly_score += 0.2
            reasons.append('Slow query detected')
        
        # Normalize score
        anomaly_score = min(anomaly_score, 1.0)
        
        return {
            'isAnomaly': is_anomaly,
            'anomalyScore': float(anomaly_score),
            'algorithm': 'rule_based',
            'confidence': float(anomaly_score),
            'reasons': reasons
        }
    
    def get_anomaly_type(self, log: Dict[str, Any]) -> str:
        """Determine the type of anomaly"""
        
        message = log.get('message', '').lower()
        context = log.get('context', {})
        
        # Security-related
        security_patterns = ['authentication failed', 'unauthorized', 'access denied', 
                           'permission denied', 'login failed', 'invalid credentials']
        for pattern in security_patterns:
            if pattern in message:
                return 'security'
        
        # Performance-related
        if context.get('duration', 0) > 1000:
            return 'performance'
        
        if 'slow' in message:
            return 'performance'
        
        # Connection-related
        if 'connection' in message:
            return 'connection'
        
        # Replication-related
        if 'replication' in message or 'repl' in message.lower():
            return 'replication'
        
        # Storage-related
        if 'storage' in message or 'wiredtiger' in message:
            return 'capacity'
        
        # Resource-related
        if 'memory' in message or 'cpu' in message or 'disk' in message:
            return 'resource'
        
        return 'unknown'
    
    def get_anomaly_severity(self, log: Dict[str, Any], anomaly_score: float) -> str:
        """Determine the severity of anomaly"""
        
        severity = log.get('severity', 'INFO')
        
        # Start with log severity
        severity_map = {
            'FATAL': 'critical',
            'ERROR': 'high',
            'WARNING': 'medium',
            'INFO': 'low',
            'DEBUG': 'info',
            'TRACE': 'info'
        }
        
        base_severity = severity_map.get(severity, 'low')
        
        # Adjust based on anomaly score
        if anomaly_score > 0.8:
            return 'critical'
        elif anomaly_score > 0.6:
            return 'high'
        elif anomaly_score > 0.4:
            return 'medium'
        
        return base_severity

