# Nkwalink Emergency Dashboard - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Access the Dashboard

1. **Local Development** (Recommended for testing)
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Then open in browser
   http://localhost:8000/dashboard.html
   ```

2. **Direct Access**
   - Open `dashboard.html` in your web browser
   - Or navigate to your deployed URL

### Step 2: Choose Your Role

Click the "User" menu in the top-right corner to switch between roles:

- **Citizen** - Report emergencies
- **Responder** - Manage incidents on the field
- **Coordinator** - Command center operations

### Step 3: Test Core Features

#### As a Citizen:
1. Fill in the emergency report form
2. Click "Submit Report"
3. See your report ID in the success modal
4. View local emergency alerts below

#### As a Responder:
1. View the incident queue
2. Click "Accept" on any incident
3. Update your status (Available/Busy/Break/Offline)
4. Send messages to command center
5. View your team status

#### As a Coordinator:
1. Check the KPI dashboard (top cards)
2. Hover over the heatmap to see incident density
3. Review active incidents in the table
4. Create an alert by filling the broadcast form
5. Export a report using the button

---

## 🌍 Language Selection

Click the language dropdown in the header to switch:
- English (en)
- Twi (tw)
- Ewe (ee)
- Hausa (ha)

---

## 📱 Features Overview

### Citizen Dashboard
```
┌─────────────────────────────────────┐
│ Quick Emergency Report              │
│ ├─ Emergency Type                   │
│ ├─ Priority Level                   │
│ ├─ Location (GPS)                   │
│ ├─ Description                      │
│ └─ Submit Button                    │
├─────────────────────────────────────┤
│ Emergency Hotlines                  │
│ ├─ 191 Police                       │
│ ├─ 192 Fire                         │
│ └─ 193 Ambulance                    │
├─────────────────────────────────────┤
│ Local Emergency Alerts              │
└─────────────────────────────────────┘
```

### Responder Dashboard
```
┌─────────────────────────────────────┐
│ Priority Counters                   │
│ ├─ Critical  ├─ High                │
│ ├─ Medium    ├─ Low                 │
├─────────────────────────────────────┤
│ Incident Queue                      │
│ ├─ Sortable by Priority             │
│ └─ Accept Button                    │
├─────────────────────────────────────┤
│ My Status & Team                    │
│ ├─ Status Dropdown                  │
│ ├─ Team Info                        │
│ └─ Resources                        │
├─────────────────────────────────────┤
│ Communications                      │
│ ├─ Message Thread                   │
│ └─ Send Message                     │
└─────────────────────────────────────┘
```

### Coordinator Dashboard
```
┌─────────────────────────────────────┐
│ KPI Cards                           │
│ ├─ Total Incidents                  │
│ ├─ Response Time                    │
│ ├─ Active Units                     │
│ └─ Capacity Usage                   │
├─────────────────────────────────────┤
│ Incident Heatmap                    │
│ └─ Hover for Details                │
├─────────────────────────────────────┤
│ Resource Status Overview            │
│ ├─ Ambulances                       │
│ ├─ Fire Trucks                      │
│ └─ Police Units                     │
├─────────────────────────────────────┤
│ Incident Table                      │
│ ├─ Searchable & Sortable            │
│ └─ Edit Actions                     │
├─────────────────────────────────────┤
│ Alert Broadcasting                  │
│ ├─ Select Type                      │
│ ├─ Choose Channels                  │
│ └─ Broadcast Button                 │
├─────────────────────────────────────┤
│ Analytics Charts                    │
│ ├─ Incidents by Type                │
│ └─ Response Times                   │
└─────────────────────────────────────┘
```

---

## 🎮 Interactive Demo

### Demo Scenario: Report a Fire

**As Citizen:**
1. Fill emergency type: Select "🔥 Fire"
2. Set priority: Select "🔴 Critical"
3. Enter location: Type "Accra Central"
4. Describe situation: "Fire outbreak at commercial building"
5. Enter phone: "0501234567"
6. Click "Submit Report"
7. ✅ Success! You'll see your report ID

**As Responder:**
1. Click "Accept" on the fire incident
2. Notice status changes to "assigned"
3. Your status changes to "Busy"
4. Type message: "En route to location"
5. Click "Send"

**As Coordinator:**
1. See incident in table with "assigned" status
2. View heatmap showing incident density
3. Create alert about traffic diversions
4. Select SMS and WhatsApp channels
5. Click "Broadcast Alert"
6. See alert in recent alerts list

---

## 🌐 Offline Usage

### How It Works

The dashboard uses Service Workers to work offline:

1. **First Visit**: Dashboard is cached automatically
2. **Without Internet**: All cached features work
3. **Forms**: Submit when online
4. **Messages**: Queue locally
5. **Auto-Sync**: Syncs when connection returns

### Test Offline Mode

1. Open dashboard normally
2. Open DevTools (F12)
3. Network tab → Toggle offline
4. Dashboard continues to work!

---

## 🔑 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `1` | Switch to Citizen |
| `2` | Switch to Responder |
| `3` | Switch to Coordinator |
| `L` | Cycle languages |
| `/` | Focus search (if available) |
| `Esc` | Close modals |
| `Enter` | Submit forms |

---

## 📊 Understanding the Dashboard

### KPI Cards Explained

**Coordinator Dashboard:**

```
Total Incidents = 42
├─ Reported: 5
├─ Assigned: 8
├─ En-route: 10
└─ Resolved: 19

