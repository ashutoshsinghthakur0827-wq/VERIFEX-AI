# VERIFEX AI

### AI-Powered Multi-Agent Claim Verification System

**Verifex AI** is an AI-powered claim verification platform designed to analyze statements, news articles, URLs, and documents. It uses a multi-agent workflow to research claims, evaluate evidence, assess source reliability, and generate structured investigation reports.

## 🚀 Key Features

* **Claim Analysis Agent:** Breaks submitted content into individual claims.
* **Research Agent:** Finds relevant information from accessible sources.
* **Evidence Agent:** Identifies evidence supporting or contradicting claims.
* **Source Analysis Agent:** Examines source context and reliability indicators.
* **Verification Agent:** Combines evidence to assess claims and highlight uncertainty.
* **Report Agent:** Generates structured reports with findings and citations.
* **Document Analysis:** Supports analysis of submitted content and documents.
* **Investigation Dashboard:** Presents claim analysis and verification results.

## 🧠 How It Works

1. Submit a statement, news article, URL, or document.
2. The Claim Analysis Agent extracts individual claims.
3. The Research Agent gathers relevant information.
4. The Evidence Agent identifies supporting and contradicting evidence.
5. The Source Analysis Agent evaluates source reliability.
6. The Verification Agent analyzes the findings and uncertainty.
7. The Report Agent prepares a structured investigation report.

## 🏗️ Project Architecture

```text
VERIFEX-AI/
├── backend/
│   ├── app/
│   └── ...
├── frontend/
├── docs/
├── research/
├── storage/
├── tests/
├── .gitignore
└── README.md
```

*The folder structure above is a high-level overview; update it to match the actual repository.*

## 🛠️ Technology Stack

* **Frontend:** React, JavaScript, HTML, CSS
* **Backend:** Python, FastAPI
* **AI Workflow:** Multi-agent architecture
* **LLM / Retrieval:** Configure according to the models and retrieval tools used in your implementation

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ashutoshsinghthakur0827-wq/VERIFEX-AI.git
cd VERIFEX-AI
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies using the project's dependency file, if available:

```bash
pip install -r requirements.txt
```

Run the FastAPI server using the correct application module for your project. For example:

```bash
python -m uvicorn app.main:app --reload
```

### 3. Set up the frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Refer to the project's configuration and scripts if your setup uses different commands.

## 📊 Expected Output

Verifex AI is designed to provide:

* Extracted claims
* Relevant research findings
* Supporting and contradicting evidence
* Source reliability indicators
* Verification assessments and confidence
* Uncertainty and limitations
* A structured investigation report

Verification results are evidence-based assessments, not a guarantee that a claim is true or false.

## 🔐 Security

* Keep API keys and credentials in environment variables.
* Do not commit `.env` files, secrets, or private user data.
* Use `.env.example` to document required configuration without exposing credentials.

## 🎯 Project Goal

The goal of Verifex AI is to make information analysis more structured, transparent, and understandable by combining specialized AI agents into a coordinated verification workflow.

## ⚠️ Disclaimer

Verifex AI is an AI-assisted research and claim verification tool. Its results may be incomplete or inaccurate. Always review original sources and independently verify important findings.

## 👨‍💻 Author

**Ashutosh Singh**
CSE (AIML) Student | AI/ML Developer

## 📄 License

Add a license file if you intend to publish this project under an open-source license.
