# Quick Start: Voice Recording Feature

## 🚀 Get Started in 30 Seconds

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Working microphone
- Internet connection (or localhost)

### Step 1: Open the Application
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to: `http://localhost:8000`

### Step 2: Test Voice Recording

1. **Click "Report Emergency"** button on the dashboard
2. **Fill in basic information:**
   - Emergency Type: (e.g., "Medical Emergency")
   - Location: (e.g., "Accra Central")
   - Priority Level: (select one)

3. **Click the "Audio" button** to open the voice recording modal

4. **Start Recording:**
   - Click **"🎤 Start Recording"** button
   - Speak clearly: *"This is a test emergency - multiple casualties reported at Central Market"*
   - Watch the recording timer count up (MM:SS format)

5. **Stop Recording:**
   - Click **"⏹ Stop Recording"** button
   - The audio player will automatically appear

6. **Review Your Recording:**
   - Click the play button (▶) to listen to your recording
   - Use the volume slider if needed
   - The duration will display in the description field

7. **Use the Recording:**
   - Click **"✓ Use Recording"** to attach it to the report
   - The modal closes and description field is auto-filled

8. **Submit Your Report:**
   - Complete any remaining fields
   - Click **"Submit Emergency Report"** button
   - You'll see a success message with your Report ID

## 📱 Features You'll Experience

### Real-Time Feedback
- 🎤 **Recording Indicator** - Visual icon and pulsing animation
- ⏱️ **Timer Display** - Elapsed time in MM:SS format
- 🔊 **Audio Playback** - Built-in player with controls
- ✅ **Confirmation** - Toast notifications for each action

### Error Handling
If you see an error message:
- **Microphone Access Denied**: Check browser permissions and try again
- **No Microphone Found**: Connect a microphone and reload the page
- **Browser Not Supported**: Use a modern browser (Chrome/Firefox/Safari/Edge)

## 🔧 Troubleshooting

### Recording Won't Start
```
✓ Check microphone permissions in browser settings
✓ Ensure HTTPS is enabled (or use localhost:8000)
✓ Try using a different browser
✓ Restart the browser
```

### Can't Hear Playback
```
✓ Check system volume levels
✓ Verify headphones/speakers are connected
✓ Refresh the page and try again
✓ Check browser audio settings
```

### Very Quiet Recording
```
✓ Speak closer to the microphone
✓ Check microphone levels in system settings
✓ Move to a quieter environment
✓ Test microphone in another application
```

## 💡 Tips for Best Results

1. **Speak Clearly**: Use a normal conversational tone
2. **Keep It Concise**: 30-60 seconds is ideal for emergency descriptions
3. **No Background Noise**: Find a quiet location if possible
4. **Test First**: Do a test recording before an actual emergency
5. **Review Before Submit**: Always listen to your recording before sending

## 🎯 What to Say in a Test Recording

Here are example emergency descriptions to test with:

**Medical Emergency:**
> *"Multiple people injured in car accident at intersection of Main and Center streets. At least three casualties visible. Please dispatch ambulance immediately."*

**Fire Emergency:**
> *"House fire on Second Avenue, flames visible from windows. Smoke spreading to neighboring properties. Residents are evacuating. Fire department needed urgently."*

**Crime Report:**
> *"Armed robbery in progress at downtown convenience store. One suspect visible with gun. Police response needed immediately. I'm safe but nearby."*

## 📊 Example Workflow

```
Start App
   ↓
Click "Report Emergency"
   ↓
Fill in Emergency Details
   ↓
Click "Audio" Button
   ↓
Click "Start Recording" 🎤
   ↓
Speak Your Emergency Description
   ↓
Click "Stop Recording" ⏹
   ↓
Listen to Playback (Optional)
   ↓
Click "Use Recording" ✓
   ↓
Submit Emergency Report
   ↓
View Success with Report ID ✅
```

## 🔐 Privacy & Security

✅ **Your microphone is:**
- Only accessed when you explicitly click "Start Recording"
- Released immediately when you click "Stop Recording"
- Never accessed without your permission

✅ **Your recording is:**
- Stored only in your browser's memory
- Not transmitted until you submit the report
- Associated with your emergency report
- Subject to the same security as other emergency data

## 📋 Supported Browsers

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 49+ | ✅ Full Support |
| Firefox | 25+ | ✅ Full Support |
| Safari | 14+ | ✅ Full Support |
| Edge | 79+ | ✅ Full Support |
| Opera | 36+ | ✅ Full Support |
| Internet Explorer | Any | ❌ Not Supported |

## 🎓 Learn More

- **For Users**: See [VOICE_RECORDING_FEATURE.md](./VOICE_RECORDING_FEATURE.md)
- **For Developers**: See [VOICE_RECORDING_INTEGRATION.md](./VOICE_RECORDING_INTEGRATION.md)
- **Main Documentation**: See [README.md](./README.md)

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review browser console for error messages (Press F12)
3. Try in a different browser
4. Verify your microphone works in other applications
5. Check that you're using HTTPS (or localhost)

## ✨ What Happens Next?

After you submit your emergency report with a voice recording:

1. **Report ID Generated**: You receive a unique report reference
2. **Dispatch Notification**: Emergency responders are alerted
3. **Recording Attached**: Your voice recording goes with the report
4. **Priority Assigned**: Based on emergency type and location
5. **Response Coordination**: Responders coordinate faster with your description

---

**Ready to test?** Start the server and open the app now! 🚀

**Report an Issue?** Include:
- Browser name and version
- Error message (if any)
- Steps to reproduce the issue
- Screenshot (if applicable)

---

Last Updated: May 2026  
Version: 1.0  
Platform: Nkwalink Emergency Response Platform
