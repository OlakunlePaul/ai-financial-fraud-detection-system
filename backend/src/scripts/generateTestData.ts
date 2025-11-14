import { pool } from '../db/connection';
import { predictFraud } from '../services/aiService';

async function generateTestData() {
  try {
    // Get a user ID
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.error('No users found. Please run seed script first.');
      process.exit(1);
    }
    const userId = userResult.rows[0].id;

    const transactions = [
      {
        transaction_id: 'TXN' + Date.now() + '_1',
        amount: 100.50,
        currency: 'USD',
        merchant_name: 'Amazon',
        transaction_type: 'purchase',
        payment_method: 'credit_card',
        location_country: 'US',
        location_city: 'Seattle',
      },
      {
        transaction_id: 'TXN' + Date.now() + '_2',
        amount: 5000.00,
        currency: 'USD',
        merchant_name: 'Unknown Merchant',
        transaction_type: 'withdrawal',
        payment_method: 'debit_card',
        location_country: 'NG',
        location_city: 'Lagos',
      },
      {
        transaction_id: 'TXN' + Date.now() + '_3',
        amount: 25.99,
        currency: 'USD',
        merchant_name: 'Starbucks',
        transaction_type: 'purchase',
        payment_method: 'credit_card',
        location_country: 'US',
        location_city: 'New York',
      },
      {
        transaction_id: 'TXN' + Date.now() + '_4',
        amount: 15000.00,
        currency: 'USD',
        merchant_name: 'Luxury Store',
        transaction_type: 'purchase',
        payment_method: 'bank_transfer',
        location_country: 'RU',
        location_city: 'Moscow',
      },
      {
        transaction_id: 'TXN' + Date.now() + '_5',
        amount: 75.00,
        currency: 'USD',
        merchant_name: 'Uber',
        transaction_type: 'purchase',
        payment_method: 'paypal',
        location_country: 'US',
        location_city: 'San Francisco',
      },
    ];

    console.log('Generating test transactions...');

    for (const tx of transactions) {
      const prediction = await predictFraud({
        amount: tx.amount,
        currency: tx.currency,
        transaction_type: tx.transaction_type,
        payment_method: tx.payment_method,
        location_country: tx.location_country,
        device_type: 'mobile',
        hour_of_day: new Date().getHours(),
        day_of_week: new Date().getDay(),
      });

      await pool.query(
        `INSERT INTO transactions (
          transaction_id, user_id, amount, currency, merchant_name,
          transaction_type, payment_method, location_country, location_city,
          fraud_risk_score, is_flagged
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          tx.transaction_id,
          userId,
          tx.amount,
          tx.currency,
          tx.merchant_name,
          tx.transaction_type,
          tx.payment_method,
          tx.location_country,
          tx.location_city,
          prediction.fraud_risk_score,
          prediction.is_flagged,
        ]
      );

      console.log(`Created transaction ${tx.transaction_id} (Risk: ${prediction.fraud_risk_score})`);
    }

    console.log('✅ Test data generated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    process.exit(1);
  }
}

generateTestData();

