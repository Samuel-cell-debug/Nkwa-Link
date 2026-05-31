# Mobile App Plan for Nkwa-Link Emergency Dashboard

## Goal
Provide a lightweight mobile companion for citizen reporting and responder coordination using React Native.

## Target Platforms
- Android
- iOS

## Core Features
- Citizen reports: quick incident submission, photo upload, location sharing
- Responder panel: dispatch feed, map tracking, status updates
- Coordinator overview: resource requests, alert broadcasts, analytics summary
- Offline queueing: cache reports when connectivity is unavailable
- Push notifications: emergency alerts and mission assignments

## Technical Stack
- React Native (Expo managed workflow)
- TypeScript
- React Navigation
- Expo Location
- Expo Notifications
- Firebase / Supabase backend for realtime sync

## Proposed Folder Structure
- `/mobile-app`
  - `App.tsx`
  - `screens/`
    - `CitizenHomeScreen.tsx`
    - `ResponderDashboard.tsx`
    - `CoordinatorOverview.tsx`
    - `LoginScreen.tsx`
  - `components/`
    - `IncidentForm.tsx`
    - `AlertCard.tsx`
    - `MapPane.tsx`
  - `services/`
    - `locationService.ts`
    - `notificationService.ts`
    - `syncService.ts`

## Phase 2 Mobile Milestones
1. Scaffold Expo app with role-based entry screen
2. Implement location permissions and incident geo-reporting
3. Add offline caching for critical report data
4. Connect to web dashboard APIs for incident sync
5. Add push notification subscription and handling

## Next Steps
- Initialize repository under `/mobile-app`
- Define shared API contract with the web dashboard
- Build MVP screens for citizen and responder flows
- Validate on device/emulator and test offline behavior
