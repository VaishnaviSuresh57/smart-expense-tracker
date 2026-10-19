# 💰 Smart Expense Tracker

A web-based expense tracking application built with Python and Flask to manage expenses, scan receipts using OCR, organize inventory, and review spending information.

## 🚀 Features

| Feature | Description |
|---|---|
| 🔐 User Authentication | User registration and login |
| 📊 Dashboard | Overview of expense and purchase information |
| 🧾 Receipt Scanning | Extract receipt text using OCR |
| 💸 Expense Management | Organize and track expense information |
| 📦 Inventory Management | Manage inventory items and quantities |
| 📈 Spending Insights | Review spending-related summaries |

## 🛠️ Tech Stack

- **Frontend** — HTML, CSS, JavaScript, Bootstrap (if used)
- **Backend** — Python, Flask
- **Image Processing** — OpenCV, Pillow
- **OCR** — Pytesseract, Tesseract OCR
- **Data Storage** — JSON files
- **Dependencies** — Python packages listed in `requirements.txt`

## 📁 Project Structure

```text
smart-expense-tracker/
├── static/
│   ├── style.css
│   ├── main.js
│   ├── insights.js
│   ├── inventory.js
│   └── receipts.js
├── templates/
│   ├── dashboard.html
│   ├── index.html
│   ├── insights.html
│   ├── inventory.html
│   ├── login.html
│   ├── receipts.html
│   └── signup.html
├── app.py
├── requirements.txt
├── .gitignore
└── README.md
```

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/VaishnaviSuresh57/smart-expense-tracker.git
cd smart-expense-tracker
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure the application

Configure the required environment variables and local application data before starting the application. Do not commit secrets or personal receipt data to GitHub.

### 5. Install Tesseract OCR

Install the Tesseract OCR engine separately if you want to use receipt text extraction. The `pytesseract` Python package alone does not install the OCR engine.

### 6. Run the application

```bash
python app.py
```

### 7. Open in your browser

```text
http://127.0.0.1:5000
```

## 📸 Screenshots

### 🏠 Dashboard

![Expense Tracker Dashboard](images/dashboard.png)

### 🧾 Receipt Scanning

![Receipt Scanning](images/receipts.png)

### 📦 Inventory Management

![Inventory Management](images/inventory.png)

### 📈 Spending Insights

![Spending Insights](images/insights.png)

## 🔒 Security and Privacy

- Keep secret keys and `.env` files out of version control.
- Do not upload personal receipt images or private user records.
- Use environment variables for sensitive configuration.
- Keep local application data separate from public source code.

## 📌 Project Status

Currently under development. Features and setup instructions may change as testing and improvements continue.

## 👩‍💻 Developed By

**Vaishnavi S.**

Smart Expense Tracker — 2026

GitHub: [VaishnaviSuresh57](https://github.com/VaishnaviSuresh57)
