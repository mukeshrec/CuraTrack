console.log("--- SERVER INITIALIZING ---");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Set up multer for handling file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Create prescription storage directory if it doesn't exist
const prescriptionDir = path.join(__dirname, "prescriptions");
if (!fs.existsSync(prescriptionDir)) {
  fs.mkdirSync(prescriptionDir, { recursive: true });
}

// In-memory storage for prescription metadata (in production, use a database)
const prescriptionStore = {};

// In-memory storage for medication adherence (in production, use a database)
const medicationAdherence = {};

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Mock Database of Patients
const mockPatients = {
  "HID-TN-20240847": {
    name: "Rajan Kumar",
    age: 64,
    gender: "Male",
    bloodGroup: "O+",
    conditions: ["Type 2 Diabetes", "Hypertension", "Hyperlipidemia"],
    allergies: ["Penicillin", "Aspirin"],
    medications: [
      { name: "Metformin", dosage: "500mg", frequency: "Twice daily" },
      { name: "Amlodipine", dosage: "5mg", frequency: "Once daily" },
      { name: "Atorvastatin", dosage: "10mg", frequency: "At bedtime" },
    ],
    history: [
      {
        date: "2026-03-10",
        type: "Consultation",
        doctor: "Dr. S. Mehta",
        notes: "BP controlled. HbA1c improving. Continue current meds.",
      },
      {
        date: "2026-03-05",
        type: "Lab Report",
        facility: "City Diagnostics",
        results: "HbA1c: 7.2%, Creatinine: 0.9, Cholesterol: 178 mg/dL.",
      },
      {
        date: "2026-01-08",
        type: "Emergency Visit",
        facility: "Apollo Hospital",
        notes:
          "Chest pain episode — ruled out cardiac event. Stress ECG normal.",
      },
    ],
  },
  "HID-TN-20240955": {
    name: "Anita Sharma",
    age: 45,
    gender: "Female",
    bloodGroup: "A+",
    conditions: ["Asthma"],
    allergies: ["Dust"],
    medications: [
      { name: "Salbutamol Inhaler", dosage: "100mcg", frequency: "As needed" },
    ],
    history: [
      {
        date: "2026-02-15",
        type: "Consultation",
        doctor: "Dr. Arjun Rajan",
        notes: "Mild wheezing. Continue inhaler.",
      },
    ],
  },
  "HID-TN-20241012": {
    name: "Vikram Singh",
    age: 52,
    gender: "Male",
    bloodGroup: "B-",
    conditions: ["Hypertension"],
    allergies: [],
    medications: [
      { name: "Lisinopril", dosage: "10mg", frequency: "Once daily" },
    ],
    history: [
      {
        date: "2026-01-20",
        type: "Consultation",
        doctor: "Dr. Priya Nair",
        notes: "BP slightly elevated. Increased dosage.",
      },
    ],
  },
};

// Mock Hospital Appointments
const mockAppointments = {
  "HOSP-TN-001": [ // Apollo Hospital
    { id: "APT-001", patientId: "HID-TN-20240847", patientName: "Rajan Kumar", time: "10:00 AM", reason: "Follow-up for Diabetes", status: "Pending", doctorAssigned: null },
    { id: "APT-002", patientId: "HID-TN-20240955", patientName: "Anita Sharma", time: "11:30 AM", reason: "Breathing difficulty", status: "Pending", doctorAssigned: null },
  ],
  "HOSP-TN-044": [ // Ambattur PHC
    { id: "APT-003", patientId: "HID-TN-20241012", patientName: "Vikram Singh", time: "09:15 AM", reason: "Routine BP Check", status: "Pending", doctorAssigned: null },
  ]
};

// Initial state for Doctor Queue
// Structure: { doctorId: [ { appointmentId, patientId, patientName, time, reason, status, isEmergency } ] }
const doctorQueue = {
  "DID-TN-0081": [], // Dr. Suresh Mehta
  "DID-TN-0124": [], // Dr. Priya Nair
  "DID-TN-0209": []  // Dr. Arjun Rajan
};

