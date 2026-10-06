import sys
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from flask import Flask, request, jsonify, session
import joblib
import pandas as pd
import numpy as np
import os
import json
import base64
import uuid
import datetime
import math
import tensorflow as tf
from decimal import Decimal
from werkzeug.security import check_password_hash, generate_password_hash

from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'), override=True)
except ImportError:
    pass

app = Flask(__name__)
app.secret_key = os.getenv('APP_SECRET_KEY') or os.urandom(32)

try:
    from flask_cors import CORS
    CORS(app)
except ImportError:
    pass

@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
    return response


# ============================================================
# CUSTOM ENCODER
# Required to load the saved worker matching model
# ============================================================

class MultiLabelSkillsEncoder(BaseEstimator, TransformerMixin):

    def __init__(self):
        self.encoder = MultiLabelBinarizer()

    def fit(self, X, y=None):

        skills = pd.Series(
            np.asarray(X).ravel()
        ).fillna("")

        skill_lists = skills.apply(
            lambda x: [
                skill.strip()
                for skill in str(x).split(",")
                if skill.strip()
            ]
        )

        self.encoder.fit(skill_lists)

        return self

    def transform(self, X):

        skills = pd.Series(
            np.asarray(X).ravel()
        ).fillna("")

        skill_lists = skills.apply(
            lambda x: [
                skill.strip()
                for skill in str(x).split(",")
                if skill.strip()
            ]
        )

        return self.encoder.transform(skill_lists)

    def get_feature_names_out(self, input_features=None):

        return np.array([
            f"Worker_Skill_{skill}"
            for skill in self.encoder.classes_
        ])


# Attach to __main__ so joblib unpickler finds it
sys.modules['__main__'].MultiLabelSkillsEncoder = MultiLabelSkillsEncoder
setattr(sys.modules[__name__], 'MultiLabelSkillsEncoder', MultiLabelSkillsEncoder)


# ============================================================
# LOAD TRAINED MODELS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def get_mysql_connection():
    config = {
        'host': os.getenv('MYSQL_HOST'),
        'user': os.getenv('MYSQL_USER'),
        'password': os.getenv('MYSQL_PASSWORD'),
        'database': os.getenv('MYSQL_DATABASE'),
        'port': int(os.getenv('MYSQL_PORT', '3306')),
        'charset': 'utf8mb4'
    }
    if not all(config[key] for key in ('host', 'user', 'password', 'database')):
        raise RuntimeError('MySQL settings are missing. Configure MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE.')

    import mysql.connector
    connection = mysql.connector.connect(**config)
    cursor = connection.cursor()
    for statement in MYSQL_SCHEMA:
        cursor.execute(statement)
    for table, columns in LOCATION_COLUMNS.items():
        cursor.execute(f"SHOW COLUMNS FROM `{table}`")
        existing_columns = {row[0] for row in cursor.fetchall()}
        for column, definition in columns.items():
            if column not in existing_columns:
                cursor.execute(f"ALTER TABLE `{table}` ADD COLUMN `{column}` {definition}")
    cursor.close()
    return connection


MYSQL_SCHEMA = [
    """CREATE TABLE IF NOT EXISTS farmers (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(160) NOT NULL,
        phone VARCHAR(32) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        district VARCHAR(120) NOT NULL,
        location VARCHAR(255),
        rating DECIMAL(3,2) NOT NULL DEFAULT 4.50,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS workers (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(160) NOT NULL,
        phone VARCHAR(32) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        district VARCHAR(120) NOT NULL,
        location VARCHAR(255),
        location_latitude DOUBLE,
        location_longitude DOUBLE,
        experience_years INT NOT NULL DEFAULT 0,
        primary_skills TEXT,
        expected_wage DECIMAL(10,2) NOT NULL DEFAULT 0,
        rating DECIMAL(3,2) NOT NULL DEFAULT 4.50,
        total_jobs_done INT NOT NULL DEFAULT 0,
        acceptance_rate DECIMAL(5,4) NOT NULL DEFAULT 0.9000,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS jobs (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        farmer_id BIGINT NOT NULL,
        job_title VARCHAR(180) NOT NULL,
        crop_type VARCHAR(80) NOT NULL,
        required_skill VARCHAR(120) NOT NULL,
        workers_needed INT NOT NULL,
        district VARCHAR(120) NOT NULL,
        location VARCHAR(255),
        location_latitude DOUBLE,
        location_longitude DOUBLE,
        mandi_season VARCHAR(40),
        weather_condition VARCHAR(80),
        job_date DATE NOT NULL,
        experience_required INT NOT NULL DEFAULT 0,
        offered_wage DECIMAL(10,2) NOT NULL,
        acres DECIMAL(10,2) NOT NULL DEFAULT 0,
        description TEXT,
        predicted_market_wage DECIMAL(10,2),
        predicted_labour_demand INT,
        status VARCHAR(24) NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_jobs_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id)
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS hiring_requests (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        job_id BIGINT NOT NULL,
        farmer_id BIGINT NOT NULL,
        worker_id BIGINT NOT NULL,
        status VARCHAR(24) NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_hiring_job FOREIGN KEY (job_id) REFERENCES jobs(id),
        CONSTRAINT fk_hiring_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id),
        CONSTRAINT fk_hiring_worker FOREIGN KEY (worker_id) REFERENCES workers(id),
        UNIQUE KEY uq_hiring_job_worker (job_id, worker_id)
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS notifications (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        recipient_role VARCHAR(16) NOT NULL,
        recipient_id BIGINT NOT NULL,
        hiring_request_id BIGINT,
        title_en VARCHAR(180) NOT NULL,
        title_te VARCHAR(180) NOT NULL,
        message_en TEXT NOT NULL,
        message_te TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_notification_request FOREIGN KEY (hiring_request_id) REFERENCES hiring_requests(id)
    ) ENGINE=InnoDB"""
]

LOCATION_COLUMNS = {
    'workers': {'location_latitude': 'DOUBLE NULL', 'location_longitude': 'DOUBLE NULL'},
    'jobs': {
        'location': 'VARCHAR(255) NULL',
        'location_latitude': 'DOUBLE NULL',
        'location_longitude': 'DOUBLE NULL'
    }
}


def mysql_unavailable_response(error):
    return jsonify({'error': str(error)}), 503

wage_model = joblib.load(
    os.path.join(BASE_DIR, "models", "market_wage_model.pkl")
)

jobs_model = joblib.load(
    os.path.join(BASE_DIR, "models", "labour_demand_model.pkl")
)

matching_model = joblib.load(
    os.path.join(BASE_DIR, "models", "gradient_boosting_classifier.pkl")
)

print("[OK] Market Wage model loaded")
print("[OK] Labour Demand model loaded")
print("[OK] Worker Matching model loaded")

# ============================================================
# LOAD PLANT DISEASE CNN MODEL
# ============================================================

cnn_model_path = os.path.join(
    BASE_DIR,
    "models",
    "plant_disease",
    "best_fine_tuned_model.keras"
)

class_names_path = os.path.join(
    BASE_DIR,
    "models",
    "plant_disease",
    "class_names.json"
)

treatment_csv_path = os.path.join(
    BASE_DIR,
    "datasets",
    "disease_treatment.csv"
)

plant_disease_model = tf.keras.models.load_model(
    cnn_model_path
)

with open(class_names_path, "r", encoding="utf-8") as f:
    class_names = json.load(f)

treatment_df = pd.read_csv(
    treatment_csv_path
)

print("[OK] Plant Disease CNN model loaded")
print("[OK] Plant disease class names loaded")
print("[OK] Disease treatment data loaded")

# ============================================================
# CNN LABEL -> TREATMENT CSV MAPPING
# ============================================================

cnn_to_csv = {
    "Chilli_Healthy": ("Chilli", "healthy"),
    "Chilli_Leaf_Curl": ("Chilli", "leafcurl"),
    "Chilli_Leaf_Spot": ("Chilli", "spotleaf"),
    "Chilli_Whitefly": ("Chilli", "whitefly"),
    "Chilli_Yellowish_Leaf": ("Chilli", "Yellowish Leaf"),

    "Cotton_Healthy": ("Cotton", "Healthy"),
    "Cotton_Bacterial_Blight": ("Cotton", "bacterial_blight"),
    "Cotton_Curl_Virus": ("Cotton", "curl_virus"),
    "Cotton_Fusarium_Wilt": ("Cotton", "fussarium_wilt"),

    "Paddy_Healthy": ("Paddy", "health_paddy"),
    "Paddy_Brownspot": ("Paddy", "Brownspot"),
    "Paddy_Leafsmut": ("Paddy", "Leafsmut"),
    "Paddy_Bacterial_Leaf": ("Paddy", "bacterial_leaf"),

    "Sugarcane_Healthy": ("Sugarcane", "Healthy"),
    "Sugarcane_Mosaic": ("Sugarcane", "Mosaic"),
    "Sugarcane_Redrot": ("Sugarcane", "redrot"),
    "Sugarcane_Rust": ("Sugarcane", "Rust"),

    "Wheat_Healthy": ("Wheat", "Healthy"),
    "Wheat_Brown_Rust": ("Wheat", "Brownrust"),
    "Wheat_Septoria": ("Wheat", "septorial"),
    "Wheat_Yellow_Rust": ("Wheat", "yellow")
}

