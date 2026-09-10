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

// ─────────────────────────────────────────────────────────────
// Section 4 of 5 — The Three Routes
// ─────────────────────────────────────────────────────────────

// ── ROUTE 1: Homepage ── GET /
// Fetches all records from the custom object and renders the table
app.get('/', async (req, res) => {
  const url = `${HUBSPOT_BASE}/crm/v3/objects/${OBJECT_TYPE}`;
  try {
    const resp = await axios.get(url, {
      params: {
        properties: `${PROPERTY_1},${PROPERTY_2},${PROPERTY_3}`,
        limit: 100
      },
      headers
    });
    const records = resp.data.results;
    res.render('homepage', {
      title: 'Custom Object List | Integrating With HubSpot I Practicum',
      records,
      col1: COL_1_LABEL, col2: COL_2_LABEL, col3: COL_3_LABEL,
      prop1: PROPERTY_1, prop2: PROPERTY_2, prop3: PROPERTY_3
    });
  } catch (error) {
    console.error('Error fetching records:', error.response?.data || error.message);
    res.status(500).send('Error fetching records — check your terminal.');
  }
});

// ── ROUTE 2: Show Form ── GET /update-cobj
// Renders the HTML form for creating a new record
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
    col1: COL_1_LABEL, col2: COL_2_LABEL, col3: COL_3_LABEL,
    prop1: PROPERTY_1, prop2: PROPERTY_2, prop3: PROPERTY_3
  });
});

// ── ROUTE 3: Submit Form ── POST /update-cobj
// Receives form data and creates a new record in HubSpot
app.post('/update-cobj', async (req, res) => {
  const url = `${HUBSPOT_BASE}/crm/v3/objects/${OBJECT_TYPE}`;
  const newRecord = {
    properties: {
      [PROPERTY_1]: req.body[PROPERTY_1],
      [PROPERTY_2]: req.body[PROPERTY_2],
      [PROPERTY_3]: req.body[PROPERTY_3]
    }
  };
  try {
    await axios.post(url, newRecord, { headers });
    res.redirect('/');
  } catch (error) {
    console.error('Error creating record:', error.response?.data || error.message);
    res.status(500).send('Error creating record — check your terminal.');
  }
});

// ─────────────────────────────────────────────────────────────
// Section 5 of 5 — Start the Server
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT} — open this in your browser`);
  });
}

module.exports = app;
