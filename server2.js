const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// users
const users = {
  'rickyBobby': {
    full_name: 'Ricky Bobby',
    username: 'rickyBobby',
    password: 'password',
    userID: 1,
    token:'',
    loads: [
      {id: "Walmart-Load"},
      {id: "Target-Load"},
      {id: "Aldi-Load"}
    ]
  },
  'bobRoss': {
    full_name: 'Bob Ross',
    username: 'bobRoss',
    password: 'password',
    userID: 2,
    token:'',
    loads: [
      {id: "Walmart-Load"},
      {id: "Aldi-Load"},
      {id: "GNC-Load"}
    ]
  },
  'johnnyCage': {
    full_name: 'Johnny Cage',
    username: 'johnnyCage',
    password: 'password',
    userID: 3,
    token:'',
    loads: [
      {id: "Aldi-Load"},
      {id: "GNC-Load"},
      {id: "Gamestop-Load"}
    ]
  },
  'lukeSkywalker': {
    full_name: 'Luke Skywalker',
    username: 'lukeSkywalker',
    password: 'password',
    userID: 4,
    token:'',
    loads: [
      {id: "Walmart-Load"},
      {id: "Target-Load"},
      {id: "Gamestop-Load"}
    ]
  }
  // add more users here
}
// Middleware to check authorization header
// used for Eleos platform
const checkAuth = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (authHeader !== '1Qh8xtgSWnC3ThU7N7TDHr') { // my Eleos Platform Key
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

//app.use(checkAuth);

// POST /logins endpoint
// REQUIRED
// request -- username, password, is_team_driver_login
// response -- full_name, api_token, 
app.post('/logins', (req, res) => {
  const { username, password, team_driver } = req.body;
  const user = users[username];
  const name = user.full_name;
  const is_team_driver_login = false;

  if (user && user.password === password) {
    const token = generateToken(user);
    res.json({ name, token });
    user.token = token;
  } 
  else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

// Token generator
const generateToken = (user) => `token-${user.username}-${user.userID}`;

// GET /verifies endpoint
// REQUIRED
// request -- token
// response -- full_name, api_token
app.get('/verifies', (req, res) => {
  const { token } = req.query;

  const user = getUserByToken(token);

  if (user) {
    res.json({ validToken: true, full_name: user.full_name, token: token });
  } 
  else {
    res.status(401).json({ validToken: false, message: "Invalid token" });
  }
});

// Function to find a user by token
const getUserByToken = (token) => {
  return Object.values(users).find(user => user.token === token);
};


// Function to validate token
const isTokenValid = (token) => {
  return Object.values(users).some(user => user.token === token);
};

const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'database-1.ctmqvvhjgxau.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'password123',
  database: 'loadsDatabase'
});

// Connect to the MySQL server
connection.connect(error => {
  if (error) throw error;
  console.log("Successfully connected to the database.");
});

app.get('/load', (req, res) => {
  const { token } = req.query;

  const user = getUserByToken(token);
  if (user) {
    // you could also use a map: const loadIds = user.loads.map(load => load.id);
    const loadIds = [];
    for (let i = 0; i < user.loads.length; i++) {
      loadIds.push(user.loads[i].id);
    }

    // Create a query to fetch loads from the database
    const query = 'SELECT * FROM loads WHERE id IN (?)';
    connection.query(query, [loadIds], (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json(results);
    });
  } else {
    res.status(401).json({ error: "Invalid or missing token" });
  }
});

// PUT /messages endpoint
app.put('/messages', (req, res) => {
  const message = req.body;
  storeMessage(message);
  res.json({ status: 'Message received' });
});

// Function to store a message
const storeMessage = (message) => {
  console.log('Storing message:', message);
};


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