print("[OK] CNN to treatment mapping loaded (Total:", len(cnn_to_csv), ")")

# ============================================================
# ROUTE 1 — MARKET WAGE
# ============================================================

def build_forecast_input(data):
    return pd.DataFrame({
        'Date': [pd.Timestamp(data.get('date', datetime.date.today().isoformat())).toordinal()],
        'Mandi_Season': [data.get('mandi_season', 'Kharif')],
        'Region_ID / District': [data.get('district', 'Guntur District')],
        'Crop_Type': [data.get('crop_type', 'Paddy')],
        'Weather_Condition': [data.get('weather_condition', 'Sunny / Dry')],
        'Historical_Labour_Demanded': [float(data.get('historical_labour_demanded', 60))],
        'Historical_Labour_Supplied': [float(data.get('historical_labour_supplied', 45))]
    })


def generate_openai_explanation(instructions, context, image_bytes=None, image_mime_type='image/jpeg'):
    groq_api_key = (os.getenv('GROQ_API_KEY') or '').strip()
    openai_api_key = (os.getenv('OPENAI_API_KEY') or '').strip()
    using_groq = not image_bytes and (bool(groq_api_key) or openai_api_key.startswith('gsk_'))
    api_key = (groq_api_key or openai_api_key) if using_groq else openai_api_key
    if not api_key:
        return None
    try:
        from openai import OpenAI
        client_options = {'api_key': api_key}
        if using_groq:
            client_options['base_url'] = 'https://api.groq.com/openai/v1'
            model = (os.getenv('GROQ_MODEL') or 'llama-3.3-70b-versatile').strip()
            provider = 'Groq'
        else:
            model = (os.getenv('OPENAI_MODEL') or 'gpt-4o-mini').strip()
            provider = 'OpenAI'
        client = OpenAI(**client_options)
        user_content = json.dumps(context, ensure_ascii=False)
        if image_bytes:
            image_data = base64.b64encode(image_bytes).decode('ascii')
            user_content = [
                {'type': 'text', 'text': user_content},
                {'type': 'image_url', 'image_url': {'url': f'data:{image_mime_type};base64,{image_data}'}},
            ]
        response = client.chat.completions.create(
            model=model,
            messages=[
                {'role': 'system', 'content': instructions},
                {'role': 'user', 'content': user_content}
            ],
            temperature=0.2
        )
        return response.choices[0].message.content.strip()
    except Exception as error:
        app.logger.warning('%s explanation unavailable (%s); verify the provider key and model configuration.', provider, type(error).__name__)
        return None


@app.route('/api/predict_combined', methods=['POST'])
def predict_combined():
    data = request.get_json() or {}
    try:
        acres = float(data.get('acres', 0))
        if not np.isfinite(acres) or acres <= 0:
            return jsonify({'error': 'Enter an area greater than zero acres.'}), 400
        sample_input = build_forecast_input(data)
        wage = round(float(wage_model.predict(sample_input)[0]), 2)
        labour = round(float(jobs_model.predict(sample_input)[0]))
    except (TypeError, ValueError) as error:
        return jsonify({'error': f'Invalid forecast input: {error}'}), 400

    explanation = generate_openai_explanation(
        'Explain the supplied ML outputs simply in exactly 3 concise bullet points. Write each point in both English and Telugu, '
        'using this format on one line per point: "- English: ... | తెలుగు: ...". Do not add a heading. '
        'Do not change, recalculate, or claim to improve the predictions. The existing trained models do not use acreage as a feature; '
        'state clearly that acres are context only and do not scale either output by acres. '
        'Mention the predicted market wage per day and regional labour-demand estimate with a short practical interpretation.',
        {'date': data.get('date'), 'crop': data.get('crop_type'), 'district': data.get('district'), 'season': data.get('mandi_season'),
         'weather': data.get('weather_condition'), 'acres': acres, 'predicted_wage_per_day': wage,
         'historical_labour_demanded': data.get('historical_labour_demanded'),
         'historical_labour_supplied': data.get('historical_labour_supplied'),
         'regional_labour_demand_prediction': labour}
    )
    return jsonify({
        'predicted_market_wage': wage,
        'predicted_jobs_next_week': labour,
        'acres': acres,
        'explanation': explanation,
        'explanation_available': explanation is not None
    })

@app.route('/predict_wage', methods=['POST'])
def predict_wage():
    data = request.get_json() or {}
    sample_input = build_forecast_input(data)
    predicted_wage = wage_model.predict(sample_input)[0]
    return jsonify({'predicted_market_wage': round(float(predicted_wage), 2)})


@app.route('/predict_jobs', methods=['POST'])
def predict_jobs():
    data = request.get_json() or {}
    sample_input = build_forecast_input(data)
    predicted_jobs = jobs_model.predict(sample_input)[0]
    return jsonify({'predicted_jobs_next_week': round(float(predicted_jobs))})


# ============================================================
# ROUTE 3 — WORKER MATCHING
# ============================================================

@app.route('/predict_match', methods=['POST'])
def predict_match():
    data = request.get_json() or {}

    sample_input = pd.DataFrame({
        'Worker_Experience_Years': [
            float(data.get('worker_experience_years', 3))
        ],
        'Distance_KM': [
            float(data.get('distance_km', 5.0))
        ],
        'Worker_Historical_Rating': [
            float(data.get('worker_historical_rating', 4.5))
        ],
        'Farmer_Historical_Rating': [
            float(data.get('farmer_historical_rating', 4.5))
        ],
        'Historical_Acceptance_Rate': [
            float(data.get('historical_acceptance_rate', 0.85))
        ],
        'Job_Required_Skill': [
            str(data.get('job_required_skill', 'Harvesting'))
        ],
        'Worker_Primary_Skills': [
            str(data.get('worker_primary_skills', 'Harvesting, Seeding'))
        ]
    })

    prediction = matching_model.predict(
        sample_input
    )[0]

    probability = matching_model.predict_proba(
        sample_input
    )[0]

    return jsonify({
        'prediction': int(prediction),
        'match_status': (
            'Successful Match'
            if prediction == 1
            else 'Unsuccessful Match'
        ),
        'match_probability': round(
            float(probability[1]) * 100,
            2
        ),
        'unsuccessful_probability': round(
            float(probability[0]) * 100,
            2
        )
    })


# ============================================================
# ROUTE 4 — PLANT DISEASE PREDICTION
# ============================================================

