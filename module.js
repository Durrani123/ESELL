const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const multer = require('multer');
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });
const upload = multer();

const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ESELL1',
    password: '21325',
    port: 5432,
  });


// Session middleware
app.use(session({
  store: new pgSession({
    pool: pool,
    createTableIfMissing: true, // automatically create session table if missing
  }),
  secret: 'your-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // session expires in 30 days
}));

  module.exports = { express, app, bodyParser, ejs, session, pgSession, Pool, pool,upload };
  