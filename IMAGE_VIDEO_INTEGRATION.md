# Image & Video Integration Guide - Developers

## Developer Documentation

This guide provides technical information for developers integrating image/video upload functionality with backend systems.

## Accessing Captured Media

Media blobs are globally accessible after capture/upload:

```javascript
// Photo data
window.emergencyPhotoBlob    // Blob object containing JPEG
window.emergencyMediaType    // Set to 'photo'

// Video data
window.emergencyVideoBlob    // Blob object containing WebM
window.emergencyMediaType    // Set to 'video'
```

## Uploading Media with Emergency Report

### Method 1: FormData with Emergency Report (Recommended)

Modify `handleEmergencySubmit()` function:

```javascript
function handleEmergencySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('type', document.getElementById('emergencyType').value);
    formData.append('priority', document.getElementById('priorityLevel').value);
    formData.append('location', document.getElementById('locationInput').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('contact', document.getElementById('contactNumber').value);
    
    // Add media if available
    if (window.emergencyPhotoBlob) {
        formData.append('media', window.emergencyPhotoBlob, 'emergency_photo.jpg');
        formData.append('mediaType', 'photo');
    } else if (window.emergencyVideoBlob) {
        formData.append('media', window.emergencyVideoBlob, 'emergency_video.webm');
        formData.append('mediaType', 'video');
    }
    
    // Send to backend
    fetch('/api/emergency-report', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Report submitted:', data);
        window.emergencyPhotoBlob = null;
        window.emergencyVideoBlob = null;
        window.emergencyMediaType = null;
    })
    .catch(error => console.error('Error:', error));
}
```

### Method 2: Separate Media Upload

Upload media independently from report:

```javascript
async function uploadEmergencyMedia() {
    let mediaBlob = window.emergencyPhotoBlob || window.emergencyVideoBlob;
    let mediaType = window.emergencyMediaType;
    
    if (!mediaBlob) return;
    
    const formData = new FormData();
    formData.append('media', mediaBlob);
    formData.append('type', mediaType);
    
    try {
        const response = await fetch('/api/upload-emergency-media', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        return data.mediaId;
    } catch (error) {
        console.error('Media upload failed:', error);
        return null;
    }
}

// Then reference mediaId in emergency report
```

### Method 3: Chunked Upload for Large Files

For videos or high-resolution photos:

```javascript
async function uploadMediaInChunks(blob, chunkSize = 1024 * 1024) {
    const totalChunks = Math.ceil(blob.size / chunkSize);
    const uploadId = generateUploadId();
    
    for (let i = 0; i < totalChunks; i++) {
        const chunk = blob.slice(i * chunkSize, (i + 1) * chunkSize);
        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', i);
        formData.append('totalChunks', totalChunks);
        formData.append('chunk', chunk);
        
        await fetch('/api/upload-media-chunk', {
            method: 'POST',
            body: formData
        });
        
        // Progress update
        console.log(`Uploaded chunk ${i + 1}/${totalChunks}`);
    }
    
    // Finalize upload
    const response = await fetch('/api/finalize-media-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId })
    });
    
    return (await response.json()).mediaId;
}
```

## Backend Integration Examples

### Node.js/Express

```javascript
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ 
    dest: 'uploads/media/',
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max
    }
});

app.post('/api/emergency-report', upload.single('media'), (req, res) => {
    const reportData = {
        type: req.body.type,
        priority: req.body.priority,
        location: req.body.location,
        description: req.body.description,
        contact: req.body.contact,
        mediaFile: req.file ? req.file.filename : null,
        mediaType: req.body.mediaType,
        mediaSize: req.file ? req.file.size : 0,
        timestamp: new Date()
    };
    
    // Validate media if present
    if (req.file) {
        if (req.body.mediaType === 'photo' && !isValidPhoto(req.file)) {
            return res.status(400).json({ error: 'Invalid photo format' });
        }
        if (req.body.mediaType === 'video' && !isValidVideo(req.file)) {
            return res.status(400).json({ error: 'Invalid video format' });
        }
    }
    
    // Save to database
    // Process emergency
    // Send to responders
    
    res.json({ 
        success: true, 
        reportId: generateReportId(),
        mediaId: reportData.mediaFile
    });
});

function isValidPhoto(file) {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    return validMimes.includes(file.mimetype);
}

function isValidVideo(file) {
    const validMimes = ['video/webm', 'video/mp4', 'video/quicktime'];
    return validMimes.includes(file.mimetype);
}
```

