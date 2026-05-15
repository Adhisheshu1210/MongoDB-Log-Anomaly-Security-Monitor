# MongoDB and AI Integration - Complete Analysis

## Executive Summary
This project implements a **log anomaly detection and security monitoring system** where **MongoDB serves as the central data hub** and **Python AI service performs real-time anomaly detection and log classification**. The two technologies work in tandem: MongoDB stores raw logs and processed results, while the AI service enriches those logs with ML-driven insights.

---

## 1. HOW MONGODB IS USED IN THIS PROJECT

### 1.1 **Primary Data Storage - The Core Repository**

MongoDB is the persistent database that stores **all log data, detected anomalies, alerts, and system metadata** for the project. It is implemented using **Mongoose ODM** in the Node.js backend, and the data models define the schema for logs, anomalies, and alerts.

**Key collections stored in MongoDB:**

- **Logs Collection**: Every incoming log entry is stored with timestamp, severity level, component name, raw message, and parsed context. This collection has indexes on `timestamp`, `severity`, `component`, and `classification` for fast retrieval.
  
- **Anomalies Collection**: After the AI service processes logs and detects anomalies, results are saved here with anomaly score (0–1), anomaly type (security, performance, capacity), severity (critical/high/medium/low), and the AI algorithm used (Isolation Forest, LOF, etc.).
  
- **Alerts Collection**: Critical and high-severity anomalies trigger alerts that are also stored in MongoDB. Alerts track user actions (acknowledged, resolved, dismissed) for audit and feedback purposes.
  
- **Settings & Control State**: MongoDB stores configuration settings, AI control flags, and thresholds. This allows users to adjust anomaly detection sensitivity without code changes.
  
- **SIEM Dataset Records**: Labeled log examples are stored in MongoDB for supervised model training and validation. The dataset (`advanced_siem_dataset.jsonl`) is imported into MongoDB for use in training pipelines.
  
- **Audit Logs**: All user actions, API calls, and system events are logged to MongoDB for compliance and investigation.

### 1.2 **Support for High-Volume Ingestion**

MongoDB is chosen because it can **handle high-throughput write operations** needed for log ingestion:

- The `Log` model is optimized for rapid inserts from incoming logs (via the backend API or Kafka streams).
- MongoDB's flexible document schema allows storing logs with variable fields without enforcing rigid schema validation upfront.
- Indexes on `timestamp` and `component` ensure fast queries even as the collection grows to millions of documents.
- Optional **capped collections** can be used to automatically delete old logs and keep storage bounded.

### 1.3 **Fast Retrieval for Training and Inference**

MongoDB supports **efficient querying** needed by the AI service for feature extraction and model training:

- The anomaly detection pipeline queries MongoDB to fetch training data (labeled logs) for retraining models.
- The backend service uses MongoDB queries to retrieve recent logs for anomaly detection context.
- Frontend dashboards query MongoDB to display logs, anomalies, and trends without needing separate data warehouses.

### 1.4 **Flexible Document Schema for Enrichment**

MongoDB's document model naturally stores **raw and processed log data side-by-side**:

```javascript
{
  timestamp: "2024-01-15T10:00:01Z",
  severity: "ERROR",
  component: "QUERY",
  message: "Slow query detected",
  classification: "slow_query",           // AI-added field
  context: {
    duration: 5000,                       // Original log context
    connectionId: 123,
    affectedCollections: ["users"]        // AI-extracted field
  },
  raw: "[2024-01-15T10:00:01Z] E QUERY ...", // Original raw log
  anomalyScore: 0.87,                    // AI-assigned score
  algorithm: "isolation_forest"          // Which AI algorithm detected this
}
```

This allows traceability: you can always see the raw log, the parsed fields, and the AI's prediction in one document.

---

## 2. HOW THE AI SERVICE WORKS

### 2.1 **Architecture: Four-Stage AI Pipeline**

The AI service (`ai-service/src/main.py`) is a **FastAPI application** that implements four distinct AI processing stages:

#### **Stage 1: Log Ingestion**
- **Component**: `LogIngestor` (reads from Kafka or log files)
- **Input**: Raw logs from MongoDB or live log streams
- **Output**: Streams raw logs to Kafka topic `raw-logs`
- **Purpose**: Capture logs in real-time without blocking the backend

#### **Stage 2: Log Processing & Parsing**
- **Component**: `LogProcessor` (normalizes and extracts features)
- **Input**: Raw logs from Kafka `raw-logs` topic
- **Output**: Parsed logs with structured fields (timestamp, severity, component, message, context)
- **Techniques Used**:
  - Regex parsing to extract MongoDB log components (severity codes: F/E/W/I/D/T)
  - Timestamp normalization (ISO 8601 format)
  - Context extraction (query duration, connection info, locks, etc.)
  - Streams to Kafka topic `processed-logs`