@app.route('/api/disease_chat', methods=['POST'])
def disease_chat():
    data = request.get_json(silent=True) or {}
    question = str(data.get('question', '')).strip()
    if not question or len(question) > 1200:
        return jsonify({'error': 'Enter a question of 1 to 1200 characters.'}), 400

    history = data.get('messages', [])
    if not isinstance(history, list):
        return jsonify({'error': 'Chat history must be a list of messages.'}), 400

    messages = []
    for item in history[-10:]:
        if not isinstance(item, dict) or item.get('role') not in ('user', 'assistant'):
            return jsonify({'error': 'Chat history contains an invalid message.'}), 400
        content = item.get('content')
        if not isinstance(content, str) or len(content) > 2000:
            return jsonify({'error': 'Chat messages must be text under 2000 characters.'}), 400
        if content.strip():
            messages.append({'role': item['role'], 'content': content.strip()})

    diagnosis = data.get('diagnosis')
    diagnosis_context = {}
    selected_crop = data.get('crop_type')
    if isinstance(selected_crop, str) and selected_crop.strip():
        diagnosis_context['selected_crop'] = selected_crop.strip()[:120]
    if isinstance(diagnosis, dict):
        for key in ('crop', 'disease', 'confidence', 'symptoms', 'precautions', 'treatment_pesticide_information', 'acres'):
            value = diagnosis.get(key)
            if isinstance(value, (str, int, float)):
                diagnosis_context[key] = str(value)[:1200]

    system_message = (
        'You are a careful agricultural assistant for farmers. Answer in both English and Telugu, regardless of the selected UI language. '
        'Format every answer as Markdown with a "## English" section followed by a "## తెలుగు" section. '
        'Use concise headings and bullet points under each section; do not use tables. Include what the result means, safe actions now, '
        'acreage and treatment, and missing information or warnings when relevant. '
        'Use the supplied crop, acreage, diagnosis, and treatment context when relevant; a CNN result is not a confirmed field diagnosis. '
        'When acreage is supplied, repeat that acreage but do not invent acreage-based percentages, plant counts, thresholds, schedules, or quantities. '
        'Only calculate a total product quantity when the supplied context or user provides a clear, locally applicable per-acre rate for the same '
        'product formulation; show the exact rate multiplied by acres and its units. Never guess or invent any numeric recommendation, including '
        'pesticide dose, concentration, mixing instructions, application rate, waiting period, percentage, or product approval. '
        'If a verified rate is missing, say the exact quantity cannot be safely calculated and request the product label details '
        '(active ingredient, formulation, crop, and per-acre rate). Prefer safe non-chemical and integrated pest-management steps without unsupported numbers. '
        'Be honest about uncertainty, identify when a local agricultural officer should inspect the crop, and ask concise follow-up questions '
        'when location, crop stage, or symptoms are needed. If unrelated to agriculture, briefly say you can help with crop and farming questions.'
    )
    if diagnosis_context:
        system_message += '\nCurrent diagnosis context (user-provided app result): ' + json.dumps(diagnosis_context, ensure_ascii=False)

    groq_api_key = (os.getenv('GROQ_API_KEY') or '').strip()
    openai_api_key = (os.getenv('OPENAI_API_KEY') or '').strip()
    using_groq = bool(groq_api_key) or openai_api_key.startswith('gsk_')
    api_key = groq_api_key or openai_api_key
    if not api_key:
        return jsonify({'error': 'The AI assistant is not configured. Add GROQ_API_KEY or OPENAI_API_KEY to the backend .env file.'}), 503

    try:
        from openai import AuthenticationError, OpenAI, RateLimitError
        client_options = {'api_key': api_key}
        if using_groq:
            client_options['base_url'] = 'https://api.groq.com/openai/v1'
            model = (os.getenv('GROQ_MODEL') or 'llama-3.3-70b-versatile').strip()
            provider = 'Groq'
        else:
            model = (os.getenv('OPENAI_MODEL') or 'gpt-4o-mini').strip()
            provider = 'OpenAI'
        client = OpenAI(**client_options)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {'role': 'system', 'content': system_message},
                *messages,
                {'role': 'user', 'content': question}
            ],
            temperature=0.4,
            max_tokens=700
        )
        answer = response.choices[0].message.content
        if not answer:
            raise ValueError('The AI returned an empty response.')
        return jsonify({'answer': answer.strip()})
    except RateLimitError as error:
        error_body = getattr(error, 'body', {})
        provider_error = error_body.get('error', {}) if isinstance(error_body, dict) else {}
        error_code = provider_error.get('code') or provider_error.get('type') or getattr(error, 'code', None)
        if error_code in ('insufficient_quota', 'credit_balance_exhausted'):
            if using_groq:
                return jsonify({
                    'error': 'Groq API quota or credits are unavailable for this key. Check the Groq account limits and try again.'
                }), 503
            return jsonify({
                'error': 'The AI assistant is out of API credits. Add credits to the OpenAI account or configure a funded API key, then try again.'
            }), 503
        return jsonify({'error': 'The AI assistant is receiving too many requests. Please try again shortly.'}), 429
    except AuthenticationError:
        key_name = 'GROQ_API_KEY' if using_groq else 'OPENAI_API_KEY'
        return jsonify({'error': f'The AI assistant API key was rejected. Check {key_name} in the backend .env file.'}), 503
    except Exception as error:
        app.logger.warning('Disease chat unavailable for %s (%s).', provider, type(error).__name__)
        return jsonify({'error': 'The AI assistant could not respond right now. Please try again.'}), 502


@app.route('/predict_disease', methods=['POST'])
def predict_disease():
    if 'image' not in request.files:
        return jsonify({
            'error': 'No image uploaded'
        }), 400

    file = request.files['image']
    requested_crop = str(request.form.get('crop_type', '')).strip()
    try:
        acres = float(request.form.get('acres', 0))
    except (TypeError, ValueError):
        return jsonify({'error': 'Enter a valid land area in acres.'}), 400
    if not requested_crop or not np.isfinite(acres) or acres <= 0:
        return jsonify({'error': 'Crop type and a land area greater than zero acres are required.'}), 400

    if file.filename == '':
        return jsonify({
            'error': 'No image selected'
        }), 400

    try:
        image_bytes = file.read()

        image = tf.io.decode_image(
            image_bytes,
            channels=3,
            expand_animations=False
        )

        image = tf.image.resize(
            image,
            (224, 224)
        )

        image = image / 255.0

        image = tf.expand_dims(
            image,
            axis=0
        )

        predictions = plant_disease_model.predict(
            image,
            verbose=0
        )

        predicted_index = int(
            np.argmax(predictions[0])
        )

        predicted_label = class_names[
            predicted_index
        ]

        confidence = float(
            predictions[0][predicted_index]
        ) * 100

        if predicted_label not in cnn_to_csv:
            return jsonify({
                'error': 'Predicted class not found in mapping',
                'predicted_class': predicted_label
            }), 500

        crop, disease_class = cnn_to_csv[
            predicted_label
        ]

        result = treatment_df[
            (treatment_df['Crop'].str.strip().str.lower() == crop.strip().lower()) &
            (treatment_df['Disease_Class'].str.strip().str.lower() == disease_class.strip().lower())
        ]

        if result.empty:
            return jsonify({
                'error': 'Treatment information not found',
                'predicted_class': predicted_label,
                'crop': crop,
                'disease_class': disease_class
            }), 404

        row = result.iloc[0]

        result_payload = {
            'predicted_class': predicted_label,
            'confidence': round(
                confidence,
                2
            ),
            'crop': row['Crop'],
            'disease': row['Disease_Name'],
            'symptoms': row['Symptoms'],
            'precautions': row['Precautions_Management'],
            'treatment_pesticide_information': row['Treatment_Pesticide_Information'],
            'requested_crop': requested_crop,
            'acres': acres
        }
        result_payload['recommendation'] = generate_openai_explanation(
            'Inspect the attached crop-leaf photo visually, then explain the image-classification result and supplied treatment record simply in '
            + ('Telugu' if request.form.get('lang') == 'te' else 'English') + '. Translate all supplied diagnosis and guidance text into that language. '
            'Use the photo as evidence and compare it with the CNN result; clearly mention uncertainty if they do not agree. '
            'Use short headings for crop, disease, symptoms, safe management, treatment information, and acreage/rate guidance. '
            'Use only the supplied crop, disease, symptoms, precautions, and treatment information. '
            'Do not invent pesticide names, active ingredients, doses, spray volumes, or application rates. '
            'No verified application rate is present in this data, so do not calculate chemical quantity from acreage. '
            'Say to follow the current locally registered product label and local agricultural guidance; mention uncertainty if the entered crop differs from the detected crop.',
            {'entered_crop': requested_crop, 'cnn_detected_crop': row['Crop'], 'disease': row['Disease_Name'],
             'symptoms': row['Symptoms'], 'management': row['Precautions_Management'],
             'treatment_data': row['Treatment_Pesticide_Information'], 'land_acres': acres,
               'validated_application_rate_available': False},
              image_bytes=image_bytes,
              image_mime_type=file.mimetype or 'image/jpeg'
        )
        return jsonify(result_payload)
    except Exception as e:
        return jsonify({
            'error': f'Failed to process image: {str(e)}'
        }), 500


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ML server is running',
        'models': [
            'market_wage_model',
            'labour_demand_model',
            'gradient_boosting_classifier',
            'plant_disease_cnn_model'
        ]
    })


# ============================================================
# HARVESTHUB DATA STORE & WORKFLOW APIS
# ============================================================

