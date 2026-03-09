"""
Configuration for AI Service
"""

import os
from typing import Optional
from pydantic import BaseModel


class Config(BaseModel):
    """Application configuration"""
    
    # MongoDB
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    mongodb_database: str = os.getenv("MONGODB_DATABASE", "log_monitor")
    
    # Kafka
    kafka_bootstrap_servers: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    kafka_topic_raw_logs: str = os.getenv("KAFKA_TOPIC_RAW_LOGS", "raw-logs")
    kafka_topic_processed_logs: str = os.getenv("KAFKA_TOPIC_PROCESSED_LOGS", "processed-logs")
    kafka_topic_anomalies: str = os.getenv("KAFKA_TOPIC_ANOMALIES", "anomalies")
    kafka_consumer_group: str = os.getenv("KAFKA_CONSUMER_GROUP", "ai-service")
    
    # Backend API
    backend_api_url: str = os.getenv("BACKEND_API_URL", "http://localhost:5000")
    
    # ML Settings
    anomaly_algorithm: str = os.getenv("ANOMALY_ALGORITHM", "isolation_forest")
    contamination: float = float(os.getenv("CONTAMINATION", "0.1"))
    n_estimators: int = int(os.getenv("N_ESTIMATORS", "100"))
    
    # Log File
    log_file_path: str = os.getenv("LOG_FILE_PATH", "../logs/sample-logs/mongodb.log")
    log_polling_interval: int = int(os.getenv("LOG_POLLING_INTERVAL", "2"))
    
    # Processing
    batch_size: int = int(os.getenv("BATCH_SIZE", "100"))
    
    class Config:
        env_file = ".env"

