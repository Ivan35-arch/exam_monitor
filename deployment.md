# Deployment Guide for ExamMonitor

This guide covers how to deploy the ExamMonitor full-stack application to a production environment. Since the frontend is served statically by the Node.js backend, you only need to deploy a single web service and a PostgreSQL database.

## 1. Database Setup (PostgreSQL)

You will need a hosted PostgreSQL database. Good options include **Render**, **Supabase**, **Neon**, or **ElephantSQL**.

1. Create a new PostgreSQL database on your chosen provider.
2. Connect to the database using a tool like `psql` or pgAdmin.
3. Run the SQL scripts provided in the project root to set up the schema and insert initial data:
   - First, execute `init.sql` to create all the necessary tables.
   - Then, execute `fixedseed.sql` to populate the roles, mock data, and initial state.
4. Copy the connection string (usually starts with `postgresql://` or `postgres://`).

## 2. Environment Variables

Your production environment will need the following environment variables securely set:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | The connection string for your hosted PostgreSQL database. | `postgresql://user:password@host:port/dbname` |
| `JWT_SECRET` | A strong, random string used for signing JSON Web Tokens. | `your_very_long_secure_random_string` |
| `PORT` | The port the server runs on. Most hosts (like Render/Heroku) set this automatically. | `3000` |

## 3. Deploying the Node.js Backend

You can easily deploy the application using services like **Render**, **Railway**, or **Heroku**.

### Example: Deploying to Render

1. Create an account on [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing the ExamMonitor code.
4. Fill in the following settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (This runs `node backend/server.js` as defined in `package.json`)
5. Scroll down to **Environment Variables** and add the variables listed in Section 2 (`DATABASE_URL`, `JWT_SECRET`). Note: Render will inject the `PORT` variable automatically.
6. Click **Create Web Service**.

Once the build is complete, your application will be live! Since the Node server serves the frontend files statically, you will be able to access the UI immediately by navigating to the provided URL (e.g., `https://exammonitor-app.onrender.com/login.html`).

## 4. Considerations for Production

- **Security:** Ensure you change the default passwords from `fixedseed.sql` and use a strong, unique `JWT_SECRET`.
- **Database Limits:** If you use a free tier for PostgreSQL, keep in mind that connection limits or storage limits may apply.
- **Cron Jobs:** The Node application runs an internal cron job (`backend/services/cronJobs.js`) to send out notifications. If you use serverless deployments (like Vercel functions), background jobs might not run consistently. Using a standard Web Service (like on Render) ensures the process stays active to execute daily background tasks.
