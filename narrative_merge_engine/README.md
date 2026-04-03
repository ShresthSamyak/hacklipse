# Narrative Merge Engine

Narrative Merge Engine is a core intelligence layer designed to systematically reconstruct truth from fragmented human testimonies. It functions as a version control system for unstructured memory, taking disjointed, out-of-order, and conflicting accounts (in potentially mixed languages such as English, Hindi, and Hinglish) and processing them into structured, chronological timelines, identifying critical areas of contention.

## Features

- **Event Extraction**: Translates raw testimony into structured events. Operates with explicit handling of ambiguity, extracting approximate times, unconfirmed presence, and preserving the speaker's uncertainty.
- **Timeline Reconstruction**: Assembles events into confirmed, probable, and uncertain sequences, forming a logical timeline out of non-linear testimony without hallucinating exact chronological orders.
- **Forensic Conflict Detection (Git-Style)**: Detects mismatches between differing timelines (e.g., temporal clashes, logical contradictions, entity mismatches) and outputs them in a strict, Git-style diff format for human review.
- **High-Availability Demo Pipeline**: An end-to-end processing pipeline built for resilience, incorporating fast-preview modes, aggressive timeout bounds, status ratcheting, and graceful degradation during live operation.
- **Integrated API Documentation**: OpenAPI/Swagger UI natively integrates with HTTPBearer JWT authentication for seamless local testing and endpoint interaction.

## Architecture & Technology Stack

- **Framework**: FastAPI (Asynchronous Web Framework)
- **Validation**: Pydantic v2 (Strict Typing and Environment Settings)
- **Database**: PostgreSQL with asyncpg (Supabase-compatible)
- **Cache**: Redis (Rate Limiting and Pub-Sub)
- **Language Models**: Groq (Llama 3.3 70B Versatile for core reasoning, Llama 3.1 8B Instant for fast previews)
- **Automatic Speech Recognition**: Groq Whisper Large V3 Turbo

## System Requirements

- Python 3.10+
- PostgreSQL
- Redis
- API Keys: Groq (Primary and Fast AI routes)

## Setup Instructions

1. **Clone the Repository**

2. **Install Dependencies**
   It is recommended to use Poetry for dependency management.
   ```bash
   poetry install
   ```

3. **Configure Environment**
   Copy the example environment configuration and populate it with your credentials:
   ```bash
   cp .env.example .env
   ```
   Ensure you provide a valid LLM_API_KEY mapped to your Groq account. The system utilizes pydantic-settings v2, enforcing environment consistency at startup.

4. **Initialize the Database**
   Apply Alembic migrations to set up the database schema:
   ```bash
   alembic upgrade head
   ```

5. **Run the Server**
   Start the FastAPI application via Uvicorn:
   ```bash
   poetry run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

6. **Access Documentation**
   Navigate to the auto-generated Swagger UI at `http://localhost:8000/docs`. To test protected routes, use the Authorize button with your Bearer token (or bypass tokens during local development runs if debugging is enabled).

## Demo Pipeline Usage

The system includes dedicated endpoints designed for live demonstration under the `/api/v1/demo` route.

- **Full Run**: `POST /api/v1/demo/run`
  Accepts Multipart Form Data (audio file or text). Processes STT, Extraction, Timeline, and Conflicts natively via asyncio.gather for parallel witness execution.

- **Text-Only Mode**: `POST /api/v1/demo/run-text`
  Accepts direct text arrays representing various testimony branches to directly observe conflict detection.

- **Fast Preview**: Append `?fast_preview=true` to skip latency-bound reasoning paths for immediate structural UI rendering using the lightweight delegator model.

- **Sample Backup**: `GET /api/v1/demo/sample`
  Failsafe static data route for system unavailability.

## Development & Maintenance

Codebase quality is enforced via flake8, black, isort, and mypy. Ensure you run formatting pipelines before submitting changes to the repository.

```bash
black app
isort app
mypy app
```

## License

Copyright (c) 2026. All rights reserved.
