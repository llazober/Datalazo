const { Client } = require('pg');
const path = require('path');

// The .env is at the repo root (3 levels up from server/src/db/)
const envPath = path.resolve(__dirname, '../../../.env');
console.log('Loading .env from:', envPath);
require('dotenv').config({ path: envPath });

const DB_URL = process.env.DATABASE_URL || '';

// Parse the DATABASE_URL using the URL constructor (handles percent-encoding)
let parsedUrl;
try {
  // Replace postgresql:// with postgres:// for URL constructor compatibility
  parsedUrl = new URL(DB_URL.replace('postgresql://', 'postgres://'));
} catch (e) {
  console.error('❌ Could not parse DATABASE_URL from .env:', DB_URL);
  process.exit(1);
}

const user = parsedUrl.username;
const password = decodeURIComponent(parsedUrl.password); // decode %24 → $
const host = parsedUrl.hostname;
const port = parsedUrl.port || '5432';
const dbName = parsedUrl.pathname.replace('/', '');

async function setup() {
  console.log(`\n🔧 Setting up database...`);
  console.log(`   Host: ${host}:${port}`);
  console.log(`   User: ${user}`);
  console.log(`   Target DB: ${dbName}\n`);

  // Step 1: Connect to default "postgres" database to create Datalazo
  const adminClient = new Client({
    host,
    port: parseInt(port),
    user,
    password,
    database: 'postgres', // Connect to system DB first
  });

  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const res = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (res.rowCount === 0) {
      console.log(`📦 Creating database "${dbName}"...`);
      // Can't use parameterized query for CREATE DATABASE
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created!`);
    } else {
      console.log(`✅ Database "${dbName}" already exists`);
    }

    await adminClient.end();

    // Step 2: Connect to Datalazo and create schema
    const dbClient = new Client({
      host,
      port: parseInt(port),
      user,
      password,
      database: dbName,
    });

    await dbClient.connect();
    await dbClient.query(`CREATE SCHEMA IF NOT EXISTS email_assistant`);
    console.log(`✅ Schema "email_assistant" ready`);
    await dbClient.end();

    console.log('\n🎉 Database setup complete!');
    console.log('   Now run: npm run db:push\n');

  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    console.error('\n💡 Check that:');
    console.error('   1. PostgreSQL is running on', `${host}:${port}`);
    console.error('   2. Username/password in .env is correct');
    console.error('   3. User has CREATE DATABASE permission\n');
    process.exit(1);
  }
}

setup();
