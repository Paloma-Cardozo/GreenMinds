# 🌿 Easy Bloom: Plant Care Guidance App

A full-stack application built by Hiwot, Juliana, Paloma and Shilpa at **Hack Your Future** to help users track and manage their favorite plants with personalized care guidance.

## Table of Contents

- [Team & Roles](#team--roles)
- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [API Documentation](#api-documentation)
- [Deployment & Demo Links](#deployment--demo-links)
- [Project Structure](#project-structure)
- [Key Technical Decisions](#key-technical-decisions)
- [Current Status](#current-status)
- [Development Notes](#development-notes)
- [License](#license)
- [Getting Help](#getting-help)

## Team & Roles

| Person  | Primary focus                                                               |
| ------- | --------------------------------------------------------------------------- |
| Paloma  | Authentication, security (rate limiting), error handling, API documentation |
| Juliana | Database design & schema, frontend                                          |
| Hiwot   | Plants & Favorites API, PlantBook integration                               |
| Shilpa  | User profile API, frontend                                                  |

Mentored by Unmesh.

## Project Overview

Easy Bloom is a plant management platform where users can:

- Create an account with secure authentication
- Search and explore plant information via the PlantBook API
- Save favorite plants to their personal collection
- Access personalized plant care tips and guidance

**Tech Stack:**

- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL (with Knex.js migrations)
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **API Documentation:** Swagger/OpenAPI
- **Frontend:** (in progress: templates available)

---

## Getting Started

### Prerequisites

- **Node.js** v20.12.1 or higher
- **npm** v10.5.0 or higher
- **PostgreSQL** running locally or remote connection details

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Paloma-Cardozo/GreenMinds.git
   cd GreenMinds/api
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env-template` to `.env`
   - Fill in your configuration:

     ```
     PORT=3001
     DB_CLIENT=pg
     DB_HOST=localhost
     DB_PORT=5432
     DB_USER=postgres
     DB_PASSWORD=your_password
     DB_DATABASE_NAME=greenminds
     DB_USE_SSL=false

     JWT_SECRET=your_secret_key_here
     PLANTBOOK_CLIENT_ID=your_client_id
     PLANTBOOK_CLIENT_SECRET=your_client_secret
     ```

4. **Create the database:**
   - Using pgAdmin or your PostgreSQL client, create a database named `greenminds`

5. **Run migrations:**

   ```bash
   npm run migrate:latest
   ```

6. **Seed demo data (optional):**
   ```bash
   npm run seed
   ```
   This creates 4 demo users (hiwot, juliana, paloma, shilpa) with passwords matching their usernames.

### Running the Server

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The API will be available at `http://localhost:3001/api`

---

## API Endpoints

### Sign up and Login

- **POST** `/api/auth/signup` — Register a new user

  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure_password_8+"
  }
  ```

- **POST** `/api/auth/login` — Login and receive JWT token
  ```json
  {
    "email": "john@example.com",
    "password": "secure_password_8+"
  }
  ```
  Returns: `{ token: "jwt_token", user: { id, username, email } }`

### Plants & Favorites

All endpoints require `Authorization: Bearer <token>` header.

- **GET** `/api/plants/favorites` — Get user's favorite plants
- **POST** `/api/plants/favorites` — Add a plant to favorites
  ```json
  {
    "pid": "plantsdb_id",
    "alias": "optional_custom_name"
  }
  ```
- **DELETE** `/api/plants/favorites/:id` — Remove a favorite plant

### User Profile

All endpoints require `Authorization: Bearer <token>` header, and act on the currently logged-in user (there's no way to view or edit another user's profile).

- **GET** `/api/users/me` — Get the logged-in user's profile (`id`, `username`, `email`, `created_at`)
- **PUT** `/api/users/me` — Update the logged-in user's `username` and/or `email`
  ```json
  {
    "username": "new_username",
    "email": "new_email@example.com"
  }
  ```
- **DELETE** `/api/users/me` — Permanently delete the logged-in user's account

---

## API Documentation

Interactive API documentation is available at:

```
http://localhost:3001/api-docs
```

Use the "Authorize" button to test endpoints with your JWT token.

---

## Deployment & Demo Links

| Resource           | Link                 |
| ------------------ | -------------------- |
| Deployed API       | _Pending deployment_ |
| Deployed API docs  | _Pending deployment_ |
| Postman collection | _Pending_            |

This section will be updated once the team deploys to Render and publishes a Postman collection.

---

## Project Structure

```
GreenMinds/
├── api/                          # Backend
│   ├── src/
│   │   ├── index.mjs            # Express server setup
│   │   ├── database_client.js   # Knex database configuration
│   │   ├── swagger.js           # Swagger/OpenAPI configuration
│   │   ├── middleware/
│   │   │   ├── asyncHandler.js  # Wraps async routes to forward errors automatically
│   │   │   ├── auth.js          # JWT verification
│   │   │   ├── errorHandler.js  # Error handling
│   │   │   ├── loginLimiter.js  # Rate limiting
│   │   │   └── notFoundHandler.js
│   │   ├── routers/
│   │   |   ├── auth.js          # Authentication routes
│   │   |   ├── plants.js        # Plants/favorites routes
│   │   │   └── users.js         # User profile routes
│   │   └── services/
│   │       └── plantService.js  # PlantBook integration and favorites logic
│   ├── migrations/               # Database schema
│   ├── seeds/                    # Demo data
│   ├── .env-template             # Environment variable reference (copy to .env locally)
│   └── package.json
├── app/                          # Frontend (in progress)
├── templates/                    # Frontend starter templates
└── README.md
```

---

## Key Technical Decisions

A few choices worth explaining, beyond just listing the tech stack:

- **Centralized error handling middleware** — instead of each route formatting its own error responses, all unexpected errors flow through one `errorHandler.js`, so the response format stays consistent and internal error details (database error messages) never leak to the client.
- **`asyncHandler` wrapper for all async routes** — Express 4 doesn't automatically catch errors from `async` routes, so one unhandled rejection could crash the entire server. Wrapping every route in a small reusable function fixes this once, following DRY, instead of relying on every route remembering its own `try/catch`.
- **Rate limiting on login only, not signup** — login is the realistic target for brute-force password guessing; signup doesn't expose that same risk, so it was left unrestricted to avoid blocking legitimate new users.
- **Email normalization (lowercase) at signup and login** — avoids users accidentally creating duplicate accounts, or failing to log in, due to inconsistent capitalization in their email address.

---

## Current Status

### ✅ Completed

- User authentication (signup, login, JWT tokens)
- Password security (bcrypt hashing)
- Plant favorites management (CRUD operations)
- API documentation (Swagger/OpenAPI)
- Rate limiting on login endpoint
- Email validation and normalization
- Bearer token authentication on protected routes
- User profile management (view, update, delete account)

### 🔄 In Progress

- Frontend implementation (choose template: Vanilla JS, React, or Next.js)
- Additional plant features (watering schedule)

### Not Yet Implemented (Optional)

These were listed as optional ideas in the project requirements:

- Automated tests (integration tests for key endpoints)
- CI pipeline (GitHub Actions on each PR)
- Pagination, sorting, and filtering on list endpoints
- Role-based access control (admin vs regular user)

---

## Development Notes

### Database Migrations

Migrations are managed with Knex.js. To create a new migration:

```bash
npx knex migrate:make migration_name
```

---

## License

This is a Hack Your Future educational project.

---

## Getting Help

For issues or questions:

1. Check the API documentation at `/api-docs`
2. Review the `.env-template` for required configuration
3. Ensure PostgreSQL is running and accessible
4. Check console logs for error messages

---
