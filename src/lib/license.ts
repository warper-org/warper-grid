/**
 * WarperGrid License System
 * 
 * Robust license key validation using Dodo Payments API.
 * Supports:
 * - License key validation
 * - Device-based activation
 * - Offline validation with cached keys
 * - Expiry checking
 * - Activation limits
 */

// ============================================
// TYPES
// ============================================

export interface LicenseInfo {
  licenseKey: string;
  isValid: boolean;
  activationsUsed: number;
  activationLimit: number;
  expiryDate: string | null;
  productId: string;
  customerId: string;
  features: string[];
  tier: 'free' | 'pro' | 'enterprise';
  metadata?: Record<string, unknown>;
}

export interface LicenseValidationResult {
  valid: boolean;
  reason?: string;
  license?: LicenseInfo;
  activations_used?: number;
  activation_limit?: number;
  expiry_date?: string;
}

export interface LicenseActivationResult {
  success: boolean;
  activationId?: string;
  error?: string;
  license?: LicenseInfo;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  userAgent: string;
  timestamp: number;
}

// ============================================
// CONSTANTS
// ============================================

const DODO_API_BASE = 'https://api.dodopayments.com';
const DODO_TEST_API_BASE = 'https://test.dodopayments.com';
const LICENSE_STORAGE_KEY = 'warper_grid_license';
const DEVICE_ID_KEY = 'warper_grid_device_id';
const VALIDATION_CACHE_KEY = 'warper_grid_license_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Feature flags by tier
const TIER_FEATURES: Record<string, string[]> = {
  free: ['basic-grid', 'sorting', 'filtering'],
  pro: ['basic-grid', 'sorting', 'filtering', 'export', 'cell-editing', 'clipboard', 'sql-query', 'master-detail'],
  enterprise: ['basic-grid', 'sorting', 'filtering', 'export', 'cell-editing', 'clipboard', 'sql-query', 'master-detail', 'unlimited-rows', 'priority-support', 'custom-plugins'],
};

// ============================================
// UTILITIES
// ============================================

/**
 * Get the API base URL based on environment
 */
function getApiBase(): string {
  const env = import.meta.env.VITE_DODO_ENVIRONMENT || 'test_mode';
  return env === 'live_mode' ? DODO_API_BASE : DODO_TEST_API_BASE;
}

/**
 * Generate a unique device ID using available browser APIs
 */
export function generateDeviceId(): string {
  // Try to get existing device ID
  const existingId = localStorage.getItem(DEVICE_ID_KEY);
  if (existingId) return existingId;

  // Generate a new device ID using crypto API
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const deviceId = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  
  // Store for future use
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

/**
 * Get device information for activation
 */
export function getDeviceInfo(): DeviceInfo {
  return {
    deviceId: generateDeviceId(),
    deviceName: navigator.platform || 'Unknown',
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  };
}

/**
 * Hash a string using SHA-256 (for secure comparisons)
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify license key format
 * Dodo Payments format: DODO-XXXX-XXXX-XXXX or UUID format
 */
export function isValidLicenseFormat(licenseKey: string): boolean {
  // UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Dodo format
  const dodoRegex = /^DODO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
  // Generic format
  const genericRegex = /^[A-Z0-9-]{16,64}$/i;
  
  return uuidRegex.test(licenseKey) || dodoRegex.test(licenseKey) || genericRegex.test(licenseKey);
}

// ============================================
// STORAGE
// ============================================

interface CachedLicense {
  license: LicenseInfo;
  validatedAt: number;
  signature: string;
}

/**
 * Save license to local storage with signature
 */
export async function saveLicense(license: LicenseInfo): Promise<void> {
  const secret = import.meta.env.VITE_LICENSE_SECRET_KEY || 'default-secret-key';
  const dataToSign = JSON.stringify(license) + license.licenseKey + secret;
  const signature = await hashString(dataToSign);
  
  const cached: CachedLicense = {
    license,
    validatedAt: Date.now(),
    signature,
  };
  
  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(cached));
}

/**
 * Load and verify license from local storage
 */
export async function loadLicense(): Promise<LicenseInfo | null> {
  try {
    const stored = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!stored) return null;
    
    const cached: CachedLicense = JSON.parse(stored);
    
    // Verify signature to detect tampering
    const secret = import.meta.env.VITE_LICENSE_SECRET_KEY || 'default-secret-key';
    const dataToSign = JSON.stringify(cached.license) + cached.license.licenseKey + secret;
    const expectedSignature = await hashString(dataToSign);
    
    if (cached.signature !== expectedSignature) {
      console.warn('License signature mismatch - possible tampering detected');
      clearLicense();
      return null;
    }
    
    // Check if cache is still valid (within TTL)
    const cacheAge = Date.now() - cached.validatedAt;
    if (cacheAge > CACHE_TTL_MS) {
      console.info('License cache expired, will revalidate online');
      // Return cached license but mark for revalidation
      return { ...cached.license, isValid: false };
    }
    
    return cached.license;
  } catch (error) {
    console.error('Error loading license:', error);
    return null;
  }
}

/**
 * Clear stored license
 */
export function clearLicense(): void {
  localStorage.removeItem(LICENSE_STORAGE_KEY);
  localStorage.removeItem(VALIDATION_CACHE_KEY);
}

// ============================================
// DODO PAYMENTS API
// ============================================

