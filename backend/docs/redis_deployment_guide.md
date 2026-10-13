# Redis Production Deployment & Linux Configuration Guide

This guide documents the setup, security, operating system tuning, and maintenance of **Redis** for the **Ranniti** backend in production environments.

---

## 1. Overview & Role in Ranniti Architecture

In Ranniti, Redis acts as a high-performance in-memory cache and synchronization coordinator:

1. **Query Caching (`CacheService`)**:
   - Caches master electoral data, voter filters, assembly/parliamentary records, and system settings.
   - **Thundering Herd Protection**: Uses distributed leases (`SET ... NX EX` with auto-renewal heartbeat and atomic Lua script release) to ensure only one worker executes expensive database queries during cache misses.
   - **Jittered Expiration**: Uses randomized TTLs (±15%) to prevent simultaneous expiration of cached datasets.
   - **Non-blocking Invalidation**: Uses non-blocking `SCAN` streams (batch size 100) instead of blocking `KEYS *` commands to prevent freezing the Redis event loop.
2. **Mobile Sync Manifests (`SyncManifestService`)**:
   - Tracks tenant dataset version counters in $O(1)$ time using Redis Hashes (`HGETALL`, `HINCRBY`) to support offline-first sync for mobile users.
3. **Graceful Fallback**:
   - Configured with `enableOfflineQueue: false` and `maxRetriesPerRequest: 3`. If Redis is offline or restarting, requests do not hang; the backend automatically falls back to PostgreSQL directly.
4. **Lifecycle Safety**:
   - Cleanly disconnected via `closeRedis()` during server graceful shutdown (`SIGTERM`/`SIGINT`).

---

## 2. Linux Installation

### Ubuntu / Debian

```bash
# 1. Update system package index
sudo apt update

# 2. Install Redis server and CLI utilities
sudo apt install -y redis-server

# 3. Verify installed version
redis-server --version
```

### RHEL / CentOS / Rocky Linux / AlmaLinux

```bash
# 1. Enable EPEL repository (if not already enabled)
sudo dnf install -y epel-release

# 2. Install Redis
sudo dnf install -y redis

# 3. Verify installed version
redis-server --version
```

---

## 3. Production Redis Configuration (`/etc/redis/redis.conf`)

Edit the Redis configuration file:

```bash
sudo nano /etc/redis/redis.conf
```

Apply the following production parameters:

```conf
# ─── 1. Supervised Mode (Systemd) ──────────────────────────
# Allows systemd to manage the service lifecycle and watchdog
supervised systemd

# ─── 2. Network & Binding ──────────────────────────────────
# Bind to localhost (if Node.js and Redis reside on the same server)
bind 127.0.0.1 ::1
protected-mode yes
port 6379

# If Redis is hosted on a separate private VPC server, bind to its internal IP:
# bind 127.0.0.1 10.0.x.x

# ─── 3. Authentication ─────────────────────────────────────
# Mandatory: Set a strong, generated password
requirepass "YOUR_STRONG_PRODUCTION_REDIS_PASSWORD"

# ─── 4. Memory Limits & Eviction Policy ────────────────────
# Adjust based on server capacity (e.g., 1gb, 2gb, 4gb)
maxmemory 1gb

# Evict oldest keys with TTL to protect persistent Sync Manifests
maxmemory-policy volatile-lru

# ─── 5. Persistence (RDB Snapshots) ────────────────────────
# Periodic background snapshots
save 900 1
save 300 10
save 60 10000
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# ─── 6. Security: Rename / Disable Dangerous Commands ──────
# Disables dangerous commands that can wipe data or lock the single thread
rename-command FLUSHALL ""
rename-command FLUSHDB ""
rename-command DEBUG ""
rename-command SHUTDOWN "SHUTDOWN_ADMIN_ONLY"
```

Save and exit (`Ctrl + O`, then `Ctrl + X`).

---

## 4. Linux OS Kernel Optimizations

Redis requires specific Linux kernel configurations to avoid memory allocation failures and high latency.

### A. Memory Overcommit (`vm.overcommit_memory = 1`)

Without this, background snapshotting (`BGSAVE`) can fail when system memory is heavily utilized.

```bash
# Apply immediately
sudo sysctl vm.overcommit_memory=1

# Make permanent across reboots
echo 'vm.overcommit_memory = 1' | sudo tee -a /etc/sysctl.conf
```

### B. Increase TCP Connection Backlog (`net.core.somaxconn = 1024`)

Prevents connection drops during traffic bursts.

```bash
# Apply immediately
sudo sysctl net.core.somaxconn=1024

# Make permanent across reboots
echo 'net.core.somaxconn = 1024' | sudo tee -a /etc/sysctl.conf
```

