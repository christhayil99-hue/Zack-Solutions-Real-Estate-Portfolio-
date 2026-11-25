// server.js (main folder)
// Vercel looks for an Express app in a file like this one, in the main folder.
// It simply loads the real server from backend/server.js.
// Render and your PC keep using "npm start" (node backend/server.js) as before.

require('express'); // lets Vercel recognise this project as an Express app
module.exports = require('./backend/server');
