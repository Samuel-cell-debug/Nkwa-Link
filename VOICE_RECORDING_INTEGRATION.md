# Voice Recording Integration Guide

## Developer Documentation

This guide provides information for developers who want to integrate audio upload functionality or extend the voice recording feature.

## Accessing Recorded Audio

The recorded audio blob is globally accessible after a recording is completed:

```javascript
// Audio blob (Blob object containing WAV audio)
window.emergencyAudioBlob

// Recording duration string (MM:SS format)
window.emergencyAudioDuration
```

## Uploading Audio to Backend

### Method 1: FormData with Emergency Report

Modify the `handleEmergencySubmit()` function to include audio:

```javascript
function handleEmergencySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('type', document.getElementById('emergencyType').value);
    formData.append('priority', document.getElementById('priorityLevel').value);
    formData.append('location', document.getElementById('locationInput').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('contact', document.getElementById('contactNumber').value);
    
    // Add audio if available
    if (window.emergencyAudioBlob) {
        formData.append('audio', window.emergencyAudioBlob, 'emergency_audio.wav');
        formData.append('audioDuration', window.emergencyAudioDuration);
    }
    
    // Send to backend
    fetch('/api/emergency-report', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Handle response
        window.emergencyAudioBlob = null;
        window.emergencyAudioDuration = null;
    })
    .catch(error => console.error('Error:', error));
}
```

### Method 2: Separate Audio Upload

Upload audio independently from emergency report:

```javascript
async function uploadVoiceRecording() {
    if (!window.emergencyAudioBlob) return;
    
    const formData = new FormData();
    formData.append('audio', window.emergencyAudioBlob, 'emergency_audio.wav');
    formData.append('duration', window.emergencyAudioDuration);
    
    try {
        const response = await fetch('/api/upload-voice-recording', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        return data.recordingId;
    } catch (error) {
        console.error('Audio upload failed:', error);
        return null;
    }
}
```

### Method 3: Audio Stream (for large files)

For streaming audio without loading entire file in memory:

```javascript
// Capture audio with higher quality
async function startHighQualityRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
            sampleRate: 16000
        }
    });
    
    const mediaRecorder = new MediaRecorder(stream, {
        audioBitsPerSecond: 128000,
        mimeType: 'audio/webm'
    });
    
    // ... rest of recording logic
}
```

## Backend Integration Examples

### Node.js/Express

```javascript
const express = require('express');
const multer = require('multer');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/audio/' });

app.post('/api/emergency-report', upload.single('audio'), (req, res) => {
    const emergencyData = {
        type: req.body.type,
        priority: req.body.priority,
        location: req.body.location,
        description: req.body.description,
        contact: req.body.contact,
        audioFile: req.file ? req.file.filename : null,
        audioDuration: req.body.audioDuration,
        timestamp: new Date()
    };
    
    // Save to database
    // Process emergency
    // Send to responders
    
    res.json({ 
        success: true, 
        reportId: generateReportId(),
        audioId: emergencyData.audioFile 
    });
});
```

### Python/Flask

```python
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/audio'

@app.route('/api/emergency-report', methods=['POST'])
def handle_emergency_report():
    audio_file = request.files.get('audio')
    
    emergency_data = {
        'type': request.form.get('type'),
        'priority': request.form.get('priority'),
        'location': request.form.get('location'),
        'description': request.form.get('description'),
        'contact': request.form.get('contact'),
        'audioDuration': request.form.get('audioDuration')
    }
    
    audio_filename = None
    if audio_file:
        audio_filename = secure_filename(audio_file.filename)
        audio_file.save(os.path.join(app.config['UPLOAD_FOLDER'], audio_filename))
        emergency_data['audioFile'] = audio_filename
    
    # Save to database
    # Process emergency
    # Dispatch to responders
    
    return jsonify({
        'success': True,
        'reportId': generate_report_id(),
        'audioId': audio_filename
    })
```

### PHP

```php
<?php
$emergency_data = [
    'type' => $_POST['type'],
    'priority' => $_POST['priority'],
    'location' => $_POST['location'],
    'description' => $_POST['description'],
    'contact' => $_POST['contact'],
    'audioDuration' => $_POST['audioDuration']
];

$audio_filename = null;
if ($_FILES['audio']['size'] > 0) {
    $upload_dir = 'uploads/audio/';
    $audio_filename = uniqid() . '_' . basename($_FILES['audio']['name']);
    
    if (move_uploaded_file($_FILES['audio']['tmp_name'], $upload_dir . $audio_filename)) {
        $emergency_data['audioFile'] = $audio_filename;
    }
}

// Save to database
// Process emergency
// Dispatch to responders

echo json_encode([
    'success' => true,
    'reportId' => generate_report_id(),
    'audioId' => $audio_filename
]);
?>
```

