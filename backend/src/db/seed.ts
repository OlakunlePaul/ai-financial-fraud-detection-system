import { pool } from './connection';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    // Create default users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const analystPassword = await bcrypt.hash('analyst123', 10);

    await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES 
        ('admin@fraud.com', $1, 'Admin User', 'admin'),
        ('analyst@fraud.com', $2, 'Analyst User', 'analyst')
      ON CONFLICT (email) DO NOTHING
    `, [adminPassword, analystPassword]);

    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

