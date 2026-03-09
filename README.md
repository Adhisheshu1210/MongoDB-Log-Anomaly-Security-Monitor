# MongoDB Log Anomaly & Security Monitor

<p align="center">
  <img src="https://img.shields.io/badge/MongoDB-Log--Monitor-v1.0.0-brightgreen" alt="Version">
  <img src="https://img.shields.io/badge/Stack-MERN+-blue" alt="Stack">
  <img src="https://img.shields.io/badge/AI-Python-red" alt="AI">
  <img src="https://img.shields.io/badge/Docker-Ready-blue" alt="Docker">
</p>

A **real-time AI-powered monitoring platform** that detects anomalies, security threats, and performance issues from MongoDB logs. Built with a scalable microservice architecture using MERN stack and Python AI services.

![Dashboard Preview](https://via.placeholder.com/800x400?text=MongoDB+Log+Monitor+Dashboard)

## 🚀 Features

### Core Features
- **Real-time Log Ingestion** - Continuously reads MongoDB logs and streams to Kafka
- **AI-Powered Anomaly Detection** - Uses Isolation Forest, LOF, or Autoencoders
- **NLP Log Classification** - Classifies logs into categories (slow queries, auth failures, etc.)
- **Real-time WebSocket Updates** - Instant dashboard updates when anomalies occur
- **RESTful API** - Full CRUD operations for logs, anomalies, alerts

### Security
- **JWT Authentication** - Secure API access with JSON Web Tokens
- **Role-Based Access Control** - Admin, User, and Viewer roles
- **Password Encryption** - bcrypt hashing

### Monitoring Dashboard
- **Dark Cybersecurity Theme** - Professional dark mode with neon accents
- **Interactive Charts** - Recharts visualizations of log patterns
- **Real-time Log Viewer** - Filter, search, and paginate log entries
- **Alert Management** - Acknowledge, resolve, and track alerts
- **Configurable Thresholds** - Custom alert settings

### Notifications
- **Email Notifications** - SMTP-based alerts
- **Slack Integration** - Webhook notifications
- **Telegram Bot** - Direct message alerts

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MONITORING PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐           │
│   │   Frontend  │     │   Backend    │     │  AI Service │           │
│   │   (React)   │◄───►│  (Express)   │◄───►│  (Python)   │           │
│   │  :3000      │     │  :5000       │     │  :8000      │           │
│   └──────────────┘     └──────────────┘     └──────────────┘           │
│         │                    │                    │                    │
│         │              ┌──────┴──────┐             │                    │
│         │              │  WebSocket  │             │                    │
│         │              └──────┬──────┘             │                    │
│         │                   │                    │                     │
│         └───────────────────┼────────────────────┘                     │
│                             │                                           │
│   ┌─────────────────────────┼─────────────────────────────────────┐    │
│   │                    KAFKA BROKER                              │    │
│   │   ┌────────────┐  ┌────────────┐  ┌────────────┐           │    │
│   │   │  raw-logs  │  │processed   │  │ anomalies  │           │    │
│   │   │  topic     │  │-logs topic │  │ topic      │           │    │
│   │   └────────────┘  └────────────┘  └────────────┘           │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                             │                                          │
│   ┌─────────────────────────┼─────────────────────────────────────┐    │
│   │                    MONGODB                                     │    │
│   │   Collections: logs, anomalies, alerts, users, settings        │    │
│   └───────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
mongodb-log-monitor/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth, error handling
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API routes
│   │   ├── services/          # WebSocket, notifications
│   │   ├── utils/             # Logger utilities
│   │   └── app.js             # Main application
│   ├── package.json
│   └── .env
│
├── frontend/                   # React.js Dashboard
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client
│   │   ├── context/           # React contexts
│   │   └── App.jsx           # Main app
│   ├── package.json
│   └── tailwind.config.js
│
├── ai-service/                 # Python AI Service
│   ├── src/
│   │   ├── ingestion/         # Log ingestor
│   │   ├── processing/        # Log processor
│   │   ├── ml/                # Anomaly detection
│   │   ├── nlp/               # Log classification
│   │   └── main.py           # FastAPI app
│   └── requirements.txt
│
├── docker/                     # Docker configs
│   └── docker-compose.yml
│
├── logs/                       # Sample logs
│   └── sample-logs/
│
├── kubernetes/                # K8s deployments
│
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Charts
- **Socket.io Client** - WebSocket
- **React Router** - Navigation
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time
- **JWT** - Authentication
- **Bcryptjs** - Encryption
- **Helmet** - Security headers

### AI Service
- **Python 3.11** - Runtime
- **FastAPI** - Web framework
- **scikit-learn** - ML algorithms
- **Kafka-Python** - Message queue
- **spaCy** - NLP processing
- **NumPy** - Numerical computing

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Kafka** - Message broker
- **MongoDB** - Database

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- MongoDB (optional for local)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd mongodb-log-monitor

# Start all services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

### Option 2: Local Development

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### AI Service Setup
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs` | Get all logs (paginated) |
| GET | `/api/logs/:id` | Get single log |
| GET | `/api/logs/recent/:limit` | Get recent logs |

### Anomalies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/anomalies` | Get all anomalies |
| GET | `/api/anomalies/recent/:limit` | Get recent anomalies |
| POST | `/api/anomalies/:id/resolve` | Resolve anomaly |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Get all alerts |
| POST | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| POST | `/api/alerts/:id/resolve` | Resolve alert |

### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/dashboard` | Dashboard statistics |
| GET | `/api/stats/logs-by-level` | Logs by severity |
| GET | `/api/stats/logs-by-time` | Logs over time |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get all settings |
| PUT | `/api/settings/:key` | Update setting |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

## 🔌 WebSocket Events

### Server Events
| Event | Description |
|-------|-------------|
| `log:new` | New log entry received |
| `anomaly:detected` | Anomaly detected |
| `alert:new` | New alert created |
| `stats:update` | Statistics updated |

### Client Events
| Event | Description |
|-------|-------------|
| `subscribe:logs` | Subscribe to log updates |
| `subscribe:anomalies` | Subscribe to anomaly updates |

## 🤖 AI Processing

### Anomaly Detection Algorithms

1. **Isolation Forest** - Best for high-dimensional data
2. **Local Outlier Factor (LOF)** - Density-based detection
3. **Autoencoder** - Deep learning approach

### Log Classification Categories

- `normal` - Regular operation
- `slow_query` - Query > 100ms
- `auth_failure` - Authentication failures
- `unauthorized_access` - Permission issues
- `replication_error` - Replication problems
- `connection_spike` - Connection overload
- `memory_issue` - Memory problems
- `disk_issue` - Storage issues

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/log_monitor
JWT_SECRET=your_secret_key
PORT=5000
KAFKA_BROKER=localhost:9092
FRONTEND_URL=http://localhost:3000
```

#### AI Service (.env)
```env
MONGODB_URI=mongodb://localhost:27017
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
ANOMALY_ALGORITHM=isolation_forest
CONTAMINATION=0.1
```

### Alert Thresholds

Configure in Dashboard Settings:
- Slow Query: 100ms (default)
- Connection Spike: 100 connections
- Error Rate: 10/min
- Memory Usage: 85%
- Disk Usage: 90%
- Replication Lag: 10s

## 📊 Sample Log Format

```
2024-01-15T10:00:01.123+0000 I NETWORK  [initandlisten] waiting for connections on port 27017
2024-01-15T10:00:05.789+0000 I COMMAND  [conn2] command test.users find operation took 5423ms
2024-01-15T10:00:15.345+0000 I ACCESS   [conn4] Authentication failed for user test@admin from 192.168.1.100
```

## 📚 RBAC Documentation

This project includes comprehensive **Role-Based Access Control (RBAC)** system documentation. See the backend folder for complete guides:

### 🎯 Quick Links

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [**Quick Reference**](./backend/QUICK_REFERENCE.md) | ⭐ **START HERE** - Fast learn & troubleshooting | 10 min |
| [**Complete RBAC Guide**](./backend/COMPLETE_RBAC_GUIDE.md) | 📖 Full implementation guide with patterns | 45 min |
| [**RBAC Implementation**](./backend/RBAC_IMPLEMENTATION.md) | 📋 Detailed specification & API reference | 30 min |
| [**Project Summary**](./backend/PROJECT_COMPLETION_SUMMARY.md) | ✅ Status, features, testing checklist | 20 min |
| [**Documentation Index**](./backend/DOCUMENTATION_INDEX.md) | 🗂️ Navigation & topic lookup | 5 min |

### 🔐 RBAC Features Implemented

**Three Role Tiers**:
- ✅ **Admin** - Full system access (view all, configure settings, manage users)
- ✅ **User** - Standard access (view logs/anomalies, monitor dashboard)
- ✅ **Viewer** - Read-only access (view logs, check metrics)

**Comprehensive Error Handling**:
- ✅ Failed to generate demo data
- ✅ Failed to clear demo data  
- ✅ Failed to backup settings
- ✅ Failed to restore settings (with validation)

**Key Operations**:
- ✅ Demo data generation (with parameter validation)
- ✅ Demo data clearing (parallel deletion)
- ✅ Settings backup (with completeness check)
- ✅ Settings restore (with format/version validation + partial success)

### 🚀 Getting Started with RBAC

1. **Read** [QUICK_REFERENCE.md](./backend/QUICK_REFERENCE.md) (10 min)
2. **Review** Demo user credentials in the guide
3. **Try** Sample curl commands provided
4. **Integrate** Frontend using the patterns shown

### 🔑 Demo Users

```
# Admin user (full access)
Username: admin@example.com
Password: admin123

# Standard user
Username: user@example.com
Password: user123

# Viewer (read-only)
Username: viewer@example.com
Password: viewer123
```

See [QUICK_REFERENCE.md](./backend/QUICK_REFERENCE.md) for more details.

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run AI service tests
cd ai-service
pytest tests/

# Test RBAC system
# See QUICK_REFERENCE.md for curl test examples
```

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- MongoDB Documentation
- scikit-learn Documentation
- FastAPI Documentation
- React Documentation

---

<p align="center">Built with ❤️ for DevOps and AI Innovation</p>


# MongoDB-Log-Anomaly-Security-Monitor
