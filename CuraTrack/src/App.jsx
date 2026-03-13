
import { useState, useEffect } from 'react';
import './index.css';
import logoImg from './assets/image.png';

function App() {
  const [activeView, setActiveView] = useState('patient');
  const [recording, setRecording] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // New states for AI Prescription
  const [uploadLoading, setUploadLoading] = useState(false);
  const [pendingSchedule, setPendingSchedule] = useState(null);
  const [meds, setMeds] = useState([
    { id: 1, name: 'Metformin 500mg', detail: 'After breakfast · Type 2 Diabetes', time: '8:00 AM', status: 'taken', icon: 'green' },
    { id: 2, name: 'Amlodipine 5mg', detail: 'Before lunch · Hypertension', time: '2:27 PM', status: 'upcoming', icon: 'yellow' },
    { id: 3, name: 'Atorvastatin 10mg', detail: 'After dinner · Cholesterol', time: '9:00 PM', status: 'evening', icon: 'blue' }
  ]);

  // New states for AI Patient Summary
  const [fetchHealthId, setFetchHealthId] = useState('HID-TN-20240847');
  const [patientSummary, setPatientSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  useEffect(() => {
    // Initial notifications mock
    const t1 = setTimeout(() => addNotification('⚠️', 'Medication Due', 'Amlodipine 5mg due for Rajan Kumar at 1:00 PM'), 2000);
    const t2 = setTimeout(() => addNotification('🤖', 'AI Alert', 'BP pattern suggests elevated risk — schedule follow-up'), 5000);

    // Alarm interval checker
    const alarmInterval = setInterval(() => {
      const now = new Date();
      let currentHour = now.getHours();
      let currentMinute = now.getMinutes();
      const ampm = currentHour >= 12 ? 'PM' : 'AM';
      currentHour = currentHour % 12 || 12;
      const timeStr = `${currentHour}:${currentMinute.toString().padStart(2, '0')} ${ampm}`;

      meds.forEach(med => {
        if (med.time === timeStr && med.status !== 'taken' && activeView === 'patient') {
          addNotification('⏰', 'Time to take Meds!', `${med.name} is due right now.`);
        }
      });
    }, 60000); // Check every minute

    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(alarmInterval); };
  }, [meds, activeView]);

  const addNotification = (icon, title, body) => {
    const newNotif = { id: Date.now() + Math.random(), icon, title, body };
    setNotifications(prev => [...prev, newNotif]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 4000);
  };

  const triggerSOS = () => {
    setShowSOS(false);
    addNotification('🚑', 'SOS Activated!', 'Ambulance dispatched. Hospital notified with medical data.');
    setTimeout(() => addNotification('📱', 'Family Alerted', 'Emergency SMS sent to all caregivers.'), 1500);
  };

  const toggleVoice = () => {
    setRecording(!recording);
    if (!recording) {
      addNotification('🎙️', 'Recording...', 'Speak your health note clearly');
    } else {
      addNotification('✅', 'Note Saved', 'Voice log added to health record');
    }
  };

  const handlePrescriptionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    addNotification('⏳', 'Analyzing...', 'Llama 3 is analyzing the prescription');
    
    const formData = new FormData();
    formData.append('prescription', file);

    try {
      const res = await fetch('http://localhost:3001/api/analyze-prescription', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.schedule) {
        addNotification('✅', 'Analysis Complete', 'Prescription has been converted into a schedule and sent to Patient Portal.');
        setPendingSchedule(data.schedule);
      } else {
        addNotification('❌', 'Error', data.error || 'Failed to parse prescription');
      }
    } catch (err) {
      addNotification('❌', 'Upload Failed', 'Could not reach backend server');
      console.error(err);
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
      status: 'upcoming',
      icon: 'blue'
    }));

    setMeds(prev => [...prev, ...newMeds]);
    setPendingSchedule(null);
    addNotification('📅', 'Schedule Active', 'Meds automatically added to your timer');
  };

  const handleFetchSummary = async () => {
    if (!fetchHealthId) return;

    setSummaryLoading(true);
    addNotification('⏳', 'Summarizing...', 'Llama 3 is synthesizing patient history');

    try {
      const res = await fetch('http://localhost:3001/api/summarize-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ healthId: fetchHealthId })
      });
      const data = await res.json();

      if (data.summary) {
        setPatientSummary(data.summary);
        addNotification('✅', 'Summary Ready', `Health record for ${data.patientName} has been summarized.`);
      } else {
        addNotification('❌', 'Error', data.error || 'Failed to fetch summary');
      }
    } catch (err) {
      addNotification('❌', 'Fetch Failed', 'Could not reach backend server');
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };


  return (
    <>
      <div className="notif-stack" id="notifStack">
        {notifications.map(n => (
          <div key={n.id} className="notif" onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}>
            <div className="notif-icon">{n.icon}</div>
            <div>
              <div className="notif-title">{n.title}</div>
              <div className="notif-body">{n.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={`modal-overlay ${showSOS ? 'active' : ''}`} onClick={(e) => { if (e.target.className.includes('modal-overlay')) setShowSOS(false); }}>
          <div className="sos-modal">
              <div className="sos-modal-icon">🆘</div>
              <div className="sos-modal-title">Emergency SOS</div>
              <div className="sos-modal-text">Medical data will be sent to the nearest hospital and ambulance dispatched. All
                  emergency contacts will be notified instantly.</div>
              <div className="sos-info-grid">
                  <div className="sos-info-item">
                      <div className="sos-info-label">Patient</div>
                      <div className="sos-info-value">Rajan Kumar</div>
                  </div>
                  <div className="sos-info-item">
                      <div className="sos-info-label">Health ID</div>
                      <div className="sos-info-value" style={{color:"var(--blue)"}}>HID-TN-20240847</div>
                  </div>
                  <div className="sos-info-item">
                      <div className="sos-info-label">Nearest Hospital</div>
                      <div className="sos-info-value">Ambattur PHC (2.1 km)</div>
                  </div>
                  <div className="sos-info-item">
                      <div className="sos-info-label">Ambulance ETA</div>
                      <div className="sos-info-value" style={{color:"var(--teal)"}}>~6 minutes</div>
                  </div>
              </div>
              <div
                  style={{background:"var(--red-light)",border:"1px solid var(--red-mid)",borderRadius:"10px",padding:"12px",fontSize:"12.5px",color:"var(--text2)",marginBottom:"16px",textAlign:"left"}}>
                  ⚠️ <strong style={{color:"var(--red)"}}>Allergy Alert being sent:</strong> Penicillin, Aspirin — Do NOT
                  administer
              </div>
              <button className="btn-sos-confirm" onClick={triggerSOS}>🚑 Confirm — Send SOS Now</button>
              <button className="btn-cancel" onClick={() => setShowSOS(false)}>Cancel</button>
          </div>
      </div>

      

    <nav>
        <div className="nav-logo">
            <img src={logoImg} alt="CuraTrack Base Logo" style={{width: 34, height: 34, borderRadius: 10, objectFit: "cover"}} />
            CuraTrack
        </div>
        <div className="nav-tabs">
            <button className={`nav-tab ${activeView === 'patient' ? 'active' : ''}`} onClick={() => setActiveView('patient')}>Patient View</button>
            <button className={`nav-tab ${activeView === 'doctor' ? 'active' : ''}`} onClick={() => setActiveView('doctor')}>Doctor Portal</button>
            <button className={`nav-tab ${activeView === 'caregiver' ? 'active' : ''}`} onClick={() => setActiveView('caregiver')}>Caregiver Dashboard</button>
        </div>
        <div className="nav-right">
            <span className="offline-badge">⚡ Offline Ready</span>
            <button className="sos-btn" onClick={() => setShowSOS(true)}>🆘 SOS</button>
            <div className="user-avatar">RK</div>
        </div>
    </nav>

    
    <div id="view-patient" className={`app ${activeView === 'patient' ? 'active' : ''}`}>

        
        <div className="patient-sidebar">

            <div className="patient-id-card">
                <div className="patient-avatar">👤</div>
                <div className="patient-name">Rajan Kumar</div>
                <div className="patient-meta">64 yrs · Male · Blood: O+</div>
                <div className="health-id-badge">🪪 HID-TN-20240847</div>
                <div style={{"textAlign":"center","marginBottom":"14px"}}>
                    <div className="qr-container" id="qrCode">{[1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1].map((v, i) => (<div key={i} className={'qr-cell' + (v ? '' : ' w')}></div>))}</div>
                    <div style={{"fontSize":"11px","color":"rgba(255,255,255,0.6)","marginTop":"6px"}}>Emergency QR Scan</div>
                </div>
                <div className="vital-row">
                    <div className="vital-item">
                        <div className="vital-value">124<span style={{"fontSize":"13px"}}>/82</span></div>
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
                        Patient shows <strong style={{"color":"var(--amber)"}}>moderate adherence</strong> (78%). BP slightly
                        elevated this week. HbA1c improving. Recommend follow-up with Dr. Mehta within 7 days.
                    </div>
                </div>
            </div>

        </div>

        
        <div style={{"display":"flex","flexDirection":"column","gap":"18px"}}>
            {pendingSchedule && (
              <div className="card" style={{borderColor: 'var(--blue)', background: 'var(--blue-light)'}}>
                <div className="card-title" style={{color: 'var(--blue)'}}>
                    <div className="card-title-icon" style={{background: 'var(--blue)', color: 'white'}}>🤖</div> New AI Schedule Ready
                </div>
                <div style={{fontSize: 13, color: 'var(--text2)', marginBottom: 16}}>
                  Dr. Mehta uploaded a prescription which was processed into the following schedule:
                </div>
                <div className="med-list" style={{marginBottom: 16}}>
                  {pendingSchedule.map((item, idx) => (
                    <div key={idx} className="med-item" style={{background: 'white'}}>
                        <div className="med-icon blue">💊</div>
                        <div className="med-info">
                            <div className="med-name">{item.medName}</div>
                            <div className="med-detail">{item.dosage} · {item.reason || item.schedule}</div>
                        </div>
                        <div className="med-time">{item.timeString}</div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={acceptSchedule}>✓ Accept & Schedule Alarms</button>
              </div>
            )}

            <div className="card">
                <div className="card-title" style={{"justifyContent":"space-between"}}>
                    <span style={{"display":"flex","alignItems":"center","gap":"7px"}}>
                        <div className="card-title-icon">💊</div> Today's Medication Schedule
                    </span>
                    <div style={{"display":"flex","alignItems":"center","gap":"6px"}}>
                        <div style={{"width":"8px","height":"8px","borderRadius":"50%","background":"var(--teal)"}}></div>
                        <span style={{"fontSize":"12px","color":"var(--text2)","fontWeight":"600"}}>78% Adherence Today</span>
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
                    <div className="med-item taken">
                        <div className="med-icon green">💊</div>
                        <div className="med-info">
                            <div className="med-name">Metformin 500mg</div>
                            <div className="med-detail">After breakfast · Type 2 Diabetes</div>
                        </div>
                        <div className="med-time">8:00 AM</div>
                        <div className="med-status status-taken">✓ Taken</div>
                    </div>
                    <div className="med-item upcoming">
                        <div className="med-icon yellow">💊</div>
                        <div className="med-info">
                            <div className="med-name">Amlodipine 5mg</div>
                            <div className="med-detail">Before lunch · Hypertension</div>
                        </div>
                        <div className="med-time">1:00 PM</div>
                        <div className="med-status status-upcoming">⏰ Due Soon</div>
                    </div>
                    <div className="med-item evening">
                        <div className="med-icon blue">💊</div>
                        <div className="med-info">
                            <div className="med-name">Atorvastatin 10mg</div>
                            <div className="med-detail">After dinner · Cholesterol</div>
                        </div>
                        <div className="med-time">9:00 PM</div>
                        <div className="med-status status-evening">⏳ Evening</div>
                    </div>
                </div>
            </div>

            <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"18px"}}>

                <div className="card">
                    <div className="card-title">
                        <div className="card-title-icon">🔮</div> AI Risk Alerts
                    </div>
                    <div className="insight-list scrollable">
                        <div className="insight-item">
                            <div className="insight-icon warn">⚠️</div>
                            <div className="insight-text">
                                <div className="insight-title">Medication skip pattern</div>
                                <div className="insight-sub">Evening dose missed 3× this week — BP risk increases</div>
                            </div>
                        </div>
                        <div className="insight-item">
                            <div className="insight-icon ok">✅</div>
                            <div className="insight-text">
                                <div className="insight-title">HbA1c improving</div>
                                <div className="insight-sub">Down from 7.8% → 7.2% — keep maintaining diet</div>
                            </div>
                        </div>
                        <div className="insight-item">
                            <div className="insight-icon warn">📅</div>
                            <div className="insight-text">
                                <div className="insight-title">Follow-up overdue</div>
                                <div className="insight-sub">Cardiology check-up 12 days overdue</div>
                            </div>
                        </div>
                        <div className="insight-item">
                            <div className="insight-icon info">💧</div>
                            <div className="insight-text">
                                <div className="insight-title">Hydration reminder</div>
                                <div className="insight-sub">Summer heat — ensure 2.5L water intake daily</div>
                            </div>
                        </div>
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
                                <div className="record-doctor">Dr. S. Mehta · Diabetology</div>
                                <div className="record-desc">BP controlled. HbA1c improving. Continue current meds. Follow
                                    up in 3 weeks.</div>
                            </div>
                        </div>
                        <div className="record-item">
                            <div className="record-timeline-col">
                                <div className="record-dot" style={{"background":"var(--teal)","boxShadow":"0 0 0 2px var(--teal)"}}>
                                </div>
                                <div className="record-line"></div>
                            </div>
                            <div className="record-content">
                                <div className="record-header">
                                    <div className="record-type">🧪 Lab Report</div>
                                    <div className="record-date">Mar 5, 2026</div>
                                </div>
                                <div className="record-doctor">City Diagnostics Lab</div>
                                <div className="record-desc">HbA1c: 7.2%, Creatinine: 0.9, Cholesterol: 178 mg/dL. All
                                    within range.</div>
                            </div>
                        </div>
                        <div className="record-item">
                            <div className="record-timeline-col">
                                <div className="record-dot"
                                    style={{"background":"var(--amber)","boxShadow":"0 0 0 2px var(--amber)"}}></div>
                                <div className="record-line"></div>
                            </div>
                            <div className="record-content">
                                <div className="record-header">
                                    <div className="record-type">💊 Prescription</div>
                                    <div className="record-date">Feb 18, 2026</div>
                                </div>
                                <div className="record-doctor">Dr. R. Nair · Cardiologist</div>
                                <div className="record-desc">Amlodipine 5mg added for hypertension management. Monitor BP
                                    daily.</div>
                            </div>
                        </div>
                        <div className="record-item">
                            <div className="record-timeline-col">
                                <div className="record-dot"
                                    style={{"background":"var(--text3)","boxShadow":"0 0 0 2px var(--text3)"}}></div>
                            </div>
                            <div className="record-content">
                                <div className="record-header">
                                    <div className="record-type">🏥 Emergency Visit</div>
                                    <div className="record-date">Jan 8, 2026</div>
                                </div>
                                <div className="record-doctor">Apollo Hospital, Chennai</div>
                                <div className="record-desc">Chest pain episode — ruled out cardiac event. Stress ECG
                                    normal.</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

    </div>

    
    <div id="view-doctor" className={`app ${activeView === 'doctor' ? 'active' : ''}`} style={{gridTemplateColumns:'1fr 1fr', gridTemplateRows:'auto auto', gap:'20px'}}>

        <div className="stats-bar span-2">
            <div className="stat-card">
                <div className="stat-value" style={{"color":"var(--blue)"}}>247</div>
                <div className="stat-label">Active Patients</div>
            </div>
            <div className="stat-card">
                <div className="stat-value" style={{"color":"var(--teal)"}}>89%</div>
                <div className="stat-label">Avg Adherence</div>
            </div>
            <div className="stat-card">
                <div className="stat-value" style={{"color":"var(--amber)"}}>12</div>
                <div className="stat-label">Alerts Today</div>
            </div>
            <div className="stat-card">
                <div className="stat-value" style={{"color":"var(--red)"}}>3</div>
                <div className="stat-label">Critical Cases</div>
            </div>
        </div>

        <div className="card">
            <div className="card-title">
                <div className="card-title-icon">📝</div> Upload Prescription
            </div>
            <div className="prescription-form">
                <div>
                    <div className="form-label">Patient Health ID</div><input className="form-input" type="text"
                        value="HID-TN-20240847" />
                </div>
                <div className="form-row">
                    <div>
                        <div className="form-label">Medicine Name</div><input className="form-input"
                            placeholder="e.g. Metformin" />
                    </div>
                    <div>
                        <div className="form-label">Dosage</div><input className="form-input" placeholder="e.g. 500mg" />
                    </div>
                </div>
                <div className="form-row">
                    <div>
                        <div className="form-label">Frequency</div><select className="form-input">
                            <option>Once daily</option>
                            <option>Twice daily</option>
                            <option>Thrice daily</option>
                            <option>Every 8 hours</option>
                        </select>
                    </div>
                    <div>
                        <div className="form-label">Duration</div><input className="form-input" placeholder="e.g. 30 days" />
                    </div>
                </div>
                <div>
                    <div className="form-label">Notes</div><textarea className="form-input"
                        placeholder="After meals, avoid alcohol..."></textarea>
                </div>
                <button className="btn btn-primary"
                    onClick={() => addNotification('💊','Prescription Added','Schedule auto-generated & patient notified')}>+ Add to
                    Schedule</button>
                <div style={{position: 'relative'}}>
                  <input type="file" onChange={handlePrescriptionUpload} style={{position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 5}} accept=".jpg,.jpeg,.png,.pdf" />
                  <button className="btn btn-secondary" style={{position: 'relative', zIndex: 1, width: '100%'}}>
                    {uploadLoading ? '⏳ Analyzing via Llama 3...' : '📎 Upload PDF / Image'}
                  </button>
                </div>
            </div>
        </div>

        <div style={{"display":"flex","flexDirection":"column","gap":"16px"}}>
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
                            <div className="doc-id-spec">Primary Health · Offline-enabled</div>
                        </div>
                        <div className="doc-id-badge">HOSP-TN-044</div>
                    </div>
                </div>
            </div>
        </div>

        <div className="card span-2">
            <div className="card-title">
                <div className="card-title-icon">📲</div> Incoming Patient Scan (Emergency / Transfer)
            </div>
            <div style={{"display":"grid","gridTemplateColumns":"220px 1fr","gap":"20px","alignItems":"start"}}>
                <div style={{"textAlign":"center"}}>
                    <div
                        style={{"background":"var(--surface2)","border":"1.5px dashed var(--border2)","borderRadius":"12px","padding":"22px","marginBottom":"12px"}}>
                        <div style={{"fontSize":"44px","marginBottom":"8px"}}>📷</div>
                        <div style={{"fontSize":"12.5px","color":"var(--text2)"}}>Scan patient QR or enter Health ID</div>
                    </div>
                    <input className="form-input" placeholder="Or type HID manually..." style={{"marginBottom":"8px"}} value={fetchHealthId} onChange={(e) => setFetchHealthId(e.target.value)} />
                    <button className="btn btn-primary"
                        onClick={handleFetchSummary} disabled={summaryLoading}>{summaryLoading ? '⌛ Processing...' : '🔍 Fetch & Summarize'}</button>

                </div>
                <div>
                    <div className="ai-summary-box">
                        <div className="ai-label">✦ AI Pre-Summary for Incoming Patient</div>
                        <div className="ai-text" style={{"marginBottom":"12px", whiteSpace: 'pre-wrap'}}>
                            {patientSummary || (
                                <>
                                    <strong>Rajan Kumar</strong> (64M) — Transferred from Ambattur PHC.<br /><br />
                                    🔴 <strong>Active conditions:</strong> Type 2 Diabetes, Hypertension, Hyperlipidemia<br />
                                    ⚠️ <strong>Allergies:</strong> Penicillin, Aspirin — <em>do not administer</em><br />
                                    💊 <strong>Current meds:</strong> Metformin 500mg (BD), Amlodipine 5mg (OD), Atorvastatin
                                    10mg (HS)<br />
                                    📋 <strong>Last visit:</strong> Mar 10, 2026 — Dr. Mehta, Diabetology<br />
                                    🧪 <strong>Last labs:</strong> Mar 5 — HbA1c 7.2%, Cholesterol 178<br />
                                    🆘 <strong>Emergency note:</strong> Chest pain history (Jan 2026), ECG normal
                                </>
                            )}
                        </div>
                        {/* Old content below will be removed manually if needed */}
                        <div style={{display: 'none'}}>
                            <strong>Rajan Kumar</strong> (64M) — Transferred from Ambattur PHC.<br /><br />
                            🔴 <strong>Active conditions:</strong> Type 2 Diabetes, Hypertension, Hyperlipidemia<br />
                            ⚠️ <strong>Allergies:</strong> Penicillin, Aspirin — <em>do not administer</em><br />
                            💊 <strong>Current meds:</strong> Metformin 500mg (BD), Amlodipine 5mg (OD), Atorvastatin
                            10mg (HS)<br />
                            📋 <strong>Last visit:</strong> Mar 10, 2026 — Dr. Mehta, Diabetology<br />
                            🧪 <strong>Last labs:</strong> Mar 5 — HbA1c 7.2%, Cholesterol 178<br />
                            🆘 <strong>Emergency note:</strong> Chest pain history (Jan 2026), ECG normal
                        </div>
                        <span className="tag">Diabetic</span>
                        <span className="tag">Hypertensive</span>
                        <span className="tag red">⚠ Penicillin Allergy</span>
                    </div>
                </div>
            </div>
        </div>

    </div>

    
    <div id="view-caregiver" className={`app ${activeView === 'caregiver' ? 'active' : ''}`} style={{gridTemplateColumns:'1fr 1fr 1fr', gap:'18px'}}>

        <div className="patient-monitor-card">
            <div className="monitor-header">
                <div className="monitor-avatar">👴</div>
                <div>
                    <div className="monitor-name">Rajan Kumar</div>
                    <div className="monitor-relation">Father · 64 yrs</div>
                </div>
                <div className="monitor-status">
                    <div className="status-dot warn"></div><span style={{"color":"var(--amber)"}}>Attention</span>
                </div>
            </div>
            <div className="monitor-meds">
                <div className="monitor-med-row"><span className="monitor-med-name">Metformin</span>
                    <div className="pill-status">
                        <div className="pill taken"></div>
                        <div className="pill taken"></div>
                        <div className="pill pending"></div>
                    </div>
                </div>
                <div className="monitor-med-row"><span className="monitor-med-name">Amlodipine</span>
                    <div className="pill-status">
                        <div className="pill taken"></div>
                        <div className="pill missed"></div>
                        <div className="pill pending"></div>
                    </div>
                </div>
                <div className="monitor-med-row"><span className="monitor-med-name">Atorvastatin</span>
                    <div className="pill-status">
                        <div className="pill taken"></div>
                        <div className="pill taken"></div>
                        <div className="pill pending"></div>
                    </div>
                </div>
            </div>
            <div className="progress-bar">
                <div className="progress-fill" style={{"width":"78%"}}></div>
            </div>
            <div style={{"fontSize":"11.5px","color":"var(--text3)","marginTop":"5px","marginBottom":"12px","fontWeight":"600"}}>78%
                adherence today</div>
            <div className="alert-banner">🔔 Evening Amlodipine missed yesterday</div>
        </div>

        <div className="patient-monitor-card">
            <div className="monitor-header">
                <div className="monitor-avatar">👵</div>
                <div>
                    <div className="monitor-name">Lakshmi Kumar</div>
                    <div className="monitor-relation">Mother · 61 yrs</div>
                </div>
                <div className="monitor-status">
                    <div className="status-dot good"></div><span style={{"color":"var(--teal)"}}>On Track</span>
                </div>
            </div>
            <div className="monitor-meds">
                <div className="monitor-med-row"><span className="monitor-med-name">Levothyroxine</span>
                    <div className="pill-status">
                        <div className="pill taken"></div>
                        <div className="pill taken"></div>
                        <div className="pill taken"></div>
                    </div>
                </div>
                <div className="monitor-med-row"><span className="monitor-med-name">Calcium+D3</span>
                    <div className="pill-status">
                        <div className="pill taken"></div>
                        <div className="pill taken"></div>
                        <div className="pill pending"></div>
                    </div>
                </div>
            </div>
            <div className="progress-bar">
                <div className="progress-fill" style={{"width":"95%"}}></div>
            </div>
            <div style={{"fontSize":"11.5px","color":"var(--text3)","marginTop":"5px","marginBottom":"12px","fontWeight":"600"}}>95%
                adherence today</div>
            <div
                style={{"background":"var(--green-light)","border":"1px solid var(--green-mid)","borderRadius":"9px","padding":"10px 13px","fontSize":"12.5px","color":"var(--green)","fontWeight":"600"}}>
                ✅ All medications on schedule
            </div>
        </div>

        <div className="card">
            <div className="card-title">
                <div className="card-title-icon">🎙️</div> Voice Health Log
            </div>
            <div className="voice-panel">
                <button className={`voice-btn ${recording ? 'recording' : ''}`} id="voiceBtn" onClick={toggleVoice} style={recording ? {background: 'linear-gradient(135deg, var(--red), #f87171)'} : {}}>{recording ? '⏹️' : '🎙️'}</button>
                <div className="voice-wave" id="voiceWave" style={{display: recording ? 'flex' : 'none'}}>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                </div>
                <div style={{"fontSize":"12.5px","color":"var(--text2)","textAlign":"center"}}>Tap to record symptoms or notes
                </div>
                <div className="voice-log-list">
                    <div className="voice-log-item">
                        <div className="voice-log-time">10:30 AM</div>
                        <div className="voice-log-text">"Father took Metformin after breakfast, slight dizziness for 10
                            mins"</div>
                    </div>
                    <div className="voice-log-item">
                        <div className="voice-log-time">8:15 AM</div>
                        <div className="voice-log-text">"Morning BP: 128/84, feels normal"</div>
                    </div>
                    <div className="voice-log-item">
                        <div className="voice-log-time">Yesterday</div>
                        <div className="voice-log-text">"Forgot evening Amlodipine, gave it late with water"</div>
                    </div>
                </div>
            </div>
        </div>

        <div className="card">
            <div className="card-title">
                <div className="card-title-icon">🔔</div> Live Alerts
            </div>
            <div className="insight-list scrollable">
                <div className="insight-item" style={{"borderLeft":"3px solid var(--red)"}}>
                    <div className="insight-icon" style={{"background":"var(--red-light)"}}>🚨</div>
                    <div className="insight-text">
                        <div className="insight-title" style={{"color":"var(--red)"}}>Medication Missed</div>
                        <div className="insight-sub">Rajan — Amlodipine 5mg (1:00 PM) not confirmed</div>
                    </div>
                </div>
                <div className="insight-item">
                    <div className="insight-icon warn">📅</div>
                    <div className="insight-text">
                        <div className="insight-title">Doctor Follow-up Due</div>
                        <div className="insight-sub">Cardiology appointment overdue — Dr. Nair</div>
                    </div>
                </div>
                <div className="insight-item">
                    <div className="insight-icon ok">✅</div>
                    <div className="insight-text">
                        <div className="insight-title">Lakshmi — All Good</div>
                        <div className="insight-sub">All medications taken. Next: Calcium+D3 at 9 PM</div>
                    </div>
                </div>
                <div className="insight-item">
                    <div className="insight-icon info">🩺</div>
                    <div className="insight-text">
                        <div className="insight-title">Lab Report Uploaded</div>
                        <div className="insight-sub">Dr. Mehta uploaded new report for Rajan</div>
                    </div>
                </div>
            </div>
        </div>

        <div className="card">
            <div className="card-title">
                <div className="card-title-icon">🆘</div> Emergency Network
            </div>
            <div className="doctor-ids" style={{"marginBottom":"14px"}}>
                <div className="doc-id-row" onClick={() => setShowSOS(true)}>
                    <div className="doc-id-avatar" style={{"background":"var(--red-light)"}}>🚑</div>
                    <div className="doc-id-info">
                        <div className="doc-id-name">Nearby Ambulance</div>
                        <div className="doc-id-spec">Ambattur — 2.3 km</div>
                    </div>
                    <div style={{"color":"var(--teal)","fontSize":"12px","fontWeight":"700"}}>Available</div>
                </div>
                <div className="doc-id-row">
                    <div className="doc-id-avatar">👨‍⚕️</div>
                    <div className="doc-id-info">
                        <div className="doc-id-name">Dr. Mehta</div>
                        <div className="doc-id-spec">On-call until 8 PM</div>
                    </div>
                    <div style={{"color":"var(--blue)","fontSize":"12px","fontWeight":"700"}}>📞 Call</div>
                </div>
            </div>
            <button className="btn btn-primary"
                style={{"background":"var(--red)","boxShadow":"0 2px 10px rgba(220,38,38,0.3)","marginBottom":"12px"}}
                onClick={() => setShowSOS(true)}>
                🆘 Trigger Emergency SOS
            </button>
            <div className="ai-summary-box">
                <div className="ai-label">⚡ Offline Mode Active</div>
                <div className="ai-text" style={{"fontSize":"12px"}}>Critical data cached locally. SMS alerts queue and send
                    when internet restores.</div>
            </div>
        </div>

    </div>

    
    </>
  );
}

export default App;
