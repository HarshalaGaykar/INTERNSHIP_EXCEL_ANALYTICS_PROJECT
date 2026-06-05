# Excel Analytics Platform

A MERN application that lets users upload Excel workbooks, inspect worksheet data,
create 2D/3D charts, save visualizations, and review upload history. Administrators
can view usage statistics and manage user accounts.

## Main technologies

- React, Tailwind CSS, Chart.js, Plotly
- Node.js, Express, MongoDB, Mongoose
- JWT authentication and Multer/XLSX file processing

## Local setup

Prerequisites: Node.js 20+, npm, and a MongoDB database.

1. Create `backend/.env` from `backend/.env.example`.
2. Create `frontend/.env` from `frontend/.env.example`.
3. Install and start the API:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

4. In another terminal, install and start the frontend:

   ```powershell
   cd frontend
   npm install
   npm start
   ```

The frontend runs at `http://localhost:5173` and the API at
`http://localhost:5000`.

## Production deployment

The included `render.yaml` can create both services from the repository. In
Render, create a Blueprint from the repo, then provide:

- Backend `MONGO_URI`: your managed MongoDB connection string
- Backend `CLIENT_URL`: the deployed static-site URL,
  `https://internship-excel-analytics-project-1.onrender.com`
- Frontend `VITE_API_URL`: the deployed API URL followed by `/api`

Render generates `JWT_SECRET` automatically. Trigger a new frontend deployment
after setting `VITE_API_URL`, because Vite embeds it at build time.

For manual deployment, use the following settings.

Deploy the backend as a Node web service with:

- Build command: `npm ci`
- Start command: `npm start`
- Root directory: `backend`
- Environment variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`

Deploy the frontend as a static site with:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Root directory: `frontend`
- Environment variable: `VITE_API_URL=https://your-api-host/api`

Set backend `CLIENT_URL` to the final frontend URL. For local Vite development,
use `CLIENT_URL=http://localhost:5173`. For multiple allowed origins, use a
comma-separated value. Use MongoDB Atlas or another managed MongoDB service; do
not commit database credentials.

## Security notes

- Public signup creates only standard users. Promote administrators directly in
  the database or through a future protected admin workflow.
- Excel uploads are limited to modern `.xlsx` files up to 5 MB.
- Rotate any credentials that were ever committed to GitHub, then remove them
  from Git history.
