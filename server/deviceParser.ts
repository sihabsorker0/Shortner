// Device information parser utility
export interface DeviceInfo {
  deviceType: string;
  operatingSystem: string;
  browser: string;
  browserVersion: string;
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  if (!userAgent) {
    return {
      deviceType: 'unknown',
      operatingSystem: 'unknown',
      browser: 'unknown',
      browserVersion: 'unknown'
    };
  }

  const ua = userAgent.toLowerCase();
  
  // Device Type Detection
  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  }

  // Operating System Detection
  let operatingSystem = 'unknown';
  if (/windows nt/i.test(ua)) {
    if (/windows nt 10/i.test(ua)) operatingSystem = 'Windows 10';
    else if (/windows nt 6.3/i.test(ua)) operatingSystem = 'Windows 8.1';
    else if (/windows nt 6.2/i.test(ua)) operatingSystem = 'Windows 8';
    else if (/windows nt 6.1/i.test(ua)) operatingSystem = 'Windows 7';
    else operatingSystem = 'Windows';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    const iosMatch = ua.match(/os (\d+)_(\d+)/);
    if (iosMatch) {
      operatingSystem = `iOS ${iosMatch[1]}.${iosMatch[2]}`;
    } else {
      operatingSystem = 'iOS';
    }
  } else if (/android/i.test(ua)) {
    const androidMatch = ua.match(/android (\d+\.?\d*)/);
    if (androidMatch) {
      operatingSystem = `Android ${androidMatch[1]}`;
    } else {
      operatingSystem = 'Android';
    }
  } else if (/mac os x/i.test(ua)) {
    const macMatch = ua.match(/mac os x (\d+)[._](\d+)/);
    if (macMatch) {
      operatingSystem = `macOS ${macMatch[1]}.${macMatch[2]}`;
    } else {
      operatingSystem = 'macOS';
    }
  } else if (/linux/i.test(ua)) {
    operatingSystem = 'Linux';
  }

  // Browser Detection
  let browser = 'unknown';
  let browserVersion = 'unknown';
  
  if (/edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
    const edgeMatch = ua.match(/edg\/(\d+\.?\d*)/);
    if (edgeMatch) browserVersion = edgeMatch[1];
  } else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) {
    browser = 'Chrome';
    const chromeMatch = ua.match(/chrome\/(\d+\.?\d*)/);
    if (chromeMatch) browserVersion = chromeMatch[1];
  } else if (/firefox/i.test(ua)) {
    browser = 'Firefox';
    const firefoxMatch = ua.match(/firefox\/(\d+\.?\d*)/);
    if (firefoxMatch) browserVersion = firefoxMatch[1];
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari';
    const safariMatch = ua.match(/version\/(\d+\.?\d*)/);
    if (safariMatch) browserVersion = safariMatch[1];
  } else if (/opera|opr\//i.test(ua)) {
    browser = 'Opera';
    const operaMatch = ua.match(/(opera|opr)\/(\d+\.?\d*)/);
    if (operaMatch) browserVersion = operaMatch[2];
  }

  return {
    deviceType,
    operatingSystem,
    browser,
    browserVersion
  };
}

export function parseAcceptLanguage(acceptLanguage: string): string {
  if (!acceptLanguage) return 'unknown';
  
  // Extract primary language from Accept-Language header
  const languages = acceptLanguage.split(',');
  const primaryLang = languages[0].split(';')[0].trim();
  return primaryLang;
}

export function getTimezone(req: any): string {
  // Try to get timezone from headers if available
  const timezone = req.get('X-Timezone') || req.get('Timezone');
  if (timezone) return timezone;
  
  // Default timezone detection can be improved with IP geolocation
  return 'unknown';
}

export async function getLocationFromIP(ip: string): Promise<{country: string, city: string, region: string, isp: string}> {
  // Skip localhost and private IPs
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { country: 'unknown', city: 'unknown', region: 'unknown', isp: 'unknown' };
  }

  try {
    // Using free ipapi.co service (no API key required for basic usage)
    const response = await fetch(`http://ipapi.co/${ip}/json/`, {
      timeout: 3000,
      headers: {
        'User-Agent': 'LinkShortener/1.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name || 'unknown',
        city: data.city || 'unknown', 
        region: data.region || 'unknown',
        isp: data.org || 'unknown'
      };
    }
  } catch (error) {
    console.log('IP geolocation lookup failed:', error.message);
  }
  
  return { country: 'unknown', city: 'unknown', region: 'unknown', isp: 'unknown' };
}

export function getCountryFromIP(ip: string): Promise<string> {
  return getLocationFromIP(ip).then(location => location.country);
}

export function getCityFromIP(ip: string): Promise<string> {
  return getLocationFromIP(ip).then(location => location.city);
}