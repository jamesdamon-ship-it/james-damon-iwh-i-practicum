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

// ─────────────────────────────────────────────────────────────
// Section 3 of 5 — Configuration Variables
// ─────────────────────────────────────────────────────────────
// * DO NOT commit your private app access token. It lives in .env only.
const HUBSPOT_TOKEN = process.env.PRIVATE_APP_ACCESS_TOKEN;

// Custom object API name — Settings > Data Management > Objects > data model
const OBJECT_TYPE = process.env.HUBSPOT_OBJECT_TYPE || 'p_plants';

// Internal names of the three custom properties
const PROPERTY_1 = 'name';           // Required by the practicum
const PROPERTY_2 = 'plant_type';
const PROPERTY_3 = 'bloom_season';

// Friendly column labels shown in the homepage table
const COL_1_LABEL = 'Name';
const COL_2_LABEL = 'Type';
const COL_3_LABEL = 'Bloom Season';

const HUBSPOT_BASE = process.env.HUBSPOT_BASE_URL || 'https://api.hubapi.com';
const headers = {
  Authorization: `Bearer ${HUBSPOT_TOKEN}`,
  'Content-Type': 'application/json'
};

