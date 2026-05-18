require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Postgres Connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Test DB Connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
  }
});

/**
 * ROUTES FOR ORGANIZATION
 */

// GET ALL OR ONE
app.get('/api/organization', async (req, res) => {
  const { org_id, line_id } = req.query;
  try {
    if (org_id === 'ALL') {
      const result = await pool.query('SELECT * FROM organization ORDER BY created_at DESC');
      res.json(result.rows);
    } else if (line_id) {
      const result = await pool.query(`
        SELECT DISTINCT o.* 
        FROM organization o
        JOIN lines l ON o.org_id = l.org_id
        WHERE l.line_id = $1
      `, [line_id]);
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM organization WHERE org_id = $1', [org_id]);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching organizations' });
  }
});

// CREATE
app.post('/api/organization', async (req, res) => {
  const { 
    org_name, 
    org_description, 
    org_abbrevation, 
    org_address, 
    org_contact_no, 
    org_parent 
  } = req.body;

  try {
    // Generate a simple numeric ID for now if not using serial
    const idResult = await pool.query('SELECT COALESCE(MAX(org_id), 0) + 1 as next_id FROM organization');
    const nextId = idResult.rows[0].next_id;

    const result = await pool.query(
      `INSERT INTO organization (org_id, org_name, org_description, org_abbrevation, org_address, org_contact_no, org_parent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nextId, org_name, org_description, org_abbrevation, org_address, org_contact_no, org_parent]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put('/api/organization', async (req, res) => {
  const { 
    org_id,
    org_name, 
    org_description, 
    org_abbrevation, 
    org_address, 
    org_contact_no, 
    org_parent 
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE organization 
       SET org_name = $1, org_description = $2, org_abbrevation = $3, org_address = $4, org_contact_no = $5, org_parent = $6, updated_at = NOW() 
       WHERE org_id = $7 RETURNING *`,
      [org_name, org_description, org_abbrevation, org_address, org_contact_no, org_parent, org_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/organization/:org_id', async (req, res) => {
  const { org_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM organization WHERE org_id = $1 RETURNING *', [org_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json({ message: 'Organization deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ROUTES FOR LINES
 */

// GET ALL OR ONE
app.get('/api/lines', async (req, res) => {
  const { line_id } = req.query;
  try {
    if (line_id === 'ALL') {
      const result = await pool.query(`
        SELECT l.*, o.org_name 
        FROM lines l 
        LEFT JOIN organization o ON l.org_id = o.org_id 
        ORDER BY l.created_at DESC
      `);
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM lines WHERE line_id = $1', [line_id]);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching lines' });
  }
});

// CREATE
app.post('/api/lines', async (req, res) => {
  const { 
    org_id, 
    line_name, 
    description, 
    line_abbrevation, 
    line_color, 
    line_city, 
    line_type 
  } = req.body;

  try {
    const idResult = await pool.query('SELECT COALESCE(MAX(line_id), 0) + 1 as next_id FROM lines');
    const nextId = idResult.rows[0].next_id;

    const result = await pool.query(
      `INSERT INTO lines (line_id, org_id, line_name, description, line_abbrevation, line_color, line_city, line_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [nextId, org_id, line_name, description, line_abbrevation, line_color, line_city, line_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put('/api/lines', async (req, res) => {
  const { 
    line_id,
    org_id, 
    line_name, 
    description, 
    line_abbrevation, 
    line_color, 
    line_city, 
    line_type 
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE lines 
       SET org_id = $1, line_name = $2, description = $3, line_abbrevation = $4, line_color = $5, line_city = $6, line_type = $7, updated_at = NOW() 
       WHERE line_id = $8 RETURNING *`,
      [org_id, line_name, description, line_abbrevation, line_color, line_city, line_type, line_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Line not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/lines/:line_id', async (req, res) => {
  const { line_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM lines WHERE line_id = $1 RETURNING *', [line_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Line not found' });
    }
    res.json({ message: 'Line deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET ALL LINE TYPES
app.get('/api/line-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT type_name FROM line_types ORDER BY type_name ASC');
    res.json(result.rows.map(r => r.type_name));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching line types' });
  }
});

// GET ALL LINE COLORS
app.get('/api/line-colors', async (req, res) => {
  try {
    const result = await pool.query('SELECT color_name FROM line_colors ORDER BY color_name ASC');
    res.json(result.rows.map(r => r.color_name));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching line colors' });
  }
});

/**
 * ROUTES FOR SERVICE PROVIDERS
 */

// GET ALL OR ONE
app.get('/api/service-providers', async (req, res) => {
  const { sp_id, line_id } = req.query;
  try {
    if (sp_id === 'ALL') {
      const result = await pool.query('SELECT * FROM serviceprovider ORDER BY sp_id DESC');
      res.json(result.rows);
    } else if (line_id) {
      const result = await pool.query(`
        SELECT sp.* 
        FROM serviceprovider sp
        JOIN serviceprovider_lines spl ON sp.sp_id = spl.sp_id
        WHERE spl.line_id = $1
      `, [line_id]);
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM serviceprovider WHERE sp_id = $1', [sp_id]);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching service providers' });
  }
});

// CREATE
app.post('/api/service-providers', async (req, res) => {
  const { 
    sp_name, 
    service_category, 
    address, 
    active, 
    sp_contact_no, 
    sp_abbreviation 
  } = req.body;

  try {
    const idResult = await pool.query('SELECT COALESCE(MAX(sp_id), 0) + 1 as next_id FROM serviceprovider');
    const nextId = idResult.rows[0].next_id;

    const result = await pool.query(
      `INSERT INTO serviceprovider (sp_id, sp_name, service_category, address, "active   ", sp_contact_no, sp_abbreviation) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nextId, sp_name, service_category, address, active, sp_contact_no, sp_abbreviation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put('/api/service-providers', async (req, res) => {
  const { 
    sp_id,
    sp_name, 
    service_category, 
    address, 
    active, 
    sp_contact_no, 
    sp_abbreviation 
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE serviceprovider 
       SET sp_name = $1, service_category = $2, address = $3, "active   " = $4, sp_contact_no = $5, sp_abbreviation = $6 
       WHERE sp_id = $7 RETURNING *`,
      [sp_name, service_category, address, active, sp_contact_no, sp_abbreviation, sp_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service Provider not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/service-providers/:sp_id', async (req, res) => {
  const { sp_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM serviceprovider WHERE sp_id = $1 RETURNING *', [sp_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service Provider not found' });
    }
    res.json({ message: 'Service Provider deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ROUTES FOR USERS
 */

// GET ALL OR ONE
app.get('/api/users', async (req, res) => {
  const { user_id, sp_id } = req.query;
  try {
    if (user_id === 'ALL') {
      const result = await pool.query(`
        SELECT u.*, l.line_name, sp.sp_name 
        FROM "Users" u
        LEFT JOIN lines l ON u.line_id = l.line_id
        LEFT JOIN serviceprovider sp ON u.sp_id = sp.sp_id
        ORDER BY u.user_id DESC
      `);
      res.json(result.rows);
    } else if (sp_id) {
      const result = await pool.query('SELECT * FROM "Users" WHERE sp_id = $1', [sp_id]);
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM "Users" WHERE user_id = $1', [user_id]);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
});

// CREATE
app.post('/api/users', async (req, res) => {
  const { 
    first_name, 
    last_name, 
    CNIC, 
    username, 
    password, 
    user_designation, 
    emp_id, 
    line_id, 
    sp_id, 
    active_status, 
    user_email 
  } = req.body;

  try {
    const idResult = await pool.query('SELECT COALESCE(MAX(user_id), 0) + 1 as next_id FROM "Users"');
    const nextId = idResult.rows[0].next_id;

    const result = await pool.query(
      `INSERT INTO "Users" (user_id, first_name, last_name, "CNIC", username, password, user_designation, emp_id, line_id, sp_id, active_status, user_email) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [nextId, first_name, last_name, CNIC, username, password, user_designation, emp_id, line_id, sp_id, active_status, user_email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put('/api/users', async (req, res) => {
  const { 
    user_id,
    first_name, 
    last_name, 
    CNIC, 
    username, 
    password, 
    user_designation, 
    emp_id, 
    line_id, 
    sp_id, 
    active_status, 
    user_email 
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE "Users" 
       SET first_name = $1, last_name = $2, "CNIC" = $3, username = $4, password = $5, user_designation = $6, emp_id = $7, line_id = $8, sp_id = $9, active_status = $10, user_email = $11 
       WHERE user_id = $12 RETURNING *`,
      [first_name, last_name, CNIC, username, password, user_designation, emp_id, line_id, sp_id, active_status, user_email, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/users/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM "Users" WHERE user_id = $1 RETURNING *', [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ROUTES FOR CLIENT USERS
 */

// GET ALL OR ONE
app.get('/api/client-users', async (req, res) => {
  const { client_user_id, org_id } = req.query;
  try {
    if (client_user_id === 'ALL') {
      const result = await pool.query(`
        SELECT u.*, l.line_name, o.org_name 
        FROM "Client_Users" u
        LEFT JOIN lines l ON u.line_id = l.line_id
        LEFT JOIN organization o ON u.org_id = o.org_id
        ORDER BY u.client_user_id DESC
      `);
      res.json(result.rows);
    } else if (org_id) {
      const result = await pool.query('SELECT * FROM "Client_Users" WHERE org_id = $1', [org_id]);
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM "Client_Users" WHERE client_user_id = $1', [client_user_id]);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching client users' });
  }
});

// CREATE
app.post('/api/client-users', async (req, res) => {
  const { 
    first_name, 
    last_name, 
    CNIC, 
    username, 
    password, 
    user_designation, 
    emp_id, 
    line_id, 
    org_id, 
    active_status, 
    user_email 
  } = req.body;

  try {
    const idResult = await pool.query('SELECT COALESCE(MAX(client_user_id), 0) + 1 as next_id FROM "Client_Users"');
    const nextId = idResult.rows[0].next_id;

    const result = await pool.query(
      `INSERT INTO "Client_Users" (client_user_id, first_name, last_name, "CNIC", username, password, user_designation, emp_id, line_id, org_id, active_status, user_email) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [nextId, first_name, last_name, CNIC, username, password, user_designation, emp_id, line_id, org_id, active_status, user_email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put('/api/client-users', async (req, res) => {
  const { 
    client_user_id,
    first_name, 
    last_name, 
    CNIC, 
    username, 
    password, 
    user_designation, 
    emp_id, 
    line_id, 
    org_id, 
    active_status, 
    user_email 
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE "Client_Users" 
       SET first_name = $1, last_name = $2, "CNIC" = $3, username = $4, password = $5, user_designation = $6, emp_id = $7, line_id = $8, org_id = $9, active_status = $10, user_email = $11 
       WHERE client_user_id = $12 RETURNING *`,
      [first_name, last_name, CNIC, username, password, user_designation, emp_id, line_id, org_id, active_status, user_email, client_user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/client-users/:client_user_id', async (req, res) => {
  const { client_user_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM "Client_Users" WHERE client_user_id = $1 RETURNING *', [client_user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client User not found' });
    }
    res.json({ message: 'Client User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * LOGIN ENDPOINT
 */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // 1. Check in regular Users table (Service Providers)
    const userResult = await pool.query('SELECT * FROM "Users" WHERE username = $1 AND password = $2', [username, password]);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      return res.json({
        success: true,
        user: {
          id: user.user_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          user_type: 'regular',
          sp_id: user.sp_id,
          org_id: null
        }
      });
    }

    // 2. Check in Client_Users table (Clients)
    const clientUserResult = await pool.query('SELECT * FROM "Client_Users" WHERE username = $1 AND password = $2', [username, password]);
    if (clientUserResult.rows.length > 0) {
      const clientUser = clientUserResult.rows[0];
      return res.json({
        success: true,
        user: {
          id: clientUser.client_user_id,
          username: clientUser.username,
          first_name: clientUser.first_name,
          last_name: clientUser.last_name,
          user_type: 'client',
          sp_id: null,
          org_id: clientUser.org_id
        }
      });
    }

    // 3. Special case for hardcoded Admin
    if (username === 'Admin' && password === 'admin22') {
      return res.json({
        success: true,
        user: {
          id: 0,
          username: 'Admin',
          first_name: 'System',
          last_name: 'Admin',
          user_type: 'admin'
        }
      });
    }

    res.status(401).json({ error: 'Invalid username or password' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

/**
 * ROUTES FOR KPI CATEGORIES
 */

// GET ALL OR ONE
app.get('/api/kpi-categories', async (req, res) => {
  const { kpi_main_cat_id } = req.query;
  try {
    if (kpi_main_cat_id === 'ALL') {
      const result = await pool.query(`
        SELECT k.*, l.line_name, sp.sp_name 
        FROM "KPI_Categories" k
        LEFT JOIN lines l ON k.line_id = l.line_id
        LEFT JOIN serviceprovider sp ON k.sp_id = sp.sp_id
        ORDER BY k.kpi_main_cat_id DESC
      `);
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM "KPI_Categories" WHERE kpi_main_cat_id = $1', [kpi_main_cat_id]);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching KPI categories' });
  }
});

// CREATE
app.post('/api/kpi-categories', async (req, res) => {
  const { 
    weight, 
    kpi_status, 
    kpi_name, 
    sp_id, 
    line_id, 
    kpi_desc 
  } = req.body;

  try {
    const idResult = await pool.query('SELECT COALESCE(MAX(kpi_main_cat_id), 0) + 1 as next_id FROM "KPI_Categories"');
    const nextId = idResult.rows[0].next_id;

    const result = await pool.query(
      `INSERT INTO "KPI_Categories" (kpi_main_cat_id, weight, kpi_status, kpi_name, sp_id, line_id, kpi_desc) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nextId, weight, kpi_status, kpi_name, sp_id, line_id, kpi_desc]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put('/api/kpi-categories', async (req, res) => {
  const { 
    kpi_main_cat_id,
    weight, 
    kpi_status, 
    kpi_name, 
    sp_id, 
    line_id, 
    kpi_desc 
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE "KPI_Categories" 
       SET weight = $1, kpi_status = $2, kpi_name = $3, sp_id = $4, line_id = $5, kpi_desc = $6 
       WHERE kpi_main_cat_id = $7 RETURNING *`,
      [weight, kpi_status, kpi_name, sp_id, line_id, kpi_desc, kpi_main_cat_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KPI Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/kpi-categories/:kpi_main_cat_id', async (req, res) => {
  const { kpi_main_cat_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM "KPI_Categories" WHERE kpi_main_cat_id = $1 RETURNING *', [kpi_main_cat_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KPI Category not found' });
    }
    res.json({ message: 'KPI Category deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ROUTES FOR KPI SUB-CATEGORIES
 */

// GET ALL OR ONE
app.get('/api/kpi-sub-categories', async (req, res) => {
  const { sub_category_id } = req.query;
  try {
    if (sub_category_id === 'ALL') {
      const result = await pool.query(`
        SELECT sc.*, mc.kpi_name as main_category_name, l.line_name, sp.sp_name 
        FROM "KPI_Sub_Categories" sc
        LEFT JOIN "KPI_Categories" mc ON sc.kpi_main_cat_id = mc.kpi_main_cat_id
        LEFT JOIN lines l ON sc.line_id = l.line_id
        LEFT JOIN serviceprovider sp ON sc.sp_id = sp.sp_id
        ORDER BY sc.sub_category_id DESC
      `);
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM "KPI_Sub_Categories" WHERE sub_category_id = $1', [sub_category_id]);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching KPI sub-categories' });
  }
});

// CREATE
app.post('/api/kpi-sub-categories', async (req, res) => {
  const { 
    kpi_main_cat_id, 
    sub_category_name, 
    sp_id, 
    line_id, 
    fl_category_id 
  } = req.body;

  try {
    const idResult = await pool.query('SELECT COALESCE(MAX(sub_category_id), 0) + 1 as next_id FROM "KPI_Sub_Categories"');
    const nextId = idResult.rows[0].next_id;

    const result = await pool.query(
      `INSERT INTO "KPI_Sub_Categories" (sub_category_id, kpi_main_cat_id, sub_category_name, sp_id, line_id, fl_category_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nextId, kpi_main_cat_id, sub_category_name, sp_id, line_id, fl_category_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put('/api/kpi-sub-categories', async (req, res) => {
  const { 
    sub_category_id,
    kpi_main_cat_id, 
    sub_category_name, 
    sp_id, 
    line_id, 
    fl_category_id 
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE "KPI_Sub_Categories" 
       SET kpi_main_cat_id = $1, sub_category_name = $2, sp_id = $3, line_id = $4, fl_category_id = $5 
       WHERE sub_category_id = $6 RETURNING *`,
      [kpi_main_cat_id, sub_category_name, sp_id, line_id, fl_category_id, sub_category_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KPI Sub-Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/kpi-sub-categories/:sub_category_id', async (req, res) => {
  const { sub_category_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM "KPI_Sub_Categories" WHERE sub_category_id = $1 RETURNING *', [sub_category_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KPI Sub-Category not found' });
    }
    res.json({ message: 'KPI Sub-Category deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ROUTES FOR FAULT LEVEL CATEGORY
 */

// GET ALL OR ONE
app.get('/api/fault-level-categories', async (req, res) => {
  const { fl_category_id } = req.query;
  try {
    if (fl_category_id === 'ALL') {
      const result = await pool.query(`
        SELECT fl.*, mc.kpi_name as main_category_name, sc.sub_category_name, sp.sp_name, l.line_name 
        FROM fault_level_category fl
        LEFT JOIN "KPI_Categories" mc ON fl.kpi_main_cat_id = mc.kpi_main_cat_id
        LEFT JOIN "KPI_Sub_Categories" sc ON fl.kpi_sub_category_id = sc.sub_category_id
        LEFT JOIN serviceprovider sp ON fl.sp_id = sp.sp_id
        LEFT JOIN lines l ON fl.line_id = l.line_id
        ORDER BY fl.fl_category_id DESC
      `);
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM fault_level_category WHERE fl_category_id = $1', [fl_category_id]);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching fault level categories' });
  }
});

// CREATE
app.post('/api/fault-level-categories', async (req, res) => {
  const { 
    kpi_main_cat_id, 
    kpi_sub_category_id, 
    fl_name,
    fl_desc, 
    resolution_time, 
    sp_id,
    line_id
  } = req.body;

  try {
    const idResult = await pool.query('SELECT COALESCE(MAX(fl_category_id), 0) + 1 as next_id FROM fault_level_category');
    const nextId = idResult.rows[0].next_id;

    const result = await pool.query(
      `INSERT INTO fault_level_category (fl_category_id, kpi_main_cat_id, kpi_sub_category_id, fl_name, fl_desc, resolution_time, sp_id, line_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [nextId, kpi_main_cat_id, kpi_sub_category_id, fl_name, fl_desc, resolution_time, sp_id, line_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put('/api/fault-level-categories', async (req, res) => {
  const { 
    fl_category_id,
    kpi_main_cat_id, 
    kpi_sub_category_id, 
    fl_name,
    fl_desc, 
    resolution_time, 
    sp_id,
    line_id
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE fault_level_category 
       SET kpi_main_cat_id = $1, kpi_sub_category_id = $2, fl_name = $3, fl_desc = $4, resolution_time = $5, sp_id = $6, line_id = $7 
       WHERE fl_category_id = $8 RETURNING *`,
      [kpi_main_cat_id, kpi_sub_category_id, fl_name, fl_desc, resolution_time, sp_id, line_id, fl_category_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fault Level Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/fault-level-categories/:fl_category_id', async (req, res) => {
  const { fl_category_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM fault_level_category WHERE fl_category_id = $1 RETURNING *', [fl_category_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fault Level Category not found' });
    }
    res.json({ message: 'KPI Sub-Category deleted successfully' });
    } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
    }
    });

    /**
    * ROUTES FOR TICKETS & TRAIL
    */

    // GET ALL TICKETS (with Joins)
    app.get('/api/tickets', async (req, res) => {
    const { user_id, user_type } = req.query;
    try {
    let query = `
      SELECT t.*, 
             l.line_name, 
             sp.sp_name, 
             o.org_name,
             mc.kpi_name as main_category_name, 
             sc.sub_category_name,
             CASE 
                WHEN t.created_by_type = 'client' THEN cu.first_name || ' ' || COALESCE(cu.last_name, '')
                ELSE u.first_name || ' ' || COALESCE(u.last_name, '')
             END as creator_name,
             CASE 
                WHEN t.created_by_type = 'client' THEN ru.first_name || ' ' || COALESCE(ru.last_name, '')
                ELSE rcu.first_name || ' ' || COALESCE(rcu.last_name, '')
             END as reported_to_name
      FROM "Tickets" t
      LEFT JOIN lines l ON t.line_id = l.line_id
      LEFT JOIN serviceprovider sp ON t.sp_id = sp.sp_id
      LEFT JOIN organization o ON t.org_id = o.org_id
      LEFT JOIN "KPI_Categories" mc ON t.kpi_main_category_id = mc.kpi_main_cat_id
      LEFT JOIN "KPI_Sub_Categories" sc ON t.kpi_sub_category_id = sc.sub_category_id
      LEFT JOIN "Users" u ON t.created_by = u.user_id AND t.created_by_type != 'client'
      LEFT JOIN "Client_Users" cu ON t.created_by = cu.client_user_id AND t.created_by_type = 'client'
      LEFT JOIN "Users" ru ON t.reported_to = ru.user_id
      LEFT JOIN "Client_Users" rcu ON t.reported_to = rcu.client_user_id
    `;

    const params = [];
    if (user_id && user_id !== '0') {
      query += ` WHERE (t.created_by = $1 AND t.created_by_type = $2) 
                    OR (t.reported_to = $1 AND t.reported_to_type = $2)`;
      params.push(user_id, user_type || 'regular');
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
    } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching tickets' });
    }
    });

    // CREATE TICKET (Transaction)
    app.post('/api/tickets', async (req, res) => {
    const { 
    line_id, 
    ticket_number, 
    ticket_title,
    kpi_main_category_id, 
    kpi_sub_category_id, 
    fl_category_id, 
    ticket_status, 
    ticket_description, 
    sp_id,
    org_id,
    created_by, // User ID of creator
    created_by_type,
    reported_to,
    attachment
    } = req.body;

    const client = await pool.connect();

    try {
    await client.query('BEGIN');

    // 1. Generate next ID
    const idResult = await client.query('SELECT COALESCE(MAX(ticket_id), 0) + 1 as next_id FROM "Tickets"');
    const nextId = idResult.rows[0].next_id;

    // 2. Insert into Tickets (Added is_read=FALSE, last_action_by)
    const ticketResult = await client.query(
      `INSERT INTO "Tickets" (ticket_id, line_id, ticket_number, ticket_title, kpi_main_category_id, kpi_sub_category_id, fl_category_id, ticket_status, ticket_description, sp_id, org_id, created_by, created_by_type, reported_to, reported_to_type, attachment, is_read, last_action_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, FALSE, $17) RETURNING *`,
      [
        nextId, line_id, ticket_number, ticket_title, kpi_main_category_id, kpi_sub_category_id, fl_category_id, 
        ticket_status, ticket_description, sp_id, org_id, 
        created_by || null, created_by_type || 'regular', 
        reported_to || null, created_by_type === 'client' ? 'regular' : 'client', 
        attachment || null,
        created_by || null
      ]
    );

    // 3. Insert into Ticket_trail (Initial Record)
    await client.query(
      `INSERT INTO "Ticket_trail" (comment, ticket_no, new_status, sp_id, line_id, created_by, created_by_type, attachment) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['Ticket Created: ' + ticket_description, ticket_number, 1, sp_id, line_id, created_by || null, created_by_type || 'regular', attachment || null] 
    );

    await client.query('COMMIT');
    res.status(201).json(ticketResult.rows[0]);
    } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: err.message });
    } finally {
    client.release();
    }
    });

    // UPDATE TICKET (with Trail)
    app.put('/api/tickets', async (req, res) => {
      const { 
        ticket_id,
        ticket_status, 
        remarks, // This will go into the trail
        reported_to, // This allows sending back or reassigning
        reported_to_type,
        updated_by, // User ID of who is making the change
        updated_by_type, // 'regular' or 'client'
        attachment
      } = req.body;
    
      const client = await pool.connect();
    
      try {
        await client.query('BEGIN');
    
        // 1. Get current ticket info
        const currentTicketResult = await client.query('SELECT * FROM "Tickets" WHERE ticket_id = $1', [ticket_id]);
        if (currentTicketResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Ticket not found' });
        }
        const ticket = currentTicketResult.rows[0];
    
        // 2. Update Tickets table (Reset is_read=FALSE, update last_action_by, update reported_to_type)
        const updateResult = await client.query(
          `UPDATE "Tickets" 
           SET ticket_status = $1, reported_to = $2, reported_to_type = $3, updated_at = NOW(), is_read = FALSE, last_action_by = $4 
           WHERE ticket_id = $5 RETURNING *`,
          [
            ticket_status || ticket.ticket_status, 
            reported_to || ticket.reported_to, 
            reported_to_type || ticket.reported_to_type,
            updated_by, 
            ticket_id
          ]
        );
    
        // 3. Insert into Ticket_trail
        await client.query(
          `INSERT INTO "Ticket_trail" (comment, ticket_no, new_status, sp_id, line_id, created_by, created_by_type, attachment) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [remarks || `Ticket status updated to ${ticket_status}`, ticket.ticket_number, 1, ticket.sp_id, ticket.line_id, updated_by || null, updated_by_type || 'regular', attachment || null]
        );
    
        await client.query('COMMIT');
        res.json(updateResult.rows[0]);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: err.message });
      } finally {
        client.release();
      }
    });
    
    // DELETE TICKET
    app.delete('/api/tickets/:ticket_id', async (req, res) => {
      const { ticket_id } = req.params;
      try {
        const result = await pool.query('DELETE FROM "Tickets" WHERE ticket_id = $1 RETURNING *', [ticket_id]);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Ticket not found' });
        }
        res.json({ message: 'Ticket deleted successfully' });
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
      }
    });

    // GET TICKET TRAIL
    app.get('/api/tickets/trail/:ticket_no', async (req, res) => {
    const { ticket_no } = req.params;
    try {
    const result = await pool.query(`
      SELECT tt.*, 
             COALESCE(u.first_name || ' ' || COALESCE(u.last_name, ''), 
                      cu.first_name || ' ' || COALESCE(cu.last_name, ''),
                      'System') as creator_name
      FROM "Ticket_trail" tt
      LEFT JOIN "Users" u ON tt.created_by = u.user_id
      LEFT JOIN "Client_Users" cu ON tt.created_by = cu.client_user_id
      WHERE tt.ticket_no = $1 
      ORDER BY tt.created_at ASC
    `, [ticket_no]);
    res.json(result.rows);
    } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching ticket trail' });
    }
    });

    /**
     * ROUTES FOR SERVICE PROVIDER LINES
     */
    app.get('/api/serviceprovider-lines', async (req, res) => {
      try {
        const result = await pool.query('SELECT * FROM serviceprovider_lines');
        res.json(result.rows);
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching service provider lines' });
      }
    });

    /**
     * NOTIFICATION & READ STATUS ENDPOINTS
     */
    app.get('/api/tickets/unread-count', async (req, res) => {
      const { user_id, user_type } = req.query;
      try {
        let query = 'SELECT COUNT(*) FROM "Tickets" WHERE is_read = FALSE';
        let params = [];
        
        if (user_type !== 'admin') {
          query += ' AND reported_to = $1 AND reported_to_type = $2';
          params = [user_id, user_type || 'regular'];
        }
        
        const result = await pool.query(query, params);
        res.json({ count: parseInt(result.rows[0].count) });
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch unread count' });
      }
    });

    app.put('/api/tickets/mark-read/:ticket_id', async (req, res) => {
      const { ticket_id } = req.params;
      const { user_id, user_type } = req.body;
      try {
        await pool.query(
          'UPDATE "Tickets" SET is_read = TRUE WHERE ticket_id = $1 AND reported_to = $2 AND reported_to_type = $3',
          [ticket_id, user_id, user_type || 'regular']
        );
        res.json({ success: true });
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to mark ticket as read' });
      }
    });

    app.put('/api/tickets/mark-all-read', async (req, res) => {
      const { user_id, user_type } = req.body;
      try {
        let query = 'UPDATE "Tickets" SET is_read = TRUE WHERE is_read = FALSE';
        let params = [];
        
        if (user_type !== 'admin') {
          query += ' AND reported_to = $1 AND reported_to_type = $2';
          params = [user_id, user_type || 'regular'];
        }
        
        await pool.query(query, params);
        res.json({ success: true });
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to mark all tickets as read' });
      }
    });

    // Serve Static Files (Production Frontend Build)
    const path = require('path');
    app.use(express.static(path.join(__dirname, '../dist')));

    // Fallback to index.html for SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    });

    app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
