# ZSG Realty — Real Estate Portfolio Website

A beginner-friendly real estate website built for Zack Solutions Group internship.

---

## Project Structure

```
zsg-realty/
├── frontend/           ← Everything the visitor SEES
│   ├── index.html      ← Homepage
│   ├── listings.html   ← All properties page
│   ├── detail.html     ← Single property page
│   ├── contact.html    ← Contact form page
│   ├── admin.html      ← Admin dashboard (manage listings)
│   ├── css/
│   │   └── style.css   ← All styles in one file
│   └── js/
│       └── app.js      ← All frontend logic in one file
│
├── backend/            ← The server (handles data & API)
│   ├── server.js       ← Main server file — START HERE
│   ├── config/
│   │   └── db.js       ← Database connection
│   ├── models/
│   │   ├── Property.js ← What a property looks like in the DB
│   │   └── Inquiry.js  ← What an inquiry looks like in the DB
│   └── routes/
│       ├── properties.js ← API routes for properties
│       └── inquiries.js  ← API routes for inquiries
│
├── docs/
│   └── schema.md       ← Database schema explanation
│
├── package.json        ← Project dependencies
└── README.md           ← This file
```

---

## How to Run This Project

### Step 1 — Install Node.js
Download from https://nodejs.org (choose the LTS version)

### Step 2 — Get a free MongoDB database
1. Go to https://www.mongodb.com/atlas
2. Sign up for free
3. Create a cluster → click "Connect" → copy the connection string
4. It looks like: `mongodb+srv://username:password@cluster.mongodb.net/`

### Step 3 — Set up the project
Open your terminal (search "Terminal" on Mac or "Command Prompt" on Windows):

```bash
# Go into the project folder
cd zsg-realty

# Install all dependencies
npm install

# Create a .env file for your secrets
echo MONGO_URI=your_mongodb_connection_string_here > .env
echo PORT=3000 >> .env
```

### Step 4 — Run the server
```bash
npm start
```

Then open your browser and go to: **http://localhost:3000**

---

## Tech Stack (Simple Explanation)

| Part | Tool | What it does |
|------|------|--------------|
| Frontend | HTML, CSS, JS | What users see and click |
| Backend | Node.js + Express | Server that handles requests |
| Database | MongoDB | Stores property & inquiry data |
| API | REST | How frontend talks to backend |

---

## Key Concepts for NJIT IT Students

- **API**: The backend exposes URLs (called endpoints) that the frontend fetches data from
- **REST**: A pattern where GET = read, POST = create, PUT = update, DELETE = remove
- **MongoDB**: Stores data as JSON-like documents (no rigid tables like SQL)
- **Express**: A simple web framework for Node.js — handles routing & middleware
