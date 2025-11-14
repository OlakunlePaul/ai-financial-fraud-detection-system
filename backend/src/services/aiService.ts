import axios from 'axios';

export interface TransactionData {
  amount: number;
  currency: string;
  transaction_type: string;
  payment_method: string;
  location_country: string;
  device_type: string;
  hour_of_day?: number;
  day_of_week?: number;
}

export interface FraudPrediction {
  fraud_risk_score: number;
  is_flagged: boolean;
  reasons?: string[];
}

export async function predictFraud(
  transaction: TransactionData
): Promise<FraudPrediction> {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';
    const response = await axios.post(`${aiServiceUrl}/predict`, transaction, {
      timeout: 5000
    });

    return response.data;
  } catch (error) {
    console.error('AI Service error:', error);
    // Fallback: return medium risk if AI service is unavailable
    return {
      fraud_risk_score: 50,
      is_flagged: false,
      reasons: ['AI service unavailable']
    };
  }
}