INITIAL_WORKERS = [
    {
        "id": "w1",
        "name": "Ravi Kumar",
        "district": "Guntur District",
        "experience_years": 5,
        "primary_skills": "Harvesting, Seeding, Pruning",
        "expected_wage": 450,
        "rating": 4.8,
        "total_jobs_done": 42,
        "acceptance_rate": 0.92,
        "phone": "+91 98480 12345",
        "location": "Tenali, Guntur",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    },
    {
        "id": "w2",
        "name": "Lakshmi Narayana",
        "district": "Guntur District",
        "experience_years": 7,
        "primary_skills": "Harvesting, Pesticide Spraying, Tractor Driving",
        "expected_wage": 480,
        "rating": 4.9,
        "total_jobs_done": 68,
        "acceptance_rate": 0.95,
        "phone": "+91 98480 23456",
        "location": "Bapatla, Guntur",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
    },
    {
        "id": "w3",
        "name": "Suresh Babu",
        "district": "Kurnool District",
        "experience_years": 3,
        "primary_skills": "Seeding, Irrigation Setup",
        "expected_wage": 400,
        "rating": 4.4,
        "total_jobs_done": 25,
        "acceptance_rate": 0.88,
        "phone": "+91 98480 34567",
        "location": "Nandyal, Kurnool",
        "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80"
    },
    {
        "id": "w4",
        "name": "Venkata Rao",
        "district": "East Godavari",
        "experience_years": 8,
        "primary_skills": "Harvesting, Seeding, Pruning, Irrigation Setup",
        "expected_wage": 500,
        "rating": 4.95,
        "total_jobs_done": 80,
        "acceptance_rate": 0.98,
        "phone": "+91 98480 45678",
        "location": "Rajahmundry, East Godavari",
        "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
    },
    {
        "id": "w5",
        "name": "Chandra Shekar",
        "district": "Chittoor Region",
        "experience_years": 4,
        "primary_skills": "Pesticide Spraying, Pruning, Tractor Driving",
        "expected_wage": 430,
        "rating": 4.6,
        "total_jobs_done": 34,
        "acceptance_rate": 0.90,
        "phone": "+91 98480 56789",
        "location": "Madanapalle, Chittoor",
        "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"
    },
    {
        "id": "w6",
        "name": "Anjaneyulu",
        "district": "Anantapur District",
        "experience_years": 6,
        "primary_skills": "Tractor Driving, Irrigation Setup, Seeding",
        "expected_wage": 460,
        "rating": 4.7,
        "total_jobs_done": 51,
        "acceptance_rate": 0.91,
        "phone": "+91 98480 67890",
        "location": "Dharmavaram, Anantapur",
        "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80"
    }
]

INITIAL_JOBS = [
    {
        "id": "job-101",
        "farmer_name": "Appa Rao (రైతు అప్పారావు)",
        "farmer_id": "f1",
        "farmer_rating": 4.7,
        "crop_type": "Paddy",
        "required_skill": "Harvesting",
        "workers_needed": 12,
        "district": "Guntur District",
        "mandi_season": "Kharif",
        "weather_condition": "Sunny / Dry",
        "job_date": "2026-10-10",
        "experience_required": 2,
        "offered_wage": 460,
        "predicted_market_wage": 455.0,
        "predicted_labour_demand": 45,
        "description": "Paddy harvesting needed for 6 acres in Tenali rural. Immediate requirement for trained harvesters.",
        "status": "Active",
        "created_at": "2026-10-01T09:00:00Z"
    },
    {
        "id": "job-102",
        "farmer_name": "Satyanarayana (రైతు సత్యనారాయణ)",
        "farmer_id": "f2",
        "farmer_rating": 4.9,
        "crop_type": "Chilli",
        "required_skill": "Pesticide Spraying",
        "workers_needed": 6,
        "district": "Guntur District",
        "mandi_season": "Rabi",
        "weather_condition": "Sunny / Dry",
        "job_date": "2026-10-12",
        "experience_required": 3,
        "offered_wage": 480,
        "predicted_market_wage": 472.5,
        "predicted_labour_demand": 38,
        "description": "Specialized pesticide spraying for Guntur Sannam Chilli crop against leaf curl and thrips.",
        "status": "Active",
        "created_at": "2026-10-02T11:30:00Z"
    },
    {
        "id": "job-103",
        "farmer_name": "Subba Reddy (రైతు సుబ్బారెడ్డి)",
        "farmer_id": "f3",
        "farmer_rating": 4.5,
        "crop_type": "Cotton",
        "required_skill": "Seeding",
        "workers_needed": 15,
        "district": "Kurnool District",
        "mandi_season": "Kharif",
        "weather_condition": "Moderate Rainfall",
        "job_date": "2026-10-14",
        "experience_required": 1,
        "offered_wage": 420,
        "predicted_market_wage": 415.0,
        "predicted_labour_demand": 52,
        "description": "Cotton seeding and bed preparation across 10 acres in Nandyal region.",
        "status": "Active",
        "created_at": "2026-10-02T15:00:00Z"
    },
    {
        "id": "job-104",
        "farmer_name": "Rama Krishna (రైతు రామకృష్ణ)",
        "farmer_id": "f4",
        "farmer_rating": 4.8,
        "crop_type": "Sugarcane",
        "required_skill": "Pruning",
        "workers_needed": 8,
        "district": "East Godavari",
        "mandi_season": "Zaid",
        "weather_condition": "Sunny / Dry",
        "job_date": "2026-10-16",
        "experience_required": 3,
        "offered_wage": 500,
        "predicted_market_wage": 490.0,
        "predicted_labour_demand": 28,
        "description": "Sugarcane de-trashing and inter-row pruning for optimal sun penetration in Rajahmundry.",
        "status": "Active",
        "created_at": "2026-10-03T08:00:00Z"
    },
    {
        "id": "job-105",
        "farmer_name": "Narayana Swamy (రైతు నారాయణస్వామి)",
        "farmer_id": "f5",
        "farmer_rating": 4.6,
        "crop_type": "Wheat",
        "required_skill": "Irrigation Setup",
        "workers_needed": 4,
        "district": "Anantapur District",
        "mandi_season": "Rabi",
        "weather_condition": "Sunny / Dry",
        "job_date": "2026-10-18",
        "experience_required": 2,
        "offered_wage": 440,
        "predicted_market_wage": 435.0,
        "predicted_labour_demand": 20,
        "description": "Drip and furrow irrigation setup for wheat crop before winter sowing.",
        "status": "Active",
        "created_at": "2026-10-03T10:00:00Z"
    }
]

INITIAL_APPLICATIONS = [
    {
        "id": "app-1",
        "job_id": "job-101",
        "worker_id": "w1",
        "worker_name": "Ravi Kumar",
        "worker_rating": 4.8,
        "worker_experience": 5,
        "worker_skills": "Harvesting, Seeding, Pruning",
        "expected_wage": 450,
        "distance_km": 6.5,
        "matching_score": 93,
        "status": "Pending",
        "applied_date": "2026-10-02T14:20:00Z",
        "notes": "Experienced in combine and manual paddy harvesting. Available immediately."
    },
    {
        "id": "app-2",
        "job_id": "job-102",
        "worker_id": "w2",
        "worker_name": "Lakshmi Narayana",
        "worker_rating": 4.9,
        "worker_experience": 7,
        "worker_skills": "Harvesting, Pesticide Spraying, Tractor Driving",
        "expected_wage": 480,
        "distance_km": 4.2,
        "matching_score": 96,
        "status": "Accepted",
        "applied_date": "2026-10-02T16:10:00Z",
        "notes": "Certified knapsack and battery sprayer operator."
    }
]

workers_db = list(INITIAL_WORKERS)
jobs_db = list(INITIAL_JOBS)
applications_db = list(INITIAL_APPLICATIONS)
notifications_db = [
    {
        "id": "notif-1",
        "recipient_role": "farmer",
        "title_en": "New Worker Application",
        "title_te": "కొత్త కార్మికుని దరఖాస్తు",
        "message_en": "Ravi Kumar (93% Match) applied for Paddy Harvesting Job in Guntur.",
        "message_te": "రవి కుమార్ (93% అనుకూలత) గుంటూరు వరి కోత పనికి దరఖాస్తు చేసుకున్నారు.",
        "timestamp": "2026-10-02T14:20:00Z",
        "read": False
    },
    {
        "id": "notif-2",
        "recipient_role": "worker",
        "title_en": "Application Accepted!",
        "title_te": "మీ దరఖాస్తు ఆమోదించబడింది!",
        "message_en": "Satyanarayana accepted your application for Chilli Spraying.",
        "message_te": "సత్యనారాయణ మిరప పిచికారీ పనికి మీ దరఖాస్తును ఆమోదించారు.",
        "timestamp": "2026-10-02T17:00:00Z",
        "read": False
    }
]

# Helper to compute distance approximation between districts
DISTRICT_DISTANCES = {
    ("Guntur District", "Guntur District"): 6.0,
    ("Guntur District", "Kurnool District"): 180.0,
    ("Guntur District", "East Godavari"): 140.0,
    ("Guntur District", "Chittoor Region"): 260.0,
    ("Guntur District", "Anantapur District"): 320.0,
    ("Kurnool District", "Kurnool District"): 7.0,
    ("Kurnool District", "Anantapur District"): 120.0,
    ("Kurnool District", "Chittoor Region"): 210.0,
    ("East Godavari", "East Godavari"): 8.0,
    ("Chittoor Region", "Chittoor Region"): 5.0,
    ("Anantapur District", "Anantapur District"): 6.0,
}