// Mock Doctors Directory
const mockDoctors = [
  { id: "DID-TN-0081", name: "Dr. Suresh Mehta", specialty: "Diabetology", experience: "15+ Years", status: "On-call until 8 PM", avatar: "👨‍⚕️" },
  { id: "DID-TN-0124", name: "Dr. Priya Nair", specialty: "Cardiology", experience: "12+ Years", status: "Available", avatar: "👩‍⚕️" },
  { id: "DID-TN-0209", name: "Dr. Arjun Rajan", specialty: "General Medicine", experience: "8+ Years", status: "Available", avatar: "👨‍⚕️" },
];

// Helper to clean up uploaded files
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Failed to cleanup file:", filePath, err);
  }
};

// Route to summarize patient history using AI (POST)
app.post("/api/summarize-patient", async (req, res) => {
  const { healthId } = req.body;
  await summarizePatient(healthId, res);
});

// Route to summarize patient history using AI (GET - for testing)
app.get("/api/summarize-patient/:healthId", async (req, res) => {
  const { healthId } = req.params;
  await summarizePatient(healthId, res);
});

async function summarizePatient(healthId, res) {
  if (!healthId || !mockPatients[healthId]) {
    return res.status(404).json({ error: "Patient not found" });
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
    const ollamaResponse = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "llama3",
        prompt: prompt,
        stream: false,
      },
    );

    res.json({
      summary: ollamaResponse.data.response,
      patientName: patient.name,
    });
  } catch (error) {
    console.error("Summarization Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to generate AI summary", details: error.message });
  }
}