### Python/Flask

```python
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
from datetime import datetime

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/media'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB

ALLOWED_PHOTO_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'webm', 'mp4', 'mov'}

@app.route('/api/emergency-report', methods=['POST'])
def handle_emergency_report():
    media_file = request.files.get('media')
    
    report_data = {
        'type': request.form.get('type'),
        'priority': request.form.get('priority'),
        'location': request.form.get('location'),
        'description': request.form.get('description'),
        'contact': request.form.get('contact'),
        'mediaType': request.form.get('mediaType'),
        'timestamp': datetime.now()
    }
    
    media_filename = None
    if media_file:
        # Validate file
        if not is_allowed_file(media_file, report_data['mediaType']):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Save file
        media_filename = secure_filename(media_file.filename)
        media_filename = f"{datetime.now().timestamp()}_{media_filename}"
        media_file.save(os.path.join(app.config['UPLOAD_FOLDER'], media_filename))
        report_data['mediaFile'] = media_filename
    
    # Save to database
    # Process emergency
    # Dispatch to responders
    
    return jsonify({
        'success': True,
        'reportId': generate_report_id(),
        'mediaId': media_filename
    })

def is_allowed_file(file, media_type):
    if '.' not in file.filename:
        return False
    ext = file.filename.rsplit('.', 1)[1].lower()
    if media_type == 'photo':
        return ext in ALLOWED_PHOTO_EXTENSIONS
    elif media_type == 'video':
        return ext in ALLOWED_VIDEO_EXTENSIONS
    return False
```

### PHP

```php
<?php
$max_size = 50 * 1024 * 1024; // 50MB
$upload_dir = 'uploads/media/';

$report_data = [
    'type' => $_POST['type'],
    'priority' => $_POST['priority'],
    'location' => $_POST['location'],
    'description' => $_POST['description'],
    'contact' => $_POST['contact'],
    'mediaType' => $_POST['mediaType']
];

$media_filename = null;

if ($_FILES['media']['size'] > 0) {
    // Validate file size
    if ($_FILES['media']['size'] > $max_size) {
        http_response_code(413);
        echo json_encode(['error' => 'File too large']);
        exit;
    }
    
    // Validate file type
    $allowed_photos = ['image/jpeg', 'image/png', 'image/webp'];
    $allowed_videos = ['video/webm', 'video/mp4', 'video/quicktime'];
    
    $allowed_types = $report_data['mediaType'] === 'photo' ? $allowed_photos : $allowed_videos;
    
    if (!in_array($_FILES['media']['type'], $allowed_types)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type']);
        exit;
    }
    
    // Save file
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    $media_filename = uniqid() . '_' . basename($_FILES['media']['name']);
    
    if (move_uploaded_file($_FILES['media']['tmp_name'], $upload_dir . $media_filename)) {
        $report_data['mediaFile'] = $media_filename;
    }
}

// Save to database
// Process emergency
// Dispatch to responders

echo json_encode([
    'success' => true,
    'reportId' => generate_report_id(),
    'mediaId' => $media_filename
]);

function generate_report_id() {
    return 'NK-' . date('Y') . '-' . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
}
?>
```

## Media Processing

### Image Optimization

```python
from PIL import Image
import io

def optimize_image(file_path, max_width=1920, max_height=1080, quality=85):
    """Optimize image for emergency dispatch"""
    img = Image.open(file_path)
    
    # Resize if needed
    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
    
    # Convert to RGB if needed (remove alpha channel)
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    
    # Save optimized
    img.save(file_path, 'JPEG', quality=quality, optimize=True)
    return file_path

# Usage
optimize_image('uploads/media/photo.jpg')
```

### Video Transcoding

```bash
#!/bin/bash
# Convert video to optimized format for streaming

input_file=$1
output_file=${input_file%.*}_optimized.mp4

ffmpeg -i "$input_file" \
    -vcodec libx264 \
    -crf 23 \
    -preset fast \
    -acodec aac \
    -b:a 128k \
    -movflags +faststart \
    "$output_file"
```

### Thumbnail Generation

```python
from PIL import Image
import os

def generate_thumbnail(video_path, timestamp=0, size=(320, 240)):
    """Generate thumbnail from video"""
    import subprocess
    
    thumbnail_path = video_path.replace('.webm', '_thumb.jpg')
    
    subprocess.run([
        'ffmpeg',
        '-i', video_path,
        '-ss', str(timestamp),
        '-vf', f'scale={size[0]}:{size[1]}:force_original_aspect_ratio=decrease',
        '-vframes', '1',
        thumbnail_path
    ])
    
    return thumbnail_path
```

