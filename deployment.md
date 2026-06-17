# Deployment Guide for ExamMonitor

This guide covers how to deploy the ExamMonitor full-stack application to a production environment or move it to a new machine. Since the frontend is served statically by the Node.js backend, you only need to deploy a single web service, a Python environment, and a PostgreSQL database.

## 1. Prerequisites

Before moving the system to a new machine, ensure the following are installed:
- **Node.js** (v16 or higher recommended)
- **Python** (v3.8 or higher)
- **PostgreSQL** (v12 or higher)
- **Git** (optional, for cloning the repository)

## 2. Database Setup (PostgreSQL)

You will need a PostgreSQL database. You can host this locally on the new machine or use a managed service (Render, Supabase, Neon).

1. Create a new PostgreSQL database.
2. Connect to the database using a tool like `psql` or pgAdmin.
3. Run the SQL scripts provided in the project root to set up the schema and insert initial data:
   - First, execute `init.sql` to create all the necessary tables.
   - Then, execute `fixedseed.sql` to populate the roles, mock data, and initial state.
4. Note down your connection string (e.g., `postgresql://user:password@localhost:5432/exam_db`).

## 3. Python Environment Setup

The backend relies on a Python script (`parse_2025.py`) using `pdfplumber` to extract data from uploaded PDF timetables. The Node server automatically looks for a virtual environment named `venv` in the root directory.

1. Open a terminal in the root directory of the project.
2. Create a virtual environment:
   - Windows: `python -m venv venv`
   - Linux/Mac: `python3 -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Install the required Python packages:
   - `pip install -r requirements.txt`

## 4. Node.js Environment Setup

1. In the project root, install the Node dependencies:
   - `npm install`
2. Create a `.env` file in the root directory and configure your environment variables:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | The connection string for your PostgreSQL database. | `postgresql://user:password@localhost:5432/exam_db` |
| `JWT_SECRET` | A strong, random string used for signing JSON Web Tokens. | `your_very_long_secure_random_string` |
| `PORT` | The port the server runs on. | `3000` |

## 5. Directory Structure & Permissions

Ensure the backend has permissions to write to the file system.
- The `backend/uploads/` directory must exist and be writable, as this is where uploaded PDF timetables are temporarily saved before parsing.

## 6. Running the Application

Once both environments are set up and the database is running:

1. Start the Node.js server:
   - `npm start` (or `npm run dev` for development)
2. The server will start (default is port 3000). You can access the UI by navigating to `http://localhost:3000/login.html`.

## 7. Considerations for Production

- **Security:** Ensure you change the default passwords from `fixedseed.sql` and use a strong, unique `JWT_SECRET`.
- **Process Manager:** On a production machine, use a process manager like **PM2** (`npm install -g pm2` then `pm2 start backend/server.js`) to ensure the Node app restarts automatically if it crashes or the server reboots.
- **Python Execution:** The system uses `child_process.execFile` to execute the local Python script. For deployments on platforms like Render or Railway, ensure both Node and Python are installed in the deployment environment. Serverless environments (like Vercel functions) are not recommended due to these system dependencies.
