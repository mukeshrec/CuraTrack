console.log('--- SERVER INITIALIZING ---');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Set up multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Mock Database of Patients
const mockPatients = {
    'HID-TN-20240847': {
        name: 'Rajan Kumar',
        age: 64,
        gender: 'Male',
        bloodGroup: 'O+',
        conditions: ['Type 2 Diabetes', 'Hypertension', 'Hyperlipidemia'],
        allergies: ['Penicillin', 'Aspirin'],
        medications: [
            { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
            { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
            { name: 'Atorvastatin', dosage: '10mg', frequency: 'At bedtime' }
        ],
        history: [
            { date: '2026-03-10', type: 'Consultation', doctor: 'Dr. S. Mehta', notes: 'BP controlled. HbA1c improving. Continue current meds.' },
            { date: '2026-03-05', type: 'Lab Report', facility: 'City Diagnostics', results: 'HbA1c: 7.2%, Creatinine: 0.9, Cholesterol: 178 mg/dL.' },
            { date: '2026-01-08', type: 'Emergency Visit', facility: 'Apollo Hospital', notes: 'Chest pain episode — ruled out cardiac event. Stress ECG normal.' }
        ]
    }
};

// Helper to clean up uploaded files
const cleanupFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error('Failed to cleanup file:', filePath, err);
    }
};

// Route to summarize patient history using AI (POST)
app.post('/api/summarize-patient', async (req, res) => {
    const { healthId } = req.body;
    await summarizePatient(healthId, res);
});

// Route to summarize patient history using AI (GET - for testing)
app.get('/api/summarize-patient/:healthId', async (req, res) => {
    const { healthId } = req.params;
    await summarizePatient(healthId, res);
});

async function summarizePatient(healthId, res) {
    if (!healthId || !mockPatients[healthId]) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = mockPatients[healthId];

    try {
        const prompt = `
You are a medical AI assistant. Summarize the following patient's medical history for a doctor. 
Focus on active conditions, critical allergies, recent lab results, and previous significant events (like emergency visits).
Keep the summary concise and professional.

Patient Data:
${JSON.stringify(patient, null, 2)}

Output the summary in plain text or markdown.
        `;

        console.log(`Summarizing history for patient: ${healthId}...`);
        const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3',
            prompt: prompt,
            stream: false
        });

        res.json({ 
            summary: ollamaResponse.data.response,
            patientName: patient.name 
        });

    } catch (error) {
        console.error('Summarization Error:', error.message);
        res.status(500).json({ error: 'Failed to generate AI summary', details: error.message });
    }
}

// Route to handle prescription upload and AI analysis
app.post('/api/analyze-prescription', upload.single('prescription'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No prescription file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    let extractedText = '';

    try {
        console.log(`Processing file type: ${fileType}`);
        
        // 1. Extract Text from PDF or Image
        if (fileType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            extractedText = pdfData.text;
        } else if (fileType.startsWith('image/')) {
            const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
            extractedText = text;
        } else {
            cleanupFile(filePath);
            return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or Image.' });
        }

        console.log('Extracted Text Preview:', extractedText.substring(0, 100) + '...');
        cleanupFile(filePath); // We have the text, clean up the temp file

        if (!extractedText || extractedText.trim() === '') {
            return res.status(400).json({ error: 'Failed to extract text from the document.' });
        }

        // 2. Analyze with Llama 3 via Ollama
        const prompt = `
You are a medical AI assistant. Your task is to extract prescription data from the following text and output ONLY a valid JSON array of objects representing the medication schedule.

Input Text:
"""
${extractedText}
"""

Output Format MUST be a strict JSON Array with the structure below. Do not include markdown blocks, explanations, or any other text.
[
  {
    "medName": "Name of the medicine",
    "dosage": "e.g., 500mg",
    "schedule": "e.g., After breakfast",
    "timeString": "e.g., 8:00 AM",
    "reason": "What is it for, if mentioned (or 'Prescribed')"
  }
]
        `;

        console.log('Sending request to Llama 3 (Ollama)...');
        const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3',
            prompt: prompt,
            stream: false
        });

        const rawResponse = ollamaResponse.data.response;
        console.log('Raw Llama 3 Output:', rawResponse);

        // 3. Parse JSON from AI response
        let jsonSchedule = [];
        try {
            // Find the array pattern in the response using regex in case it wraps it in markdown
            const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse;
            jsonSchedule = JSON.parse(jsonStr);
        } catch (jsonErr) {
            console.error('Failed to parse JSON from AI response:', rawResponse);
            return res.status(500).json({ 
                error: 'AI failed to generate a valid JSON structure',
                rawResponse: rawResponse
            });
        }

        res.json({ schedule: jsonSchedule });

    } catch (error) {
        console.error('Analysis Error:', error.message);
        if(req.file) cleanupFile(filePath);
        res.status(500).json({ error: 'Internal server error during analysis', details: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