## Database Schema

### Emergency Report with Media

```sql
CREATE TABLE emergency_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id VARCHAR(50) UNIQUE,
    emergency_type VARCHAR(50),
    priority VARCHAR(20),
    location VARCHAR(255),
    description TEXT,
    contact VARCHAR(20),
    media_file_path VARCHAR(255),
    media_type ENUM('photo', 'video'),
    media_size_bytes INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    responder_assigned_id INT,
    FOREIGN KEY (responder_assigned_id) REFERENCES responders(id)
);

CREATE TABLE media_metadata (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT,
    width INT,
    height INT,
    duration_ms INT,
    file_format VARCHAR(20),
    file_size INT,
    created_at TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES emergency_reports(id)
);

-- Index for faster queries
CREATE INDEX idx_report_media ON emergency_reports(media_type);
CREATE INDEX idx_media_size ON emergency_reports(media_size_bytes);
```

## Validation & Security

### Input Validation

```javascript
function validateMediaUpload(blob, mediaType) {
    // Check file size
    const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
    
    const maxSize = mediaType === 'photo' ? MAX_PHOTO_SIZE : MAX_VIDEO_SIZE;
    
    if (blob.size > maxSize) {
        throw new Error(`File too large. Maximum ${maxSize / 1024 / 1024}MB`);
    }
    
    // Check MIME type
    const validMimes = {
        photo: ['image/jpeg', 'image/png', 'image/webp'],
        video: ['video/webm', 'video/mp4', 'video/quicktime']
    };
    
    if (!validMimes[mediaType]?.includes(blob.type)) {
        throw new Error('Invalid file type');
    }
    
    return true;
}
```

### Server-Side Validation

```python
def validate_media_file(file_path, media_type):
    """Validate uploaded media file"""
    import subprocess
    import magic
    
    # Check MIME type
    mime = magic.Magic(mime=True)
    detected_mime = mime.from_file(file_path)
    
    valid_mimes = {
        'photo': ['image/jpeg', 'image/png', 'image/webp'],
        'video': ['video/webm', 'video/mp4', 'video/quicktime']
    }
    
    if detected_mime not in valid_mimes.get(media_type, []):
        raise ValueError(f'Invalid MIME type: {detected_mime}')
    
    # Verify file integrity
    if media_type == 'video':
        result = subprocess.run(
            ['ffmpeg', '-v', 'error', '-i', file_path, '-f', 'null', '-'],
            capture_output=True
        )
        if result.returncode != 0:
            raise ValueError('Corrupted video file')
    
    return True
```

## Rate Limiting

```javascript
const mediaUploadAttempts = new Map();

function checkMediaUploadRateLimit(userId) {
    const now = Date.now();
    const hour = 3600000;
    
    const attempts = mediaUploadAttempts.get(userId) || [];
    const recentAttempts = attempts.filter(t => now - t < hour);
    
    // Limit to 20 media uploads per hour
    if (recentAttempts.length >= 20) {
        return false;
    }
    
    recentAttempts.push(now);
    mediaUploadAttempts.set(userId, recentAttempts);
    return true;
}
```

## Testing

### Unit Tests

```javascript
describe('Image/Video Capture', () => {
    it('should capture photo from camera', async () => {
        await startCamera();
        expect(cameraStream).toBeDefined();
        
        takeScreenshot();
        expect(capturedPhotoBlob).toBeDefined();
        expect(capturedPhotoBlob.type).toBe('image/jpeg');
    });
    
    it('should validate media before upload', () => {
        expect(() => validateMediaUpload(photoBlob, 'photo')).not.toThrow();
    });
});
```

### Integration Tests

```javascript
describe('Media Upload', () => {
    it('should upload photo with emergency report', async () => {
        const formData = new FormData();
        formData.append('media', capturedPhotoBlob, 'test.jpg');
        formData.append('mediaType', 'photo');
        
        const response = await fetch('/api/emergency-report', {
            method: 'POST',
            body: formData
        });
        
        expect(response.status).toBe(200);
    });
});
```

## Performance Optimization

### Compression Before Upload

```javascript
async function compressImage(blob) {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    
    return new Promise((resolve) => {
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 1920;
                const maxHeight = 1080;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(resolve, 'image/jpeg', 0.85);
            };
            img.src = e.target.result;
        };
    });
}
```

---

## References

- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
