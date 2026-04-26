# Animax 🎓

An interactive learning platform that generates comprehensive educational content—including text summaries, quizzes, and synchronized video—based on any user-provided topic.

## The Innovation: Cost-Effective Video Generation
Traditional AI video models (like Sora or Kling) are computationally expensive, often costing **$6.00+ per minute** (approx. $0.10/second). 

This app utilizes a proprietary **Canvas-based rendering engine**. By programmatically generating visuals on a canvas and syncing them with GPT-4o-generated scripts, the app produces high-quality, 1-minute educational videos for approximately **$0.10 total**. This represents a **60x cost reduction** compared to industry standards.

## Features
* **Topic-to-Video:** Instant 1-minute educational animations.
* **Interactive Quizzes:** Context-aware questions to test retention.
* **AI Text Summaries:** Concise breakdowns of complex subjects.
* **Low-Latency Performance:** Optimized for rapid content delivery.

## ⚙️ Setup & Installation

### 1. Environment Configuration
Create a `.env` file in the following directories:

**Frontend (`/frontend/.env`)**
 ⁠env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_BASE=your_api_backend_url


⁠ **AI Engine (`/ai/.env`)**
 ⁠env
OPENAI_API_KEY=your_openai_api_key


⁠ ### 2. Installation
The project requires Python virtual environments for both the AI and Backend services.

 ⁠bash
# Setup AI Service
cd ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup Backend Service
cd ../backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

