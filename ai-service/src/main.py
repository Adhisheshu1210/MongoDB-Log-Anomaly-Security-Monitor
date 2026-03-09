"""
MongoDB Log Monitor - AI Service
Main entry point for the AI processing service
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
import uvicorn

from src.ingestion.log_ingestor import LogIngestor
from src.processing.log_processor import LogProcessor
from src.ml.anomaly_detector import AnomalyDetector
from src.nlp.log_classifier import LogClassifier
from src.utils.config import Config
from src.utils.logger import setup_logger

# Setup logging
logger = setup_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    logger.info("Starting MongoDB Log Monitor AI Service")
    
    # Initialize components
    config = Config()
    
    # Initialize log ingestor
    log_ingestor = LogIngestor(config)
    await log_ingestor.start()
    
    # Initialize log processor
    log_processor = LogProcessor(config)
    
    # Initialize anomaly detector
    anomaly_detector = AnomalyDetector(config)
    
    # Initialize NLP classifier
    log_classifier = LogClassifier(config)
    
    # Store in app state
    app.state.ingestor = log_ingestor
    app.state.processor = log_processor
    app.state.detector = anomaly_detector
    app.state.classifier = log_classifier
    
    logger.info("All components initialized successfully")
    
    yield
    
    # Cleanup
    logger.info("Shutting down AI Service")
    await log_ingestor.stop()


# Create FastAPI app
app = FastAPI(
    title="MongoDB Log Monitor AI Service",
    description="AI-powered log processing and anomaly detection",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "MongoDB Log Monitor AI Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "components": {
            "kafka": "connected" if app.state.ingestor.kafka_connected else "disconnected",
            "mongodb": "connected",
            "ml_model": "ready" if app.state.detector.is_ready else "training"
        }
    }


@app.post("/process/log")
async def process_log(log_data: dict):
    """Process a single log entry"""
    processor = app.state.processor
    classifier = app.state.classifier
    detector = app.state.detector
    
    # Parse log
    parsed = processor.parse_log(log_data)
    
    # Classify log
    classification = classifier.classify(parsed)
    
    # Detect anomaly
    anomaly_result = detector.detect(parsed)
    
    return {
        "parsed": parsed,
        "classification": classification,
        "anomaly": anomaly_result
    }


@app.post("/train")
async def train_model():
    """Retrain anomaly detection model"""
    detector = app.state.detector
    await detector.train()
    return {"status": "model retrained"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development"
    )