def get_distance(dist1, dist2):
    pair = (dist1, dist2)
    rev = (dist2, dist1)
    if pair in DISTRICT_DISTANCES:
        return DISTRICT_DISTANCES[pair]
    if rev in DISTRICT_DISTANCES:
        return DISTRICT_DISTANCES[rev]
    return 35.0


def get_location_distance(lat1, lon1, lat2, lon2, district1, district2):
    try:
        if None not in (lat1, lon1, lat2, lon2):
            lat1, lon1, lat2, lon2 = map(float, (lat1, lon1, lat2, lon2))
            lat1, lon1, lat2, lon2 = map(math.radians, (lat1, lon1, lat2, lon2))
            delta_lat = lat2 - lat1
            delta_lon = lon2 - lon1
            value = math.sin(delta_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
            value = min(1.0, max(0.0, value))
            return 6371 * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))
    except (TypeError, ValueError):
        pass
    return get_distance(district1, district2)


def row_for_json(row):
    if not row:
        return row
    return {
        key: value.isoformat() if isinstance(value, (datetime.date, datetime.datetime))
        else float(value) if isinstance(value, Decimal) else value
        for key, value in row.items()
    }


def add_notification(cursor, role, recipient_id, title_en, title_te, message_en, message_te, request_id=None):
    cursor.execute(
        """INSERT INTO notifications
        (recipient_role, recipient_id, hiring_request_id, title_en, title_te, message_en, message_te)
        VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (role, recipient_id, request_id, title_en, title_te, message_en, message_te)
    )


def match_score(features):
    normalized = [max(0.0, min(float(value), 1.0)) for value in features]
    return round(float(cosine_similarity([normalized], [[1.0] * len(normalized)])[0][0]) * 100, 1)


def public_user(row):
    if not row:
        return None
    return {key: value for key, value in row.items() if key != 'password_hash'}


def is_authenticated(role=None, user_id=None):
    if not session.get('user_id') or not session.get('role'):
        return False
    if role and session.get('role') != role:
        return False
    if user_id and str(session.get('user_id')) != str(user_id):
        return False
    return True


@app.route('/api/auth/register', methods=['POST'])
def register_user():
    data = request.get_json() or {}
    role = data.get('role')
    name = str(data.get('name', '')).strip()
    phone = str(data.get('phone', '')).strip()
    password = str(data.get('password', ''))
    district = str(data.get('district', '')).strip()
    if role not in ('farmer', 'worker') or not name or not phone or len(password) < 8 or not district:
        return jsonify({'error': 'Choose a role and provide name, phone, district, and a password of at least 8 characters.'}), 400

    connection = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute('SELECT id FROM farmers WHERE phone = %s UNION SELECT id FROM workers WHERE phone = %s LIMIT 1', (phone, phone))
        if cursor.fetchone():
            return jsonify({'error': 'An account with this phone number already exists.'}), 409

        if role == 'farmer':
            cursor.execute(
                'INSERT INTO farmers (name, phone, password_hash, district, location) VALUES (%s, %s, %s, %s, %s)',
                (name, phone, generate_password_hash(password), district, data.get('location', district))
            )
            user_id = cursor.lastrowid
            cursor.execute('SELECT id, name, phone, district, location, rating FROM farmers WHERE id = %s', (user_id,))
        else:
            cursor.execute(
                '''INSERT INTO workers
                (name, phone, password_hash, district, location, location_latitude, location_longitude,
                 experience_years, primary_skills, expected_wage)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                (name, phone, generate_password_hash(password), district, data.get('location', district),
                 data.get('location_latitude'), data.get('location_longitude'),
                 int(data.get('experience_years', 0)), data.get('primary_skills', ''), float(data.get('expected_wage', 0)))
            )
            user_id = cursor.lastrowid
            cursor.execute('''SELECT id, name, phone, district, location, experience_years, primary_skills,
                              location_latitude, location_longitude, expected_wage, rating, total_jobs_done,
                              acceptance_rate FROM workers WHERE id = %s''', (user_id,))

        user = row_for_json(cursor.fetchone())
        connection.commit()
        session.clear()
        session['user_id'] = user_id
        session['role'] = role
        return jsonify({'success': True, 'role': role, 'user': user}), 201
    except Exception as error:
        if connection:
            connection.rollback()
        return mysql_unavailable_response(error)
    finally:
        if connection:
            connection.close()


@app.route('/api/auth/login', methods=['POST'])
def login_user():
    data = request.get_json() or {}
    role = data.get('role')
    phone = str(data.get('phone', '')).strip()
    password = str(data.get('password', ''))
    if role not in ('farmer', 'worker') or not phone or not password:
        return jsonify({'error': 'Role, phone number, and password are required.'}), 400

    connection = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        table = 'farmers' if role == 'farmer' else 'workers'
        cursor.execute(f'SELECT * FROM {table} WHERE phone = %s', (phone,))
        user = cursor.fetchone()
        authenticated_role = role
        if not user:
            authenticated_role = 'worker' if role == 'farmer' else 'farmer'
            other_table = 'workers' if authenticated_role == 'worker' else 'farmers'
            cursor.execute(f'SELECT * FROM {other_table} WHERE phone = %s', (phone,))
            user = cursor.fetchone()
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Phone number or password is incorrect.'}), 401
        user = row_for_json(public_user(user))
        session.clear()
        session['user_id'] = user['id']
        session['role'] = authenticated_role
        return jsonify({'success': True, 'role': authenticated_role, 'user': user})
    except Exception as error:
        return mysql_unavailable_response(error)
    finally:
        if connection:
            connection.close()


@app.route('/api/auth/logout', methods=['POST'])
def logout_user():
    session.clear()
    return jsonify({'success': True})


@app.route('/api/hiring-requests', methods=['GET', 'POST'])
def handle_hiring_requests():
    connection = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        if request.method == 'POST':
            data = request.get_json() or {}
            job_id = data.get('job_id')
            worker_id = data.get('worker_id')
            farmer_id = data.get('farmer_id')
            if not is_authenticated('farmer', farmer_id):
                return jsonify({'error': 'Sign in as the farmer who owns this job.'}), 401
            cursor.execute('''SELECT j.*, f.name AS farmer_name, w.name AS worker_name
                              FROM jobs j JOIN farmers f ON f.id = j.farmer_id
                              JOIN workers w ON w.id = %s
                              WHERE j.id = %s AND j.farmer_id = %s AND j.status = 'Active' ''',
                           (worker_id, job_id, farmer_id))
            details = cursor.fetchone()
            if not details:
                return jsonify({'error': 'The job, farmer, or worker could not be found.'}), 404
            cursor.execute('INSERT INTO hiring_requests (job_id, farmer_id, worker_id) VALUES (%s, %s, %s)',
                           (job_id, farmer_id, worker_id))
            request_id = cursor.lastrowid
            add_notification(
                cursor, 'worker', worker_id, 'Farmer wants to hire you', 'రైతు మీకు పని ఇవ్వాలనుకుంటున్నారు',
                f"{details['farmer_name']} invited you for {details['job_title']} ({details['crop_type']}) in {details['district']}. Wage: ₹{details['offered_wage']}/day. Date: {details['job_date']}.",
                f"{details['farmer_name']} {details['job_title']} ({details['crop_type']}) పనికి ఆహ్వానించారు. ప్రాంతం: {details['district']}. కూలీ: ₹{details['offered_wage']}/రోజు. తేదీ: {details['job_date']}.", request_id
            )
            connection.commit()
            return jsonify({'success': True, 'request': {'id': request_id, 'status': 'Pending'}}), 201

        role = request.args.get('role')
        user_id = request.args.get('user_id')
        if not is_authenticated(role, user_id):
            return jsonify({'error': 'Please sign in to view hiring requests.'}), 401
        if role == 'farmer':
            cursor.execute('''SELECT hr.*, j.job_title, j.crop_type, j.district, j.job_date, j.offered_wage,
                              w.name AS worker_name, w.experience_years AS worker_experience,
                              w.primary_skills AS worker_skills, w.rating AS worker_rating, w.location AS worker_location
                              FROM hiring_requests hr JOIN jobs j ON j.id = hr.job_id
                              JOIN workers w ON w.id = hr.worker_id WHERE hr.farmer_id = %s ORDER BY hr.created_at DESC''', (user_id,))
        else:
            cursor.execute('''SELECT hr.*, j.job_title, j.crop_type, j.district, j.job_date, j.offered_wage,
                              f.name AS farmer_name FROM hiring_requests hr JOIN jobs j ON j.id = hr.job_id
                              JOIN farmers f ON f.id = hr.farmer_id WHERE hr.worker_id = %s ORDER BY hr.created_at DESC''', (user_id,))
        requests_list = [row_for_json(row) for row in cursor.fetchall()]
        return jsonify({'requests': requests_list})
    except Exception as error:
        if connection and request.method == 'POST':
            connection.rollback()
        return mysql_unavailable_response(error)
    finally:
        if connection:
            connection.close()


@app.route('/api/hiring-requests/<int:request_id>', methods=['PATCH'])
def respond_to_hiring_request(request_id):
    data = request.get_json() or {}
    status = data.get('status')
    worker_id = data.get('worker_id')
    if status not in ('Accepted', 'Rejected') or not worker_id:
        return jsonify({'error': 'A valid response and worker ID are required.'}), 400
    if not is_authenticated('worker', worker_id):
        return jsonify({'error': 'Sign in as the worker receiving this request.'}), 401

    connection = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute('''SELECT hr.*, j.job_title, j.crop_type, f.name AS farmer_name, w.name AS worker_name
                          FROM hiring_requests hr JOIN jobs j ON j.id = hr.job_id
                          JOIN farmers f ON f.id = hr.farmer_id JOIN workers w ON w.id = hr.worker_id
                          WHERE hr.id = %s AND hr.worker_id = %s''', (request_id, worker_id))
        details = cursor.fetchone()
        if not details:
            return jsonify({'error': 'Hiring request not found.'}), 404
        if details['status'] != 'Pending':
            return jsonify({'error': 'This request has already been answered.'}), 409
        cursor.execute('UPDATE hiring_requests SET status = %s WHERE id = %s', (status, request_id))
        if status == 'Accepted':
            title_en, title_te = 'Worker accepted your job request', 'కార్మికుడు మీ పని అభ్యర్థనను అంగీకరించారు'
            message_en = f"{details['worker_name']} accepted your {details['job_title']} request. Status: Accepted."
            message_te = f"{details['worker_name']} మీ {details['job_title']} పని అభ్యర్థనను అంగీకరించారు. స్థితి: అంగీకరించారు."
        else:
            title_en, title_te = 'Worker rejected your job request', 'కార్మికుడు మీ పని అభ్యర్థనను తిరస్కరించారు'
            message_en = f"{details['worker_name']} rejected your {details['job_title']} request."
            message_te = f"{details['worker_name']} మీ {details['job_title']} పని అభ్యర్థనను తిరస్కరించారు."
        add_notification(cursor, 'farmer', details['farmer_id'], title_en, title_te, message_en, message_te, request_id)
        connection.commit()
        details['status'] = status
        return jsonify({'success': True, 'request': row_for_json(details)})
    except Exception as error:
        if connection:
            connection.rollback()
        return mysql_unavailable_response(error)
    finally:
        if connection:
            connection.close()


@app.route('/api/jobs', methods=['GET', 'POST'])
def handle_jobs():
    connection = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        if request.method == 'GET':
            if not is_authenticated():
                return jsonify({'error': 'Please sign in to find jobs.'}), 401
            clauses = ["j.status = 'Active'"]
            values = []
            for argument, column in [('crop', 'j.crop_type'), ('district', 'j.district'), ('skill', 'j.required_skill')]:
                value = request.args.get(argument)
                if value and value != 'all':
                    clauses.append(f'{column} = %s')
                    values.append(value)
            cursor.execute('''SELECT j.*, f.name AS farmer_name, f.rating AS farmer_rating
                              FROM jobs j JOIN farmers f ON f.id = j.farmer_id WHERE '''
                           + ' AND '.join(clauses) + ' ORDER BY j.created_at DESC', values)
            return jsonify({'jobs': [row_for_json(row) for row in cursor.fetchall()]})

        data = request.get_json() or {}
        farmer_id = data.get('farmer_id')
        if not is_authenticated('farmer', farmer_id):
            return jsonify({'error': 'Please sign in as a farmer to post a job.'}), 401
        crop = str(data.get('crop_type', '')).strip()
        skill = str(data.get('required_skill', '')).strip()
        if not farmer_id or not crop or not skill:
            return jsonify({'error': 'Farmer account, crop, and required skill are required.'}), 400
        title = str(data.get('job_title') or f'{crop} {skill}').strip()
        cursor.execute('''INSERT INTO jobs
            (farmer_id, job_title, crop_type, required_skill, workers_needed, district, location,
             location_latitude, location_longitude, mandi_season, weather_condition, job_date,
             experience_required, offered_wage, acres, description,
             predicted_market_wage, predicted_labour_demand)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
            (farmer_id, title, crop, skill, int(data.get('workers_needed', 1)), data.get('district', ''),
             data.get('location', ''), data.get('location_latitude'), data.get('location_longitude'),
             data.get('mandi_season', ''), data.get('weather_condition', ''),
             data.get('job_date', datetime.date.today().isoformat()), int(data.get('experience_required', 0)),
             float(data.get('offered_wage', 0)), float(data.get('acres', 0)), data.get('description', ''),
             data.get('predicted_market_wage'), data.get('predicted_labour_demand')))
        job_id = cursor.lastrowid
        cursor.execute('SELECT id FROM workers')
        for worker in cursor.fetchall():
            add_notification(cursor, 'worker', worker['id'], 'New farm job posted', 'కొత్త వ్యవసాయ పని',
                             f'{crop} {skill} in {data.get("district", "")}. Wage: ₹{data.get("offered_wage", 0)}/day.',
                             f'{data.get("district", "")} లో {crop} {skill} పని. కూలీ: ₹{data.get("offered_wage", 0)}/రోజు.')
        cursor.execute('''SELECT j.*, f.name AS farmer_name, f.rating AS farmer_rating
                          FROM jobs j JOIN farmers f ON f.id = j.farmer_id WHERE j.id = %s''', (job_id,))
        job = row_for_json(cursor.fetchone())
        connection.commit()
        return jsonify({'success': True, 'job': job}), 201
    except Exception as error:
        if connection:
            connection.rollback()
        return mysql_unavailable_response(error)
    finally:
        if connection:
            connection.close()


@app.route('/api/workers', methods=['GET', 'POST'])
def handle_workers():
    connection = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        if request.method == 'GET':
            if not is_authenticated():
                return jsonify({'error': 'Please sign in to view worker matches.'}), 401
            cursor.execute('''SELECT id, name, district, location, experience_years, primary_skills,
                              location_latitude, location_longitude, expected_wage, rating, total_jobs_done,
                              acceptance_rate FROM workers''')
            return jsonify({'workers': [row_for_json(row) for row in cursor.fetchall()]})
        data = request.get_json() or {}
        worker_id = data.get('id')
        if not is_authenticated('worker', worker_id):
            return jsonify({'error': 'Please sign in as this worker to update the profile.'}), 401
        if not worker_id:
            return jsonify({'error': 'Worker ID is required to update a profile.'}), 400
        cursor.execute('''UPDATE workers SET name=%s, district=%s, location=%s, location_latitude=%s,
                  location_longitude=%s, experience_years=%s, primary_skills=%s, expected_wage=%s WHERE id=%s''',
                   (data.get('name', ''), data.get('district', ''), data.get('location', data.get('district', '')),
                data.get('location_latitude'), data.get('location_longitude'),
                int(data.get('experience_years', 0)), data.get('primary_skills', ''),
                float(data.get('expected_wage', 0)), worker_id))
        if cursor.rowcount == 0:
            return jsonify({'error': 'Worker profile not found.'}), 404
        connection.commit()
        cursor.execute('''SELECT id, name, district, location, experience_years, primary_skills,
                          location_latitude, location_longitude, expected_wage, rating, total_jobs_done,
                          acceptance_rate FROM workers WHERE id=%s''', (worker_id,))
        return jsonify({'success': True, 'worker': row_for_json(cursor.fetchone())})
    except Exception as error:
        if connection and request.method == 'POST':
            connection.rollback()
        return mysql_unavailable_response(error)
    finally:
        if connection:
            connection.close()


@app.route('/api/applications', methods=['GET', 'POST'])
def handle_applications():
    connection = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        if request.method == 'GET':
            if not is_authenticated():
                return jsonify({'error': 'Please sign in to view applications.'}), 401
            requested_farmer = request.args.get('farmer_id')
            requested_worker = request.args.get('worker_id')
            if (session.get('role') == 'farmer' and (requested_worker or (requested_farmer and not is_authenticated('farmer', requested_farmer)))) or (session.get('role') == 'worker' and (requested_farmer or (requested_worker and not is_authenticated('worker', requested_worker)))):
                return jsonify({'error': 'You can only view your own applications.'}), 403
            clauses, values = [], []
            if session.get('role') == 'farmer':
                clauses.append('hr.farmer_id = %s')
                values.append(session.get('user_id'))
            else:
                clauses.append('hr.worker_id = %s')
                values.append(session.get('user_id'))
            for key, column in [('job_id', 'hr.job_id'), ('worker_id', 'hr.worker_id'), ('farmer_id', 'hr.farmer_id')]:
                value = request.args.get(key)
                if value:
                    clauses.append(f'{column} = %s')
                    values.append(value)
            query = '''SELECT hr.*, j.job_title, j.crop_type, j.district, j.location, j.job_date, j.offered_wage,
                       f.name AS farmer_name, w.name AS worker_name, w.rating AS worker_rating,
                       w.experience_years AS worker_experience, w.primary_skills AS worker_skills,
                       w.location AS worker_location, w.location_latitude AS worker_latitude,
                       w.location_longitude AS worker_longitude FROM hiring_requests hr
                       JOIN jobs j ON j.id=hr.job_id JOIN farmers f ON f.id=hr.farmer_id
                       JOIN workers w ON w.id=hr.worker_id'''
            if clauses:
                query += ' WHERE ' + ' AND '.join(clauses)
            cursor.execute(query + ' ORDER BY hr.created_at DESC', values)
            return jsonify({'applications': [row_for_json(row) for row in cursor.fetchall()]})

        data = request.get_json() or {}
        job_id, worker_id = data.get('job_id'), data.get('worker_id')
        if not is_authenticated('worker', worker_id):
            return jsonify({'error': 'Please sign in as a worker to apply.'}), 401
        cursor.execute('''SELECT j.*, f.name AS farmer_name FROM jobs j JOIN farmers f ON f.id=j.farmer_id
                          WHERE j.id=%s AND j.status='Active' ''', (job_id,))
        job = cursor.fetchone()
        cursor.execute('SELECT * FROM workers WHERE id=%s', (worker_id,))
        worker = cursor.fetchone()
        if not job or not worker:
            return jsonify({'error': 'Job or worker profile not found.'}), 404
        cursor.execute('INSERT INTO hiring_requests (job_id, farmer_id, worker_id) VALUES (%s, %s, %s)',
                       (job_id, job['farmer_id'], worker_id))
        request_id = cursor.lastrowid
        add_notification(cursor, 'farmer', job['farmer_id'], 'New worker application', 'కొత్త కార్మికుని దరఖాస్తు',
                         f"{worker['name']} applied for {job['job_title']}.",
                         f"{worker['name']} {job['job_title']} పనికి దరఖాస్తు చేసుకున్నారు.", request_id)
        connection.commit()
        return jsonify({'success': True, 'application': {'id': request_id, 'job_id': job_id, 'worker_id': worker_id, 'status': 'Pending'}}), 201
    except Exception as error:
        if connection and request.method == 'POST':
            connection.rollback()
        return mysql_unavailable_response(error)
    finally:
        if connection:
            connection.close()


@app.route('/api/applications/<app_id>', methods=['PATCH'])
def update_application(app_id):
    data = request.get_json() or {}
    new_status = data.get('status')
    farmer_id = data.get('farmer_id')
    if new_status not in ('Accepted', 'Rejected') or not farmer_id:
        return jsonify({'error': 'Farmer ID and a valid application status are required.'}), 400
    if not is_authenticated('farmer', farmer_id):
        return jsonify({'error': 'Please sign in as the farmer who owns this application.'}), 401
    connection = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute('''SELECT hr.*, j.crop_type, j.job_title, w.name AS worker_name FROM hiring_requests hr
                          JOIN jobs j ON j.id=hr.job_id JOIN workers w ON w.id=hr.worker_id
                          WHERE hr.id=%s AND hr.farmer_id=%s''', (app_id, farmer_id))
        application = cursor.fetchone()
        if not application:
            return jsonify({'error': 'Application not found.'}), 404
        cursor.execute('UPDATE hiring_requests SET status=%s WHERE id=%s', (new_status, app_id))
        add_notification(cursor, 'worker', application['worker_id'], f'Application {new_status}',
                         f'దరఖాస్తు స్థితి: {new_status}',
                         f"Your application for {application['job_title']} was {new_status.lower()}.",
                         f"{application['job_title']} పనికి మీ దరఖాస్తు {new_status} అయింది.", app_id)
        connection.commit()
        application['status'] = new_status
        return jsonify({'success': True, 'application': row_for_json(application)})
    except Exception as error:
        if connection:
            connection.rollback()
        return mysql_unavailable_response(error)
    finally:
        if connection:
            connection.close()


@app.route('/api/notifications', methods=['GET', 'PATCH'])
def handle_notifications():
    role = request.args.get('role') if request.method == 'GET' else (request.get_json() or {}).get('role')
    user_id = request.args.get('user_id') if request.method == 'GET' else (request.get_json() or {}).get('user_id')
    if role not in ('farmer', 'worker') or not user_id:
        return jsonify({'error': 'Role and user ID are required.'}), 400
    if not is_authenticated(role, user_id):
        return jsonify({'error': 'Please sign in to view notifications.'}), 401
    connection = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        if request.method == 'PATCH':
            cursor.execute('UPDATE notifications SET is_read=TRUE WHERE recipient_role=%s AND recipient_id=%s', (role, user_id))
            connection.commit()
            return jsonify({'success': True})
        cursor.execute('''SELECT n.id, n.recipient_role, n.recipient_id, n.hiring_request_id, n.title_en, n.title_te,
                          n.message_en, n.message_te, n.is_read AS `read`, n.created_at AS `timestamp`,
                          hr.status, j.job_title, j.crop_type, j.district, j.location, j.job_date, j.offered_wage, j.acres,
                          f.name AS farmer_name, w.name AS worker_name, w.experience_years AS worker_experience,
                          w.primary_skills AS worker_skills, w.rating AS worker_rating, w.location AS worker_location
                          FROM notifications n LEFT JOIN hiring_requests hr ON hr.id=n.hiring_request_id
                          LEFT JOIN jobs j ON j.id=hr.job_id LEFT JOIN farmers f ON f.id=hr.farmer_id
                          LEFT JOIN workers w ON w.id=hr.worker_id
                          WHERE n.recipient_role=%s AND n.recipient_id=%s ORDER BY n.created_at DESC''', (role, user_id))
        return jsonify({'notifications': [row_for_json(row) for row in cursor.fetchall()]})
    except Exception as error:
        if connection and request.method == 'PATCH':
            connection.rollback()
        return mysql_unavailable_response(error)
    finally:
        if connection:
            connection.close()


# ============================================================
# BATCH WORKER MATCHING FOR A SPECIFIC JOB
# Runs ML Model across all workers
# ============================================================

@app.route('/api/match_workers_for_job', methods=['POST'])
def match_workers_for_job():
    data = request.get_json() or {}
    farmer_id = data.get('farmer_id')
    if not is_authenticated('farmer', farmer_id):
        return jsonify({'error': 'Please sign in as a farmer to find workers.'}), 401
    required_skill = data.get('required_skill', 'Harvesting')
    district = data.get('district', 'Guntur District')
    location_latitude = data.get('location_latitude')
    location_longitude = data.get('location_longitude')
    offered_wage = float(data.get('offered_wage', 450))
    required_experience = float(data.get('experience_required', 2))
    connection = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        if data.get('id'):
            cursor.execute('''SELECT j.required_skill, j.district, j.location_latitude, j.location_longitude,
                              j.offered_wage, j.experience_required, f.rating AS farmer_historical_rating
                              FROM jobs j JOIN farmers f ON f.id=j.farmer_id
                              WHERE j.id=%s AND j.farmer_id=%s AND j.status='Active' ''',
                           (data.get('id'), farmer_id))
            job = cursor.fetchone()
            if not job:
                return jsonify({'error': 'The selected job was not found for this farmer.'}), 404
            required_skill = job['required_skill']
            district = job['district']
            location_latitude = job['location_latitude']
            location_longitude = job['location_longitude']
            offered_wage = float(job['offered_wage'])
            required_experience = float(job['experience_required'])
            farmer_historical_rating = float(job['farmer_historical_rating'])
        else:
            cursor.execute('SELECT rating FROM farmers WHERE id=%s', (farmer_id,))
            farmer = cursor.fetchone()
            if not farmer:
                return jsonify({'error': 'The signed-in farmer could not be found.'}), 404
            farmer_historical_rating = float(farmer['rating'])
        cursor.execute('''SELECT id, name, district, location, location_latitude, location_longitude,
                          experience_years, primary_skills, expected_wage,
                          rating, total_jobs_done, acceptance_rate FROM workers''')
        matched_workers = []
        model_inputs = []
        for worker in cursor.fetchall():
            distance = get_location_distance(
                location_latitude, location_longitude,
                worker.get('location_latitude'), worker.get('location_longitude'),
                district, worker.get('district') or district
            )
            worker['calculated_distance_km'] = distance
            matched_workers.append(worker)
            model_inputs.append({
                'Worker_Experience_Years': float(worker['experience_years']),
                'Distance_KM': distance,
                'Worker_Historical_Rating': float(worker['rating']),
                'Farmer_Historical_Rating': farmer_historical_rating,
                'Historical_Acceptance_Rate': float(worker['acceptance_rate']),
                'Job_Required_Skill': required_skill,
                'Worker_Primary_Skills': worker.get('primary_skills') or ''
            })
        if model_inputs:
            model_frame = pd.DataFrame(model_inputs, columns=matching_model.feature_names_in_)
            match_probabilities = matching_model.predict_proba(model_frame)[:, 1]
            for worker, probability in zip(matched_workers, match_probabilities):
                skills = [item.strip().lower() for item in str(worker.get('primary_skills') or '').split(',')]
                skill_match = required_skill.strip().lower() in skills
                distance = worker['calculated_distance_km']
                worker['matching_score'] = round(float(probability) * 100, 2)
                worker['reasons_en'] = [
                    'Required skill matches' if skill_match else 'Required skill is not listed',
                    f'{int(worker["experience_years"])} years of experience',
                    f'{distance:g} km from the job region'
                ]
                worker['reasons_te'] = [
                    'అవసరమైన నైపుణ్యం సరిపోలింది' if skill_match else 'అవసరమైన నైపుణ్యం ప్రొఫైల్‌లో లేదు',
                    f'{int(worker["experience_years"])} సంవత్సరాల అనుభవం',
                    f'పని ప్రాంతం నుంచి {distance:g} కి.మీ'
                ]
        matched_workers.sort(key=lambda item: item['matching_score'], reverse=True)
        return jsonify({
            'job_id': data.get('id'),
            'total_workers_evaluated': len(matched_workers),
            'matched_workers': [row_for_json(worker) for worker in matched_workers]
        })
    except Exception as error:
        return mysql_unavailable_response(error)
    finally:
        if connection:
            connection.close()


# ============================================================
# BATCH JOB RECOMMENDATION FOR A SPECIFIC WORKER
# Runs ML Model across all active jobs
# ============================================================

@app.route('/api/recommend_jobs_for_worker', methods=['POST'])
def recommend_jobs_for_worker():
    data = request.get_json() or {}
    worker_id = data.get('id')
    if not is_authenticated('worker', worker_id):
        return jsonify({'error': 'Please sign in as a worker to get job recommendations.'}), 401
    worker_skills = data.get('primary_skills', 'Harvesting, Seeding')
    worker_exp = float(data.get('experience_years', 4))
    worker_district = data.get('district', 'Guntur District')
    worker_expected_wage = float(data.get('expected_wage', 450))
    skill_set = {item.strip().lower() for item in str(worker_skills).split(',')}
    connection = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute('SELECT location_latitude, location_longitude FROM workers WHERE id=%s', (worker_id,))
        worker_location = cursor.fetchone() or {}
        cursor.execute('''SELECT j.*, f.name AS farmer_name, f.rating AS farmer_rating
                          FROM jobs j JOIN farmers f ON f.id=j.farmer_id WHERE j.status='Active' ''')
        recommended_jobs = []
        for job in cursor.fetchall():
            distance = get_location_distance(
                worker_location.get('location_latitude'), worker_location.get('location_longitude'),
                job.get('location_latitude'), job.get('location_longitude'),
                worker_district, job.get('district') or worker_district
            )
            skill_score = 1.0 if job['required_skill'].lower() in skill_set else 0.0
            experience_score = min(worker_exp / max(float(job['experience_required']), 1.0), 1.0)
            distance_score = 1 / (1 + distance / 100)
            wage_score = min(float(job['offered_wage']) / max(worker_expected_wage, 1.0), 1.0)
            farmer_rating_score = float(job['farmer_rating']) / 5
            recommended_jobs.append({
                **job,
                'distance_km': distance,
                'matching_score': match_score([skill_score, experience_score, distance_score, wage_score, farmer_rating_score]),
                'reasons_en': [
                    'Your skills match this job' if skill_score else 'Builds on your agricultural experience',
                    f'{distance:g} km from your region',
                    f'Farmer rating: {job["farmer_rating"]}/5'
                ],
                'reasons_te': [
                    'మీ నైపుణ్యాలు ఈ పనికి సరిపోతున్నాయి' if skill_score else 'మీ వ్యవసాయ అనుభవానికి సంబంధించిన పని',
                    f'మీ ప్రాంతం నుంచి {distance:g} కి.మీ',
                    f'రైతు రేటింగ్: {job["farmer_rating"]}/5'
                ]
            })
        recommended_jobs.sort(key=lambda item: item['matching_score'], reverse=True)
        return jsonify({'worker_id': data.get('id'), 'recommended_jobs': [row_for_json(row) for row in recommended_jobs]})
    except Exception as error:
        return mysql_unavailable_response(error)
    finally:
        if connection:
            connection.close()


# ============================================================
# SAMPLE LEAF IMAGES FOR TESTING
# ============================================================

@app.route('/api/sample_disease_images', methods=['GET'])
def get_sample_disease_images():
    # Return descriptive test list for the 5 crops and treatments
    samples = [
        {
            "id": "s1",
            "crop": "Paddy",
            "disease_class": "Brownspot",
            "disease_name": "Rice Brown Spot",
            "description_en": "Circular to oval dark brown spots on paddy leaves with yellow halo.",
            "description_te": "వరి ఆకులపై పసుపు రంగుతో కూడిన గోధుమ రంగు మచ్చలు.",
            "thumbnail_color": "#854d0e"
        },
        {
            "id": "s2",
            "crop": "Chilli",
            "disease_class": "leafcurl",
            "disease_name": "Chilli Leaf Curl",
            "description_en": "Upward curling, puckering of leaves caused by Gemini virus transmitted by whitefly.",
            "description_te": "తెల్లదోమ ద్వారా వ్యాపించే మిరప ఆకు ముడుత తెగులు.",
            "thumbnail_color": "#15803d"
        },
        {
            "id": "s3",
            "crop": "Cotton",
            "disease_class": "bacterial_blight",
            "disease_name": "Cotton Bacterial Blight",
            "description_en": "Angular water-soaked leaf spots bounded by veinlets.",
            "description_te": "పత్తి ఆకులపై కోణాకారపు నీటి మచ్చలు మరియు మచ్చల తెగులు.",
            "thumbnail_color": "#b45309"
        },
        {
            "id": "s4",
            "crop": "Sugarcane",
            "disease_class": "redrot",
            "disease_name": "Sugarcane Red Rot",
            "description_en": "Red discoloration of internal pith with characteristic white patches.",
            "description_te": "చెరకు ఎర్ర కుళ్ళు తెగులు - అంతర్గత ఎరుపు మరియు తెల్లటి మచ్చలు.",
            "thumbnail_color": "#b91c1c"
        },
        {
            "id": "s5",
            "crop": "Wheat",
            "disease_class": "yellow",
            "disease_name": "Wheat Yellow Rust",
            "description_en": "Yellow-orange pustules arranged in linear stripes on leaf blades.",
            "description_te": "గోధుమ ఆకులపై చారలుగా ఏర్పడే పసుపు రంగు కుంకుమ తెగులు.",
            "thumbnail_color": "#ca8a04"
        },
        {
            "id": "s6",
            "crop": "Paddy",
            "disease_class": "health_paddy",
            "disease_name": "Healthy Paddy Leaf",
            "description_en": "Vibrant green, spotless leaf with healthy vegetative vigor.",
            "description_te": "ఆరోగ్యకరమైన పచ్చని వరి ఆకు - ఎలాంటి తెగులు లేదు.",
            "thumbnail_color": "#16a34a"
        }
    ]
    return jsonify({'samples': samples})


# ============================================================
# START SERVER
# ============================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting HarvestHub ML Server on http://127.0.0.1:{port}")
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False
    )
