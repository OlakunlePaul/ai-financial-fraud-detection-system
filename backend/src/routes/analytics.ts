import express from 'express';
import { pool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Dashboard statistics
router.get('/dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const [
      totalTransactions,
      flaggedTransactions,
      totalAmount,
      avgRiskScore,
      recentAlerts
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM transactions'),
      pool.query("SELECT COUNT(*) as count FROM transactions WHERE is_flagged = true"),
      pool.query('SELECT SUM(amount) as total FROM transactions'),
      pool.query('SELECT AVG(fraud_risk_score) as avg FROM transactions'),
      pool.query(
        `SELECT a.*, t.transaction_id, t.amount 
         FROM alerts a 
         JOIN transactions t ON a.transaction_id = t.id 
         WHERE a.is_resolved = false 
         ORDER BY a.created_at DESC 
         LIMIT 10`
      )
    ]);

    res.json({
      stats: {
        totalTransactions: parseInt(totalTransactions.rows[0].count),
        flaggedTransactions: parseInt(flaggedTransactions.rows[0].count),
        totalAmount: parseFloat(totalAmount.rows[0].total || '0'),
        avgRiskScore: parseFloat(avgRiskScore.rows[0].avg || '0').toFixed(2),
        fraudRate: (
          (parseInt(flaggedTransactions.rows[0].count) / 
           parseInt(totalTransactions.rows[0].count || '1')) * 100
        ).toFixed(2)
      },
      recentAlerts: recentAlerts.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Daily/Monthly trends
router.get('/trends', authenticate, async (req: AuthRequest, res) => {
  try {
    const { period = 'daily', days = '30' } = req.query;

    let dateFormat: string;
    if (period === 'monthly') {
      dateFormat = "TO_CHAR(created_at, 'YYYY-MM')";
    } else {
      dateFormat = "TO_CHAR(created_at, 'YYYY-MM-DD')";
    }

    const result = await pool.query(
      `SELECT 
        ${dateFormat} as date,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN is_flagged = true THEN 1 END) as flagged_transactions,
        AVG(fraud_risk_score) as avg_risk_score,
        SUM(amount) as total_amount
       FROM transactions
       WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY ${dateFormat}
       ORDER BY date ASC`
    );

    res.json({ trends: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Risk score distribution
router.get('/risk-distribution', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        CASE 
          WHEN fraud_risk_score < 30 THEN 'Low (0-30)'
          WHEN fraud_risk_score < 70 THEN 'Medium (30-70)'
          ELSE 'High (70-100)'
        END as risk_category,
        COUNT(*) as count
       FROM transactions
       GROUP BY risk_category
       ORDER BY risk_category`
    );

    res.json({ distribution: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch risk distribution' });
  }
});

export default router;