Response Time = 7.2 min
├─ Best: 2 min
├─ Worst: 45 min
└─ Average: 7.2 min

Active Units = 18/30
├─ Available: 12
├─ Busy: 18
└─ Offline: 0

Capacity = 60%
└─ 18 units deployed of 30 total
```

### Heatmap Explained

The heatmap shows incident density across regions:
- **Darker cells** = More incidents
- **Lighter cells** = Fewer incidents
- **Hover** to see exact numbers
- **Click** to filter by region

### Incident Priorities

| Level | Color | Urgency | Examples |
|-------|-------|---------|----------|
| 🔴 Critical | Red | Immediate | Life-threatening situations |
| 🟠 High | Orange | Urgent | Severe injuries, fires |
| 🟡 Medium | Yellow | Important | Moderate injuries, property damage |
| 🟢 Low | Green | Non-urgent | Minor incidents, information |

---

## 🎯 Common Tasks

### Report an Emergency (Citizen)

```
1. Select incident type
2. Set priority level
3. Enter location or use GPS (📍)
4. Describe what's happening
5. Provide your phone number
6. Optional: Add photo/video
7. Submit
8. Note your report ID
9. Wait for responders
```

### Accept an Incident (Responder)

```
1. Look at incident queue
2. Read incident details
3. Click "Accept" button
4. Status becomes "On Assignment"
5. Acknowledge to command
6. Head to location
7. Send updates as needed
```

### Broadcast an Alert (Coordinator)

```
1. Select alert type (Urgent/Warning/Info)
2. Write alert message
3. Check desired channels:
   ☑ SMS
   ☑ WhatsApp
   ☐ USSD
