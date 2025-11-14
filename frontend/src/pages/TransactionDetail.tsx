import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionsApi } from '../services/api';
import { format } from 'date-fns';
import { ArrowLeft, Flag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Transaction {
  id: number;
  transaction_id: string;
  amount: number;
  currency: string;
  merchant_name: string;
  transaction_type: string;
  payment_method: string;
  card_number_last4: string;
  location_country: string;
  location_city: string;
  ip_address: string;
  device_type: string;
  fraud_risk_score: number;
  is_flagged: boolean;
  is_fraud: boolean;
  status: string;
  created_at: string;
  alert_count: number;
}

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTransaction();
    }
  }, [id]);

  const fetchTransaction = async () => {
    try {
      const data = await transactionsApi.getById(parseInt(id!));
      setTransaction(data);
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!transaction || !window.confirm('Flag this transaction as fraud?')) {
      return;
    }

    try {
      await transactionsApi.flag(transaction.id);
      fetchTransaction();
    } catch (error) {
      console.error('Failed to flag transaction:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Transaction not found</p>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Transaction Details
          </h1>
          {(user?.role === 'admin' || user?.role === 'analyst') && (
            <button
              onClick={handleFlag}
              disabled={transaction.is_flagged}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Flag className="w-4 h-4 mr-2" />
              Flag as Fraud
            </button>
          )}
        </div>

        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Transaction ID
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {transaction.transaction_id}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {transaction.currency} {transaction.amount.toFixed(2)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Merchant</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {transaction.merchant_name || 'N/A'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">
                Transaction Type
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {transaction.transaction_type}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">
                Payment Method
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {transaction.payment_method}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">
                Card Number (Last 4)
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {transaction.card_number_last4 || 'N/A'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {transaction.location_city
                  ? `${transaction.location_city}, ${transaction.location_country}`
                  : transaction.location_country}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">IP Address</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {transaction.ip_address || 'N/A'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Device Type</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {transaction.device_type || 'N/A'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">
                Fraud Risk Score
              </dt>
              <dd className="mt-1">
                <span
                  className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getRiskColor(
                    transaction.fraud_risk_score
                  )}`}
                >
                  {transaction.fraud_risk_score.toFixed(1)} / 100
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                {transaction.is_flagged ? (
                  <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Flagged
                  </span>
                ) : (
                  <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Normal
                  </span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">
                Transaction Status
              </dt>
              <dd className="mt-1">
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                  {transaction.status}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(
                  new Date(transaction.created_at),
                  'MMM dd, yyyy HH:mm:ss'
                )}
              </dd>
            </div>

            {transaction.alert_count > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Alerts</dt>
                <dd className="mt-1 text-sm text-red-600">
                  {transaction.alert_count} active alert(s)
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

