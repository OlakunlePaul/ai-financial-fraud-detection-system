import express from 'express';
import { pool } from '../db/connection';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { predictFraud } from '../services/aiService';
import { sendFraudAlert } from '../services/notificationService';
import { z } from 'zod';

const router = express.Router();

const transactionSchema = z.object({
  transaction_id: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  merchant_name: z.string().optional(),
  transaction_type: z.string(),
  payment_method: z.string(),
  card_number_last4: z.string().length(4).optional(),
  location_country: z.string(),
  location_city: z.string().optional(),
  ip_address: z.string().optional(),
  device_type: z.string().optional()
});

// Get all transactions with filters
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      page = '1',
      limit = '50',
      is_flagged,
      min_risk_score,
      start_date,
      end_date
    } = req.query;

    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (is_flagged !== undefined) {
      paramCount++;
      query += ` AND is_flagged = $${paramCount}`;
      params.push(is_flagged === 'true');
    }

    if (min_risk_score) {
      paramCount++;
      query += ` AND fraud_risk_score >= $${paramCount}`;
      params.push(parseFloat(min_risk_score as string));
    }

    if (start_date) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      params.push(end_date);
    }

    query += ' ORDER BY created_at DESC';

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit as string));
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM transactions'
    );

    res.json({
      transactions: result.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit as string))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, 
       (SELECT COUNT(*) FROM alerts WHERE transaction_id = t.id AND is_resolved = false) as alert_count
       FROM transactions t WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Create transaction with fraud detection
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = transactionSchema.parse(req.body);

    // Get fraud prediction from AI service
    const prediction = await predictFraud({
      amount: data.amount,
      currency: data.currency,
      transaction_type: data.transaction_type,
      payment_method: data.payment_method,
      location_country: data.location_country,
      device_type: data.device_type || 'unknown',
      hour_of_day: new Date().getHours(),
      day_of_week: new Date().getDay()
    });

    const result = await pool.query(
      `INSERT INTO transactions (
        transaction_id, user_id, amount, currency, merchant_name,
        transaction_type, payment_method, card_number_last4,
        location_country, location_city, ip_address, device_type,
        fraud_risk_score, is_flagged
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        data.transaction_id,
        req.user!.id,
        data.amount,
        data.currency,
        data.merchant_name,
        data.transaction_type,
        data.payment_method,
        data.card_number_last4,
        data.location_country,
        data.location_city,
        data.ip_address,
        data.device_type,
        prediction.fraud_risk_score,
        prediction.is_flagged
      ]
    );

    const transaction = result.rows[0];

    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user!.id,
        'create_transaction',
        'transaction',
        transaction.id,
        JSON.stringify({ transaction_id: data.transaction_id })
      ]
    );

    // Send alert if flagged
    if (prediction.is_flagged) {
      await sendFraudAlert(transaction.id);
    }

    res.status(201).json({ transaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if ((error as any).code === '23505') {
      return res.status(400).json({ error: 'Transaction ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, is_fraud } = req.body;

    const result = await pool.query(
      `UPDATE transactions 
       SET status = COALESCE($1, status),
           is_fraud = COALESCE($2, is_fraud),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, is_fraud, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user!.id,
        'update_transaction',
        'transaction',
        parseInt(req.params.id),
        JSON.stringify({ status, is_fraud })
      ]
    );

    res.json({ transaction: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Flag transaction as fraud
router.post('/:id/flag', authenticate, authorize('admin', 'analyst'), async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `UPDATE transactions 
       SET is_flagged = true, is_fraud = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await sendFraudAlert(result.rows[0].id);

    res.json({ transaction: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to flag transaction' });
  }
});

// Delete transaction (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;