#### **Stage 3: ML-Based Anomaly Detection**
- **Component**: `AnomalyDetector` (scikit-learn models)
- **Algorithms**: 
  - **Isolation Forest**: Detects anomalies by isolating outliers (default)
  - **Local Outlier Factor (LOF)**: Identifies density-based anomalies
  - **Rule-based**: Pattern-matching for known issues (slow queries, auth failures)
- **Input**: Processed log features (numeric: duration, connection count, etc.; categorical: severity, component)
- **Output**: Anomaly score (0–1) and anomaly type for each log
- **Example Decision**: A query with duration 5000ms when typical is 100ms = anomaly score 0.87 (high anomaly)
- **Streams to**: Kafka topic `anomalies`

#### **Stage 4: NLP-Based Log Classification**
- **Component**: `LogClassifier` (spaCy NLP)
- **Input**: Log message text
- **Output**: Semantic classification (slow_query, auth_failure, replication_error, etc.)
- **Techniques**: 
  - Named Entity Recognition (NER) to extract component names, user IDs, collection names
  - Text similarity matching to known log patterns
- **Stores in**: MongoDB `Anomaly.classification` field

### 2.2 **Where AI Gets Data From MongoDB**

The AI service **reads training data from MongoDB** to:

1. **Historical Feature Analysis**: Query MongoDB for past logs with timestamps, durations, error codes to compute statistical baselines (mean, std dev) for the anomaly detector.

2. **Labeled Datasets**: The SIEM dataset is imported into MongoDB's `SiemDatasetRecord` collection. The AI service fetches labeled logs to train supervised models or validate anomaly scores.

3. **Control Parameters**: AI reads settings from MongoDB (e.g., anomaly threshold, contamination rate) to adjust model sensitivity without restarting the service.

---

## 3. HOW MONGODB AND AI WORK TOGETHER

### 3.1 **End-to-End Data Flow**

```
Raw Logs
   ↓ (ingested via backend API or log simulator)
MongoDB [Logs collection]
   ↓
Kafka [raw-logs topic]
   ↓
AI Service [LogIngestor & LogProcessor]
   ↓
Kafka [processed-logs topic]
   ↓
AI Service [AnomalyDetector + LogClassifier]
   ↓
Kafka [anomalies topic]
   ↓
Backend Service [listens to anomalies, queries MongoDB for context]
   ↓
MongoDB [Anomalies collection] ← also queries for labels/training data
   ↓
Frontend Dashboard [shows alerts, allows user triage]
   ↓
Feedback → MongoDB [updated Anomaly.isResolved, user feedback] → AI retraining
```

### 3.2 **Concrete Example: Detecting a Slow Query Anomaly**

**Scenario**: A MongoDB query takes 5000ms (normally takes 100ms).

1. **Ingestion**: Log entry arrives: `[2024-01-15T10:00:01Z] E QUERY {"duration": 5000}` 
   - Backend API stores it in MongoDB `Logs` collection.

2. **Processing**: AI service's `LogProcessor` reads from MongoDB or Kafka:
   - Extracts timestamp, severity (E = ERROR), component (QUERY), duration (5000).
   - Creates feature vector: `[severity_score=0.8, duration=5000, component_encoded=3]`

3. **Anomaly Detection**: `AnomalyDetector` (Isolation Forest):
   - Compares features to learned normal distribution from MongoDB training data.
   - **Result**: Anomaly score = 0.87 (87% likely to be anomalous)
   - Type: `performance`

4. **Classification**: `LogClassifier` (spaCy):
   - Parses message: "slow query"
   - **Classification**: `slow_query`

5. **Storage**: Results saved to MongoDB:
   ```javascript
   // In Anomalies collection
   {
     logId: ObjectId("..."),
     severity: "high",
     type: "performance",
     title: "Slow Query Detected",
     description: "Query execution took 5000ms, expected ~100ms",
     anomalyScore: 0.87,
     algorithm: "isolation_forest",
     confidence: 0.87,
     recommendedAction: "Review query indexes or add caching"
   }
   ```

6. **Alert Generation**: Backend's `anomalyService` (JavaScript):
   - Detects high anomaly score in MongoDB
   - Creates Alert document: `{title: "Slow Query", severity: "high"}`
   - Sends WebSocket notification to frontend

7. **User Interaction**:
   - Frontend displays alert
   - User clicks "Investigate" → backend queries MongoDB for related logs
   - User marks alert as "Resolved" → stored in MongoDB for feedback
   
