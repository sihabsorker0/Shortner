// Client-side device detection utilities
export function getScreenResolution(): string {
  if (typeof window !== 'undefined' && window.screen) {
    return `${window.screen.width}x${window.screen.height}`;
  }
  return 'unknown';
}

export function getClientLanguage(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.language || navigator.languages?.[0] || 'unknown';
  }
  return 'unknown';
}

export function getClientTimezone(): string {
  if (typeof Intl !== 'undefined') {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return 'unknown';
    }
  }
  return 'unknown';
}

// Function to send additional client-side data to server
export async function sendDeviceInfo(linkId: number) {
  if (typeof window === 'undefined') return;
  
  const deviceData = {
    screenResolution: getScreenResolution(),
    language: getClientLanguage(),
    timezone: getClientTimezone(),
  };
  
  try {
    await fetch('/api/device-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        linkId,
        ...deviceData,
      }),
    });
  } catch (error) {
    console.log('Failed to send device info:', error);
  }
}