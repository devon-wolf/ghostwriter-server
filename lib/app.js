const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/documents', async(req, res) => {
  try {
    const data = await client.query('SELECT * from documents');
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/documents', async(req, res) => {
  try {
    const data = await client.query(`SELECT * from documents where owner_id=${req.userId}`);
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/documents', async(req, res) => {
  try {
    const { title, body_text } = req.body;
    const data = await client.query(`
    INSERT into documents (title, body_text, owner_id)
    values ($1, $2, $3)
    returning *`,
    [
      title,
      body_text,
      req.userId
    ]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/documents/:id', async(req, res) => {
  try {
    const { title, body_text } = req.body;
    const data = await client.query(`
    UPDATE documents
    SET title = $1, body_text = $2
    where id=$3
    returning *;`,
    [
      title,
      body_text,
      req.params.id
    ]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
