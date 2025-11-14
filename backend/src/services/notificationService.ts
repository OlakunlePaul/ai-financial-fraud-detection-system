import nodemailer from 'nodemailer';
import axios from 'axios';
import { pool } from '../db/connection';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendFraudAlert(transactionId: number) {
  try {
    const result = await pool.query(
      `SELECT t.*, u.email as user_email, u.name as user_name
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [transactionId]
    );

    if (result.rows.length === 0) return;

    const transaction = result.rows[0];

    // Create alert in database
    await pool.query(
      `INSERT INTO alerts (transaction_id, alert_type, severity, message)
       VALUES ($1, $2, $3, $4)`,
      [
        transactionId,
        'fraud_detected',
        transaction.fraud_risk_score > 80 ? 'high' : 'medium',
        `Transaction ${transaction.transaction_id} flagged with risk score ${transaction.fraud_risk_score}`
      ]
    );

    // Send email notification
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@frauddetection.com',
        to: process.env.ADMIN_EMAIL || transaction.user_email,
        subject: `🚨 Fraud Alert: Transaction ${transaction.transaction_id}`,
        html: `
          <h2>Fraud Alert</h2>
          <p>A transaction has been flagged as potentially fraudulent:</p>
          <ul>
            <li><strong>Transaction ID:</strong> ${transaction.transaction_id}</li>
            <li><strong>Amount:</strong> ${transaction.currency} ${transaction.amount}</li>
            <li><strong>Risk Score:</strong> ${transaction.fraud_risk_score}/100</li>
            <li><strong>Merchant:</strong> ${transaction.merchant_name || 'N/A'}</li>
            <li><strong>Location:</strong> ${transaction.location_city}, ${transaction.location_country}</li>
          </ul>
          <p>Please review this transaction immediately.</p>
        `
      });
    }

    // Send webhook notification
    if (process.env.WEBHOOK_URL) {
      try {
        await axios.post(process.env.WEBHOOK_URL, {
          event: 'fraud_alert',
          transaction: {
            id: transaction.id,
            transaction_id: transaction.transaction_id,
            amount: transaction.amount,
            risk_score: transaction.fraud_risk_score
          },
          timestamp: new Date().toISOString()
        }, { timeout: 5000 });
      } catch (error) {
        console.error('Webhook notification failed:', error);
      }
    }
  } catch (error) {
    console.error('Notification service error:', error);
  }
}