8. **Continuous Learning** (optional):
   - Resolved anomalies + user feedback stored in MongoDB
   - Periodic retraining fetches labeled data from MongoDB
   - Model improves with new feedback

### 3.3 **Why This Architecture Is Effective**

| Aspect | Benefit |
|--------|---------|
| **MongoDB for Raw Logs** | High-speed writes, flexible schema, queryable for context |
| **AI for Enrichment** | Adds intelligence without cluttering the database schema |
| **Kafka for Decoupling** | Async processing; backend doesn't wait for AI; scalable |
| **Feedback Loop** | User actions stored in MongoDB → used to retrain models → better predictions |

---

## 4. DETAILED COMPONENT USAGE

### 4.1 **Backend Models & MongoDB Collections**

| Model File | MongoDB Collection | Purpose |
|------------|-------------------|---------|
| [backend/src/models/Log.js](backend/src/models/Log.js) | `logs` | Raw and processed logs with classification |
| [backend/src/models/Anomaly.js](backend/src/models/Anomaly.js) | `anomalies` | AI-detected anomalies with scores & types |
| [backend/src/models/Alert.js](backend/src/models/Alert.js) | `alerts` | User-facing alerts derived from anomalies |
| [backend/src/models/SiemDatasetRecord.js](backend/src/models/SiemDatasetRecord.js) | `siemdatasetrecords` | Labeled logs for supervised training |
| [backend/src/models/AuditLog.js](backend/src/models/AuditLog.js) | `auditlogs` | All user actions for compliance |
| [backend/src/models/Settings.js](backend/src/models/Settings.js) | `settings` | AI thresholds, control flags |

### 4.2 **AI Service Modules**

| Module | Framework | Purpose | Input | Output |
|--------|-----------|---------|-------|--------|
| [ai-service/src/ingestion/log_ingestor.py](ai-service/src/ingestion/log_ingestor.py) | Kafka + MongoDB | Stream raw logs | Log files or APIs | Kafka topic |
| [ai-service/src/processing/log_processor.py](ai-service/src/processing/log_processor.py) | Python regex + dateutil | Parse & normalize logs | Raw log strings | Structured fields |
| [ai-service/src/ml/anomaly_detector.py](ai-service/src/ml/anomaly_detector.py) | scikit-learn | Detect anomalies | Feature vectors | Anomaly scores (0–1) |
| [ai-service/src/nlp/log_classifier.py](ai-service/src/nlp/log_classifier.py) | spaCy | Classify logs semantically | Log messages | Classification labels |

### 4.3 **Backend Service Integration**

The backend service (`backend/src/services/anomalyService.js`) **bridges MongoDB and user actions**:

- **Reads** from MongoDB: Recent logs, settings, learned patterns
- **Calls** AI service: `/api/process/log` to classify a log in real-time
- **Writes** to MongoDB: Anomaly documents, alerts, user feedback
- **Emits** via Socket.IO: Real-time alerts to connected frontend clients

**Example code flow**:
```javascript
// backend/src/services/anomalyService.js
async detectAnomalies() {
  const recentLogs = await Log.find({ timestamp: { $gte: oneHourAgo } });
  
  for (const log of recentLogs) {
    const anomaly = this.classifyLogAnomaly(log);  // Rule-based + AI
    if (anomaly) {
      await Anomaly.create(anomaly);               // Save to MongoDB
      if (anomaly.severity === 'critical') {
        const alert = await Alert.create({...});   // Create alert
        io.emit('alert', alert);                   // Notify frontend
      }
    }
  }
}
```

---

## 5. KEY FILES & THEIR ROLES

### MongoDB-Related Files
- [backend/src/models/Log.js](backend/src/models/Log.js) – Log schema
- [backend/src/models/Anomaly.js](backend/src/models/Anomaly.js) – Anomaly schema
- [docker/docker-compose.yml](docker/docker-compose.yml) – MongoDB service config (port 27017)

### AI Service Files
- [ai-service/src/main.py](ai-service/src/main.py) – FastAPI entry point
- [ai-service/src/ml/anomaly_detector.py](ai-service/src/ml/anomaly_detector.py) – Isolation Forest + LOF
- [ai-service/src/nlp/log_classifier.py](ai-service/src/nlp/log_classifier.py) – spaCy classification
- [ai-service/requirements.txt](ai-service/requirements.txt) – Python dependencies (FastAPI, scikit-learn, spaCy, Kafka)

### Integration Files
- [backend/src/services/anomalyService.js](backend/src/services/anomalyService.js) – Calls AI, stores results
- [docker/docker-compose.yml](docker/docker-compose.yml) – Orchestrates MongoDB, Kafka, AI service, backend

