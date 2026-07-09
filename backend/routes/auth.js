const express = require('express');
const router  = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password required' });
  }

  if (password === process.env.ADMIN_PASSWORD) {
    // Password correct — send back a simple token
    return res.json({ success: true, token: 'zack-admin-verified' });
  }

  return res.status(401).json({ success: false, message: 'Incorrect password' });
});

module.exports = router;