/**
 * Validate a license key with Dodo Payments API
 * This is a public endpoint - no API key required
 */
export async function validateLicenseWithDodo(
  licenseKey: string,
  deviceId?: string
): Promise<LicenseValidationResult> {
  try {
    const response = await fetch(`${getApiBase()}/licenses/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        license_key: licenseKey,
        device_id: deviceId || generateDeviceId(),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        valid: false,
        reason: error.message || `Validation failed: ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      valid: result.valid || result.isValid || false,
      reason: result.reason || result.message,
      activations_used: result.activations_used,
      activation_limit: result.activation_limit,
      expiry_date: result.expiry_date,
    };
  } catch (error) {
    console.error('License validation error:', error);
    return {
      valid: false,
      reason: error instanceof Error ? error.message : 'Network error during validation',
    };
  }
}

/**
 * Activate a license key for this device
 */
export async function activateLicenseWithDodo(
  licenseKey: string,
  deviceName?: string
): Promise<LicenseActivationResult> {
  try {
    const deviceInfo = getDeviceInfo();
    
    const response = await fetch(`${getApiBase()}/licenses/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        license_key: licenseKey,
        name: deviceName || deviceInfo.deviceName,
        device_id: deviceInfo.deviceId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || `Activation failed: ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      activationId: result.id,
    };
  } catch (error) {
    console.error('License activation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error during activation',
    };
  }
}

/**
 * Deactivate a license from this device
 */
export async function deactivateLicenseWithDodo(
  licenseKey: string,
  activationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${getApiBase()}/licenses/deactivate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        license_key: licenseKey,
        activation_id: activationId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || `Deactivation failed: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('License deactivation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error during deactivation',
    };
  }
}

// ============================================
// HIGH-LEVEL LICENSE MANAGEMENT
// ============================================

/**
 * Full license validation flow:
 * 1. Check local cache
 * 2. Validate with Dodo Payments API
 * 3. Activate if needed
 * 4. Cache the result
 */
export async function validateAndActivateLicense(
  licenseKey: string
): Promise<{ success: boolean; license?: LicenseInfo; error?: string }> {
  // Validate format first
  if (!isValidLicenseFormat(licenseKey)) {
    return { success: false, error: 'Invalid license key format' };
  }

  // Validate with Dodo Payments
  const deviceId = generateDeviceId();
  const validation = await validateLicenseWithDodo(licenseKey, deviceId);
  
  if (!validation.valid) {
    return { success: false, error: validation.reason || 'License validation failed' };
  }

  // Try to activate
  const activation = await activateLicenseWithDodo(licenseKey);
  
  if (!activation.success) {
    // Activation might fail if already activated, but license is still valid
    console.warn('Activation warning:', activation.error);
  }

  // Determine tier based on metadata or default to 'pro'
  const tier = determineTier(validation);
  
  // Build license info
  const license: LicenseInfo = {
    licenseKey,
    isValid: true,
    activationsUsed: validation.activations_used || 1,
    activationLimit: validation.activation_limit || 3,
    expiryDate: validation.expiry_date || null,
    productId: import.meta.env.VITE_DODO_PRODUCT_ID || 'warper-grid',
    customerId: '', // Would come from webhook data in production
    features: TIER_FEATURES[tier] || TIER_FEATURES.pro,
    tier,
  };

  // Cache the license
  await saveLicense(license);

  return { success: true, license };
}

/**
 * Determine license tier from validation result
 */
function determineTier(validation: LicenseValidationResult): 'free' | 'pro' | 'enterprise' {
  // In production, this would come from license metadata
  // For now, default to 'pro' for any valid license
  if (validation.activation_limit && validation.activation_limit >= 10) {
    return 'enterprise';
  }
  if (validation.valid) {
    return 'pro';
  }
  return 'free';
}

/**
 * Check if current license is valid (uses cache when possible)
 */
export async function checkLicenseStatus(): Promise<LicenseInfo | null> {
  // Try loading from cache first
  const cached = await loadLicense();
  
  if (cached && cached.isValid) {
    // Check expiry
    if (cached.expiryDate) {
      const expiry = new Date(cached.expiryDate);
      if (expiry < new Date()) {
        return { ...cached, isValid: false };
      }
    }
    return cached;
  }

  // If cached but invalid (expired cache), try to revalidate
  if (cached) {
    const validation = await validateLicenseWithDodo(cached.licenseKey);
    if (validation.valid) {
      const updatedLicense = { ...cached, isValid: true };
      await saveLicense(updatedLicense);
      return updatedLicense;
    }
  }

  return null;
}

/**
 * Check if a specific feature is available
 */
export function hasFeature(license: LicenseInfo | null, feature: string): boolean {
  if (!license || !license.isValid) {
    // Free tier features
    return TIER_FEATURES.free.includes(feature);
  }
  return license.features.includes(feature);
}

/**
 * Get days until license expires
 */
export function getDaysUntilExpiry(license: LicenseInfo): number | null {
  if (!license.expiryDate) return null;
  
  const expiry = new Date(license.expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if license is expiring soon
 */
export function isExpiringSoon(license: LicenseInfo): boolean {
  const days = getDaysUntilExpiry(license);
  if (days === null) return false;
  
  const gracePeriod = parseInt(import.meta.env.VITE_LICENSE_GRACE_PERIOD_DAYS || '7', 10);
  return days > 0 && days <= gracePeriod;
}
