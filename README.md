# Exponus - A Full-Stack Blogging Platform

Exponus is a modern, full-stack blogging platform inspired by Medium, designed for performance, scalability, and a seamless user experience. It allows users to register, manage profiles, create and publish blog posts, and interact with content through likes and comments.

## Tech Stack

*   **Frontend:** React.js, TypeScript, Tailwind CSS, Redux Toolkit (State Management), Axios
*   **Backend:** Hono (Cloudflare Workers), TypeScript, Prisma ORM, Zod (Validation)
*   **Database:** PostgreSQL
*   **Infrastructure:** Cloudflare Workers (Backend Deployment), AWS S3 (Image Storage)
*   **Shared Code:** npm package (`@exponus1/exponus-common`) for shared types and validation schemas (Zod)
*   **DevOps:** Docker, CI/CD (e.g., GitHub Actions)

## Features

*   **User Authentication:** Secure user registration and login (JWT-based).
*   **Profile Management:** Users can update their name, bio, and profile avatar (uploads to AWS S3).
*   **Blog CRUD:** Create, Read, Update, and Delete blog posts.
*   **Rich Text Editor:** (Assumed/Planned) A rich editing experience for creating blog content.
*   **Blog Interactions:** Like, Dislike, and Comment on blog posts.
*   **Pagination:** Efficient loading of blog lists.
*   **Shared Validation:** End-to-end type safety and input validation using Zod schemas shared via an npm package.
*   **Serverless Backend:** High-performance, scalable backend deployed on Cloudflare's edge network.

## Project Structure

This project is structured as a monorepo:

*   `common/`: Contains shared TypeScript code (types, Zod schemas) published as an npm package (`@exponus1/exponus-common`).
*   `frontend/`: The React.js single-page application.
*   `backend/`: The Hono serverless API running on Cloudflare Workers.

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   Docker & Docker Compose (for local PostgreSQL)
*   Cloudflare Account (for Wrangler CLI and deployment)
*   AWS Account & S3 Bucket (for image uploads)

### Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd exponus
    ```

2.  **Install Dependencies:**
    *   Install dependencies in the root, common, backend, and frontend directories.
    ```bash
    npm install
    cd common && npm install && cd ..
    cd backend && npm install && cd ..
    cd frontend && npm install && cd ..
    ```

3.  **Build Shared Package:**
    *   Build the common package. You might need to link it locally (`npm link`) or rely on npm/yarn workspaces if configured.
    ```bash
    cd common
    npm run build
    cd ..
    ```
    *   *(If not using workspaces, you might need `npm link` in `common` and `npm link @exponus1/exponus-common` in `frontend` and `backend`)*

4.  **Setup Backend Environment (`backend/.env`):**
    *   Create a `.env` file in the `backend` directory based on `.env.example` (if one exists) or add the following:
    ```ini
    DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?schema=public"
    JWT_SECRET="<YOUR_STRONG_JWT_SECRET>"
    # Cloudflare Workers Environment Variables (usually set via Wrangler or dashboard)
    # S3 Variables (ensure these match your AWS setup)
    S3_BUCKET_NAME="<YOUR_S3_BUCKET_NAME>"
    S3_REGION="<YOUR_S3_BUCKET_REGION>"
    AWS_ACCESS_KEY_ID="<YOUR_AWS_ACCESS_KEY_ID>"
    AWS_SECRET_ACCESS_KEY="<YOUR_AWS_SECRET_ACCESS_KEY>"
    ```
    *   **Note:** For local development, `DB_HOST` might be `localhost` or `host.docker.internal` if using Docker.

5.  **Setup Frontend Environment (`frontend/.env`):**
    *   Create a `.env` file in the `frontend` directory if needed (e.g., for the backend URL):
    ```ini
    VITE_BACKEND_URL="http://localhost:8787" # Adjust if your backend runs elsewhere
    ```

6.  **Setup Database (Local PostgreSQL):**
    *   If using Docker, you can use a `docker-compose.yml` file to easily start a PostgreSQL instance. Example `docker-compose.yml`:
      ```yaml
      version: '3.8'
      services:
        postgres:
          image: postgres:15
          restart: always
          environment:
            POSTGRES_USER: <DB_USER>
            POSTGRES_PASSWORD: <DB_PASSWORD>
            POSTGRES_DB: <DB_NAME>
          ports:
            - '<DB_PORT>:5432'
          volumes:
            - postgres_data:/var/lib/postgresql/data

      volumes:
        postgres_data:
      ```
    *   Run `docker-compose up -d` in the directory containing this file.

7.  **Apply Database Migrations:**
    *   Navigate to the backend directory and run Prisma migrations.
    ```bash
    cd backend
    npx prisma migrate dev --name init # Or your chosen migration name
    # Optional: Seed the database
    # npx prisma db seed
    cd ..
    ```

### Running Locally

1.  **Start the Backend Server:**
    ```bash
    cd backend
    npm run dev # Or your script for running wrangler dev
    ```

2.  **Start the Frontend Development Server:**
    ```bash
    cd frontend
    npm run dev
    ```

3.  Open your browser and navigate to the frontend URL (usually `http://localhost:5173` or similar).

## Deployment

*   **Backend:** Deployed to Cloudflare Workers using the Wrangler CLI (`wrangler deploy`). Environment variables should be configured using secrets in the Cloudflare dashboard or `wrangler.toml`.
*   **Frontend:** Can be deployed to static hosting platforms like Cloudflare Pages, Vercel, or Netlify. Ensure the build command (`npm run build` in `frontend`) is configured correctly and environment variables (like `VITE_BACKEND_URL` pointing to the deployed worker URL) are set in the deployment platform.
*   **Database:** Typically hosted on a managed PostgreSQL provider (e.g., Supabase, Neon, AWS RDS, Aiven). Ensure the `DATABASE_URL` secret is correctly set for the deployed Cloudflare Worker.

## Contributing

Contributions are welcome! Please follow standard Git workflow (fork, branch, pull request). Ensure code is formatted and passes any linting checks.

## License

(Specify your license here, e.g., MIT License)
