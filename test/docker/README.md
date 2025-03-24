# Docker Support

This directory contains Docker-related utilities and documentation for the test MCP server.

## Basic Usage

### Build with Docker

```bash
docker build -t test .
```

### Run with Docker

```bash
docker run -p 3000:3000 test
```

### Use Docker Compose

```bash
docker-compose up
```

## Configuration

The Docker container uses the .env.example file by default. To use custom environment variables:

1. Mount a custom .env file:
   ```bash
   docker run -p 3000:3000 -v ./my-env-file.env:/app/.env test
   ```

2. Or use environment variables directly:
   ```bash
   docker run -p 3000:3000 -e PORT=5000 -e NODE_ENV=production test
   ```

## Production Deployment

For production deployment, consider using:

- Docker Swarm
- Kubernetes
- Cloud container services (AWS ECS, Google Cloud Run, etc.)

See the deployment documentation for more details.
