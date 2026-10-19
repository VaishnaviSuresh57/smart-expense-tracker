from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import os
import json
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import cv2
import pytesseract
import re
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")  # Change this to a random secret key in production

# Configure upload folder for receipts
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database files (JSON for simplicity)
USERS_DB = 'data/users.json'
INVENTORY_DB = 'data/inventory.json'
RECEIPTS_DB = 'data/receipts.json'

# Ensure data directory exists
os.makedirs('data', exist_ok=True)

# Initialize database files if they don't exist
def init_db():
    if not os.path.exists(USERS_DB):
        with open(USERS_DB, 'w') as f:
            json.dump({}, f)
    
    if not os.path.exists(INVENTORY_DB):
        with open(INVENTORY_DB, 'w') as f:
            json.dump({}, f)
    
    if not os.path.exists(RECEIPTS_DB):
        with open(RECEIPTS_DB, 'w') as f:
            json.dump({}, f)

init_db()

# Helper functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_users():
    with open(USERS_DB, 'r') as f:
        return json.load(f)

def save_users(users):
    with open(USERS_DB, 'w') as f:
        json.dump(users, f)

def get_inventory(user_id):
    with open(INVENTORY_DB, 'r') as f:
        inventories = json.load(f)
        return inventories.get(user_id, {})

def save_inventory(user_id, inventory):
    with open(INVENTORY_DB, 'r') as f:
        inventories = json.load(f)
    
    inventories[user_id] = inventory
    
    with open(INVENTORY_DB, 'w') as f:
        json.dump(inventories, f)

def get_receipts(user_id):
    with open(RECEIPTS_DB, 'r') as f:
        receipts = json.load(f)
        return receipts.get(user_id, [])

def save_receipts(user_id, receipts):
    with open(RECEIPTS_DB, 'r') as f:
        all_receipts = json.load(f)
    
    all_receipts[user_id] = receipts
    
    with open(RECEIPTS_DB, 'w') as f:
        json.dump(all_receipts, f)

def extract_receipt_data(image_path):
    # This is a placeholder for OCR functionality
    # In a real implementation, you would use pytesseract to extract text
    # and then parse it to find items, quantities, and prices
    
    # For now, we'll return dummy data with Indian prices
    return [
        {"item": "Milk", "quantity": 1, "price": 65.00},
        {"item": "Bread", "quantity": 1, "price": 35.00},
        {"item": "Eggs", "quantity": 12, "price": 120.00}
    ]

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        users = get_users()
        
        if username in users:
            return render_template('signup.html', error='Username already exists')
        
        users[username] = {
            'password': generate_password_hash(password),
            'created_at': datetime.now().isoformat()
        }
        
        save_users(users)
        
        session['user_id'] = username
        return redirect(url_for('dashboard'))
    
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        users = get_users()
        
        if username not in users or not check_password_hash(users[username]['password'], password):
            return render_template('login.html', error='Invalid username or password')
        
        session['user_id'] = username
        return redirect(url_for('dashboard'))
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    inventory = get_inventory(user_id)
    
    return render_template('dashboard.html', username=user_id, inventory=inventory)

@app.route('/inventory')
def inventory():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    inventory = get_inventory(user_id)
    
    return render_template('inventory.html', inventory=inventory)

@app.route('/inventory/add', methods=['POST'])
def add_inventory():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'})
    
    user_id = session['user_id']
    inventory = get_inventory(user_id)
    
    item_name = request.form['item_name']
    quantity = int(request.form['quantity'])
    price = float(request.form['price'])
    needed = request.form.get('needed', 'off') == 'on'
    
    if item_name in inventory:
        inventory[item_name]['quantity'] += quantity
    else:
        inventory[item_name] = {
            'quantity': quantity,
            'price': price,
            'needed': needed
        }
    
    save_inventory(user_id, inventory)
    
    return jsonify({'success': True})

@app.route('/inventory/update', methods=['POST'])
def update_inventory():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'})
    
    user_id = session['user_id']
    inventory = get_inventory(user_id)
    
    item_name = request.form['item_name']
    quantity = int(request.form['quantity'])
    price = float(request.form['price'])
    needed = request.form.get('needed', 'off') == 'on'
    
    if item_name in inventory:
        inventory[item_name] = {
            'quantity': quantity,
            'price': price,
            'needed': needed
        }
        
        save_inventory(user_id, inventory)
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Item not found'})

