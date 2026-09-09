# 🌾 FarmConnect

## 🚀 Quick Start

You need two terminal windows to run FarmConnect locally.

### 1. Start the Backend (Terminal 1)
```bash
cd backend
npm install

# Setup your local environment file
echo "PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=super_secret_key_123
JWT_EXPIRES_IN=7d" > .env

# Initialize the database and load test data
npx prisma db push
npx prisma db seed

# Launch the backend engine
npm run dev
cd frontend
npm install

# Setup your local environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000" > .env.local

# Launch the UI
npm run dev

Open http://localhost:3000 in your browser.

🔑 Test Credentials
Use these pre-seeded accounts to explore the dashboards:

Farmer: ramesh.mandya@farmconnect.org (Pass: Password@123)

Consumer: priya.bengaluru@gmail.com (Pass: Password@123)

📖 About This Project
FarmConnect is a full-stack, real-time agricultural marketplace built to eliminate middleman markups for farmers in Karnataka.

How it works:

Farmers log into a dedicated Control Hub to list their harvest (e.g., Tomatoes, Sugarcane) and update prices directly from the field.

Consumers browse a map-based UI that calculates the exact physical distance to the farms using geospatial engines.

Real-Time Sync: Powered by WebSockets (Socket.IO), whenever a farmer changes a crop price, the consumer's screen updates instantly without refreshing the page.

Tech Stack: Next.js 15 (App Router), Node.js, Express, Prisma (SQLite), Tailwind CSS, Socket.IO, Multer (Local Image Uploads).
