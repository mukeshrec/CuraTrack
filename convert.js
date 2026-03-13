const fs = require('fs');

const html = fs.readFileSync('app.html', 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
    fs.writeFileSync('CuraTrack/src/index.css', styleMatch[1].trim());
}

let bodyMatch = html.match(/<body>([\s\S]*?)<!-- SOS MODAL -->/);
if (!bodyMatch) {
    bodyMatch = html.match(/<body>([\s\S]*?)<script>/);
}
let bodyContent = bodyMatch ? bodyMatch[1] : '';

let jsx = bodyContent
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/onclick=/g, 'onClick=')
    .replace(/style="([^"]+)"/g, (match, styleString) => {
        const styles = styleString.split(';').filter(s => s.trim().length > 0);
        const styleObj = {};
        styles.forEach(s => {
            let [key, ...valueArr] = s.split(':');
            let value = valueArr.join(':').trim();
            key = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            styleObj[key] = value;
        });
        return `style={${JSON.stringify(styleObj)}}`;
    })
    .replace(/<input([^>]*?[^\/])>/g, '<input$1 />')
    .replace(/<img([^>]*?[^\/])>/g, '<img$1 />')
    .replace(/<br>/g, '<br />')
    .replace(/<hr>/g, '<hr />');

// Custom Logic Replacements

// 1. App Active state
jsx = jsx.replace(/<div id="view-patient" className="app active">/, "<div id=\"view-patient\" className={`app ${activeView === 'patient' ? 'active' : ''}`}>");
jsx = jsx.replace(/<div id="view-doctor" className="app"[^>]*>/, "<div id=\"view-doctor\" className={`app ${activeView === 'doctor' ? 'active' : ''}`} style={{gridTemplateColumns:'1fr 1fr', gridTemplateRows:'auto auto', gap:'20px'}}>");
jsx = jsx.replace(/<div id="view-caregiver" className="app"[^>]*>/, "<div id=\"view-caregiver\" className={`app ${activeView === 'caregiver' ? 'active' : ''}`} style={{gridTemplateColumns:'1fr 1fr 1fr', gap:'18px'}}>");

// 2. Nav Tabs
jsx = jsx.replace(/<button className="nav-tab active" onClick="switchView\('patient',this\)">Patient View<\/button>/, "<button className={`nav-tab ${activeView === 'patient' ? 'active' : ''}`} onClick={() => setActiveView('patient')}>Patient View</button>");
jsx = jsx.replace(/<button className="nav-tab" onClick="switchView\('doctor',this\)">Doctor Portal<\/button>/, "<button className={`nav-tab ${activeView === 'doctor' ? 'active' : ''}`} onClick={() => setActiveView('doctor')}>Doctor Portal</button>");
jsx = jsx.replace(/<button className="nav-tab" onClick="switchView\('caregiver',this\)">Caregiver Dashboard<\/button>/, "<button className={`nav-tab ${activeView === 'caregiver' ? 'active' : ''}`} onClick={() => setActiveView('caregiver')}>Caregiver Dashboard</button>");

// 3. Handlers
jsx = jsx.replace(/onClick="showSOS\(\)"/g, 'onClick={() => setShowSOS(true)}');
jsx = jsx.replace(/onClick="toggleVoice\(\)"/g, 'onClick={toggleVoice}');
jsx = jsx.replace(/onClick="showNotif\(([^)]+)\)"/g, 'onClick={() => addNotification($1)}');

// 4. Logo & Name
jsx = jsx.replace(/<div className="nav-logo-icon">💊<\/div>/g, '<img src={logoImg} alt="CuraTrack Base Logo" style={{width: 34, height: 34, borderRadius: 10, objectFit: "cover"}} />');
jsx = jsx.replace(/MediCare Connect/g, "CuraTrack");

// 5. QR Code
jsx = jsx.replace(/<div className="qr-container" id="qrCode"><\/div>/, `<div className="qr-container" id="qrCode">{[1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1].map((v, i) => (<div key={i} className={'qr-cell' + (v ? '' : ' w')}></div>))}</div>`);

// 6. Voice Wave & Btn Logic
jsx = jsx.replace(/<button className="voice-btn" id="voiceBtn" onClick=\{toggleVoice\}>🎙️<\/button>/, `<button className={\`voice-btn \${recording ? 'recording' : ''}\`} id="voiceBtn" onClick={toggleVoice} style={recording ? {background: 'linear-gradient(135deg, var(--red), #f87171)'} : {}}>{recording ? '⏹️' : '🎙️'}</button>`);
jsx = jsx.replace(/<div className="voice-wave" id="voiceWave" style=\{\{"display":"none"\}\}>([\s\S]*?)<\/div>/, `<div className="voice-wave" id="voiceWave" style={{display: recording ? 'flex' : 'none'}}>$1</div>`);

const component = `
import { useState, useEffect } from 'react';
import './index.css';
import logoImg from './assets/image.png';

function App() {
  const [activeView, setActiveView] = useState('patient');
  const [recording, setRecording] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Initial notifications mock
    const t1 = setTimeout(() => addNotification('⚠️', 'Medication Due', 'Amlodipine 5mg due for Rajan Kumar at 1:00 PM'), 2000);
    const t2 = setTimeout(() => addNotification('🤖', 'AI Alert', 'BP pattern suggests elevated risk — schedule follow-up'), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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

      <div className={\`modal-overlay \${showSOS ? 'active' : ''}\`} onClick={(e) => { if (e.target.className.includes('modal-overlay')) setShowSOS(false); }}>
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

      ${jsx}
    </>
  );
}

export default App;
`;

fs.writeFileSync('CuraTrack/src/App.jsx', component);
console.log('Conversion completed successfully.');
