const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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

// Authentication Security Helpers (Zero-dependency JWT alternative)
const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || 'sla-management-system-secret-key-2026';

function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadStr = Buffer.from(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiry
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payloadStr}`)
    .digest('base64url');
  return `${header}.${payloadStr}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payloadStr, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payloadStr}`)
    .digest('base64url');
  if (signature !== expectedSignature) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now() / 1000) return null; // expired
    return payload;
  } catch (e) {
    return null;
  }
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
  
  req.user = decoded;
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.user_type !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// Global API Route Protection (except /api/login)
app.use('/api', (req, res, next) => {
  if (req.path === '/login' || req.originalUrl === '/api/login') {
    return next();
  }
  authenticateToken(req, res, next);
});

// Test DB Connection and Start Server
const startServer = async () => {
  try {
    console.log('Connecting to database at:', process.env.DB_HOST);
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();

    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${port} and listening on 0.0.0.0`);
    });
  } catch (err) {
    console.error('❌ Database connection error details:');
    console.error('Host:', process.env.DB_HOST);
    console.error('Port:', process.env.DB_PORT);
    console.error('User:', process.env.DB_USER);
    console.error('Database:', process.env.DB_NAME);
    console.error('Error Stack:', err.stack);
    // Exit with failure so Docker can restart it
    process.exit(1);
  }
};

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
app.post('/api/organization', isAdmin, async (req, res) => {
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
app.put('/api/organization', isAdmin, async (req, res) => {
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
app.delete('/api/organization/:org_id', isAdmin, async (req, res) => {
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
  const user_type = req.user.user_type;
  try {
    if (line_id === 'ALL') {
      let result;
      if (user_type === 'ADMIN') {
        result = await pool.query(`
          SELECT l.*, o.org_name 
          FROM lines l 
          LEFT JOIN organization o ON l.org_id = o.org_id 
          ORDER BY l.created_at DESC
        `);
      } else if (user_type === 'CLIENT_USER') {
        result = await pool.query(`
          SELECT l.*, o.org_name 
          FROM lines l 
          LEFT JOIN organization o ON l.org_id = o.org_id 
          WHERE l.org_id = $1
          ORDER BY l.created_at DESC
        `, [req.user.org_id]);
      } else { // USER
        result = await pool.query(`
          SELECT l.*, o.org_name 
          FROM lines l 
          LEFT JOIN organization o ON l.org_id = o.org_id 
          JOIN serviceprovider_lines spl ON l.line_id = spl.line_id
          WHERE spl.sp_id = $1
          ORDER BY l.created_at DESC
        `, [req.user.sp_id]);
      }
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM lines WHERE line_id = $1', [line_id]);
      const line = result.rows[0];
      if (!line) {
        return res.status(404).json({ error: 'Line not found' });
      }
      if (user_type === 'CLIENT_USER' && String(line.org_id) !== String(req.user.org_id)) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this line' });
      }
      if (user_type === 'USER') {
        const check = await pool.query('SELECT 1 FROM serviceprovider_lines WHERE line_id = $1 AND sp_id = $2', [line_id, req.user.sp_id]);
        if (check.rows.length === 0) {
          return res.status(403).json({ error: 'Forbidden: You do not have access to this line' });
        }
      }
      res.json(line);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching lines' });
  }
});

// CREATE
app.post('/api/lines', isAdmin, async (req, res) => {
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
app.put('/api/lines', isAdmin, async (req, res) => {
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
app.delete('/api/lines/:line_id', isAdmin, async (req, res) => {
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
app.post('/api/service-providers', isAdmin, async (req, res) => {
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
app.put('/api/service-providers', isAdmin, async (req, res) => {
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
app.delete('/api/service-providers/:sp_id', isAdmin, async (req, res) => {
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
  const user_type = req.user.user_type;

  // RBAC: CLIENT_USER cannot see the full list
  if (user_type === 'CLIENT_USER' && user_id === 'ALL') {
    return res.status(403).json({ error: 'Forbidden: Client users cannot view the full list' });
  }

  try {
    if (user_id === 'ALL') {
      // If regular USER, filter to only return users in their own Service Provider
      let result;
      if (user_type === 'ADMIN') {
        result = await pool.query(`
          SELECT u.*, l.line_name, sp.sp_name 
          FROM "Users" u
          LEFT JOIN lines l ON u.line_id = l.line_id
          LEFT JOIN serviceprovider sp ON u.sp_id = sp.sp_id
          ORDER BY u.user_id DESC
        `);
      } else {
        result = await pool.query(`
          SELECT u.*, l.line_name, sp.sp_name 
          FROM "Users" u
          LEFT JOIN lines l ON u.line_id = l.line_id
          LEFT JOIN serviceprovider sp ON u.sp_id = sp.sp_id
          WHERE u.sp_id = $1
          ORDER BY u.user_id DESC
        `, [req.user.sp_id]);
      }
      res.json(result.rows);
    } else if (sp_id) {
      // If regular USER, they cannot query another SP's users
      if (user_type === 'USER' && String(sp_id) !== String(req.user.sp_id)) {
        return res.status(403).json({ error: 'Forbidden: You cannot access another service provider\'s users' });
      }
      const result = await pool.query('SELECT * FROM "Users" WHERE sp_id = $1', [sp_id]);
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM "Users" WHERE user_id = $1', [user_id]);
      const user = result.rows[0];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      // If regular USER, they cannot query another SP's users
      if (user_type === 'USER' && String(user.sp_id) !== String(req.user.sp_id)) {
        return res.status(403).json({ error: 'Forbidden: You cannot access another service provider\'s users' });
      }
      res.json(user);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
});

// CREATE
app.post('/api/users', isAdmin, async (req, res) => {
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
app.put('/api/users', isAdmin, async (req, res) => {
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
app.delete('/api/users/:user_id', isAdmin, async (req, res) => {
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
  const user_type = req.user.user_type;
  
  // RBAC: Non-admins cannot see the full list of client users
  if (user_type !== 'ADMIN' && client_user_id === 'ALL') {
    return res.status(403).json({ error: 'Forbidden: You cannot view the full list' });
  }

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
      // If CLIENT_USER, verify they are only querying their own organization
      if (user_type === 'CLIENT_USER' && String(org_id) !== String(req.user.org_id)) {
        return res.status(403).json({ error: 'Forbidden: You cannot access client users of another organization' });
      }
      const result = await pool.query('SELECT * FROM "Client_Users" WHERE org_id = $1', [org_id]);
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM "Client_Users" WHERE client_user_id = $1', [client_user_id]);
      const clientUser = result.rows[0];
      if (!clientUser) {
        return res.status(404).json({ error: 'Client User not found' });
      }
      // If CLIENT_USER, verify ownership/same organization
      if (user_type === 'CLIENT_USER' && String(clientUser.org_id) !== String(req.user.org_id)) {
        return res.status(403).json({ error: 'Forbidden: You cannot access client users of another organization' });
      }
      res.json(clientUser);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching client users' });
  }
});

// CREATE
app.post('/api/client-users', isAdmin, async (req, res) => {
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
app.put('/api/client-users', isAdmin, async (req, res) => {
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
app.delete('/api/client-users/:client_user_id', isAdmin, async (req, res) => {
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
      const payload = {
        id: user.user_id,
        username: user.username,
        user_type: 'USER',
        sp_id: user.sp_id,
        org_id: null
      };
      const token = generateToken(payload);
      return res.json({
        success: true,
        user: {
          ...payload,
          first_name: user.first_name,
          last_name: user.last_name,
          token
        }
      });
    }

    // 2. Check in Client_Users table (Clients)
    const clientUserResult = await pool.query('SELECT * FROM "Client_Users" WHERE username = $1 AND password = $2', [username, password]);
    if (clientUserResult.rows.length > 0) {
      const clientUser = clientUserResult.rows[0];
      const payload = {
        id: clientUser.client_user_id,
        username: clientUser.username,
        user_type: 'CLIENT_USER',
        sp_id: null,
        org_id: clientUser.org_id
      };
      const token = generateToken(payload);
      return res.json({
        success: true,
        user: {
          ...payload,
          first_name: clientUser.first_name,
          last_name: clientUser.last_name,
          token
        }
      });
    }

    // 3. Special case for hardcoded Admin
    if (username === 'Admin' && password === 'admin22') {
      const payload = {
        id: 0,
        username: 'Admin',
        user_type: 'ADMIN'
      };
      const token = generateToken(payload);
      return res.json({
        success: true,
        user: {
          ...payload,
          first_name: 'System',
          last_name: 'Admin',
          token
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
  const user_type = req.user.user_type;
  try {
    if (kpi_main_cat_id === 'ALL') {
      let result;
      if (user_type === 'ADMIN') {
        result = await pool.query(`
          SELECT k.*, l.line_name, sp.sp_name 
          FROM "KPI_Categories" k
          LEFT JOIN lines l ON k.line_id = l.line_id
          LEFT JOIN serviceprovider sp ON k.sp_id = sp.sp_id
          ORDER BY k.kpi_main_cat_id DESC
        `);
      } else if (user_type === 'CLIENT_USER') {
        result = await pool.query(`
          SELECT k.*, l.line_name, sp.sp_name 
          FROM "KPI_Categories" k
          LEFT JOIN lines l ON k.line_id = l.line_id
          LEFT JOIN serviceprovider sp ON k.sp_id = sp.sp_id
          WHERE l.org_id = $1
          ORDER BY k.kpi_main_cat_id DESC
        `, [req.user.org_id]);
      } else { // USER
        result = await pool.query(`
          SELECT k.*, l.line_name, sp.sp_name 
          FROM "KPI_Categories" k
          LEFT JOIN lines l ON k.line_id = l.line_id
          LEFT JOIN serviceprovider sp ON k.sp_id = sp.sp_id
          WHERE k.sp_id = $1
          ORDER BY k.kpi_main_cat_id DESC
        `, [req.user.sp_id]);
      }
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM "KPI_Categories" WHERE kpi_main_cat_id = $1', [kpi_main_cat_id]);
      const category = result.rows[0];
      if (!category) {
        return res.status(404).json({ error: 'KPI Category not found' });
      }
      // Check access
      if (user_type === 'CLIENT_USER') {
        const checkLine = await pool.query('SELECT org_id FROM lines WHERE line_id = $1', [category.line_id]);
        if (checkLine.rows.length === 0 || String(checkLine.rows[0].org_id) !== String(req.user.org_id)) {
          return res.status(403).json({ error: 'Forbidden: You do not have access to this category' });
        }
      } else if (user_type === 'USER' && String(category.sp_id) !== String(req.user.sp_id)) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this category' });
      }
      res.json(category);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching KPI categories' });
  }
});

// CREATE
app.post('/api/kpi-categories', isAdmin, async (req, res) => {
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
app.put('/api/kpi-categories', isAdmin, async (req, res) => {
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
app.delete('/api/kpi-categories/:kpi_main_cat_id', isAdmin, async (req, res) => {
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
  const user_type = req.user.user_type;
  try {
    if (sub_category_id === 'ALL') {
      let result;
      if (user_type === 'ADMIN') {
        result = await pool.query(`
          SELECT sc.*, mc.kpi_name as main_category_name, l.line_name, sp.sp_name 
          FROM "KPI_Sub_Categories" sc
          LEFT JOIN "KPI_Categories" mc ON sc.kpi_main_cat_id = mc.kpi_main_cat_id
          LEFT JOIN lines l ON sc.line_id = l.line_id
          LEFT JOIN serviceprovider sp ON sc.sp_id = sp.sp_id
          ORDER BY sc.sub_category_id DESC
        `);
      } else if (user_type === 'CLIENT_USER') {
        result = await pool.query(`
          SELECT sc.*, mc.kpi_name as main_category_name, l.line_name, sp.sp_name 
          FROM "KPI_Sub_Categories" sc
          LEFT JOIN "KPI_Categories" mc ON sc.kpi_main_cat_id = mc.kpi_main_cat_id
          LEFT JOIN lines l ON sc.line_id = l.line_id
          LEFT JOIN serviceprovider sp ON sc.sp_id = sp.sp_id
          WHERE l.org_id = $1
          ORDER BY sc.sub_category_id DESC
        `, [req.user.org_id]);
      } else { // USER
        result = await pool.query(`
          SELECT sc.*, mc.kpi_name as main_category_name, l.line_name, sp.sp_name 
          FROM "KPI_Sub_Categories" sc
          LEFT JOIN "KPI_Categories" mc ON sc.kpi_main_cat_id = mc.kpi_main_cat_id
          LEFT JOIN lines l ON sc.line_id = l.line_id
          LEFT JOIN serviceprovider sp ON sc.sp_id = sp.sp_id
          WHERE sc.sp_id = $1
          ORDER BY sc.sub_category_id DESC
        `, [req.user.sp_id]);
      }
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM "KPI_Sub_Categories" WHERE sub_category_id = $1', [sub_category_id]);
      const subCategory = result.rows[0];
      if (!subCategory) {
        return res.status(404).json({ error: 'KPI Sub-Category not found' });
      }
      // Check access
      if (user_type === 'CLIENT_USER') {
        const checkLine = await pool.query('SELECT org_id FROM lines WHERE line_id = $1', [subCategory.line_id]);
        if (checkLine.rows.length === 0 || String(checkLine.rows[0].org_id) !== String(req.user.org_id)) {
          return res.status(403).json({ error: 'Forbidden: You do not have access to this sub-category' });
        }
      } else if (user_type === 'USER' && String(subCategory.sp_id) !== String(req.user.sp_id)) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this sub-category' });
      }
      res.json(subCategory);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching KPI sub-categories' });
  }
});

// CREATE
app.post('/api/kpi-sub-categories', isAdmin, async (req, res) => {
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
app.put('/api/kpi-sub-categories', isAdmin, async (req, res) => {
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
app.delete('/api/kpi-sub-categories/:sub_category_id', isAdmin, async (req, res) => {
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
  const user_type = req.user.user_type;
  try {
    if (fl_category_id === 'ALL') {
      let result;
      if (user_type === 'ADMIN') {
        result = await pool.query(`
          SELECT fl.*, mc.kpi_name as main_category_name, sc.sub_category_name, sp.sp_name, l.line_name 
          FROM fault_level_category fl
          LEFT JOIN "KPI_Categories" mc ON fl.kpi_main_cat_id = mc.kpi_main_cat_id
          LEFT JOIN "KPI_Sub_Categories" sc ON fl.kpi_sub_category_id = sc.sub_category_id
          LEFT JOIN serviceprovider sp ON fl.sp_id = sp.sp_id
          LEFT JOIN lines l ON fl.line_id = l.line_id
          ORDER BY fl.fl_category_id DESC
        `);
      } else if (user_type === 'CLIENT_USER') {
        result = await pool.query(`
          SELECT fl.*, mc.kpi_name as main_category_name, sc.sub_category_name, sp.sp_name, l.line_name 
          FROM fault_level_category fl
          LEFT JOIN "KPI_Categories" mc ON fl.kpi_main_cat_id = mc.kpi_main_cat_id
          LEFT JOIN "KPI_Sub_Categories" sc ON fl.kpi_sub_category_id = sc.sub_category_id
          LEFT JOIN serviceprovider sp ON fl.sp_id = sp.sp_id
          LEFT JOIN lines l ON fl.line_id = l.line_id
          WHERE l.org_id = $1
          ORDER BY fl.fl_category_id DESC
        `, [req.user.org_id]);
      } else { // USER
        result = await pool.query(`
          SELECT fl.*, mc.kpi_name as main_category_name, sc.sub_category_name, sp.sp_name, l.line_name 
          FROM fault_level_category fl
          LEFT JOIN "KPI_Categories" mc ON fl.kpi_main_cat_id = mc.kpi_main_cat_id
          LEFT JOIN "KPI_Sub_Categories" sc ON fl.kpi_sub_category_id = sc.sub_category_id
          LEFT JOIN serviceprovider sp ON fl.sp_id = sp.sp_id
          LEFT JOIN lines l ON fl.line_id = l.line_id
          WHERE fl.sp_id = $1
          ORDER BY fl.fl_category_id DESC
        `, [req.user.sp_id]);
      }
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM fault_level_category WHERE fl_category_id = $1', [fl_category_id]);
      const flCategory = result.rows[0];
      if (!flCategory) {
        return res.status(404).json({ error: 'Fault level category not found' });
      }
      // Check access
      if (user_type === 'CLIENT_USER') {
        const checkLine = await pool.query('SELECT org_id FROM lines WHERE line_id = $1', [flCategory.line_id]);
        if (checkLine.rows.length === 0 || String(checkLine.rows[0].org_id) !== String(req.user.org_id)) {
          return res.status(403).json({ error: 'Forbidden: You do not have access to this fault level category' });
        }
      } else if (user_type === 'USER' && String(flCategory.sp_id) !== String(req.user.sp_id)) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this fault level category' });
      }
      res.json(flCategory);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching fault level categories' });
  }
});

// CREATE
app.post('/api/fault-level-categories', isAdmin, async (req, res) => {
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
app.put('/api/fault-level-categories', isAdmin, async (req, res) => {
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
app.delete('/api/fault-level-categories/:fl_category_id', isAdmin, async (req, res) => {
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
    const user_id = req.user.id;
    const user_type = req.user.user_type;
    try {
    let query = `
      SELECT t.*, 
             l.line_name, 
             sp.sp_name, 
             o.org_name,
             mc.kpi_name as main_category_name, 
             sc.sub_category_name,
             CASE 
                WHEN t.created_by_type = 'CLIENT_USER' THEN cu.first_name || ' ' || COALESCE(cu.last_name, '')
                ELSE u.first_name || ' ' || COALESCE(u.last_name, '')
             END as creator_name,
             CASE 
                WHEN t.created_by_type = 'CLIENT_USER' THEN ru.first_name || ' ' || COALESCE(ru.last_name, '')
                ELSE rcu.first_name || ' ' || COALESCE(rcu.last_name, '')
             END as reported_to_name
      FROM "Tickets" t
      LEFT JOIN lines l ON t.line_id = l.line_id
      LEFT JOIN serviceprovider sp ON t.sp_id = sp.sp_id
      LEFT JOIN organization o ON t.org_id = o.org_id
      LEFT JOIN "KPI_Categories" mc ON t.kpi_main_category_id = mc.kpi_main_cat_id
      LEFT JOIN "KPI_Sub_Categories" sc ON t.kpi_sub_category_id = sc.sub_category_id
      LEFT JOIN "Users" u ON t.created_by = u.user_id AND t.created_by_type != 'CLIENT_USER'
      LEFT JOIN "Client_Users" cu ON t.created_by = cu.client_user_id AND t.created_by_type = 'CLIENT_USER'
      LEFT JOIN "Users" ru ON t.reported_to = ru.user_id AND t.reported_to_type = 'USER'
      LEFT JOIN "Client_Users" rcu ON t.reported_to = rcu.client_user_id AND t.reported_to_type = 'CLIENT_USER'
    `;

    const params = [];
    if (user_type !== 'ADMIN') {
      query += ` WHERE ((t.created_by = $1 AND t.created_by_type = $2) 
                    OR (t.reported_to = $1 AND t.reported_to_type = $2))
                    AND COALESCE(t.org_id, 0) != 1 AND COALESCE(t.sp_id, 0) != 1`;
      params.push(user_id, user_type);
    } else {
      query += ` WHERE COALESCE(t.org_id, 0) != 1 AND COALESCE(t.sp_id, 0) != 1`;
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
    reported_to,
    attachment
    } = req.body;

    const created_by = req.user.id;
    const created_by_type = req.user.user_type;

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
        created_by, created_by_type, 
        reported_to || null, created_by_type === 'CLIENT_USER' ? 'USER' : 'CLIENT_USER', 
        attachment || null,
        created_by
      ]
    );

    // 3. Insert into Ticket_trail (Initial Record)
    await client.query(
      `INSERT INTO "Ticket_trail" (comment, ticket_no, new_status, sp_id, line_id, created_by, created_by_type, attachment) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['Ticket Created: ' + ticket_description, ticket_number, 1, sp_id, line_id, created_by, created_by_type, attachment || null] 
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
        attachment
      } = req.body;

      const updated_by = req.user.id;
      const updated_by_type = req.user.user_type;

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

        // Authorization check: Must be admin, creator, or assignee
        if (req.user.user_type !== 'ADMIN' && 
            !(String(ticket.created_by) === String(req.user.id) && ticket.created_by_type === req.user.user_type) && 
            !(String(ticket.reported_to) === String(req.user.id) && ticket.reported_to_type === req.user.user_type)) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this ticket' });
        }

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
          [remarks || `Ticket status updated to ${ticket_status}`, ticket.ticket_number, 1, ticket.sp_id, ticket.line_id, updated_by, updated_by_type, attachment || null]
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
        const ticketResult = await pool.query('SELECT * FROM "Tickets" WHERE ticket_id = $1', [ticket_id]);
        if (ticketResult.rows.length === 0) {
          return res.status(404).json({ error: 'Ticket not found' });
        }
        const ticket = ticketResult.rows[0];

        // Authorization check: Only admin or ticket creator can delete
        if (req.user.user_type !== 'ADMIN' && 
            !(String(ticket.created_by) === String(req.user.id) && ticket.created_by_type === req.user.user_type)) {
          return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this ticket' });
        }

        const result = await pool.query('DELETE FROM "Tickets" WHERE ticket_id = $1 RETURNING *', [ticket_id]);
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
    // 1. Get ticket info to check authorization
    const ticketResult = await pool.query('SELECT * FROM "Tickets" WHERE ticket_number = $1', [ticket_no]);
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    const ticket = ticketResult.rows[0];

    // Authorization check
    if (req.user.user_type !== 'ADMIN' && 
        !(String(ticket.created_by) === String(req.user.id) && ticket.created_by_type === req.user.user_type) && 
        !(String(ticket.reported_to) === String(req.user.id) && ticket.reported_to_type === req.user.user_type)) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this ticket trail' });
    }

    const result = await pool.query(`
      SELECT tt.*, 
             COALESCE(u.first_name || ' ' || COALESCE(u.last_name, ''), 
                      cu.first_name || ' ' || COALESCE(cu.last_name, ''),
                      'System') as creator_name
      FROM "Ticket_trail" tt
      LEFT JOIN "Users" u ON tt.created_by = u.user_id AND tt.created_by_type != 'CLIENT_USER'
      LEFT JOIN "Client_Users" cu ON tt.created_by = cu.client_user_id AND tt.created_by_type = 'CLIENT_USER'
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
      const user_id = req.user.id;
      const user_type = req.user.user_type;
      try {
        let query = 'SELECT COUNT(*) FROM "Tickets" WHERE is_read = FALSE AND COALESCE(org_id, 0) != 1 AND COALESCE(sp_id, 0) != 1';
        let params = [];

        if (user_type !== 'ADMIN') {
          query += ' AND reported_to = $1 AND reported_to_type = $2';
          params = [user_id, user_type];
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
      const user_id = req.user.id;
      const user_type = req.user.user_type;
      try {
        await pool.query(
          'UPDATE "Tickets" SET is_read = TRUE WHERE ticket_id = $1 AND reported_to = $2 AND reported_to_type = $3 AND COALESCE(org_id, 0) != 1 AND COALESCE(sp_id, 0) != 1',
          [ticket_id, user_id, user_type]
        );
        res.json({ success: true });
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to mark ticket as read' });
      }
    });

    app.put('/api/tickets/mark-all-read', async (req, res) => {
      const user_id = req.user.id;
      const user_type = req.user.user_type;
      try {
        let query = 'UPDATE "Tickets" SET is_read = TRUE WHERE is_read = FALSE AND COALESCE(org_id, 0) != 1 AND COALESCE(sp_id, 0) != 1';
        let params = [];

        if (user_type !== 'ADMIN') {
          query += ' AND reported_to = $1 AND reported_to_type = $2';
          params = [user_id, user_type];
        }

        await pool.query(query, params);
        res.json({ success: true });
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to mark all tickets as read' });
      }
    });

// Serve Static Files (Production Frontend Build)
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback to index.html for SPA routing
app.get(/.*/, (req, res) => {
  const indexPath = path.join(__dirname, '../dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.status(200).send('SLA Management System API is running.');
      } else {
        res.status(500).send('Error loading frontend assets.');
      }
    }
  });
});

startServer();
