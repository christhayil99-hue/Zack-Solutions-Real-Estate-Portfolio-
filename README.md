# Zack Real Estate Inc. — Website

The official website for **Zack Real Estate Inc.**: a property listings site with
an admin dashboard for adding listings (with photos) and managing visitor inquiries.

---

## What's inside

```
├── public/                ← Everything visitors see (website files)
│   ├── index.html         ← Homepage
│   ├── listings.html      ← All properties, with search filters
│   ├── detail.html        ← One property, with photo gallery and inquiry form
│   ├── about.html         ← About Us
│   ├── contact.html       ← Contact form
│   ├── login.html         ← Admin sign-in
│   ├── admin.html         ← Admin dashboard (listings, photos, inquiries)
│   ├── css/style.css      ← All styles
│   ├── js/app.js          ← All page logic
│   └── images/            ← Site images
│
├── backend/               ← The server
│   ├── server.js          ← Starts the app
│   ├── config/db.js       ← Connects to MongoDB
│   ├── models/            ← Property, Photo and Inquiry data shapes
│   └── routes/            ← API: properties, photos, inquiries, auth
│
└── package.json
```

## Tech

Node.js + Express, MongoDB Atlas (Mongoose), plain HTML/CSS/JavaScript.
Hosted on Render; every push to `main` deploys automatically.

## Running it locally

1. Install packages: `npm install`
2. Create a `.env` file in the project root (never commit it):
   ```
   MONGO_URI=<your MongoDB connection string>
   ADMIN_PASSWORD=<admin password>
   PORT=3000
   ```
3. Start: `npm start`, then open http://localhost:3000

On the live site, `MONGO_URI` and `ADMIN_PASSWORD` are set in Render → Environment.

## Managing listings

Sign in at `/login.html`, then use **Add new listing**:

- Add up to 15 photos per listing. They are resized automatically and stored in
  the database. The first photo is the cover photo.
- Bedrooms and bathrooms are optional (leave blank for land or commercial properties).
- Only listings with status **Active** appear on the public site. Sold/rented
  listings stay visible to admins for editing.

## Security notes

- Admin pages and data require a signed login token that expires after 12 hours.
- After 5 wrong passwords, sign-in is blocked for 15 minutes.
- Passwords and database credentials live only in `.env` / Render, never in the code.
