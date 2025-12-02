## Running the Project with Docker

This project provides a Docker setup for running the TypeScript application in a reproducible environment. The Docker configuration uses Node.js version **22.13.1** (as specified in the Dockerfile) and exposes the main application on port **3000**.

### Requirements
- Docker (latest recommended)
- Docker Compose (v2 or later)

### Environment Variables
- The application supports environment variables via a `.env` file. If you have project-specific settings, create a `.env` file in the root directory. See `.env.example` for reference.

### Build and Run Instructions

1. **Build and start the application:**

   ```bash
   docker compose up --build
   ```

   This will build the Docker image using the provided `Dockerfile` and start the service defined in `docker-compose.yaml`.

2. **Access the application:**
   - The main service (`ts-app`) is available on [http://localhost:3000](http://localhost:3000).

### Configuration Notes
- The Dockerfile uses a multi-stage build for efficient image size and security.
- The application runs as a non-root user (`appuser`) for improved security.
- If you need to add a database (e.g., PostgreSQL), see the commented example in `docker-compose.yaml` and uncomment/configure as needed.
- The `NODE_ENV` is set to `production` and `NODE_OPTIONS` is configured for increased memory limits.

### Ports
- **ts-app:** Exposes port **3000** (mapped to host port 3000)

---

_Refer to the Dockerfile and docker-compose.yaml for advanced configuration options or to add additional services._