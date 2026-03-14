# 🏥 CuraTrack - Intelligent Healthcare Companion

CuraTrack is a comprehensive, AI-powered healthcare ecosystem designed to bridge the gap between patients, caregivers, and medical infrastructure. By leveraging advanced AI (Llama 3 via Ollama) and OCR technologies, CuraTrack transforms healthcare management into a seamless, automated, and life-saving experience.

## 🌟 Key Features

### 1. Patient Portal
- **AI Prescription Analyzer**: Upload image or PDF prescriptions. Our Local AI extracts medications, dosages, and schedules automatically.
- **Medication Adherence Tracking**: Real-time reminders and logging for medication intake.
- **SMS Notifications**: Integrated with mTalkz for instant mobile alerts (medication reminders, emergency alerts).
- **Smart Health Insurance**: 
  - Real-time verification via Sandbox FHIR APIs.
  - AI-driven insurance scheme analysis and personalized recommendations.
  - One-click cashless claim filing.
- **Emergency SOS**: Instant activation of ambulance dispatch and caregiver notification.

### 2. Caregiver Portal
- **Remote Monitoring**: Track medication adherence and health status of loved ones in real-time.
- **AI Summaries**: Generate concise medical history summaries using Llama 3 for better care coordination.

### 3. Hospital & Employee Portal
- **Queue Management**: Specialized portals for hospital staff to manage appointments and assign patients to doctors.
- **Doctor's Queue**: Prioritized patient queues with emergency handling (triage).

### 4. Healthcare Infrastructure Integration
- **Practo Network**: Integrated hospital search and real-time appointment booking.
- **Digital Health ID**: Unified patient identification (HID-TN system).

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Vanilla CSS (Modern, Responsive Design)
- **State Management**: React Hooks
- **APIs**: Fetch API, Axios

### Backend
- **Runtime**: Node.js
- **Server**: Express
- **AI/ML**:
  - **Llama 3 (via Ollama)**: For medical record summarization and prescription analysis.
  - **Tesseract.js**: For Optical Character Recognition (OCR).
  - **pdf-parse**: For PDF text extraction.
- **File Handling**: Multer

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Ollama](https://ollama.com/) (installed and running locally)
- Llama 3 model downloaded: `ollama pull llama3`

### 1. Project Structure
The project is split into two main directories:
- `/CuraTrack`: The React frontend.
- `/backend`: The Node.js server.

### 2. Setup Backend
```bash
cd CuraTrack/backend
npm install
node server.js
```
The server will run on `http://localhost:3001`.

### 3. Setup Frontend
```bash
cd CuraTrack/CuraTrack
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

## 🤖 AI Setup Note
This project requires a local instance of **Ollama** running with the **Llama 3** model.
The backend communicates with Ollama at `http://localhost:11434/api/generate`.

## 📜 License
This project is licensed under the ISC License.
