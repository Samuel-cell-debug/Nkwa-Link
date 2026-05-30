# Voice Recording Feature - Citizens Dashboard

## Overview

The Nkwalink Emergency Response Platform now includes a full-featured **voice recording capability** for citizens to report emergencies. This feature allows users to speak their emergency description instead of typing, which is especially useful in urgent, high-stress situations.

## Features

### 🎤 Voice Input Capabilities
- **Real-time Recording**: Capture emergency descriptions via microphone
- **Recording Timer**: Visual display of recording duration (MM:SS format)
- **Playback Preview**: Listen to the recording before submitting
- **Error Handling**: Clear error messages if microphone access is denied
- **Auto-Release**: Automatic microphone release after recording completes

### 🔒 User Control
- **Start Recording**: Click the "🎤 Start Recording" button to begin
- **Stop Recording**: Click the "⏹ Stop Recording" button to end recording
- **Playback**: Use the audio player to review your recording
- **Use Recording**: Click "✓ Use Recording" to attach to emergency report
- **Close Modal**: Exit without recording using the "Close" button

### 📱 Browser Support
Requires a modern browser with:
- **MediaRecorder API** support (Chrome, Firefox, Edge, Safari 14+)
- **Web Audio API** support
- **getUserMedia API** support for microphone access

## How to Use

### Step 1: Report Emergency
1. Click the **"Report Emergency"** button on the Citizens Dashboard
2. Fill in the emergency type and location

### Step 2: Add Voice Description
1. Click the **"Audio"** button in the "Attach Photo/Audio" section
2. The Voice Input modal will appear

### Step 3: Record Your Emergency Description
1. Click **"🎤 Start Recording"**
2. Speak clearly to describe your emergency situation
3. The recording timer will display elapsed time
4. Click **"⏹ Stop Recording"** when finished

### Step 4: Review & Submit
1. The audio player will automatically appear
2. Use the playback controls to listen to your recording
3. Click **"✓ Use Recording"** to attach it to the emergency report
4. The voice recording will be included in your emergency description
5. Complete the form and submit your emergency report

## Technical Implementation

### Core Components

#### 1. **Voice Modal HTML**
- Recording status display with real-time timer
- Audio playback controls with player UI
- Error message container for user feedback
- Start/Stop recording buttons
- Use Recording and Close buttons

#### 2. **State Variables**
```javascript
let mediaRecorder = null;           // MediaRecorder instance
let recordedChunks = [];            // Audio data chunks
let recordingStartTime = null;      // Recording start timestamp
let recordingTimer = null;          // Timer interval
let audioBlob = null;               // Recorded audio blob
let isRecording = false;            // Recording status flag
```

#### 3. **Main Functions**

##### `startVoiceRecording()`
- Requests microphone permission via `getUserMedia()`
- Creates a `MediaRecorder` instance
- Collects audio data in chunks
- Updates UI to show recording in progress
- Starts recording timer display (MM:SS)
- Shows notification to user

##### `stopVoiceRecording()`
- Stops the MediaRecorder
- Releases microphone and stops all tracks
- Converts audio chunks to Blob
- Sets up audio playback
- Updates UI to show playback controls

##### `useVoiceRecording()`
- Embeds recording duration and indicator in description field
- Stores audio blob globally (`window.emergencyAudioBlob`)
- Closes the voice modal
- Resets UI for next recording
- Shows confirmation notification

##### `resetVoiceRecording()`
- Clears all recording state variables
- Resets UI to initial state
- Hides playback controls and timer
- Prepares for new recording session

### Audio Format

- **Codec**: WAV format (audio/wav MIME type)
- **Stored As**: Blob object for in-memory handling
- **Global Access**: `window.emergencyAudioBlob` and `window.emergencyAudioDuration`

### Error Handling

The feature includes comprehensive error handling for:

| Error | Message | Solution |
|-------|---------|----------|
| **NotAllowedError** | "Microphone access denied" | Allow microphone in browser settings |
| **NotFoundError** | "No microphone found" | Connect a microphone device |
| **Other Errors** | Specific error message | Check browser console for details |

## Integration with Emergency Report

When a voice recording is used, the emergency description field is populated with:

```
[VOICE RECORDING - MM:SS] Emergency situation described via audio input. 
Audio data captured and transmitted with this report.
```

This text indicates that an audio recording accompanies the report and shows its duration.

## Security Considerations

✅ **Microphone Access**: 
- Browser requests explicit user permission
- Permission can be managed in browser settings
- Microphone is released immediately after use

✅ **Audio Data**:
- Stored temporarily in browser memory
- Associated with emergency report submission
- Not automatically transmitted to external services

✅ **Privacy**:
- Users control when recording starts/stops
- Preview available before submission
- Can delete recording without submitting

## Browser Compatibility

| Browser | Support | Minimum Version |
|---------|---------|-----------------|
| Chrome | ✅ Full | v49+ |
| Firefox | ✅ Full | v25+ |
| Edge | ✅ Full | v79+ |
| Safari | ✅ Full | v14+ |
| Opera | ✅ Full | v36+ |
| IE | ❌ Not supported | N/A |

## Known Limitations

1. **Browser-Based Storage**: Audio is stored in browser memory, not automatically uploaded
2. **File Size**: Large recordings may impact browser performance
3. **Recording Duration**: No hard limit, but recommend <5 minutes per recording
4. **Mobile Restrictions**: iOS Safari may require specific permissions setup
5. **HTTPS Requirement**: getUserMedia API requires HTTPS (or localhost for testing)

## Future Enhancements

Planned improvements for the voice recording feature:

- [ ] Auto-upload audio with emergency report (backend implementation)
- [ ] Audio transcription to text using Speech-to-Text API
- [ ] Multiple language support for voice commands
- [ ] Recording quality/bitrate selection
- [ ] Noise filtering and audio preprocessing
- [ ] Offline recording capability
- [ ] Multi-language transcription for emergency dispatchers
- [ ] Integration with emergency responder audio playback

## Troubleshooting

### Recording won't start
- Check browser microphone permissions
- Ensure HTTPS is used (except localhost)
- Try a different browser
- Restart browser and try again

### No sound in playback
- Check browser volume settings
- Verify device speakers/headphones are connected
- Try in a different browser

### Microphone permission denied
- Go to browser Settings > Privacy > Microphone
- Add the website to allowed sites
- Reload the page

### Recording very quiet
- Speak closer to microphone
- Check microphone levels in system settings
- Try moving to a quieter environment

## Testing

To test the voice recording feature:

1. Open the application in a modern browser
2. Click "Report Emergency"
3. Click "Audio" button
4. Click "Start Recording"
5. Speak a test message
6. Click "Stop Recording"
7. Play back the recording using audio player
8. Click "Use Recording"
9. Submit the emergency report

## Support

For issues or feature requests related to voice recording:
- Check the browser console for error messages
- Verify microphone permissions are granted
- Test with a different microphone/device
- Report bugs with detailed browser information

---

**Last Updated**: May 2026  
**Feature Status**: Active  
**Mobile Support**: iOS (14+), Android (Chrome, Firefox)
