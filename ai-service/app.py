from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
from dotenv import load_dotenv
import logging

load_dotenv()

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize model and scaler
model = None
scaler = StandardScaler()

def initialize_model():
    """Initialize or load the fraud detection model"""
    global model, scaler
    
    model_path = 'fraud_model.joblib'
    scaler_path = 'scaler.joblib'
    
    if os.path.exists(model_path) and os.path.exists(scaler_path):
        logger.info("Loading existing model...")
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
    else:
        logger.info("Training new model...")
        # Generate synthetic training data
        train_data = generate_training_data()
        
        # Prepare features
        feature_cols = ['amount', 'hour_of_day', 'day_of_week', 'payment_method_encoded', 
                       'transaction_type_encoded', 'location_encoded']
        X = train_data[feature_cols]
        
        # Scale features
        X_scaled = scaler.fit_transform(X)
        
        # Train Isolation Forest (anomaly detection)
        model = IsolationForest(
            contamination=0.1,  # 10% expected fraud rate
            random_state=42,
            n_estimators=100
        )
        model.fit(X_scaled)
        
        # Save model
        joblib.dump(model, model_path)
        joblib.dump(scaler, scaler_path)
        logger.info("Model trained and saved")

def generate_training_data():
    """Generate synthetic training data for model initialization"""
    np.random.seed(42)
    n_samples = 10000
    
    data = {
        'amount': np.random.lognormal(mean=5, sigma=1, size=n_samples),
        'hour_of_day': np.random.randint(0, 24, n_samples),
        'day_of_week': np.random.randint(0, 7, n_samples),
        'payment_method_encoded': np.random.randint(0, 5, n_samples),
        'transaction_type_encoded': np.random.randint(0, 4, n_samples),
        'location_encoded': np.random.randint(0, 10, n_samples)
    }
    
    # Add some anomalies (fraud patterns)
    fraud_indices = np.random.choice(n_samples, size=int(n_samples * 0.1), replace=False)
    for idx in fraud_indices:
        data['amount'][idx] *= np.random.uniform(5, 20)  # Unusually high amounts
        data['hour_of_day'][idx] = np.random.choice([0, 1, 2, 3, 22, 23])  # Odd hours
    
    return pd.DataFrame(data)

def encode_features(transaction):
    """Encode categorical features to numerical"""
    payment_methods = {
        'credit_card': 0,
        'debit_card': 1,
        'paypal': 2,
        'bank_transfer': 3,
        'other': 4
    }
    
    transaction_types = {
        'purchase': 0,
        'withdrawal': 1,
        'transfer': 2,
        'refund': 3
    }
    
    # Simple location encoding (country hash)
    location_hash = hash(transaction.get('location_country', 'unknown')) % 10
    
    return {
        'amount': float(transaction.get('amount', 0)),
        'hour_of_day': transaction.get('hour_of_day', 12),
        'day_of_week': transaction.get('day_of_week', 0),
        'payment_method_encoded': payment_methods.get(
            transaction.get('payment_method', 'other').lower(), 4
        ),
        'transaction_type_encoded': transaction_types.get(
            transaction.get('transaction_type', 'purchase').lower(), 0
        ),
        'location_encoded': location_hash
    }

def calculate_risk_score(prediction, anomaly_score):
    """Convert model prediction to risk score (0-100)"""
    # Isolation Forest returns -1 for anomalies, 1 for normal
    # anomaly_score is negative for anomalies, positive for normal
    
    if prediction == -1:  # Anomaly detected
        # Convert anomaly score to risk score
        # anomaly_score ranges from -0.5 to 0.5 typically
        risk_score = min(100, max(70, 50 - (anomaly_score * 100)))
    else:  # Normal transaction
        risk_score = max(0, min(50, 30 + (anomaly_score * 20)))
    
    return round(risk_score, 2)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict fraud risk for a transaction"""
    try:
        if model is None:
            return jsonify({
                'error': 'Model not initialized'
            }), 500
        
        transaction = request.json
        
        # Encode features
        features = encode_features(transaction)
        feature_array = np.array([[
            features['amount'],
            features['hour_of_day'],
            features['day_of_week'],
            features['payment_method_encoded'],
            features['transaction_type_encoded'],
            features['location_encoded']
        ]])
        
        # Scale features
        feature_array_scaled = scaler.transform(feature_array)
        
        # Predict
        prediction = model.predict(feature_array_scaled)[0]
        anomaly_score = model.score_samples(feature_array_scaled)[0]
        
        # Calculate risk score
        risk_score = calculate_risk_score(prediction, anomaly_score)
        is_flagged = risk_score >= 70
        
        # Generate reasons
        reasons = []
        if features['amount'] > 10000:
            reasons.append('Unusually high transaction amount')
        if features['hour_of_day'] in [0, 1, 2, 3, 22, 23]:
            reasons.append('Transaction during unusual hours')
        if prediction == -1:
            reasons.append('Anomaly detected by ML model')
        
        return jsonify({
            'fraud_risk_score': risk_score,
            'is_flagged': is_flagged,
            'reasons': reasons if is_flagged else [],
            'anomaly_score': float(anomaly_score)
        })
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Initializing fraud detection model...")
    initialize_model()
    
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"Starting Flask server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=debug)