@app.route('/inventory/delete', methods=['POST'])
def delete_inventory():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'})
    
    user_id = session['user_id']
    inventory = get_inventory(user_id)
    
    item_name = request.form['item_name']
    
    if item_name in inventory:
        del inventory[item_name]
        save_inventory(user_id, inventory)
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Item not found'})

@app.route('/receipts')
def receipts():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    receipts = get_receipts(user_id)
    
    return render_template('receipts.html', receipts=receipts)

@app.route('/receipts/upload', methods=['POST'])
def upload_receipt():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'})
    
    if 'receipt' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'})
    
    file = request.files['receipt']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'})
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Extract data from receipt
        items = extract_receipt_data(filepath)
        
        # Save receipt data
        user_id = session['user_id']
        receipts = get_receipts(user_id)
        
        # Normalize image path for web use
        normalized_image_path = filepath.replace('\\', '/')
        
        receipt_data = {
            'id': len(receipts) + 1,
            'date': datetime.now().isoformat(),
            'image_path': normalized_image_path,
            'items': items
        }
        
        receipts.append(receipt_data)
        save_receipts(user_id, receipts)
        
        return jsonify({'success': True, 'receipt': receipt_data})
    
    return jsonify({'success': False, 'error': 'Invalid file type'})

@app.route('/receipts/<int:receipt_id>')
def get_receipt(receipt_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'})
    
    user_id = session['user_id']
    receipts = get_receipts(user_id)
    
    for receipt in receipts:
        if receipt['id'] == receipt_id:
            return jsonify({'success': True, 'receipt': receipt})
    
    return jsonify({'success': False, 'error': 'Receipt not found'})

@app.route('/receipts/update', methods=['POST'])
def update_receipt():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'})
    
    user_id = session['user_id']
    receipts = get_receipts(user_id)
    
    receipt_id = int(request.form['receipt_id'])
    items = json.loads(request.form['items'])
    
    for i, receipt in enumerate(receipts):
        if receipt['id'] == receipt_id:
            receipts[i]['items'] = items
            save_receipts(user_id, receipts)
            return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Receipt not found'})

@app.route('/receipts/delete', methods=['POST'])
def delete_receipt():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'})
    
    user_id = session['user_id']
    receipts = get_receipts(user_id)
    
    receipt_id = int(request.form['receipt_id'])
    
    # Find and remove the receipt
    for i, receipt in enumerate(receipts):
        if receipt['id'] == receipt_id:
            # Remove the image file if it exists
            import os
            image_path = receipt.get('image_path', '')
            if image_path and os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except OSError:
                    pass  # File might not exist or be in use
            
            # Remove receipt from list
            receipts.pop(i)
            save_receipts(user_id, receipts)
            return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Receipt not found'})

@app.route('/insights')
def insights():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    inventory = get_inventory(user_id)
    receipts = get_receipts(user_id)
    
    # Get the latest receipt
    latest_receipt = receipts[-1] if receipts else None
    
    if not latest_receipt:
        return render_template('insights.html', insights=None)
    
    # Generate insights
    insights_data = {
        'extra_items': [],
        'missing_items': [],
        'price_mismatches': []
    }
    
    # Find extra items (items in receipt but not needed in inventory)
    needed_items = {item: data for item, data in inventory.items() if data['needed']}
    
    for receipt_item in latest_receipt['items']:
        item_name = receipt_item['item']
        
        if item_name not in needed_items:
            insights_data['extra_items'].append(receipt_item)
        else:
            # Check for price mismatches
            if abs(receipt_item['price'] - needed_items[item_name]['price']) > 0.01:
                insights_data['price_mismatches'].append({
                    'item': item_name,
                    'expected_price': needed_items[item_name]['price'],
                    'actual_price': receipt_item['price']
                })
    
    # Find missing items (items needed in inventory but not in receipt)
    receipt_items = {item['item'] for item in latest_receipt['items']}
    
    for item_name, data in needed_items.items():
        if item_name not in receipt_items:
            insights_data['missing_items'].append({
                'item': item_name,
                'quantity': data['quantity'],
                'price': data['price']
            })
    
    return render_template('insights.html', insights=insights_data, receipt=latest_receipt)

if __name__ == '__main__':
    app.run(debug=True)