# 🌿 Easy Bloom: Plant Care Guidance App

A full-stack application built by Hiwot, Juliana, Paloma and Shilpa at **Hack Your Future** to help users track and manage their favorite plants with personalized care guidance.

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

### Authentication

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

---

## API Documentation

Interactive API documentation is available at:

```
http://localhost:3001/api-docs
```

Use the "Authorize" button to test endpoints with your JWT token.

---

## Project Structure

```
GreenMinds/
├── api/                          # Backend
│   ├── src/
│   │   ├── index.mjs            # Express server setup
│   │   ├── database_client.js   # Knex database configuration
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verification
│   │   │   ├── errorHandler.js  # Error handling
│   │   │   ├── loginLimiter.js  # Rate limiting
│   │   │   └── notFoundHandler.js
│   │   └── routers/
│   │       ├── auth.js          # Authentication routes
│   │       └── plants.js        # Plants/favorites routes
│   ├── migrations/               # Database schema
│   ├── seeds/                    # Demo data
│   ├── .env                      # Environment configuration
│   └── package.json
├── app/                          # Frontend (in progress)
├── templates/                    # Frontend starter templates
└── README.md
```

---

## Current Status

### ✅ Completed

- User authentication (signup, login, JWT tokens)
- Password security (bcrypt hashing)
- Plant favorites management (CRUD operations)
- Database migrations and seeds
- API documentation (Swagger/OpenAPI)
- Rate limiting on login endpoint
- Email validation and normalization
- Bearer token authentication on protected routes

### 🔄 In Progress

- Frontend implementation (choose template: Vanilla JS, React, or Next.js)
- Additional plant features (watering schedule)
- User profile management

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