// Route to handle prescription upload and AI analysis
app.post(
  "/api/analyze-prescription",
  upload.single("prescription"),
  async (req, res) => {
    console.log("=== PRESCRIPTION UPLOAD REQUEST ===");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    if (!req.file) {
      console.log("ERROR: No prescription file uploaded");
      return res.status(400).json({ error: "No prescription file uploaded" });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    const patientId = req.body.patientId || "HID-TN-20240847"; // Default patient if not specified
    let extractedText = "";
    let savedFilePath = null;

    console.log(`Processing file type: ${fileType} for patient: ${patientId}`);

    try {
      // Generate unique filename for permanent storage
      const fileExtension =
        fileType === "application/pdf"
          ? ".pdf"
          : fileType.includes("jpeg")
            ? ".jpg"
            : ".png";
      const uniqueFilename = `${patientId}_${Date.now()}${fileExtension}`;
      savedFilePath = path.join(prescriptionDir, uniqueFilename);

      // Move file to permanent storage
      fs.copyFileSync(filePath, savedFilePath);

      // 1. Extract Text from PDF or Image
      if (fileType === "application/pdf") {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        extractedText = pdfData.text;
      } else if (fileType.startsWith("image/")) {
        const {
          data: { text },
        } = await Tesseract.recognize(filePath, "eng");
        extractedText = text;
      } else {
        cleanupFile(filePath);
        fs.unlinkSync(savedFilePath); // Clean up saved file if unsupported
        return res.status(400).json({
          error: "Unsupported file type. Please upload a PDF or Image.",
        });
      }

      console.log(
        "Extracted Text Preview:",
        extractedText.substring(0, 100) + "...",
      );
      cleanupFile(filePath); // Clean up temp file

      if (!extractedText || extractedText.trim() === "") {
        fs.unlinkSync(savedFilePath); // Clean up saved file if no text extracted
        return res
          .status(400)
          .json({ error: "Failed to extract text from the document." });
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

      // 3. Parse JSON from AI response
      let jsonSchedule = [];
      try {
        console.log("Sending request to Llama 3 (Ollama)...");
        const ollamaResponse = await axios.post(
          "http://localhost:11434/api/generate",
          {
            model: "llama3",
            prompt: prompt,
            stream: false,
          },
        );

        const rawResponse = ollamaResponse.data.response;
        console.log("Raw Llama 3 Output:", rawResponse);

        try {
          // Find the array pattern in the response using regex in case it wraps it in markdown
          const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
          const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse;
          jsonSchedule = JSON.parse(jsonStr);
        } catch (jsonErr) {
          console.error("Failed to parse JSON from AI response:", rawResponse);
          // Fallback: create a dummy schedule if AI fails
          jsonSchedule = [
            {
              medName: "Medication from prescription",
              dosage: "As prescribed",
              schedule: "As directed",
              timeString: "As scheduled",
              reason: "Prescribed medication",
            },
          ];
        }
      } catch (aiError) {
        console.error("AI analysis failed:", aiError.message);
        // Fallback: create a dummy schedule if AI service is not available
        jsonSchedule = [
          {
            medName: "Medication from prescription",
            dosage: "As prescribed",
            schedule: "As directed",
            timeString: "As scheduled",
            reason: "Prescribed medication",
          },
        ];
      }

      // 4. Store prescription metadata
      const prescriptionId = `RX_${patientId}_${Date.now()}`;
      const prescriptionMetadata = {
        id: prescriptionId,
        patientId: patientId,
        filename: uniqueFilename,
        originalName: req.file.originalname,
        fileType: fileType,
        uploadedAt: new Date().toISOString(),
        extractedText: extractedText,
        schedule: jsonSchedule,
        filePath: savedFilePath,
      };

      // Initialize patient prescriptions array if it doesn't exist
      if (!prescriptionStore[patientId]) {
        prescriptionStore[patientId] = [];
      }
      prescriptionStore[patientId].push(prescriptionMetadata);

      console.log(
        `Prescription stored: ${prescriptionId} for patient ${patientId}`,
      );

      res.json({
        schedule: jsonSchedule,
        prescriptionId: prescriptionId,
        message: "Prescription analyzed and stored successfully",
      });
    } catch (error) {
      console.error("Analysis Error:", error.message);
      if (req.file) cleanupFile(filePath);
      if (savedFilePath && fs.existsSync(savedFilePath)) {
        fs.unlinkSync(savedFilePath); // Clean up saved file on error
      }
      res.status(500).json({
        error: "Internal server error during analysis",
        details: error.message,
      });
    }
  },
);

// Serve static prescription files
app.use("/prescriptions", express.static(prescriptionDir));

// Route to get patient's prescription list
app.get("/api/patient/:patientId/prescriptions", (req, res) => {
  const { patientId } = req.params;

  console.log(`Fetching prescriptions for patient: ${patientId}`);
  console.log("Current prescription store:", Object.keys(prescriptionStore));

  if (!prescriptionStore[patientId]) {
    console.log(`No prescriptions found for patient: ${patientId}`);
    return res.json({ prescriptions: [] });
  }

  // Return metadata without file paths for security
  const prescriptions = prescriptionStore[patientId].map((rx) => ({
    id: rx.id,
    originalName: rx.originalName,
    fileType: rx.fileType,
    uploadedAt: rx.uploadedAt,
    schedule: rx.schedule,
  }));

  console.log(
    `Found ${prescriptions.length} prescriptions for patient: ${patientId}`,
  );
  res.json({ prescriptions });
});

// Route to get prescription image file
app.get(
  "/api/patient/:patientId/prescriptions/:prescriptionId/file",
  (req, res) => {
    const { patientId, prescriptionId } = req.params;

    if (!prescriptionStore[patientId]) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const prescription = prescriptionStore[patientId].find(
      (rx) => rx.id === prescriptionId,
    );
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    if (!fs.existsSync(prescription.filePath)) {
      return res.status(404).json({ error: "Prescription file not found" });
    }

    res.sendFile(prescription.filePath);
  },
);

// Route to get prescription details
app.get("/api/patient/:patientId/prescriptions/:prescriptionId", (req, res) => {
  const { patientId, prescriptionId } = req.params;

  if (!prescriptionStore[patientId]) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const prescription = prescriptionStore[patientId].find(
    (rx) => rx.id === prescriptionId,
  );
  if (!prescription) {
    return res.status(404).json({ error: "Prescription not found" });
  }

  // Return full metadata except file path
  const { filePath, ...prescriptionData } = prescription;
  res.json(prescriptionData);
});

// Route to update medication adherence
app.post("/api/patient/:patientId/medication-adherence", (req, res) => {
  const { patientId } = req.params;
  const { medicationId, taken, timestamp } = req.body;

  console.log(
    `Updating medication adherence for patient: ${patientId}, medication: ${medicationId}, taken: ${taken}`,
  );

  // Initialize patient adherence if it doesn't exist
  if (!medicationAdherence[patientId]) {
    medicationAdherence[patientId] = {};
  }

  // Update adherence record
  medicationAdherence[patientId][medicationId] = {
    taken,
    timestamp: timestamp || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  console.log(
    `Medication adherence updated:`,
    medicationAdherence[patientId][medicationId],
  );

  res.json({
    success: true,
    message: "Medication adherence updated successfully",
    adherence: medicationAdherence[patientId][medicationId],
  });
});

// Route to get medication adherence for a patient
app.get("/api/patient/:patientId/medication-adherence", (req, res) => {
  const { patientId } = req.params;

  console.log(`Fetching medication adherence for patient: ${patientId}`);

  if (!medicationAdherence[patientId]) {
    return res.json({ adherence: {} });
  }

  res.json({ adherence: medicationAdherence[patientId] });
});

// Route to get medication adherence for a specific medication
app.get(
  "/api/patient/:patientId/medication-adherence/:medicationId",
  (req, res) => {
    const { patientId, medicationId } = req.params;

    if (
      !medicationAdherence[patientId] ||
      !medicationAdherence[patientId][medicationId]
    ) {
      return res.json({ adherence: null });
    }

    res.json({ adherence: medicationAdherence[patientId][medicationId] });
  },
);

// --- New Routes for Hospital Employee and Doctor Queue ---

// Get Appointments for a specific hospital
app.get("/api/hospital/:hospitalId/appointments", (req, res) => {
  const { hospitalId } = req.params;
  const appointments = mockAppointments[hospitalId] || [];
  res.json({ appointments });
});

// Get Detailed Doctor List with active queue metadata
app.get("/api/doctors", (req, res) => {
  const doctorsWithQueueLength = mockDoctors.map((doc) => ({
    ...doc,
    activeQueueLength: doctorQueue[doc.id] ? doctorQueue[doc.id].length : 0
  }));
  res.json({ doctors: doctorsWithQueueLength });
});

// Assign a patient/appointment to a doctor
app.post("/api/appointments/assign", (req, res) => {
  const { hospitalId, appointmentId, doctorId, isEmergency } = req.body;

  if (!mockAppointments[hospitalId]) {
    return res.status(404).json({ error: "Hospital not found" });
  }

  const appointmentIndex = mockAppointments[hospitalId].findIndex(a => a.id === appointmentId);
  
  if (appointmentIndex === -1) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  // Update appointment status and assigned doctor
  mockAppointments[hospitalId][appointmentIndex].status = "Assigned";
  mockAppointments[hospitalId][appointmentIndex].doctorAssigned = doctorId;
  mockAppointments[hospitalId][appointmentIndex].isEmergency = isEmergency || false;

  const assignedAppointment = mockAppointments[hospitalId][appointmentIndex];

  // Add to doctor's queue if it doesn't already exist
  if (!doctorQueue[doctorId]) {
      doctorQueue[doctorId] = [];
  }
  
  // Check if patient is already in the queue to avoid duplicates
  const alreadyInQueue = doctorQueue[doctorId].some(item => item.appointmentId === appointmentId);
  if(!alreadyInQueue) {
      if (isEmergency) {
        // Unshift emergency patients to the very top of the queue
         doctorQueue[doctorId].unshift({
           ...assignedAppointment,
           status: "In Queue"
         });
      } else {
         doctorQueue[doctorId].push({
           ...assignedAppointment,
           status: "In Queue"
         });
      }
  }

  res.json({ success: true, message: "Patient assigned to doctor successfully", appointment: assignedAppointment });
});

// Get Doctor's Queue
app.get("/api/doctor/:doctorId/queue", (req, res) => {
  const { doctorId } = req.params;
  const queue = doctorQueue[doctorId] || [];
  res.json({ queue });
});


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
