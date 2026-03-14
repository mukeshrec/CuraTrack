import { useState, useEffect } from "react";
import "./index.css";
import logoImg from "./assets/image.png";

function App() {
  const [activeView, setActiveView] = useState("patient");
  const [recording, setRecording] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // New states for AI Prescription
  const [uploadLoading, setUploadLoading] = useState(false);
  const [pendingSchedule, setPendingSchedule] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [meds, setMeds] = useState([
    {
      id: 1,
      name: "Metformin 500mg",
      detail: "After breakfast · Type 2 Diabetes",
      time: "8:00 AM",
      status: "taken",
      icon: "green",
      taken: true,
    },
    {
      id: 2,
      name: "Amlodipine 5mg",
      detail: "Before lunch · Hypertension",
      time: "1:00 PM",
      status: "upcoming",
      icon: "yellow",
      taken: false,
    },
    {
      id: 3,
      name: "Atorvastatin 10mg",
      detail: "After dinner · Cholesterol",
      time: "9:00 PM",
      status: "evening",
      icon: "blue",
      taken: false,
    },
  ]);

  // New states for AI Patient Summary
  const [fetchHealthId, setFetchHealthId] = useState("HID-TN-20240847");
  const [patientSummary, setPatientSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // New states for Caregiver functionality
  const [selectedPatientForCaregiver, setSelectedPatientForCaregiver] =
    useState(null);
  const [patientMedicationAdherence, setPatientMedicationAdherence] = useState(
    {},
  );
  const [adherenceLoading, setAdherenceLoading] = useState(false);

  // New states for Insurance Profile
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insuranceId, setInsuranceId] = useState("");
  const [insuranceDetails, setInsuranceDetails] = useState(null);
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);

  // New states for Smart Claims & Schemes
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [showSchemesModal, setShowSchemesModal] = useState(false);

  // New states for Insurance Claims
  const [claims, setClaims] = useState([]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [selectedSchemeForClaim, setSelectedSchemeForClaim] = useState(null);
  const [claimAmount, setClaimAmount] = useState("");
  const [claimReason, setClaimReason] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // New states for Employee Portal
  const [selectedHospital, setSelectedHospital] = useState("HOSP-TN-001");
  const [hospitalAppointments, setHospitalAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  // Available doctors list for employee portal assignment (fetched from API)
  const [doctorsList, setDoctorsList] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  // Track emergency tags per appointment manually
  const [appointmentForms, setAppointmentForms] = useState({});

  // New states for Doctor Portal Queue
  const [patientQueue, setPatientQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const loggedInDoctorId = "DID-TN-0081"; // Mock logged-in doctor

  useEffect(() => {
    // Initial notifications mock
    const t1 = setTimeout(
      () =>
        addNotification(
          "⚠️",
          "Medication Due",
          "Amlodipine 5mg due for Rajan Kumar at 1:00 PM",
        ),
      2000,
    );
    const t2 = setTimeout(
      () =>
        addNotification(
          "🤖",
          "AI Alert",
          "BP pattern suggests elevated risk — schedule follow-up",
        ),
      5000,
    );

    // Alarm interval checker
    const alarmInterval = setInterval(() => {
      const now = new Date();
      let currentHour = now.getHours();
      let currentMinute = now.getMinutes();
      const ampm = currentHour >= 12 ? "PM" : "AM";
      currentHour = currentHour % 12 || 12;
      const timeStr = `${currentHour}:${currentMinute.toString().padStart(2, "0")} ${ampm}`;

      meds.forEach((med) => {
        if (
          med.time === timeStr &&
          med.status !== "taken" &&
          activeView === "patient"
        ) {
          addNotification(
            "⏰",
            "Time to take Meds!",
            `${med.name} is due right now.`,
          );
        }
      });
    }, 60000); // Check every minute

    // Fetch prescriptions on component mount
    fetchPrescriptions();
    fetchClaims();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(alarmInterval);
    };
  }, [meds, activeView]);

  const addNotification = (icon, title, body) => {
    const newNotif = { id: Date.now() + Math.random(), icon, title, body };
    setNotifications((prev) => [...prev, newNotif]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
    }, 4000);
  };

  const triggerSOS = () => {
    setShowSOS(false);
    addNotification(
      "🚑",
      "SOS Activated!",
      "Ambulance dispatched. Hospital notified with medical data.",
    );
    setTimeout(
      () =>
        addNotification(
          "📱",
          "Family Alerted",
          "Emergency SMS sent to all caregivers.",
        ),
      1500,
    );
  };

  const toggleVoice = () => {
    setRecording(!recording);
    if (!recording) {
      addNotification("🎙️", "Recording...", "Speak your health note clearly");
    } else {
      addNotification("✅", "Note Saved", "Voice log added to health record");
    }
  };

  const handlePrescriptionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("Starting prescription upload:", file.name, file.type);
    setUploadLoading(true);
    addNotification(
      "⏳",
      "Analyzing...",
      "Llama 3 is analyzing the prescription",
    );

    const formData = new FormData();
    formData.append("prescription", file);
    formData.append("patientId", "HID-TN-20240847"); // Include patient ID

    console.log("FormData created, sending request...");

    try {
      const res = await fetch(
        "http://localhost:3001/api/analyze-prescription",
        {
          method: "POST",
          body: formData,
        },
      );

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (data.schedule) {
        addNotification(
          "✅",
          "Analysis Complete",
          "Prescription has been converted into a schedule and stored in Patient Portal.",
        );
        setPendingSchedule(data.schedule);
        // Refresh prescriptions after successful upload
        fetchPrescriptions();
      } else {
        addNotification(
          "❌",
          "Error",
          data.error || "Failed to parse prescription",
        );
      }
    } catch (err) {
      console.error("Upload error:", err);
      addNotification("❌", "Upload Failed", "Could not reach backend server");
    } finally {
      setUploadLoading(false);
    }
  };

  const acceptSchedule = () => {
    if (!pendingSchedule) return;

    const newMeds = pendingSchedule.map((item, idx) => ({
      id: Date.now() + idx,
      name: item.medName,
      detail: item.reason || item.schedule,
      time: item.timeString,
      status: "upcoming",
      icon: "blue",
      taken: false,
    }));

    setMeds((prev) => [...prev, ...newMeds]);
    setPendingSchedule(null);
    addNotification(
      "📅",
      "Schedule Active",
      "Meds automatically added to your timer",
    );
    // Refresh prescriptions after accepting schedule
    fetchPrescriptions();
  };

  const toggleMedicationTaken = async (medId) => {
    const med = meds.find((m) => m.id === medId);
    if (!med) return;

    const newTaken = !med.taken;
    const timestamp = new Date().toISOString();

    try {
      // Call backend to update adherence
      const response = await fetch(
        `http://localhost:3001/api/patient/HID-TN-20240847/medication-adherence`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medicationId: medId.toString(),
            taken: newTaken,
            timestamp: timestamp,
          }),
        },
      );

      if (response.ok) {
        // Update local state
        setMeds((prevMeds) =>
          prevMeds.map((m) =>
            m.id === medId
              ? {
                ...m,
                taken: newTaken,
                status: newTaken ? "taken" : "upcoming",
                icon: newTaken
                  ? "green"
                  : m.status === "evening"
                    ? "blue"
                    : "yellow",
              }
              : m,
          ),
        );

        // Show notification
        addNotification(
          newTaken ? "" : "",
          newTaken ? "Medicine Taken" : "Medicine Untaken",
          `${med.name} marked as ${newTaken ? "taken" : "not taken"}`,
        );
      } else {
        throw new Error("Failed to update adherence");
      }
    } catch (err) {
      console.error("Failed to update medication adherence:", err);
      addNotification("", "Error", "Failed to update medication status");
    }
  };

  const fetchPrescriptions = async () => {
    setPrescriptionsLoading(true);
    try {
      const res = await fetch(
        "http://localhost:3001/api/patient/HID-TN-20240847/prescriptions",
      );
      const data = await res.json();
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
      addNotification("❌", "Error", "Failed to load prescriptions");
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const viewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
  };

  const closePrescriptionViewer = () => {
    setSelectedPrescription(null);
  };

  const handleFetchSummary = async () => {
    if (!fetchHealthId) return;

    setSummaryLoading(true);
    addNotification(
      "⏳",
      "Summarizing...",
      "Llama 3 is synthesizing patient history",
    );

    try {
      const res = await fetch("http://localhost:3001/api/summarize-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ healthId: fetchHealthId }),
      });
      const data = await res.json();

      if (data.summary) {
        setPatientSummary(data.summary);
        addNotification(
          "✅",
          "Summary Ready",
          `Health record for ${data.patientName} has been summarized.`,
        );
      } else {
        addNotification("❌", "Error", data.error || "Failed to fetch summary");
      }
    } catch (err) {
      addNotification("❌", "Fetch Failed", "Could not reach backend server");
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchPatientMedicationAdherence = async (
    patientId = "HID-TN-20240847",
  ) => {
    setAdherenceLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3001/api/patient/${patientId}/medication-adherence`,
      );
      const data = await res.json();
      setPatientMedicationAdherence(data.adherence || {});
    } catch (err) {
      console.error("Failed to fetch medication adherence:", err);
      addNotification("❌", "Error", "Failed to load medication adherence");
    } finally {
      setAdherenceLoading(false);
    }
  };

  const handlePatientSelectForCaregiver = (patient) => {
    setSelectedPatientForCaregiver(patient);
    fetchPatientMedicationAdherence(patient.id);
  };

  const closeCaregiverPatientDetails = () => {
    setSelectedPatientForCaregiver(null);
    setPatientMedicationAdherence({});
  };

  const handleFetchInsurance = async () => {
    if (!insuranceProvider || !insuranceId) {
      addNotification("⚠️", "Required Fields", "Please select provider and enter ID");
      return;
    }
    setInsuranceLoading(true);
    addNotification("⏳", "Verifying...", "Connecting to Insurance Network API");
    try {
      const res = await fetch("http://localhost:3001/api/patient/HID-TN-20240847/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: insuranceProvider, insuranceId }),
      });
      const data = await res.json();
      if (data.success && data.insurance) {
        setInsuranceDetails(data.insurance);
        addNotification("✅", "Success", `Insurance profile linked successfully.`);
      } else {
        addNotification("❌", "Failed", data.error || "Could not verify insurance");
      }
    } catch (err) {
      addNotification("❌", "Error", "Could not reach the server");
    } finally {
      setInsuranceLoading(false);
    }
  };

  const handleCheckSchemes = async () => {
    if (!insuranceDetails) return;
    setSchemesLoading(true);
    addNotification("🤖", "AI Analysis", "Llama 3 is analyzing eligible schemes...");
    try {
      const res = await fetch("http://localhost:3001/api/patient/HID-TN-20240847/insurance-schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: insuranceDetails.provider }),
      });
      const data = await res.json();
      if (data.success) {
        setEligibleSchemes(data);
        setShowSchemesModal(true);
      } else {
        addNotification("❌", "Failed", data.error || "Could not analyze schemes");
      }
    } catch (err) {
      addNotification("❌", "Error", "Could not reach AI engine");
    } finally {
      setSchemesLoading(false);
    }
  };

  const fetchClaims = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/patient/HID-TN-20240847/claims");
      const data = await res.json();
      if (data.success) setClaims(data.claims);
    } catch (err) {
      console.error("Failed to fetch claims:", err);
    }
  };

  const handleInitiateClaim = (scheme) => {
    setSelectedSchemeForClaim(scheme);
    setShowSchemesModal(false);
    setShowClaimForm(true);
    setClaimReason(scheme.recommendationReason ? `As per AI recommendation: ${scheme.recommendationReason}` : "");
  };

  const handleSubmitClaim = async () => {
    if (!claimAmount || !claimReason) {
      addNotification("⚠️", "Required Fields", "Please enter amount and reason");
      return;
    }
    setSubmittingClaim(true);
    addNotification("⏳", "Submitting...", "Filing your insurance claim request");
    try {
      const res = await fetch("http://localhost:3001/api/patient/HID-TN-20240847/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeName: selectedSchemeForClaim.schemeName || selectedSchemeForClaim.name,
          amount: claimAmount, reason: claimReason, type: "Cashless"
        }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("✅", "Claim Submitted", "Your claim is now under review");
        setShowClaimForm(false); setClaimAmount(""); setClaimReason("");
        await fetchClaims();
      } else {
        addNotification("❌", "Failed", data.error || "Could not submit claim");
      }
    } catch (err) {
      addNotification("❌", "Error", "Failed to reach insurance server");
    } finally {
      setSubmittingClaim(false);
    }
  };

  const fetchHospitalAppointments = async (hospitalId) => {
    if (!hospitalId) return;
    setAppointmentsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/hospital/${hospitalId}/appointments`);
      const data = await res.json();
      setHospitalAppointments(data.appointments || []);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      addNotification("❌", "Error", "Failed to load hospital appointments");
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    setDoctorsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/doctors`);
      const data = await res.json();
      setDoctorsList(data.doctors || []);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
      // Fallback
    } finally {
      setDoctorsLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === "employee") {
      fetchHospitalAppointments(selectedHospital);
      fetchDoctors();
    } else if (activeView === "doctor") {
      fetchDoctorQueue();
    } else if (activeView === "patient") {
      fetchClaims();
    }
  }, [selectedHospital, activeView]);

  const fetchDoctorQueue = async () => {
    setQueueLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/doctor/${loggedInDoctorId}/queue`);
      const data = await res.json();
      setPatientQueue(data.queue || []);
    } catch (err) {
      console.error("Failed to fetch doctor queue:", err);
      addNotification("❌", "Error", "Failed to load patient queue");
    } finally {
      setQueueLoading(false);
    }
  };

  const handleAssignDoctor = async (appointmentId, doctorId, isEmergency = false) => {
    if (!doctorId) {
      addNotification("⚠️", "No Doctor Selected", "Please select a doctor to assign.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/api/appointments/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: selectedHospital,
          appointmentId,
          doctorId,
          isEmergency
        })
      });
      const data = await res.json();
      if (data.success) {
        addNotification("✅", "Assigned", "Patient assigned to doctor successfully.");
        fetchHospitalAppointments(selectedHospital); // Refresh list
      } else {
        addNotification("❌", "Assigned Failed", data.error || "Failed to assign doctor.");
      }
    } catch (err) {
      console.error("Assign doctor failed:", err);
      addNotification("❌", "Assigned Failed", "Failed to reach backend.");
    }
  };

  return (
    <>
      <div className="notif-stack" id="notifStack">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="notif"
            onClick={() =>
              setNotifications((prev) => prev.filter((x) => x.id !== n.id))
            }
          >
            <div className="notif-icon">{n.icon}</div>
            <div>
              <div className="notif-title">{n.title}</div>
              <div className="notif-body">{n.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`modal-overlay ${showSOS ? "active" : ""}`}
        onClick={(e) => {
          if (e.target.className.includes("modal-overlay")) setShowSOS(false);
        }}
      >
        <div className="sos-modal">
          <div className="sos-modal-icon">🆘</div>
          <div className="sos-modal-title">Emergency SOS</div>
          <div className="sos-modal-text">
            Medical data will be sent to the nearest hospital and ambulance
            dispatched. All emergency contacts will be notified instantly.
          </div>
          <div className="sos-info-grid">
            <div className="sos-info-item">
              <div className="sos-info-label">Patient</div>
              <div className="sos-info-value">Rajan Kumar</div>
            </div>
            <div className="sos-info-item">
              <div className="sos-info-label">Health ID</div>
              <div className="sos-info-value" style={{ color: "var(--blue)" }}>
                HID-TN-20240847
              </div>
            </div>
            <div className="sos-info-item">
              <div className="sos-info-label">Nearest Hospital</div>
              <div className="sos-info-value">Ambattur PHC (2.1 km)</div>
            </div>

            <div className="sos-info-item">
              <div className="sos-info-label">Ambulance ETA</div>
              <div className="sos-info-value" style={{ color: "var(--teal)" }}>
                ~6 minutes
              </div>
            </div>
          </div>
          <div
            style={{
              background: "var(--red-light)",
              border: "1px solid var(--red-mid)",
              borderRadius: "10px",
              padding: "12px",
              fontSize: "12.5px",
              color: "var(--text2)",
              marginBottom: "16px",
              textAlign: "left",
            }}
          >
            ⚠️{" "}
            <strong style={{ color: "var(--red)" }}>
              Allergy Alert being sent:
            </strong>{" "}
            Penicillin, Aspirin — Do NOT administer
          </div>
          <button className="btn-sos-confirm" onClick={triggerSOS}>
            🚑 Confirm — Send SOS Now
          </button>
          <button className="btn-cancel" onClick={() => setShowSOS(false)}>
            Cancel
          </button>
        </div>
      </div>

      <nav>
        <div className="nav-logo">
          <img
            src={logoImg}
            alt="CuraTrack Base Logo"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              objectFit: "cover",
            }}
          />
          CuraTrack
        </div>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeView === "patient" ? "active" : ""}`}
            onClick={() => setActiveView("patient")}
          >
            Patient View
          </button>
          <button
            className={`nav-tab ${activeView === "doctor" ? "active" : ""}`}
            onClick={() => setActiveView("doctor")}
          >
            Doctor Portal
          </button>
          <button
            className={`nav-tab ${activeView === "caregiver" ? "active" : ""}`}
            onClick={() => setActiveView("caregiver")}
          >
            Caregiver Dashboard
          </button>
          <button
            className={`nav-tab ${activeView === "employee" ? "active" : ""}`}
            onClick={() => setActiveView("employee")}
          >
            Hospital Employees
          </button>
        </div>
        <div className="nav-right" style={{ position: "relative" }}>
          <span className="offline-badge">⚡ Offline Ready</span>
          <button className="sos-btn" onClick={() => setShowSOS(true)}>
            🆘 SOS
          </button>

          {(() => {
            const profiles = {
              "patient": { initials: "RK", name: "Rajan Kumar", role: "Patient", id: "HID-TN-20240847", extra1: "Age: 64 · Blood: O+", extra2: "Conditions: Diabetes, Hypertension" },
              "doctor": { initials: "SM", name: "Dr. Suresh Mehta", role: "Diabetologist", id: "DID-TN-0081", extra1: "Experience: 15+ Years", extra2: "Status: On-call until 8 PM" },
              "caregiver": { initials: "AP", name: "Anita Patel", role: "Caregiver", id: "CID-TN-9921", extra1: "Relation: Daughter", extra2: "Primary Caretaker for Rajan K." },
              "employee": { initials: "HE", name: "Staff Admin", role: "Hospital Employee", id: "EID-HT-1021", extra1: "Facility: Apollo Hospital Chennai", extra2: "Clearance: Level 2 Admin" }
            };
            const currentProfile = profiles[activeView] || profiles["patient"];

            return (
              <>
                <div
                  className="user-avatar"
                  onClick={() => setShowProfile(!showProfile)}
                  style={{ cursor: "pointer", transition: "all 0.2s", transform: showProfile ? "scale(0.95)" : "scale(1)", boxShadow: showProfile ? "0 0 0 3px rgba(37,99,235,0.3)" : "none" }}
                >
                  {currentProfile.initials}
                </div>

                {showProfile && (
                  <div className="profile-modal">
                    <div className="profile-header">
                      <div className="profile-avatar-large">{currentProfile.initials}</div>
                      <div>
                        <div className="profile-name">{currentProfile.name}</div>
                        <div className="profile-role">{currentProfile.role}</div>
                      </div>
                    </div>
                    <div className="profile-details">
                      <div className="profile-detail-item">
                        <span className="profile-detail-label">System ID</span>
                        <span className="profile-detail-value" style={{ fontFamily: "monospace", color: "var(--blue)", fontWeight: "700" }}>{currentProfile.id}</span>
                      </div>
                      <div className="profile-detail-item">
                        <span className="profile-detail-label">Details</span>
                        <span className="profile-detail-value">{currentProfile.extra1}</span>
                      </div>
                      <div className="profile-detail-item">
                        <span className="profile-detail-label">Status / Notes</span>
                        <span className="profile-detail-value">{currentProfile.extra2}</span>
                      </div>
                    </div>
                    <div className="profile-actions">
                      <button className="btn btn-secondary" style={{ flex: 1, padding: "8px", fontSize: "13px" }} onClick={() => setShowProfile(false)}>Close Menu</button>
                      <button className="btn btn-primary" style={{ flex: 1, padding: "8px", fontSize: "13px" }} onClick={() => { setShowProfile(false); addNotification("🔒", "Logged Out", "Secure session ended."); }}>Log Out</button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </nav>

      <div
        id="view-patient"
        className={`app ${activeView === "patient" ? "active" : ""}`}
      >
        <div className="patient-sidebar">
          <div className="patient-id-card">
            <div className="patient-avatar">👤</div>
            <div className="patient-name">Rajan Kumar</div>
            <div className="patient-meta">64 yrs · Male · Blood: O+</div>
            <div className="health-id-badge">🪪 HID-TN-20240847</div>
            <div style={{ textAlign: "center", marginBottom: "14px" }}>
              <div className="qr-container" id="qrCode">
                {[
                  1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1,
                  0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1,
                  1, 1, 1, 1, 1, 1, 1,
                ].map((v, i) => (
                  <div key={i} className={"qr-cell" + (v ? "" : " w")}></div>
                ))}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.6)",
                  marginTop: "6px",
                }}
              >
                Emergency QR Scan
              </div>
            </div>
            <div className="vital-row">
              <div className="vital-item">
                <div className="vital-value">
                  124<span style={{ fontSize: "13px" }}>/82</span>
                </div>
                <div className="vital-label">BP mmHg</div>
              </div>
              <div className="vital-item">
                <div className="vital-value">7.2</div>
                <div className="vital-label">HbA1c %</div>
              </div>
              <div className="vital-item">
                <div className="vital-value">78</div>
                <div className="vital-label">BPM</div>
              </div>
              <div className="vital-item">
                <div className="vital-value">98%</div>
                <div className="vital-label">SpO2</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <div className="card-title-icon">⚠️</div> Allergies
            </div>
            <div className="allergy-tags">
              <span className="allergy-tag">Penicillin</span>
              <span className="allergy-tag">Aspirin</span>
              <span className="allergy-tag">Shellfish</span>
            </div>
          </div>
          <div className="card">
            <div className="card-title">
              <div className="card-title-icon">🤖</div> AI Health Summary
            </div>
            <div className="ai-summary-box">
              <div className="ai-label">✦ AI Analysis</div>
              <div className="ai-text">
                Patient shows{" "}
                <strong style={{ color: "var(--amber)" }}>
                  moderate adherence
                </strong>{" "}
                (78%). BP slightly elevated this week. HbA1c improving.
                Recommend follow-up with Dr. Mehta within 7 days.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <div className="card-title-icon">🛡️</div> Insurance Profile
              </span>
              {insuranceDetails && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--teal)" }}></div>
                  <span style={{ fontSize: "12px", color: "var(--teal)", fontWeight: "600" }}>Verified</span>
                </div>
              )}
            </div>

            {!insuranceDetails ? (
              <div className="prescription-form" style={{ marginTop: "12px" }}>
                <div className="form-row">
                  <div>
                    <div className="form-label">Provider Network</div>
                    <select 
                      className="form-input" 
                      value={insuranceProvider}
                      onChange={(e) => setInsuranceProvider(e.target.value)}
                    >
                      <option value="">Select Provider</option>
                      <option value="Star Health">Star Health</option>
                      <option value="HDFC ERGO">HDFC ERGO</option>
                      <option value="ICICI Lombard">ICICI Lombard</option>
                      <option value="Apollo Munich">Apollo Munich</option>
                      <option value="Max Bupa">Max Bupa</option>
                      <option value="Sandbox Health">Sandbox API Network</option>
                    </select>
                  </div>
                  <div>
                    <div className="form-label">Insurance / Reference ID</div>
                    <input 
                      className="form-input" 
                      placeholder="e.g. POL-12345678" 
                      value={insuranceId}
                      onChange={(e) => setInsuranceId(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleFetchInsurance}
                  disabled={insuranceLoading || !insuranceProvider || !insuranceId}
                  style={{ marginTop: "8px", width: "100%" }}
                >
                  {insuranceLoading ? "⏳ Verifying with HAPI FHIR..." : "🔍 Link Profile"}
                </button>
              </div>
            ) : (
              <div style={{ 
                background: "var(--surface2)", 
                border: "1px solid var(--border2)", 
                borderRadius: "12px", 
                padding: "16px",
                marginTop: "12px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ 
                      width: "40px", height: "40px", borderRadius: "10px", 
                      background: "white", display: "flex", alignItems: "center", 
                      justifyContent: "center", fontSize: "20px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                    }}>🏥</div>
                    <div>
                      <div style={{ fontWeight: "600", color: "var(--text)", fontSize: "15px" }}>{insuranceDetails.provider}</div>
                      <div style={{ fontSize: "12.5px", color: "var(--text2)", marginTop: "2px" }}>ID: {insuranceDetails.insuranceId}</div>
                    </div>
                  </div>
                  <span className="status-badge" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--teal)", padding: "4px 10px" }}>
                    {insuranceDetails.status === "active" ? "✓ Active" : (insuranceDetails.status || "Active")}
                  </span>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Valid Till</div>
                    <div style={{ fontWeight: "600", color: "var(--text)", fontSize: "14px" }}>{insuranceDetails.validTill}</div>
                  </div>
                  <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Network Type</div>
                    <div style={{ fontWeight: "600", color: "var(--text)", fontSize: "14px" }}>{insuranceDetails.network}</div>
                  </div>
                  <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", gridColumn: "span 2" }}>
                    <div style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Coverage Type</div>
                    <div style={{ fontWeight: "600", color: "var(--text)", fontSize: "14px" }}>{insuranceDetails.type}</div>
                  </div>
                </div>

                <hr style={{ margin: "16px 0", border: "none", borderTop: "1px dashed var(--border)" }} />
                
                <button 
                  className="btn btn-primary" 
                  onClick={handleCheckSchemes}
                  disabled={schemesLoading}
                  style={{ width: "100%", fontSize: "14px", padding: "12px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, var(--blue), var(--teal))", border: "none" }}
                >
                  {schemesLoading ? "🤖 Analyzing Eligibility..." : "🔍 Check Eligible Schemes for Claim"}
                </button>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                  <button className="btn btn-secondary" onClick={() => setInsuranceDetails(null)} style={{ width: "100%", fontSize: "13px" }}>Unlink</button>
                  <button className="btn btn-secondary" onClick={() => setShowInsuranceModal(true)} style={{ width: "100%", fontSize: "13px" }}>FHIR Data</button>
                </div>
              </div>
            )}

            {insuranceDetails && claims.length > 0 && (
              <div className="card" style={{ marginTop: "16px", padding: "16px", border: "1px solid var(--border)", background: "linear-gradient(to bottom, #fff, var(--surface1))" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text)" }}>📜 Active Claims Tracker</div>
                  <div style={{ fontSize: "11px", color: "var(--teal)", fontWeight: "600", padding: "2px 6px", background: "var(--teal-light)", borderRadius: "4px" }}>{claims.filter(c => c.status === "Pending").length} PENDING</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {claims.slice(0, 3).map((claim, idx) => (
                    <div key={idx} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "white", fontSize: "12px", position: "relative" }}>
                      <div style={{ position: "absolute", right: "10px", top: "10px" }}>
                        <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: "800", color: claim.status === "Approved" ? "var(--teal)" : "var(--amber)", background: claim.status === "Approved" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)" }}>{claim.status.toUpperCase()}</span>
                      </div>
                      <div style={{ fontWeight: "700", width: "80%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "4px" }}>{claim.schemeName}</div>
                      <div style={{ color: "var(--text2)", display: "flex", justifyContent: "space-between" }}><span>{claim.date}</span><span style={{ fontWeight: "700", color: "var(--blue)" }}>{claim.amount}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {pendingSchedule && (
            <div
              className="card"
              style={{
                borderColor: "var(--blue)",
                background: "var(--blue-light)",
              }}
            >
              <div className="card-title" style={{ color: "var(--blue)" }}>
                <div
                  className="card-title-icon"
                  style={{ background: "var(--blue)", color: "white" }}
                >
                  🤖
                </div>{" "}
                New AI Schedule Ready
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text2)",
                  marginBottom: 16,
                }}
              >
                Dr. Mehta uploaded a prescription which was processed into the
                following schedule:
              </div>
              <div className="med-list" style={{ marginBottom: 16 }}>
                {pendingSchedule.map((item, idx) => (
                  <div
                    key={idx}
                    className="med-item"
                    style={{ background: "white" }}
                  >
                    <div className="med-icon blue">💊</div>
                    <div className="med-info">
                      <div className="med-name">{item.medName}</div>
                      <div className="med-detail">
                        {item.dosage} · {item.reason || item.schedule}
                      </div>
                    </div>
                    <div className="med-time">{item.timeString}</div>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={acceptSchedule}>
                ✓ Accept & Schedule Alarms
              </button>
            </div>
          )}

          <div className="card">
            <div
              className="card-title"
              style={{ justifyContent: "space-between" }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "7px" }}
              >
                <div className="card-title-icon">💊</div> Today's Medication
                Schedule
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--teal)",
                  }}
                ></div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text2)",
                    fontWeight: "600",
                  }}
                >
                  78% Adherence Today
                </span>
              </div>
            </div>

            <div className="med-day-grid">
              <div className="med-day">
                <div className="med-day-name">Mon</div>
                <div className="med-day-date">10</div>
                <div className="med-day-dots">
                  <div className="dot taken"></div>
                  <div className="dot taken"></div>
                  <div className="dot taken"></div>
                </div>
              </div>
              <div className="med-day">
                <div className="med-day-name">Tue</div>
                <div className="med-day-date">11</div>
                <div className="med-day-dots">
                  <div className="dot taken"></div>
                  <div className="dot missed"></div>
                  <div className="dot taken"></div>
                </div>
              </div>
              <div className="med-day">
                <div className="med-day-name">Wed</div>
                <div className="med-day-date">12</div>
                <div className="med-day-dots">
                  <div className="dot taken"></div>
                  <div className="dot taken"></div>
                  <div className="dot missed"></div>
                </div>
              </div>
              <div className="med-day today">
                <div className="med-day-name">Thu</div>
                <div className="med-day-date">13</div>
                <div className="med-day-dots">
                  <div className="dot taken"></div>
                  <div className="dot pending"></div>
                  <div className="dot pending"></div>
                </div>
              </div>
              <div className="med-day">
                <div className="med-day-name">Fri</div>
                <div className="med-day-date">14</div>
                <div className="med-day-dots">
                  <div className="dot pending"></div>
                  <div className="dot pending"></div>
                  <div className="dot pending"></div>
                </div>
              </div>
              <div className="med-day">
                <div className="med-day-name">Sat</div>
                <div className="med-day-date">15</div>
                <div className="med-day-dots">
                  <div className="dot pending"></div>
                  <div className="dot pending"></div>
                </div>
              </div>
              <div className="med-day">
                <div className="med-day-name">Sun</div>
                <div className="med-day-date">16</div>
                <div className="med-day-dots">
                  <div className="dot pending"></div>
                </div>
              </div>
            </div>

            <div className="med-list">
              {meds.map((med) => (
                <div key={med.id} className={`med-item ${med.status}`}>
                  <div className={`med-icon ${med.icon}`}>💊</div>
                  <div className="med-info">
                    <div className="med-name">{med.name}</div>
                    <div className="med-detail">{med.detail}</div>
                  </div>
                  <div className="med-time">{med.time}</div>
                  <div className="med-checkbox">
                    <input
                      type="checkbox"
                      id={`med-${med.id}`}
                      checked={med.taken}
                      onChange={() => toggleMedicationTaken(med.id)}
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer",
                        accentColor: med.taken ? "var(--green)" : "var(--blue)",
                      }}
                    />
                    <label
                      htmlFor={`med-${med.id}`}
                      style={{
                        marginLeft: "8px",
                        fontSize: "12px",
                        cursor: "pointer",
                        color: med.taken ? "var(--green)" : "var(--text2)",
                        fontWeight: med.taken ? "600" : "400",
                      }}
                    >
                      {med.taken ? "Taken" : "Pending"}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <div className="card-title-icon">📋</div> Health Record Timeline
            </div>
            <div className="records-timeline scrollable">
              <div className="record-item">
                <div className="record-timeline-col">
                  <div className="record-dot"></div>
                  <div className="record-line"></div>
                </div>
                <div className="record-content">
                  <div className="record-header">
                    <div className="record-type">🩺 Consultation</div>
                    <div className="record-date">Mar 10, 2026</div>
                  </div>
                  <div className="record-doctor">
                    Dr. S. Mehta · Diabetology
                  </div>
                  <div className="record-desc">
                    BP controlled. HbA1c improving. Continue current meds.
                    Follow up in 3 weeks.
                  </div>
                </div>
              </div>
              <div className="record-item">
                <div className="record-timeline-col">
                  <div
                    className="record-dot"
                    style={{
                      background: "var(--teal)",
                      boxShadow: "0 0 0 2px var(--teal)",
                    }}
                  ></div>
                  <div className="record-line"></div>
                </div>
                <div className="record-content">
                  <div className="record-header">
                    <div className="record-type">🧪 Lab Report</div>
                    <div className="record-date">Mar 5, 2026</div>
                  </div>
                  <div className="record-doctor">City Diagnostics Lab</div>
                  <div className="record-desc">
                    HbA1c: 7.2%, Creatinine: 0.9, Cholesterol: 178 mg/dL. All
                    within range.
                  </div>
                </div>
              </div>
              <div className="record-item">
                <div className="record-timeline-col">
                  <div
                    className="record-dot"
                    style={{
                      background: "var(--amber)",
                      boxShadow: "0 0 0 2px var(--amber)",
                    }}
                  ></div>
                  <div className="record-line"></div>
                </div>
                <div className="record-content">
                  <div className="record-header">
                    <div className="record-type">💊 Prescription</div>
                    <div className="record-date">Feb 18, 2026</div>
                  </div>
                  <div className="record-doctor">
                    Dr. R. Nair · Cardiologist
                  </div>
                  <div className="record-desc">
                    Amlodipine 5mg added for hypertension management. Monitor
                    BP daily.
                  </div>
                </div>
              </div>
              <div className="record-item">
                <div className="record-timeline-col">
                  <div
                    className="record-dot"
                    style={{
                      background: "var(--text3)",
                      boxShadow: "0 0 0 2px var(--text3)",
                    }}
                  ></div>
                </div>
                <div className="record-content">
                  <div className="record-header">
                    <div className="record-type">🏥 Emergency Visit</div>
                    <div className="record-date">Jan 8, 2026</div>
                  </div>
                  <div className="record-doctor">
                    Apollo Hospital, Chennai
                  </div>
                  <div className="record-desc">
                    Chest pain episode — ruled out cardiac event. Stress ECG
                    normal.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <div className="card-title-icon">📄</div> Prescriptions
            </div>
            {prescriptionsLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "var(--text2)",
                }}
              >
                Loading prescriptions...
              </div>
            ) : prescriptions.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "var(--text2)",
                }}
              >
                No prescriptions uploaded yet
              </div>
            ) : (
              <div className="prescription-list">
                {prescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="prescription-item"
                    onClick={() => viewPrescription(prescription)}
                  >
                    <div className="prescription-icon">
                      {prescription.fileType === "application/pdf"
                        ? "📄"
                        : "🖼️"}
                    </div>
                    <div className="prescription-info">
                      <div className="prescription-name">
                        {prescription.originalName}
                      </div>
                      <div className="prescription-date">
                        {new Date(prescription.uploadedAt).toLocaleDateString()}{" "}
                        · {prescription.schedule.length} medications
                      </div>
                    </div>
                    <div className="prescription-action">
                      <button className="btn btn-small btn-secondary">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insurance Verified Data Modal */}
      {showInsuranceModal && insuranceDetails && (
        <div
          className="modal-overlay active"
          onClick={() => setShowInsuranceModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Original Sandbox Insurance Data</h3>
              <button className="modal-close" onClick={() => setShowInsuranceModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: "var(--surface2)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "8px" }}>
                  This data was securely fetched in real-time from the HAPI FHIR public developer sandbox at:
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--blue)", wordBreak: "break-all" }}>
                  http://hapi.fhir.org/baseR4/Coverage/{insuranceDetails.rawFhirId || insuranceDetails.insuranceId}
                </div>
              </div>

              <h4>Parsed Profile Data</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "14px" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 0", color: "var(--text2)", width: "40%" }}>Provider</td>
                    <td style={{ padding: "8px 0", fontWeight: "600" }}>{insuranceDetails.provider}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 0", color: "var(--text2)" }}>Policy / Reference ID</td>
                    <td style={{ padding: "8px 0", fontWeight: "600" }}>{insuranceDetails.insuranceId}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 0", color: "var(--text2)" }}>FHIR Status</td>
                    <td style={{ padding: "8px 0", fontWeight: "600", textTransform: "capitalize", color: insuranceDetails.status === 'active' ? 'var(--teal)' : 'var(--text)' }}>
                      {insuranceDetails.status}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 0", color: "var(--text2)" }}>Coverage Type</td>
                    <td style={{ padding: "8px 0", fontWeight: "600" }}>{insuranceDetails.type}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 0", color: "var(--text2)" }}>Valid Until</td>
                    <td style={{ padding: "8px 0", fontWeight: "600" }}>{insuranceDetails.validTill}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 0", color: "var(--text2)" }}>Network Classification</td>
                    <td style={{ padding: "8px 0", fontWeight: "600" }}>{insuranceDetails.network}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ textAlign: "right" }}>
                <button className="btn btn-primary" onClick={() => setShowInsuranceModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Schemes Recommendation Modal */}
      {showSchemesModal && (
        <div
          className="modal-overlay active"
          onClick={() => setShowSchemesModal(false)}
        >
          <div className="modal-content" style={{ maxWidth: "900px", width: "95%" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><span style={{ marginRight: "8px" }}>🤖</span> Smart Health Scheme Recommendations</h3>
              <button className="modal-close" onClick={() => setShowSchemesModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: "80vh", overflowY: "auto", padding: "20px" }}>

              {/* SECTION 1: ALL AVAILABLE SCHEMES */}
              <div style={{ marginBottom: "32px" }}>
                <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text)", marginBottom: "16px", fontSize: "18px" }}>
                  <span style={{ padding: "6px", background: "var(--blue-light)", borderRadius: "6px", fontSize: "14px" }}>01</span>
                  All Available Real-Time Schemes
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                  {eligibleSchemes.availableSchemes?.map((scheme, idx) => (
                    <div key={idx} style={{
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "16px",
                      position: "relative"
                    }}>
                      <div style={{ fontSize: "11px", color: "var(--text3)", fontWeight: "600", marginBottom: "4px" }}>{scheme.id}</div>
                      <div style={{ fontWeight: "700", color: "var(--text)", fontSize: "14px", marginBottom: "8px" }}>{scheme.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "12px" }}>Limit: <b style={{ color: "var(--teal)" }}>{scheme.coverageLimit}</b></div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {scheme.highlights?.map((h, i) => (
                          <span key={i} style={{ fontSize: "10px", background: "white", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--border2)" }}>{h}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: ELIGIBILITY & MATCHING */}
              <div style={{ marginBottom: "32px" }}>
                <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text)", marginBottom: "16px", fontSize: "18px" }}>
                  <span style={{ padding: "6px", background: "var(--teal-light)", borderRadius: "6px", fontSize: "14px" }}>02</span>
                  Eligibility & Health Profile Matching
                </h4>
                <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--surface2)" }}>
                        <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", color: "var(--text3)", textTransform: "uppercase" }}>Scheme Name</th>
                        <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", color: "var(--text3)", textTransform: "uppercase" }}>Match Percentage</th>
                        <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", color: "var(--text3)", textTransform: "uppercase" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligibleSchemes.analyzedSchemes?.map((scheme, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "14px 16px", fontWeight: "600", fontSize: "14px" }}>{scheme.schemeName}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ flex: 1, height: "8px", background: "var(--surface2)", borderRadius: "4px", overflow: "hidden" }}>
                                <div style={{
                                  width: `${scheme.eligibilityPercentage}%`,
                                  height: "100%",
                                  background: scheme.eligibilityPercentage >= 80 ? "var(--teal)" : scheme.eligibilityPercentage >= 60 ? "var(--amber)" : "var(--red)",
                                  borderRadius: "4px"
                                }}></div>
                              </div>
                              <span style={{ fontSize: "13px", fontWeight: "700", width: "35px" }}>{scheme.eligibilityPercentage}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{
                              padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
                              background: scheme.eligibilityPercentage >= 80 ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                              color: scheme.eligibilityPercentage >= 80 ? "var(--teal)" : "var(--amber)"
                            }}>
                              {scheme.eligibilityPercentage >= 80 ? "HIGH MATCH" : "POTENTIAL"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: PERSONALIZED RECOMMENDATIONS */}
              <div>
                <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text)", marginBottom: "16px", fontSize: "18px" }}>
                  <span style={{ padding: "6px", background: "var(--amber-light)", borderRadius: "6px", fontSize: "14px" }}>03</span>
                  AI Recommendations: What to Choose & Why
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {eligibleSchemes.analyzedSchemes?.map((scheme, idx) => (
                    <div key={idx} style={{
                      background: scheme.eligibilityPercentage >= 85 ? "linear-gradient(to right, #fff, var(--surface2))" : "white",
                      border: scheme.eligibilityPercentage >= 85 ? "2px solid var(--teal)" : "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "20px",
                      boxShadow: scheme.eligibilityPercentage >= 85 ? "0 4px 15px rgba(16, 185, 129, 0.1)" : "none"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                        <div style={{ fontWeight: "700", color: "var(--text)", fontSize: "16px" }}>{scheme.schemeName}</div>
                        <div style={{ color: "var(--teal)", fontWeight: "800", fontSize: "14px" }}>{scheme.estimatedSavings}</div>
                      </div>
                      <div style={{ background: "var(--surface2)", padding: "15px", borderRadius: "8px", borderLeft: "4px solid var(--blue)" }}>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <span style={{ fontSize: "18px" }}>✨</span>
                          <div style={{ fontSize: "14px", color: "var(--text)", lineHeight: "1.5" }}>
                            {scheme.recommendationReason}
                          </div>
                        </div>
                      </div>
                      {scheme.eligibilityPercentage >= 85 && (
                        <div style={{ marginTop: "12px", color: "var(--teal)", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                          ⭐ This is your top AI-recommended choice for coverage optimization.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
            <div className="modal-footer" style={{ borderTop: "1px solid var(--border)", padding: "16px 20px", textAlign: "right", background: "var(--surface2)" }}>
              <button className="btn btn-secondary" onClick={() => setShowSchemesModal(false)}>Close Analysis</button>
              <button className="btn btn-primary" style={{ marginLeft: "12px" }} onClick={() => handleInitiateClaim(eligibleSchemes.analyzedSchemes[0])}>🚀 Proceed with Best Recommended Scheme</button>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Claim Submission Form Modal */}
      {showClaimForm && selectedSchemeForClaim && (
        <div
          className="modal-overlay active"
          onClick={() => setShowClaimForm(false)}
        >
          <div className="modal-content" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 New Insurance Claim Request</h3>
              <button className="modal-close" onClick={() => setShowClaimForm(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: "var(--surface2)", padding: "16px", borderRadius: "10px", marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "4px" }}>SELECTED SCHEME</div>
                <div style={{ fontWeight: "800", color: "var(--text)", fontSize: "16px" }}>{selectedSchemeForClaim.schemeName || selectedSchemeForClaim.name}</div>
                <div style={{ fontSize: "13px", color: "var(--teal)", marginTop: "4px", fontWeight: "600" }}>Provider: {insuranceDetails?.provider}</div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Claim Amount (Requested)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontWeight: "700" }}>₹</span>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 15,000"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    style={{ paddingLeft: "30px", fontSize: "16px", fontWeight: "700" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Reason for Claim / Medical Notes</label>
                <textarea
                  className="input-field"
                  rows="4"
                  placeholder="Describe why you are filing this claim (symptoms, hospital visit details...)"
                  value={claimReason}
                  onChange={(e) => setClaimReason(e.target.value)}
                  style={{ resize: "none", fontSize: "14px", padding: "12px" }}
                ></textarea>
              </div>

              <div style={{ background: "rgba(37, 99, 235, 0.05)", border: "1px solid var(--blue-light)", padding: "12px", borderRadius: "8px", fontSize: "12px", color: "var(--text2)", marginBottom: "20px" }}>
                <b>ℹ️ Smart Documentation:</b> By clicking submit, the relevant medical records from your timeline will be automatically securely shared with {insuranceDetails?.provider} as proof of claim.
              </div>

              <button
                className="btn btn-primary"
                style={{ width: "100%", padding: "14px", fontSize: "15px" }}
                onClick={handleSubmitClaim}
                disabled={submittingClaim}
              >
                {submittingClaim ? "📡 Filing Claim..." : "🚀 Submit Claim to Provider"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Viewer Modal */}
      <div
        className={`modal-overlay ${selectedPrescription ? "active" : ""}`}
        onClick={closePrescriptionViewer}
      >
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Prescription Details</h3>
            <button className="modal-close" onClick={closePrescriptionViewer}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="prescription-viewer">
              <div className="prescription-meta">
                <div>
                  <strong>File:</strong> {selectedPrescription?.originalName}
                </div>
                <div>
                  <strong>Uploaded:</strong>{" "}
                  {selectedPrescription?.uploadedAt
                    ? new Date(selectedPrescription.uploadedAt).toLocaleString()
                    : ""}
                </div>
                <div>
                  <strong>Medications:</strong>{" "}
                  {selectedPrescription?.schedule?.length || 0}
                </div>
              </div>

              <div className="prescription-image">
                {selectedPrescription && (
                  <img
                    src={`http://localhost:3001/api/patient/HID-TN-20240847/prescriptions/${selectedPrescription.id}/file`}
                    alt="Prescription"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "400px",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                )}
              </div>

              <div className="prescription-medications">
                <h4>Extracted Medications</h4>
                {selectedPrescription?.schedule?.map((med, idx) => (
                  <div key={idx} className="med-extract-item">
                    <div className="med-extract-name">
                      {med.medName} {med.dosage}
                    </div>
                    <div className="med-extract-detail">
                      {med.schedule} · {med.timeString}
                    </div>
                    <div className="med-extract-reason">{med.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caregiver Patient Details Modal */}
      {selectedPatientForCaregiver && (
        <div
          className={`modal-overlay ${selectedPatientForCaregiver ? "active" : ""}`}
          onClick={closeCaregiverPatientDetails}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Patient Medication Details</h3>
              <button
                className="modal-close"
                onClick={closeCaregiverPatientDetails}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="caregiver-patient-details">
                <div className="patient-info-header">
                  <div className="patient-avatar-large">👴</div>
                  <div>
                    <h4>{selectedPatientForCaregiver.name}</h4>
                    <p>
                      {selectedPatientForCaregiver.relation} ·{" "}
                      {selectedPatientForCaregiver.age} yrs
                    </p>
                    <p style={{ color: "var(--blue)", fontSize: "12px" }}>
                      HID-TN-20240847
                    </p>
                  </div>
                </div>

                <div className="medication-adherence-section">
                  <h4>Today's Medication Adherence</h4>
                  {adherenceLoading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      Loading medication data...
                    </div>
                  ) : (
                    <div className="caregiver-med-list">
                      {meds.map((med) => {
                        const adherence =
                          patientMedicationAdherence[med.id.toString()];
                        const isTaken = adherence?.taken || med.taken;
                        const lastTaken = adherence?.timestamp;

                        return (
                          <div
                            key={med.id}
                            className={`caregiver-med-item ${isTaken ? "taken" : "pending"}`}
                          >
                            <div className="caregiver-med-icon">
                              <div
                                className={`pill ${isTaken ? "taken" : "pending"}`}
                              ></div>
                            </div>
                            <div className="caregiver-med-info">
                              <div className="caregiver-med-name">
                                {med.name}
                              </div>
                              <div className="caregiver-med-detail">
                                {med.detail}
                              </div>
                              <div className="caregiver-med-time">
                                {med.time}
                              </div>
                              {lastTaken && (
                                <div className="caregiver-med-timestamp">
                                  Taken at{" "}
                                  {new Date(lastTaken).toLocaleTimeString()}
                                </div>
                              )}
                            </div>
                            <div className="caregiver-med-status">
                              <span
                                className={`status-badge ${isTaken ? "taken" : "pending"}`}
                              >
                                {isTaken ? "✓ Taken" : "⏳ Pending"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="adherence-summary">
                  <h4>Adherence Summary</h4>
                  <div className="adherence-stats">
                    <div className="stat-item">
                      <div className="stat-value">
                        {
                          meds.filter((med) => {
                            const adherence =
                              patientMedicationAdherence[med.id.toString()];
                            return adherence?.taken || med.taken;
                          }).length
                        }{" "}
                        / {meds.length}
                      </div>
                      <div className="stat-label">Medications Today</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">
                        {Math.round(
                          (meds.filter((med) => {
                            const adherence =
                              patientMedicationAdherence[med.id.toString()];
                            return adherence?.taken || med.taken;
                          }).length /
                            meds.length) *
                          100,
                        )}
                        %
                      </div>
                      <div className="stat-label">Adherence Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        id="view-doctor"
        className={`app ${activeView === "doctor" ? "active" : ""}`}
        style={{
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "auto auto",
          gap: "20px",
        }}
      >
        <div className="stats-bar span-2">
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--blue)" }}>
              247
            </div>
            <div className="stat-label">Active Patients</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--teal)" }}>
              89%
            </div>
            <div className="stat-label">Avg Adherence</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--amber)" }}>
              12
            </div>
            <div className="stat-label">Alerts Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--red)" }}>
              3
            </div>
            <div className="stat-label">Critical Cases</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <div className="card-title-icon">📝</div> Upload Prescription
          </div>
          <div className="prescription-form">
            <div>
              <div className="form-label">Patient Health ID</div>
              <input
                className="form-input"
                type="text"
                defaultValue="HID-TN-20240847"
              />
            </div>
            <div className="form-row">
              <div>
                <div className="form-label">Medicine Name</div>
                <input className="form-input" placeholder="e.g. Metformin" />
              </div>
              <div>
                <div className="form-label">Dosage</div>
                <input className="form-input" placeholder="e.g. 500mg" />
              </div>
            </div>
            <div className="form-row">
              <div>
                <div className="form-label">Frequency</div>
                <select className="form-input">
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Thrice daily</option>
                  <option>Every 8 hours</option>
                </select>
              </div>
              <div>
                <div className="form-label">Duration</div>
                <input className="form-input" placeholder="e.g. 30 days" />
              </div>
            </div>
            <div>
              <div className="form-label">Notes</div>
              <textarea
                className="form-input"
                placeholder="After meals, avoid alcohol..."
              ></textarea>
            </div>
            <button
              className="btn btn-primary"
              onClick={() =>
                addNotification(
                  "💊",
                  "Prescription Added",
                  "Schedule auto-generated & patient notified",
                )
              }
            >
              + Add to Schedule
            </button>
            <div style={{ position: "relative" }}>
              <input
                type="file"
                onChange={handlePrescriptionUpload}
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                  zIndex: 5,
                }}
                accept=".jpg,.jpeg,.png,.pdf"
              />
              <button
                className="btn btn-secondary"
                style={{ position: "relative", zIndex: 1, width: "100%" }}
              >
                {uploadLoading
                  ? "⏳ Analyzing via Llama 3..."
                  : "📎 Upload PDF / Image"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card">
            <div className="card-title">
              <div className="card-title-icon">👨‍⚕️</div> Doctor Registry
            </div>
            <div className="doctor-ids">
              <div className="doc-id-row">
                <div className="doc-id-avatar">👨‍⚕️</div>
                <div className="doc-id-info">
                  <div className="doc-id-name">Dr. Suresh Mehta</div>
                  <div className="doc-id-spec">Diabetology · 18 yrs</div>
                </div>
                <div className="doc-id-badge">DID-TN-0081</div>
              </div>
              <div className="doc-id-row">
                <div className="doc-id-avatar">👩‍⚕️</div>
                <div className="doc-id-info">
                  <div className="doc-id-name">Dr. Priya Nair</div>
                  <div className="doc-id-spec">Cardiologist · 12 yrs</div>
                </div>
                <div className="doc-id-badge">DID-TN-0124</div>
              </div>
              <div className="doc-id-row">
                <div className="doc-id-avatar">👨‍⚕️</div>
                <div className="doc-id-info">
                  <div className="doc-id-name">Dr. Arjun Rajan</div>
                  <div className="doc-id-spec">General Physician · 9 yrs</div>
                </div>
                <div className="doc-id-badge">DID-TN-0209</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">
              <div className="card-title-icon">🏥</div> Hospital Network
            </div>
            <div className="doctor-ids">
              <div className="doc-id-row">
                <div className="doc-id-avatar">🏥</div>
                <div className="doc-id-info">
                  <div className="doc-id-name">Apollo Hospital Chennai</div>
                  <div className="doc-id-spec">Multi-Specialty · Online</div>
                </div>
                <div className="doc-id-badge">HOSP-TN-001</div>
              </div>
              <div className="doc-id-row">
                <div className="doc-id-avatar">🏥</div>
                <div className="doc-id-info">
                  <div className="doc-id-name">Ambattur PHC</div>
                  <div className="doc-id-spec">
                    Primary Health · Offline-enabled
                  </div>
                </div>
                <div className="doc-id-badge">HOSP-TN-044</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ color: "var(--teal)" }}>
              <div className="card-title-icon">👥</div> My Patient Queue
            </div>
            {queueLoading ? (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--text2)" }}>Loading queue...</div>
            ) : patientQueue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--text2)" }}>No patients in queue.</div>
            ) : (
              <div className="doctor-ids">
                {patientQueue.map((patient, index) => (
                  <div
                    key={patient.appointmentId}
                    className={`doc-id-row ${patient.isEmergency ? "emergency-row" : ""}`}
                    style={{ cursor: "pointer", borderLeft: patient.isEmergency ? "3px solid var(--red)" : index === 0 ? "3px solid var(--teal)" : "3px solid transparent", transition: "all 0.2s", background: patient.isEmergency ? "var(--red-light)" : "" }}
                    onClick={() => {
                      setFetchHealthId(patient.patientId);
                      // Using a timeout allows state to update before fetching
                      setTimeout(() => {
                        document.getElementById('fetch-summary-btn').click();
                      }, 50);
                    }}
                    onMouseEnter={(e) => { if (!patient.isEmergency) e.currentTarget.style.background = 'var(--surface2)'; }}
                    onMouseLeave={(e) => { if (!patient.isEmergency) e.currentTarget.style.background = 'var(--surface)'; }}
                  >
                    <div className="doc-id-avatar" style={{ fontSize: "20px" }}>{patient.isEmergency ? "🚨" : index + 1}</div>
                    <div className="doc-id-info">
                      <div className="doc-id-name" style={{ color: patient.isEmergency ? "var(--red)" : "inherit" }}>
                        {patient.patientName} {patient.isEmergency && <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--red)", marginLeft: "4px", padding: "2px 6px", background: "rgba(220,38,38,0.1)", borderRadius: "4px" }}>EMERGENCY</span>}
                      </div>
                      <div className="doc-id-spec">{patient.time} · {patient.reason}</div>
                    </div>
                    <div className="doc-id-badge" style={{ color: patient.isEmergency ? "var(--red)" : "var(--blue)" }}>{patient.patientId}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card span-2">
          <div className="card-title">
            <div className="card-title-icon">📲</div> Incoming Patient Scan
            (Emergency / Transfer)
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              gap: "20px",
              alignItems: "start",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  background: "var(--surface2)",
                  border: "1.5px dashed var(--border2)",
                  borderRadius: "12px",
                  padding: "22px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ fontSize: "44px", marginBottom: "8px" }}>📷</div>
                <div style={{ fontSize: "12.5px", color: "var(--text2)" }}>
                  Scan patient QR or enter Health ID
                </div>
              </div>
              <input
                className="form-input"
                placeholder="Or type HID manually..."
                style={{ marginBottom: "8px" }}
                value={fetchHealthId}
                onChange={(e) => setFetchHealthId(e.target.value)}
              />
              <button
                id="fetch-summary-btn"
                className="btn btn-primary"
                onClick={handleFetchSummary}
                disabled={summaryLoading}
              >
                {summaryLoading ? "⌛ Processing..." : "🔍 Fetch & Summarize"}
              </button>
            </div>
            <div>
              <div className="ai-summary-box">
                <div className="ai-label">
                  ✦ AI Pre-Summary for Incoming Patient
                </div>
                <div
                  className="ai-text"
                  style={{ marginBottom: "12px", whiteSpace: "pre-wrap" }}
                >
                  {patientSummary || (
                    <>
                      <strong>Rajan Kumar</strong> (64M) — Transferred from
                      Ambattur PHC.
                      <br />
                      <br />
                      🔴 <strong>Active conditions:</strong> Type 2 Diabetes,
                      Hypertension, Hyperlipidemia
                      <br />
                      ⚠️ <strong>Allergies:</strong> Penicillin, Aspirin —{" "}
                      <em>do not administer</em>
                      <br />
                      💊 <strong>Current meds:</strong> Metformin 500mg (BD),
                      Amlodipine 5mg (OD), Atorvastatin 10mg (HS)
                      <br />
                      📋 <strong>Last visit:</strong> Mar 10, 2026 — Dr. Mehta,
                      Diabetology
                      <br />
                      🧪 <strong>Last labs:</strong> Mar 5 — HbA1c 7.2%,
                      Cholesterol 178
                      <br />
                      🆘 <strong>Emergency note:</strong> Chest pain history
                      (Jan 2026), ECG normal
                    </>
                  )}
                </div>
                {/* Old content below will be removed manually if needed */}
                <div style={{ display: "none" }}>
                  <strong>Rajan Kumar</strong> (64M) — Transferred from Ambattur
                  PHC.
                  <br />
                  <br />
                  🔴 <strong>Active conditions:</strong> Type 2 Diabetes,
                  Hypertension, Hyperlipidemia
                  <br />
                  ⚠️ <strong>Allergies:</strong> Penicillin, Aspirin —{" "}
                  <em>do not administer</em>
                  <br />
                  💊 <strong>Current meds:</strong> Metformin 500mg (BD),
                  Amlodipine 5mg (OD), Atorvastatin 10mg (HS)
                  <br />
                  📋 <strong>Last visit:</strong> Mar 10, 2026 — Dr. Mehta,
                  Diabetology
                  <br />
                  🧪 <strong>Last labs:</strong> Mar 5 — HbA1c 7.2%, Cholesterol
                  178
                  <br />
                  🆘 <strong>Emergency note:</strong> Chest pain history (Jan
                  2026), ECG normal
                </div>
                <span className="tag">Diabetic</span>
                <span className="tag">Hypertensive</span>
                <span className="tag red">⚠ Penicillin Allergy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        id="view-caregiver"
        className={`app ${activeView === "caregiver" ? "active" : ""}`}
        style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "18px" }}
      >
        <div
          className="patient-monitor-card"
          onClick={() =>
            handlePatientSelectForCaregiver({
              id: "HID-TN-20240847",
              name: "Rajan Kumar",
              relation: "Father",
              age: 64,
            })
          }
          style={{ cursor: "pointer" }}
        >
          <div className="monitor-header">
            <div className="monitor-avatar">👴</div>
            <div>
              <div className="monitor-name">Rajan Kumar</div>
              <div className="monitor-relation">Father · 64 yrs</div>
            </div>
            <div className="monitor-status">
              <div className="status-dot warn"></div>
              <span style={{ color: "var(--amber)" }}>Attention</span>
            </div>
          </div>
          <div className="monitor-meds">
            <div className="monitor-med-row">
              <span className="monitor-med-name">Metformin</span>
              <div className="pill-status">
                <div className="pill taken"></div>
                <div className="pill taken"></div>
                <div className="pill pending"></div>
              </div>
            </div>
            <div className="monitor-med-row">
              <span className="monitor-med-name">Amlodipine</span>
              <div className="pill-status">
                <div className="pill taken"></div>
                <div className="pill missed"></div>
                <div className="pill pending"></div>
              </div>
            </div>
            <div className="monitor-med-row">
              <span className="monitor-med-name">Atorvastatin</span>
              <div className="pill-status">
                <div className="pill taken"></div>
                <div className="pill taken"></div>
                <div className="pill pending"></div>
              </div>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "78%" }}></div>
          </div>
          <div
            style={{
              fontSize: "11.5px",
              color: "var(--text3)",
              marginTop: "5px",
              marginBottom: "12px",
              fontWeight: "600",
            }}
          >
            78% adherence today
          </div>
          <div className="alert-banner">
            🔔 Evening Amlodipine missed yesterday
          </div>
        </div>

        <div className="patient-monitor-card">
          <div className="monitor-header">
            <div className="monitor-avatar">👵</div>
            <div>
              <div className="monitor-name">Lakshmi Kumar</div>
              <div className="monitor-relation">Mother · 61 yrs</div>
            </div>
            <div className="monitor-status">
              <div className="status-dot good"></div>
              <span style={{ color: "var(--teal)" }}>On Track</span>
            </div>
          </div>
          <div className="monitor-meds">
            <div className="monitor-med-row">
              <span className="monitor-med-name">Levothyroxine</span>
              <div className="pill-status">
                <div className="pill taken"></div>
                <div className="pill taken"></div>
                <div className="pill taken"></div>
              </div>
            </div>
            <div className="monitor-med-row">
              <span className="monitor-med-name">Calcium+D3</span>
              <div className="pill-status">
                <div className="pill taken"></div>
                <div className="pill taken"></div>
                <div className="pill pending"></div>
              </div>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "95%" }}></div>
          </div>
          <div
            style={{
              fontSize: "11.5px",
              color: "var(--text3)",
              marginTop: "5px",
              marginBottom: "12px",
              fontWeight: "600",
            }}
          >
            95% adherence today
          </div>
          <div
            style={{
              background: "var(--green-light)",
              border: "1px solid var(--green-mid)",
              borderRadius: "9px",
              padding: "10px 13px",
              fontSize: "12.5px",
              color: "var(--green)",
              fontWeight: "600",
            }}
          >
            ✅ All medications on schedule
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <div className="card-title-icon">🎙️</div> Voice Health Log
          </div>
          <div className="voice-panel">
            <button
              className={`voice-btn ${recording ? "recording" : ""}`}
              id="voiceBtn"
              onClick={toggleVoice}
              style={
                recording
                  ? {
                    background:
                      "linear-gradient(135deg, var(--red), #f87171)",
                  }
                  : {}
              }
            >
              {recording ? "⏹️" : "🎙️"}
            </button>
            <div
              className="voice-wave"
              id="voiceWave"
              style={{ display: recording ? "flex" : "none" }}
            >
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
            <div
              style={{
                fontSize: "12.5px",
                color: "var(--text2)",
                textAlign: "center",
              }}
            >
              Tap to record symptoms or notes
            </div>
            <div className="voice-log-list">
              <div className="voice-log-item">
                <div className="voice-log-time">10:30 AM</div>
                <div className="voice-log-text">
                  "Father took Metformin after breakfast, slight dizziness for
                  10 mins"
                </div>
              </div>
              <div className="voice-log-item">
                <div className="voice-log-time">8:15 AM</div>
                <div className="voice-log-text">
                  "Morning BP: 128/84, feels normal"
                </div>
              </div>
              <div className="voice-log-item">
                <div className="voice-log-time">Yesterday</div>
                <div className="voice-log-text">
                  "Forgot evening Amlodipine, gave it late with water"
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <div className="card-title-icon">🔔</div> Live Alerts
          </div>
          <div className="insight-list scrollable">
            <div
              className="insight-item"
              style={{ borderLeft: "3px solid var(--red)" }}
            >
              <div
                className="insight-icon"
                style={{ background: "var(--red-light)" }}
              >
                🚨
              </div>
              <div className="insight-text">
                <div className="insight-title" style={{ color: "var(--red)" }}>
                  Medication Missed
                </div>
                <div className="insight-sub">
                  Rajan — Amlodipine 5mg (1:00 PM) not confirmed
                </div>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon warn">📅</div>
              <div className="insight-text">
                <div className="insight-title">Doctor Follow-up Due</div>
                <div className="insight-sub">
                  Cardiology appointment overdue — Dr. Nair
                </div>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon ok">✅</div>
              <div className="insight-text">
                <div className="insight-title">Lakshmi — All Good</div>
                <div className="insight-sub">
                  All medications taken. Next: Calcium+D3 at 9 PM
                </div>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon info">🩺</div>
              <div className="insight-text">
                <div className="insight-title">Lab Report Uploaded</div>
                <div className="insight-sub">
                  Dr. Mehta uploaded new report for Rajan
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <div className="card-title-icon">🆘</div> Emergency Network
          </div>
          <div className="doctor-ids" style={{ marginBottom: "14px" }}>
            <div className="doc-id-row" onClick={() => setShowSOS(true)}>
              <div
                className="doc-id-avatar"
                style={{ background: "var(--red-light)" }}
              >
                🚑
              </div>
              <div className="doc-id-info">
                <div className="doc-id-name">Nearby Ambulance</div>
                <div className="doc-id-spec">Ambattur — 2.3 km</div>
              </div>
              <div
                style={{
                  color: "var(--teal)",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                Available
              </div>
            </div>
            <div className="doc-id-row">
              <div className="doc-id-avatar">👨‍⚕️</div>
              <div className="doc-id-info">
                <div className="doc-id-name">Dr. Mehta</div>
                <div className="doc-id-spec">On-call until 8 PM</div>
              </div>
              <div
                style={{
                  color: "var(--blue)",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                📞 Call
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{
              background: "var(--red)",
              boxShadow: "0 2px 10px rgba(220,38,38,0.3)",
              marginBottom: "12px",
            }}
            onClick={() => setShowSOS(true)}
          >
            🆘 Trigger Emergency SOS
          </button>
          <div className="ai-summary-box">
            <div className="ai-label">⚡ Offline Mode Active</div>
            <div className="ai-text" style={{ fontSize: "12px" }}>
              Critical data cached locally. SMS alerts queue and send when
              internet restores.
            </div>
          </div>
        </div>
      </div>

      <div
        id="view-employee"
        className={`app ${activeView === "employee" ? "active" : ""}`}
      >
        <div className="card" style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
          <div className="card-title">
            <div className="card-title-icon">🏥</div> Hospital Portal - Appointment Management
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title" style={{ fontSize: "16px", padding: "12px 16px" }}>
                <div className="card-title-icon">👨‍⚕️</div> Doctor Directory
              </div>
              <div className="doctor-ids" style={{ maxHeight: "250px", overflowY: "auto" }}>
                {doctorsLoading ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "var(--text2)" }}>Loading directory...</div>
                ) : (
                  doctorsList.map(doc => (
                    <div key={doc.id} className="doc-id-row">
                      <div className="doc-id-avatar">{doc.avatar || "👨‍⚕️"}</div>
                      <div className="doc-id-info">
                        <div className="doc-id-name">{doc.name}</div>
                        <div className="doc-id-spec">{doc.specialty} · {doc.experience}</div>
                      </div>
                      <div className="doc-id-badge" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "var(--text2)" }}>Queue</span>
                        <span style={{ fontSize: "16px", color: doc.activeQueueLength > 3 ? "var(--red)" : "var(--teal)" }}>{doc.activeQueueLength}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="hospital-select-container" style={{ margin: 0, height: "100%", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", padding: "30px" }}>
                <span className="hospital-select-label" style={{ fontSize: "18px", marginBottom: "16px" }}>🏥 Select Hospital Facility:</span>
                <select
                  className="select-doctor"
                  style={{ width: "100%", maxWidth: "100%", fontSize: "16px", padding: "14px", margin: 0 }}
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                >
                  <option value="HOSP-TN-001">Apollo Hospital Chennai (HOSP-TN-001)</option>
                  <option value="HOSP-TN-044">Ambattur PHC (HOSP-TN-044)</option>
                </select>
                <div style={{ marginTop: "16px", color: "var(--text2)", fontSize: "13px", lineHeight: "1.5" }}>
                  Select a facility to view incoming patient appointments and route them accurately to the appropriate medical professionals.
                </div>
              </div>
            </div>
          </div>

          <div className="appointment-list">
          </div>

          <div className="appointment-list">
            {appointmentsLoading ? (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--text2)" }}>Loading appointments...</div>
            ) : hospitalAppointments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--text2)" }}>No appointments scheduled for this hospital.</div>
            ) : (
              <div className="appointment-grid">
                {hospitalAppointments.map((apt) => (
                  <div key={apt.id} className="appointment-card">
                    <div className="appointment-header">
                      <div className="appointment-time">
                        <span style={{ fontSize: "20px" }}>🕒</span> {apt.time}
                      </div>
                      <div className={`appointment-status ${apt.status === 'Assigned' ? 'assigned' : 'pending'}`}>
                        {apt.status}
                      </div>
                    </div>

                    <div className="appointment-body">
                      <div>
                        <div className="appointment-patient">{apt.patientName}</div>
                        <div className="appointment-hid">{apt.patientId}</div>
                      </div>

                      <div className="appointment-reason">
                        <span style={{ fontSize: "16px" }}>📋</span>
                        <span>{apt.reason}</span>
                      </div>
                    </div>

                    <div className="appointment-actions">
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "4px" }}>
                        <input
                          type="checkbox"
                          id={`emergency-${apt.id}`}
                          checked={appointmentForms[apt.id]?.isEmergency || false}
                          onChange={(e) => setAppointmentForms(prev => ({
                            ...prev,
                            [apt.id]: { ...prev[apt.id], isEmergency: e.target.checked }
                          }))}
                          disabled={apt.status === 'Assigned'}
                          style={{ width: "16px", height: "16px", accentColor: "var(--red)", cursor: "pointer" }}
                        />
                        <label htmlFor={`emergency-${apt.id}`} style={{ fontSize: "13px", fontWeight: "600", color: "var(--red)", cursor: "pointer" }}>🚨 Mark as Emergency</label>
                      </div>
                      <select
                        className="select-doctor"
                        defaultValue={apt.doctorAssigned || ""}
                        id={`assign-doctor-${apt.id}`}
                        disabled={apt.status === 'Assigned'}
                      >
                        <option value="" disabled>Select Doctor to Assign...</option>
                        {doctorsList.map(doc => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} (Queue: {doc.activeQueueLength})
                          </option>
                        ))}
                      </select>

                      <button
                        className={`btn ${apt.status === 'Assigned' ? 'btn-secondary' : appointmentForms[apt.id]?.isEmergency ? 'btn-red' : 'btn-primary'}`}
                        style={{ padding: "12px", fontSize: "14px", fontWeight: "700" }}
                        disabled={apt.status === 'Assigned'}
                        onClick={() => {
                          const selectEl = document.getElementById(`assign-doctor-${apt.id}`);
                          const isEmergency = appointmentForms[apt.id]?.isEmergency || false;
                          handleAssignDoctor(apt.id, selectEl.value, isEmergency);
                        }}
                      >
                        {apt.status === 'Assigned' ? '✓ Assigned Securely' : appointmentForms[apt.id]?.isEmergency ? '🚨 Assign Emergency' : 'Assign Patient to Doctor'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
