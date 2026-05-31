// Phase 3 integration support utilities for Nkwalink

export function formatIntegrationStatus(id, connected) {
  return connected ? 'Connected' : 'Disconnected';
}

export function getIntegrationButtonText(type, connected) {
  if (connected) return 'Connected';
  switch (type) {
    case 'dispatch': return 'Connect Dispatch';
    case 'hospital': return 'Connect Hospital';
    case 'government': return 'Connect Government';
    case 'broadcast': return 'Activate Broadcast';
    default: return 'Connect';
  }
}