---

## 6. DATA FLOW SUMMARY

### Ingestion → Processing → Detection → Storage

```
1. Log Ingestion (Backend API or simulator)
   └─→ Insert into MongoDB Logs collection
   
2. Kafka Stream (Real-time pipeline)
   └─→ raw-logs topic ─→ processed-logs topic ─→ anomalies topic
   
3. AI Processing (Python services)
   ├─→ LogProcessor: Normalize & extract features
   ├─→ AnomalyDetector: scikit-learn models compute anomaly score
   └─→ LogClassifier: spaCy identifies log type
   
4. Results → MongoDB
   └─→ Anomalies collection (with AI scores & classifications)
   
5. Backend Integration
   ├─→ Query MongoDB for anomalies
   ├─→ Create Alerts
   └─→ Emit WebSocket updates to frontend
   
6. User Triage → MongoDB Feedback
   └─→ Update Anomaly.isResolved, collect training labels
```

---

## 7. WHY THIS DESIGN WORKS

### **MongoDB's Role**
✅ **Persistent Storage**: All logs, anomalies, alerts, and feedback survive service restarts  
✅ **Flexible Schema**: Stores both raw logs and AI-enriched data in one document  
✅ **Fast Indexing**: Efficient queries on timestamp, severity, component  
✅ **Scalability**: Can handle millions of log documents with proper indexes  
✅ **Training Data**: SIEM dataset imported for model training & validation  

### **AI Service's Role**
✅ **Enrichment**: Adds anomaly scores and classifications without cluttering raw data  
✅ **Decoupling**: Processes logs asynchronously via Kafka; backend doesn't block  
✅ **Multiple Algorithms**: Isolation Forest, LOF, rule-based; can swap without DB changes  
✅ **Continuous Learning**: User feedback stored in MongoDB → retrain models  

### **Together**
✅ **Low Latency**: Kafka decouples ingestion from detection; MongoDB provides fast context lookups  
✅ **Auditability**: Every log + AI prediction + user action is stored and queryable  
✅ **Feedback Loop**: Operators can label false positives/negatives; models improve over time  

---

## 8. DEPLOYMENT TOPOLOGY

### Docker Compose Setup
```yaml
Services running:
├─ mongodb:27017           (Database for logs, anomalies, alerts)
├─ kafka:9092              (Message broker for log streams)
├─ zookeeper:2181          (Kafka coordination)
├─ ai-service:8000         (Python FastAPI for anomaly detection)
├─ backend:5000            (Node.js Express API)
├─ frontend:3000           (React UI)
└─ nginx:80                (Reverse proxy)
```

### Kubernetes Deployment
- [kubernetes/ai-service-deployment.yaml](kubernetes/ai-service-deployment.yaml) – Scales AI service (replicas: 2)
- [kubernetes/backend-deployment.yaml](kubernetes/backend-deployment.yaml) – Scales backend service
- MongoDB can be managed via MongoDB Atlas (cloud) or StatefulSet (self-hosted)
- Kafka typically runs on a separate cluster or managed service

---

## 9. FUTURE ENHANCEMENTS

### AI Improvements
- **Vector Search**: Use MongoDB Atlas Vector Search to find similar historical logs; improve root-cause analysis
- **Deep Learning**: Upgrade from scikit-learn to PyTorch/TensorFlow autoencoders for more complex patterns
- **Explainability**: Add SHAP values to explain why a log was flagged as anomalous
- **Drift Detection**: Monitor model performance; retrain when accuracy drops

### MongoDB Optimizations
- **Sharding**: For 100M+ logs, partition by timestamp or component across multiple MongoDB instances
- **TTL Indexes**: Auto-archive old logs to reduce hot data size
- **Read Replicas**: Dedicated secondary replicas for analytics queries without impacting write performance
- **Change Streams**: Real-time subscribers instead of polling for new anomalies

### System Architecture
- **Data Warehouse**: Export clean logs to BigQuery/Snowflake for BI dashboards
- **Feature Store**: Cache computed features (e.g., hourly error rate) to speed up model training
- **A/B Testing**: Run two anomaly detection models in parallel; compare accuracy before promoting

---

## Conclusion

**MongoDB is the data backbone** that stores all logs, anomaly results, and user feedback. **The AI service is the intelligence layer** that enriches logs with anomaly scores and classifications using scikit-learn (Isolation Forest, LOF) and spaCy (NLP). **Kafka provides the connective tissue**, decoupling ingestion from detection for high throughput. Together, they create a **scalable, auditable, continuous-learning anomaly detection system** that helps operators detect and respond to security and operational incidents in real-time.
