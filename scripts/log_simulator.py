"""
Log Simulator - Generates realistic MongoDB log entries for testing
"""

import random
import time
from datetime import datetime, timedelta
from pathlib import Path


class LogSimulator:
    """Simulates MongoDB log entries for testing"""
    
    # MongoDB log templates
    SEVERITY_TEMPLATES = {
        'INFO': [
            "waiting for connections on port {port}",
            "new client connection from {ip}",
            "connection accepted from {ip} #{conn_id}",
            "end connection {ip}",
            "command {cmd} completed in {duration}ms",
            "authenticated as user {user}",
            "query {ns} planSummary: {plan} duration: {duration}ms",
            "create collection {ns}",
            "build index {ns} on field {field}",
            "Received interrupt signal",
        ],
        'WARNING': [
            "Slow query: {cmd} took {duration}ms",
            "Connection spike detected: {count} connections",
            "Checkpoint took {duration}ms (background job)",
            "Insufficient permission for operation: {op}",
            "CheckPoint delayed: still processing {count} operations",
            "Disk space warning: {percent}% used",
            "Collection scan for large dataset: {ns}",
            "Query optimization suggests new index",
        ],
        'ERROR': [
            "WiredTiger error: {error}",
            "Authentication failed for user {user} from {ip}",
            "SocketException: couldn't connect to server {ip}",
            "Command failed: {error}",
            "PlanExecutor error during query execution",
            "Journal write failure",
            "Cannot create temporary file: no space left on device",
            "Out of memory: cannot allocate {size}",
            "Sync source error: connection {error}",
            "Secondary lagging behind primary by {duration}s",
        ],
        'FATAL': [
            "Fatal assertion: {error}",
            "DBException in startup: {error}",
            "Out of memory: FATAL error",
        ]
    }
    
    COMPONENTS = [
        'NETWORK', 'STORAGE', 'REPL', 'SHARDING', 'COMMAND', 
        'QUERY', 'WRITE', 'ACCESS', 'FTDC', 'INDEX'
    ]
    
    PORTS = [27017, 27018, 27019]
    USERS = ['admin', 'root', 'developer', 'analyst', 'service', 'monitor', 'test']
    IPS = [f'192.168.1.{i}' for i in range(1, 255)]
    DATABASES = ['users', 'orders', 'products', 'sessions', 'logs', 'analytics']
    COLLECTIONS = ['documents', 'records', 'events', 'cache', 'sessions']
    COMMANDS = ['find', 'insert', 'update', 'delete', 'aggregate', 'count', 'mapReduce']
    PLANS = ['IXSCAN', 'COLLSCAN', 'IDHACK', 'SORT', 'PROJECTION']
    ERRORS = ['connection refused', 'timeout', 'not master', 'duplicate key', 'parse error']
    
    def __init__(self, output_file: str = None):
        self.output_file = Path(output_file) if output_file else Path('../logs/sample-logs/mongodb.log')
        
    def generate_log_entry(self, severity: str = None) -> str:
        """Generate a single log entry"""
        
        if not severity:
            # Weighted random severity
            severity = random.choices(
                ['INFO', 'WARNING', 'ERROR', 'FATAL'],
                weights=[70, 20, 8, 2]
            )[0]
        
        # Get template
        template = random.choice(self.SEVERITY_TEMPLATES[severity])
        
        # Format message
        message = template.format(
            port=random.choice(self.PORTS),
            ip=random.choice(self.IPS),
            conn_id=random.randint(1, 500),
            user=random.choice(self.USERS),
            duration=random.randint(10, 10000),
            count=random.randint(50, 500),
            percent=random.randint(80, 99),
            ns=f"{random.choice(self.DATABASES)}.{random.choice(self.COLLECTIONS)}",
            field=random.choice(['email', 'id', 'date', 'status', 'userId']),
            cmd=random.choice(self.COMMANDS),
            plan=random.choice(self.PLANS),
            error=random.choice(self.ERRORS),
            op=random.choice(['drop', 'create', 'insert', 'update']),
            size=f"{random.randint(1, 10)}GB",
        )
        
        # Build full log line
        timestamp = datetime.utcnow().isoformat().replace('T', 'T')[:23] + '+0000'
        component = random.choice(self.COMPONENTS)
        thread = f"conn{random.randint(1, 100)}"
        
        # Severity character
        severity_char = {
            'FATAL': 'F',
            'ERROR': 'E',
            'WARNING': 'W',
            'INFO': 'I'
        }.get(severity, 'I')
        
        log_line = f"{timestamp} {severity_char} {component} [{thread}] {message}"
        
        return log_line
    
    def write_log(self, log_line: str):
        """Write a log line to file"""
        with open(self.output_file, 'a') as f:
            f.write(log_line + '\n')
    
    def run(self, interval: float = 1.0, count: int = None):
        """Run the simulator"""
        print(f"Starting log simulator...")
        print(f"Output file: {self.output_file}")
        print(f"Interval: {interval}s")
        print("Press Ctrl+C to stop\n")
        
        # Clear file if it exists
        if self.output_file.exists():
            self.output_file.unlink()
        
        self.output_file.parent.mkdir(parents=True, exist_ok=True)
        
        generated = 0
        
        try:
            while count is None or generated < count:
                log_line = self.generate_log_entry()
                self.write_log(log_line)
                print(f"[{datetime.now().strftime('%H:%M:%S')}] {log_line}")
                
                generated += 1
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print(f"\n\nStopped. Generated {generated} log entries.")
    
    def generate_batch(self, count: int = 100) -> list:
        """Generate a batch of logs at once"""
        logs = []
        for _ in range(count):
            logs.append(self.generate_log_entry())
        return logs


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='MongoDB Log Simulator')
    parser.add_argument('-o', '--output', default='../logs/sample-logs/mongodb.log',
                       help='Output file path')
    parser.add_argument('-i', '--interval', type=float, default=1.0,
                       help='Interval between logs in seconds')
    parser.add_argument('-c', '--count', type=int, default=None,
                       help='Number of logs to generate (default: infinite)')
    
    args = parser.parse_args()
    
    simulator = LogSimulator(args.output)
    simulator.run(interval=args.interval, count=args.count)

