# Image & Video Capture Feature - Citizens Dashboard

## Overview

The Nkwalink Emergency Response Platform now includes comprehensive **image and video capture capabilities** for citizens to document emergencies visually. This feature allows users to capture photos and record videos directly from their device's camera or upload existing media files.

## Features

### 📷 Photo Capture
- **Live Camera Access**: Real-time camera feed from device
- **Instant Snapshot**: Take photos directly from camera feed
- **File Upload**: Upload existing photos from device storage
- **Preview Display**: Visual preview before submitting

### 🎥 Video Recording
- **Direct Recording**: Record videos with audio from device camera
- **Duration Limit**: Automatic stop at 2 minutes maximum
- **Recording Timer**: Real-time timer display (MM:SS format)
- **Video Playback**: Built-in player with playback controls
- **File Upload**: Upload existing videos from device storage

### 📁 Media Formats
- **Photos**: JPEG format (compressed for efficiency)
- **Videos**: WebM format with audio support
- **Quality**: Full camera resolution maintained
- **File Size**: Optimized for mobile-first usage

### 🔒 User Control
- **Camera Permission**: Explicit browser permission required
- **Media Preview**: Always preview before submitting
- **Easy Switching**: Quick toggle between photo and video modes
- **Close Anytime**: Cancel without saving any media

## How to Use

### Step 1: Start Emergency Report
1. Click the **"Report Emergency"** button
2. Fill in the emergency details (type, location, priority)

### Step 2: Add Media Evidence
1. Click the **"Photo"** button in the media section
2. The media capture modal will open

### Photo Capture Method 1: Direct Camera
1. Click **"📷 Start Camera"** to enable camera
2. Position camera to capture the emergency
3. Click **"📸 Take Shot"** to capture photo
4. Review the photo in the preview
5. Click **"⏹ Stop"** when done

### Photo Capture Method 2: Upload Existing
1. Click **"Or Upload Existing Photo"** section
2. Select a photo from your device
3. Photo will be loaded and displayed

### Video Recording Method 1: Direct Recording
1. Click the **"🎥 Video"** tab
2. Click **"📹 Start Recording"** to begin
3. Record the emergency situation (up to 2 minutes)
4. The timer will display recording duration
5. Click **"⏹ Stop"** to end recording
6. Video playback will appear automatically

### Video Recording Method 2: Upload Existing
1. Click the **"🎥 Video"** tab
2. Click **"Or Upload Existing Video"** section
3. Select a video from your device
4. Video will be loaded and ready

### Step 3: Submit with Media
1. Click **"✓ Use Media"** to attach to report
2. Modal closes and description is auto-filled
3. Complete remaining form fields
4. Click **"Submit Report"** to send with media attachment

## Technical Implementation

### Core Components

#### 1. **Media Modal HTML**
- Two main tabs: Photo and Video
- Camera preview area for live feed
- Media preview areas for captured/uploaded content
- Recording timer display
- File upload inputs
- Error message container
- Action buttons (Start, Stop, Use Media, Close)

#### 2. **State Variables**
```javascript
// Photo capture
let cameraStream = null;              // Camera MediaStream
let capturedPhotoBlob = null;         // Captured photo blob

// Video recording
let videoStream = null;               // Video MediaStream
let videoMediaRecorder = null;        // MediaRecorder for video
let videoChunks = [];                 // Video data chunks
let recordedVideoBlob = null;         // Recorded video blob
let videoRecordingStartTime = null;   // Recording start time
let videoRecordingTimer = null;       // Recording timer interval
let isVideoRecording = false;         // Recording status
let currentMediaType = 'photo';       // Current mode: 'photo' or 'video'
```

#### 3. **Main Functions**

##### Photo Functions

###### `startCamera()`
- Requests camera access with environment-facing mode
- Streams video to camera preview element
- Shows camera preview and control buttons
- Handles permission errors

###### `takeScreenshot()`
- Captures current video frame
- Converts frame to image blob (JPEG)
- Displays preview
- Shows use media button

###### `stopCamera()`
- Releases camera stream
- Stops all video tracks
- Hides camera preview
- Resets button states

##### Video Functions

###### `startVideoRecording()`
- Requests camera and microphone access
- Creates MediaRecorder instance
- Displays video preview
- Starts recording timer (max 120 seconds)
- Auto-stops at 2 minutes

###### `stopVideoRecording()`
- Stops the MediaRecorder
- Releases camera and microphone tracks
- Displays video playback player
- Shows use media button

##### Utility Functions

###### `useMediaCapture()`
- Embeds media data into emergency report
- Stores media globally for backend integration
- Closes modal and resets UI
- Shows confirmation notification

###### `handlePhotoUpload(file)`
- Reads uploaded photo file
- Validates and processes image
- Displays in preview
- Prepares for submission

###### `handleVideoUpload(file)`
- Reads uploaded video file
- Displays in playback player
- Prepares for submission

###### `handleMediaError(error)`
- Handles permission denied errors
- Handles device not found errors
- Handles HTTPS security errors
- Displays user-friendly error messages

### Media Format Specifications

#### Photo Format
- **Codec**: JPEG
- **Quality**: 90% (0.9)
- **Canvas**: Full device resolution
- **Color Space**: RGB
- **MIME Type**: image/jpeg

#### Video Format
- **Codec**: VP8 (WebM container)
- **Audio**: YES (Opus codec)
- **Duration**: 0-120 seconds (2 minutes max)
- **MIME Type**: video/webm

### Error Handling