### C. Disable Transparent Huge Pages (THP)

Transparent Huge Pages cause memory fragmentation and latency spikes in Redis.

1. **Disable immediately**:
   ```bash
   echo never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled
   echo never | sudo tee /sys/kernel/mm/transparent_hugepage/defrag
   ```

2. **Make permanent via Systemd Service**:
   Create a dedicated unit file:
   ```bash
   sudo nano /etc/systemd/system/disable-thp.service
   ```

   Paste the following definition:
   ```ini
   [Unit]
   Description=Disable Transparent Huge Pages (THP) for Redis
   DefaultDependencies=no
   After=sysinit.target local-fs.target
   Before=redis-server.service

   [Service]
   Type=oneshot
   ExecStart=/bin/sh -c "echo never > /sys/kernel/mm/transparent_hugepage/enabled && echo never > /sys/kernel/mm/transparent_hugepage/defrag"

   [Install]
   WantedBy=basic.target
   ```

   Enable the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable disable-thp.service
   sudo systemctl start disable-thp.service
   ```

---

## 5. Systemd Service Management

Start and enable Redis so it starts automatically on system reboots:

```bash
# Restart to apply configuration changes
sudo systemctl restart redis-server

# Enable auto-start on boot
sudo systemctl enable redis-server

# Inspect service status
sudo systemctl status redis-server
```

---

## 6. Network Security & Firewall (UFW / iptables)

Ensure port `6379` is never accessible from the public internet.

### If Redis and Backend Run on the Same Host:
No firewall rule is needed since Redis is bound to `127.0.0.1`.

### If Redis Runs on a Dedicated Server (VPC Subnet):
Allow traffic **only** from the backend server IP:

```bash
# Allow internal backend server (e.g., 10.0.0.50)
sudo ufw allow from 10.0.0.50 to any port 6379 proto tcp
sudo ufw reload
```

---

## 7. Ranniti Backend Configuration (`.env`)

Add the corresponding Redis configuration to your backend `.env` or `.env.production` file:

```env
# ─── Redis In-Memory Cache Configuration ───────────────────
REDIS_ENABLED=true
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_STRONG_PRODUCTION_REDIS_PASSWORD
REDIS_DB=0
REDIS_TTL_DEFAULT=86400
REDIS_TTL_JITTER_PCT=15
```

---

## 8. Deployment Verification & Testing

### 1. Test via `redis-cli`

```bash
# Connect with password
redis-cli -a "YOUR_STRONG_PRODUCTION_REDIS_PASSWORD"

# Ping test
127.0.0.1:6379> ping
# Response: PONG

# Check memory and server info
127.0.0.1:6379> info memory
127.0.0.1:6379> info clients

# Exit
127.0.0.1:6379> exit
```

### 2. Verify Backend Logs

Start or restart your backend service (`pm2 restart ranniti-backend` or `systemctl restart ranniti-backend`):

- **Expected Success Log**:
  ```text
  ✅ Connected to Redis cache server.
  ```

- **Warning / Fallback Log (If Redis is stopped or unreachable)**:
  ```text
  ⚠️ Redis server not detected at 127.0.0.1:6379 — Falling back to PostgreSQL directly.
  ```

### 3. Verify Active Cache Keys

Once requests hit the application, verify keys created by Ranniti:

```bash
redis-cli -a "YOUR_STRONG_PRODUCTION_REDIS_PASSWORD" scan 0 match "ranniti:*" count 20
```

---

## 9. Troubleshooting & Maintenance

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `ECONNREFUSED 127.0.0.1:6379` | Redis service is stopped or port mismatch | Run `sudo systemctl status redis-server` and verify port in `/etc/redis/redis.conf`. |
| `NOAUTH Authentication required` | Missing or incorrect `REDIS_PASSWORD` | Verify `REDIS_PASSWORD` in `.env` matches `requirepass` in `/etc/redis/redis.conf`. |
| `OOM command not allowed when used memory > 'maxmemory'` | Memory limit reached and no keys could be evicted | Increase `maxmemory` in `redis.conf` or ensure volatile keys have expiration TTLs. |
| High CPU usage | Blocking commands running | Check slowlog via `redis-cli slowlog get 10`. Ranniti uses non-blocking `SCAN` to avoid blocking. |
| `MISCONF Redis is configured to save RDB snapshots, but is currently not able to persist` | `vm.overcommit_memory` not set to 1 or disk is full | Run `sudo sysctl vm.overcommit_memory=1` and check free disk space with `df -h`. |