4. Click "Broadcast Alert"
5. Monitor delivery status
6. Track acknowledgments
```

### Export Report (Coordinator)

```
1. Click "📥 Export Report" button
2. Report downloads as JSON
3. Contains all incidents, resources, and analytics
4. Use for documentation and analysis
```

---

## 🆘 Troubleshooting

### Dashboard Not Loading

**Problem**: Blank white screen

**Solution**:
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check browser console (F12)
4. Try a different browser

### Features Not Working

**Problem**: Buttons don't respond

**Solution**:
1. Check internet connection
2. Verify JavaScript is enabled
3. Clear localStorage: `localStorage.clear()`
4. Check for console errors (F12)

### Offline Mode Not Working

**Problem**: Website doesn't work offline

**Solution**:
1. Visit website once while online
2. Service Worker takes time to register
3. Refresh page while online
4. Wait 30 seconds then go offline
5. Check service worker: DevTools → Application → Service Workers

### Data Not Syncing

**Problem**: Changes not showing up

**Solution**:
1. Click refresh buttons in dashboard
2. Check connection status indicator
3. Open DevTools → Network tab
4. Verify API requests succeeding
5. Check for error messages

---

## 📚 Learn More

### Read Full Documentation

1. **[INDEX.md](INDEX.md)** - Complete feature guide
2. **[DASHBOARD_ARCHITECTURE.md](DASHBOARD_ARCHITECTURE.md)** - Technical details
3. **[API_SPECIFICATION.md](API_SPECIFICATION.md)** - API endpoints
4. **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deployment instructions

### Watch Video Tutorials (Recommended to create)

- Getting Started with Nkwalink
- Citizen Emergency Reporting
- Responder Task Management
- Coordinator Command Center

### Get Help

- Check documentation files
- Review code comments
- Check browser console
- Contact support team

---

## ⚡ Tips & Tricks

### Pro Tips

1. **Customize Your Status**
   - Update availability status regularly
   - This helps dispatch team optimize responses

2. **Use GPS Location**
   - Click 📍 button for accurate location
   - More accurate than manual entry

3. **Monitor Response Time**
   - Coordinator: Check "Response Time" metric
   - Identify bottlenecks and optimize

4. **Use Alert Broadcasting Wisely**
   - SMS: Most reliable, all phones
   - WhatsApp: Faster, detailed info
   - USSD: Works on feature phones

5. **Review Analytics Weekly**
   - Identify incident patterns
   - Optimize resource allocation
   - Plan training needs

### Hidden Features

1. **Role Switching**: Use User menu to instantly switch roles
2. **Keyboard Navigation**: Tab through form fields
3. **Responsive**: Works great on phones and tablets
4. **Offline**: Works without internet after first load
5. **Multi-language**: Switch languages in header

---

## 📞 Emergency Numbers

### Ghana's Emergency Services

| Service | Number | Type |
|---------|--------|------|
| Police | 191 | One-click call |
| Fire | 192 | One-click call |
| Ambulance | 193 | One-click call |

### Using Emergency Hotlines

1. Click the service button (Citizen dashboard)
2. Your phone dials the number automatically
3. Speak with emergency operator
4. Provide your report ID if asked

---

## 🎓 Learning Path

### Beginner (Day 1)
- [ ] Access dashboard
- [ ] Switch between roles
- [ ] Submit emergency report
- [ ] View incident queue
- [ ] Read local alerts

### Intermediate (Day 2-3)
- [ ] Accept incident assignment
- [ ] Update status regularly
- [ ] Send team messages
- [ ] Broadcast alert
- [ ] View analytics charts

### Advanced (Week 1+)
- [ ] Optimize response times
- [ ] Analyze incident patterns
- [ ] Generate reports
- [ ] Train team members
- [ ] Customize workflows

---

## 🚀 Next Steps

1. **Set up your team**
   - Create user accounts
   - Assign roles (citizen, responder, coordinator)
   - Configure team assignments

2. **Train your users**
   - Show emergency reporting
   - Explain responder workflow
   - Train coordinators on dashboard

3. **Test the system**
   - Run practice drills
   - Test offline functionality
   - Verify all integrations

4. **Go live**
   - Deploy to production
   - Monitor system performance
   - Gather user feedback

5. **Optimize**
   - Review analytics
   - Improve response times
   - Update processes

---

## 📝 Notes for Users

- ✅ Dashboard saves your preferences automatically
- ✅ Messages queue offline and send when online
- ✅ Reports include full incident history
- ✅ Export reports for record-keeping
- ✅ Support team available 24/7

---

## 🎉 Welcome to Nkwalink!

You're now ready to use the Emergency Dashboard. The system is designed to be:

- **Intuitive**: Easy to learn and use
- **Reliable**: Works offline and online
- **Fast**: Responds instantly
- **Accessible**: Works for everyone
- **Powerful**: Complete incident management

**Good luck, and thank you for your service!**

---

**Version**: 1.0.0  
**Created**: May 30, 2024  
**Status**: Ready to Use
