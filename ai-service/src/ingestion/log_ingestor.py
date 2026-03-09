"""
Log Ingestor - Reads MongoDB logs and streams to Kafka
"""

import asyncio
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import NoBrokersAvailable

from ..utils.config import Config
from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class LogIngestor:
    """Reads MongoDB log files and streams to Kafka"""
    
    def __init__(self, config: Config):
        self.config = config
        self.producer: Optional[KafkaProducer] = None
        self.consumer: Optional[KafkaConsumer] = None
        self.kafka_connected = False
        self.running = False
        self.log_file_position = 0
        self.log_file_path = Path(config.log_file_path)
        
    async def start(self):
        """Start the log ingestor"""
        logger.info("Starting Log Ingestor")
        
        # Connect to Kafka
        await self._connect_kafka()
        
        # Create log file if it doesn't exist
        self._ensure_log_file()
        
        self.running = True
        
        # Start consuming logs from file
        asyncio.create_task(self._consume_logs())
        
        logger.info("Log Ingestor started successfully")
    
    async def stop(self):
        """Stop the log ingestor"""
        logger.info("Stopping Log Ingestor")
        self.running = False
        
        if self.producer:
            self.producer.flush()
            self.producer.close()
        
        if self.consumer:
            self.consumer.close()
        
        logger.info("Log Ingestor stopped")
    
    async def _connect_kafka(self):
        """Connect to Kafka broker"""
        max_retries = 10
        retry_delay = 3
        
        for attempt in range(max_retries):
            try:
                self.producer = KafkaProducer(
                    bootstrap_servers=self.config.kafka_bootstrap_servers,
                    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                    key_serializer=lambda k: k.encode('utf-8') if k else None,
                    acks='all',
                    retries=3
                )
                
                # Verify connection
                self.producer.topics()
                self.kafka_connected = True
                logger.info(f"Connected to Kafka at {self.config.kafka_bootstrap_servers}")
                return
                
            except NoBrokersAvailable:
                logger.warning(f"Kafka not available (attempt {attempt + 1}/{max_retries}), retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
        
        logger.error("Failed to connect to Kafka after all retries")
        # Continue without Kafka for demo purposes
        self.kafka_connected = False
    
    def _ensure_log_file(self):
        """Ensure log file exists"""
        if not self.log_file_path.exists():
            self.log_file_path.parent.mkdir(parents=True, exist_ok=True)
            # Create sample log file
            self._create_sample_log_file()
    
    def _create_sample_log_file(self):
        """Create a sample MongoDB log file for testing"""
        sample_logs = """2024-01-15T10:00:01.123+0000 I NETWORK  [initandlisten] waiting for connections on port 27017
2024-01-15T10:00:02.456+0000 I ACCESS   [conn1] Authentication succeeded for user admin@admin from 127.0.0.1
2024-01-15T10:00:05.789+0000 I COMMAND  [conn2] command test.users appName: "MongoDB Shell" command: find { find: \"users\", filter: {}, lsid: {id: \"abc123\"}, $db: \"test\" } protocol: op_msg 5423ms
2024-01-15T10:00:10.012+0000 E STORAGE  [conn3] WiredTiger error (0) [1705317610:12]: __wt_txn_visible: txn timestamp  has moved forward
2024-01-15T10:00:15.345+0000 I ACCESS   [conn4] Authentication failed for user test@admin from 192.168.1.100
2024-01-15T10:00:20.678+0000 I REPL     [replication] OplogViewer 5% scanned
2024-01-15T10:00:25.901+0000 W NETWORK  [conn5] socket exception (connection spike detected: 150 connections)
2024-01-15T10:00:30.234+0000 I QUERY    [conn6] query test.orders planSummary: COLLSCAN documentsExamined:100000 documentsReturned:1000 duration:2341ms
2024-01-15T10:00:35.567+0000 E ACCESS   [conn7] Unauthorized: not authorized on admin to execute command { replSetGetStatus: 1 }
2024-01-15T10:00:40.890+0000 I STORAGE  [initandlisten] WiredTiger 3.2.1: starting up
2024-01-15T10:00:45.123+0000 I COMMAND  [conn8] command: insert { insert: \"logs\", documents: 1000 } duration: 45ms
2024-01-15T10:00:50.456+0000 W STORAGE  [conn9] Checkpoint took 1234ms (background job)
2024-01-15T10:00:55.789+0000 I NETWORK  [conn10] new client connection from 192.168.1.50:54321
"""
        
        with open(self.log_file_path, 'w') as f:
            f.write(sample_logs)
        
        logger.info(f"Created sample log file at {self.log_file_path}")
    
    async def _consume_logs(self):
        """Continuously read log file and stream to Kafka"""
        logger.info("Starting log file consumption")
        
        while self.running:
            try:
                if not self.log_file_path.exists():
                    await asyncio.sleep(self.config.log_polling_interval)
                    continue
                
                with open(self.log_file_path, 'r') as f:
                    # Seek to last position
                    f.seek(self.log_file_position)
                    
                    # Read new lines
                    for line in f:
                        line = line.strip()
                        if line:
                            # Parse log line
                            log_entry = self._parse_log_line(line)
                            
                            # Send to Kafka
                            await self._send_to_kafka(log_entry)
                    
                    # Update position
                    self.log_file_position = f.tell()
                
                await asyncio.sleep(self.config.log_polling_interval)
                
            except Exception as e:
                logger.error(f"Error consuming logs: {e}")
                await asyncio.sleep(self.config.log_polling_interval)
    
    def _parse_log_line(self, line: str) -> dict:
        """Parse a MongoDB log line into structured data"""
        
        # MongoDB log format pattern
        pattern = r'^(\d{4}-\d{2}-\d{2}T[\d:\.]+\+\d{4})\s+(\w)\s+(\w+)\s+\[([^\]]+)\]\s*(.*)$'
        
        match = re.match(pattern, line)
        
        if match:
            timestamp_str, severity, component, thread, message = match.groups()
            
            severity_map = {
                'F': 'FATAL',
                'E': 'ERROR',
                'W': 'WARNING',
                'I': 'INFO',
                'D': 'DEBUG',
                'T': 'TRACE'
            }
            
            return {
                'timestamp': timestamp_str,
                'severity': severity_map.get(severity, 'INFO'),
                'component': component,
                'thread': thread,
                'message': message,
                'raw': line
            }
        
        # Fallback for unparseable lines
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'severity': 'INFO',
            'component': 'UNKNOWN',
            'thread': 'unknown',
            'message': line,
            'raw': line
        }
    
    async def _send_to_kafka(self, log_entry: dict):
        """Send log entry to Kafka topic"""
        if not self.kafka_connected or not self.producer:
            logger.warning("Kafka not connected, skipping log send")
            return
        
        try:
            future = self.producer.send(
                self.config.kafka_topic_raw_logs,
                key=log_entry.get('component'),
                value=log_entry
            )
            # Wait for send to complete
            record_metadata = future.get(timeout=10)
            logger.debug(f"Sent log to {record_metadata.topic}:{record_metadata.partition}")
            
        except Exception as e:
            logger.error(f"Error sending to Kafka: {e}")
    
    async def simulate_logs(self):
        """Generate simulated log entries for testing"""
        import random
        
        severities = ['FATAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE']
        components = ['NETWORK', 'STORAGE', 'REPL', 'SHARDING', 'COMMAND', 'QUERY', 'WRITE', 'ACCESS']
        messages = [
            'waiting for connections on port 27017',
            'Authentication succeeded for user admin',
            'command test.users find operation completed in 234ms',
            'WiredTiger error: checkpoint failed',
            'Authentication failed for user test',
            'Replication lag: 5 seconds',
            'Connection spike detected',
            'Slow query detected',
            'Memory usage: 85%',
            'Disk space warning: 90%'
        ]
        
        while self.running:
            log_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'severity': random.choice(severities),
                'component': random.choice(components),
                'thread': f'conn{random.randint(1, 100)}',
                'message': random.choice(messages),
                'raw': f"{datetime.utcnow().isoformat()} I NETWORK [conn{random.randint(1, 100)}] {random.choice(messages)}"
            }
            
            await self._send_to_kafka(log_entry)
            
            await asyncio.sleep(random.randint(1, 3))