## Audio Processing

### Transcription (Speech-to-Text)

Integrate with Google Cloud Speech-to-Text or similar service:

```javascript
async function transcribeVoiceRecording() {
    if (!window.emergencyAudioBlob) return;
    
    const reader = new FileReader();
    reader.readAsArrayBuffer(window.emergencyAudioBlob);
    
    reader.onload = async () => {
        const audioBytes = reader.result;
        const base64Audio = btoa(String.fromCharCode.apply(null, new Uint8Array(audioBytes)));
        
        // Send to Speech-to-Text API
        const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify({
                config: {
                    encoding: 'LINEAR16',
                    languageCode: 'en-US',
                    sampleRateHertz: 16000
                },
                audio: {
                    content: base64Audio
                }
            })
        });
        
        const result = await response.json();
        const transcript = result.results
            ?.map(r => r.alternatives[0].transcript)
            .join(' ');
        
        return transcript;
    };
}
```

### Audio Analysis

Extract metadata or analyze audio for emergency keywords:

```javascript
async function analyzeAudioContent() {
    if (!window.emergencyAudioBlob) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await window.emergencyAudioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get audio properties
    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const channelData = audioBuffer.getChannelData(0);
    
    // Calculate RMS (energy) to detect speech intensity
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sum / channelData.length);
    
    return {
        duration,
        sampleRate,
        numberOfChannels,
        loudness: rms
    };
}
```

## Security Considerations

### Input Validation

```javascript
function validateAudioBlob(blob) {
    // Check MIME type
    if (blob.type !== 'audio/wav') {
        throw new Error('Invalid audio format');
    }
    
    // Check file size (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (blob.size > MAX_SIZE) {
        throw new Error('Audio file too large');
    }
    
    return true;
}
```

### Rate Limiting

```javascript
const recordingAttempts = new Map();

function checkRecordingRateLimit(userId) {
    const now = Date.now();
    const attempts = recordingAttempts.get(userId) || [];
    
    // Remove attempts older than 1 hour
    const recentAttempts = attempts.filter(t => now - t < 3600000);
    
    // Limit to 10 recordings per hour
    if (recentAttempts.length >= 10) {
        return false;
    }
    
    recentAttempts.push(now);
    recordingAttempts.set(userId, recentAttempts);
    return true;
}
```

## Database Schema

### Emergency Report with Audio

```sql
CREATE TABLE emergency_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id VARCHAR(50) UNIQUE,
    emergency_type VARCHAR(50),
    priority VARCHAR(20),
    location VARCHAR(255),
    description TEXT,
    contact VARCHAR(20),
    audio_file_path VARCHAR(255),
    audio_duration VARCHAR(10),
    audio_transcription TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    responder_assigned_id INT,
    FOREIGN KEY (responder_assigned_id) REFERENCES responders(id)
);

CREATE TABLE audio_metadata (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT,
    sample_rate INT,
    channels INT,
    bit_depth INT,
    codec VARCHAR(50),
    file_size INT,
    duration_ms INT,
    FOREIGN KEY (report_id) REFERENCES emergency_reports(id)
);
```

## Testing

### Unit Tests

```javascript
describe('Voice Recording', () => {
    it('should record audio and create blob', async () => {
        await startVoiceRecording();
        expect(isRecording).toBe(true);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        stopVoiceRecording();
        
        expect(audioBlob).toBeDefined();
        expect(audioBlob.type).toBe('audio/wav');
    });
    
    it('should validate audio before upload', () => {
        expect(() => validateAudioBlob(audioBlob)).not.toThrow();
    });
});
```

### Integration Tests

```javascript
describe('Audio Upload', () => {
    it('should upload audio with emergency report', async () => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'test.wav');
        
        const response = await fetch('/api/emergency-report', {
            method: 'POST',
            body: formData
        });
        
        expect(response.status).toBe(200);
    });
});
```

## Performance Optimization

### Compress Audio Before Upload

```javascript
async function compressAudio() {
    const audioContext = new AudioContext();
    const arrayBuffer = await window.emergencyAudioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Downsample to 8kHz for emergency dispatch
    const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length * 8000 / audioBuffer.sampleRate,
        8000
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    const renderedBuffer = await offlineContext.startRendering();
    return new Blob([encodeWAV(renderedBuffer)], { type: 'audio/wav' });
}
```

---

## References

- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