| Error | Cause | Message | Solution |
|-------|-------|---------|----------|
| **NotAllowedError** | Permission denied | "Camera access denied" | Allow camera in settings |
| **NotFoundError** | No camera detected | "No camera found" | Connect camera device |
| **SecurityError** | HTTP used | "HTTPS required" | Use HTTPS connection |
| **Other Errors** | Unknown issue | Specific error details | Check browser console |

## Integration with Emergency Report

### Photo Data
When a photo is used, the following is stored:
```javascript
window.emergencyPhotoBlob    // Blob object containing JPEG
window.emergencyMediaType    // Set to 'photo'
```

### Video Data
When a video is used:
```javascript
window.emergencyVideoBlob    // Blob object containing WebM
window.emergencyMediaType    // Set to 'video'
```

### Description Field
The description is auto-filled with:
- **Photo**: "[PHOTO ATTACHED] Emergency situation captured visually..."
- **Video**: "[VIDEO ATTACHED - MM:SS] Emergency situation captured on video..."

## Browser Support

| Browser | Photo | Video | Min Version |
|---------|-------|-------|-------------|
| Chrome | ✅ | ✅ | 49+ |
| Firefox | ✅ | ✅ | 25+ |
| Safari | ✅ | ✅ | 14+ |
| Edge | ✅ | ✅ | 79+ |
| Opera | ✅ | ✅ | 36+ |
| IE | ❌ | ❌ | N/A |

## Security & Privacy

✅ **Camera/Microphone Access**:
- Browser requests explicit user permission
- Permission can be managed in browser settings
- Devices automatically released after use
- No background access possible

✅ **Media Data**:
- Stored temporarily in browser memory
- Associated with emergency report
- Not auto-transmitted to external services
- Subject to report security policies

✅ **HTTPS Requirement**:
- getUserMedia requires HTTPS for security
- Exception: localhost allowed for testing
- Prevents man-in-the-middle attacks

## Performance Optimization

### Memory Management
- Stream tracks properly released after capture
- Blobs created efficiently
- Canvas resources freed immediately
- Timer intervals cleared on stop

### File Size
- Photos compressed to 90% JPEG quality
- Videos encoded in WebM (efficient codec)
- Optimized for mobile bandwidth
- Suitable for emergency dispatch systems

### Device Compatibility
- Responsive to screen size
- Works with front and back cameras
- Handles mobile device restrictions
- iOS Safari permissions managed

## Known Limitations

1. **Browser-Based Storage**: Media stored in memory, not persistent
2. **No Automatic Upload**: Requires form submission for upload
3. **Video Duration**: Limited to 2 minutes for efficiency
4. **Screen Recording**: Cannot capture screen (camera only)
5. **HTTPS Required**: Exception for localhost development
6. **Mobile Restrictions**: iOS/Android specific permissions needed

## Future Enhancements

Planned improvements:
- [ ] Image compression and resizing options
- [ ] Photo filters and enhancement tools
- [ ] Video quality/bitrate selection
- [ ] Multi-file upload support
- [ ] Photo gallery integration
- [ ] Real-time image analysis for hazards
- [ ] Video stabilization
- [ ] HDR photo support
- [ ] Batch upload capability
- [ ] Cloud storage integration

## Troubleshooting

### Camera won't start
- Check browser camera permissions
- Ensure HTTPS is used (except localhost)
- Try different browser
- Restart browser
- Check system camera settings

### Can't see video preview
- Verify camera is working in other apps
- Check browser permissions
- Ensure good lighting for camera
- Try different camera app first

### Photos are too dark/bright
- Adjust lighting conditions
- Move closer or farther from subject
- Wait for auto-exposure adjustment
- Try in better lighting

### Video recording stops unexpectedly
- May have hit 2-minute limit
- Browser permission may have been revoked
- Device storage may be full
- Try shorter recording

### File uploads aren't working
- Check file format (JPEG for photos, MP4/WebM for video)
- Verify file size is reasonable
- Ensure file isn't corrupted
- Try different file

## Testing

### Manual Testing Checklist
- [ ] Photo capture from live camera
- [ ] Photo preview displays correctly
- [ ] Video recording starts and stops
- [ ] Video timer counts correctly
- [ ] Video playback works
- [ ] File upload works for photos
- [ ] File upload works for videos
- [ ] Media attaches to report
- [ ] Description field is auto-filled
- [ ] Error messages display properly

### Browser Compatibility Testing
- [ ] Test in Chrome/Firefox/Safari/Edge
- [ ] Test on mobile device
- [ ] Test with camera permission denied
- [ ] Test with no camera connected
- [ ] Test on HTTPS and localhost

### Permissions Testing
- [ ] First-time permission prompt appears
- [ ] Permission can be allowed
- [ ] Permission can be denied
- [ ] Permission can be reset in settings

## Mobile Considerations

### iOS
- Safari 14+ required
- User must grant camera permission
- Microphone permission separate from camera
- May need to go to Settings > Privacy to manage

### Android
- Chrome, Firefox, and other Chromium browsers
- Permission prompt on first use
- Can be managed in Settings > Apps > Permissions
- Multiple camera selection available

## Accessibility

✅ **Keyboard Navigation**:
- All buttons accessible via Tab key
- Enter/Space to activate buttons
- Logical tab order

✅ **Screen Readers**:
- Buttons have descriptive labels
- Error messages announced
- Status updates described

✅ **High Contrast**:
- Color used with text labels
- Good contrast ratios
- Works with high contrast mode

## Support

For issues or feature requests:
- Check browser console for error messages (F12)
- Verify camera permissions in browser settings
- Test with different camera/file
- Report bugs with browser and device info

---

**Last Updated**: May 2026  
**Feature Status**: Active  
**Mobile Support**: iOS (14+), Android (Chrome, Firefox)  
**Formats**: JPEG (photos), WebM (video)
