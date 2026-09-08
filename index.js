// ─────────────────────────────────────────────────────────────
// Section 1 of 5 — Dependencies & App Setup
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const express = require('express');
const axios   = require('axios');
const app     = express();

// ─────────────────────────────────────────────────────────────
// Section 2 of 5 — Middleware & View Engine
// ─────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

