# PaperHands Go API

A Go-based REST API using Gin framework and PostgreSQL.

## Prerequisites

- Go 1.21 or higher
- PostgreSQL database

## Setup

1. Install dependencies:
```bash
go mod tidy
```

2. Configure environment variables in `.env`:
```
PORT=3001
GIN_MODE=debug
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=paperhands
```

3. Ensure PostgreSQL is running and the database exists

## Running the API

```bash
go run main.go
```

The API will start on port 3001.

## Available Endpoints

### Health Check
- `GET /health` - Check API health status

### Authentication
- `POST /auth/login` - User login
  - Request body: `{"email": "user@example.com", "password": "password"}`
- `POST /auth/logout` - User logout

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create a new user
  - Request body: `{"email": "user@example.com", "password": "password123"}`
  - Password must be at least 8 characters
- `PUT /users/:id` - Update user
  - Request body: `{"email": "newemail@example.com", "password": "newpassword123"}`
  - Both fields are optional

## Database Schema

The API expects a `users` table with the following structure:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Development

- Build: `go build`
- Run tests: `go test ./...`
