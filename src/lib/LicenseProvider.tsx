/**
 * WarperGrid License Provider
 * 
 * React context for managing license state throughout the application.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  type LicenseInfo,
  validateAndActivateLicense,
  checkLicenseStatus,
  clearLicense,
  hasFeature,
  getDaysUntilExpiry,
  isExpiringSoon,
} from './license';

// ============================================
// CONTEXT TYPES
// ============================================

interface LicenseContextState {
  /** Current license info, or null if not licensed */
  license: LicenseInfo | null;
  /** Whether the license check is in progress */
  isLoading: boolean;
  /** Error message if license validation failed */
  error: string | null;
  /** Whether the user has a valid license */
  isLicensed: boolean;
  /** Current tier (free, pro, enterprise) */
  tier: 'free' | 'pro' | 'enterprise';
  /** Days until expiry (null if no expiry) */
  daysUntilExpiry: number | null;
  /** Whether license is expiring soon */
  expiringSoon: boolean;
}

interface LicenseContextActions {
  /** Activate a license key */
  activateLicense: (licenseKey: string) => Promise<{ success: boolean; error?: string }>;
  /** Deactivate current license */
  deactivateLicense: () => void;
  /** Refresh license status from API */
  refreshLicense: () => Promise<void>;
  /** Check if a feature is available */
  checkFeature: (feature: string) => boolean;
  /** Clear any errors */
  clearError: () => void;
}

type LicenseContextValue = LicenseContextState & LicenseContextActions;

// ============================================
// CONTEXT
// ============================================

const LicenseContext = createContext<LicenseContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface LicenseProviderProps {
  children: ReactNode;
  /** Automatically check license on mount */
  autoCheck?: boolean;
}

export function LicenseProvider({ children, autoCheck = true }: LicenseProviderProps) {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(autoCheck);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const isLicensed = license?.isValid ?? false;
  const tier = license?.tier ?? 'free';
  const daysUntilExpiry = license ? getDaysUntilExpiry(license) : null;
  const expiringSoon = license ? isExpiringSoon(license) : false;

  // Check license status on mount
  useEffect(() => {
    if (autoCheck) {
      checkLicenseStatus()
        .then((cachedLicense) => {
          if (cachedLicense) {
            setLicense(cachedLicense);
          }
        })
        .catch((err) => {
          console.error('License check failed:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [autoCheck]);

  // Activate a new license
  const activateLicense = useCallback(async (licenseKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await validateAndActivateLicense(licenseKey);
      
      if (result.success && result.license) {
        setLicense(result.license);
        return { success: true };
      } else {
        const errorMsg = result.error || 'License activation failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unexpected error during activation';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Deactivate current license
  const deactivateLicense = useCallback(() => {
    clearLicense();
    setLicense(null);
    setError(null);
  }, []);

  // Refresh license from API
  const refreshLicense = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const currentLicense = await checkLicenseStatus();
      setLicense(currentLicense);
      
      if (currentLicense && !currentLicense.isValid) {
        setError('License has expired or been revoked');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('License refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if a feature is available
  const checkFeature = useCallback((feature: string) => {
    return hasFeature(license, feature);
  }, [license]);

  // Clear errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: LicenseContextValue = {
    license,
    isLoading,
    error,
    isLicensed,
    tier,
    daysUntilExpiry,
    expiringSoon,
    activateLicense,
    deactivateLicense,
    refreshLicense,
    checkFeature,
    clearError,
  };

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook to access license context
 */
export function useLicense(): LicenseContextValue {
  const context = useContext(LicenseContext);
  
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  
  return context;
}

/**
 * Hook to check if a feature is available
 */
export function useFeature(feature: string): boolean {
  const { checkFeature } = useLicense();
  return checkFeature(feature);
}

/**
 * Hook to require a feature, showing upgrade prompt if not available
 */
export function useRequiredFeature(feature: string): {
  hasFeature: boolean;
  tier: 'free' | 'pro' | 'enterprise';
  upgradeRequired: boolean;
} {
  const { checkFeature, tier, isLicensed } = useLicense();
  const featureAvailable = checkFeature(feature);
  
  return {
    hasFeature: featureAvailable,
    tier,
    upgradeRequired: !featureAvailable && !isLicensed,
  };
}

// ============================================
// COMPONENTS
// ============================================

interface RequireFeatureProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that only renders children if feature is available
 */
export function RequireFeature({ feature, children, fallback }: RequireFeatureProps) {
  const hasFeatureAccess = useFeature(feature);
  
  if (!hasFeatureAccess) {
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
}

interface LicenseGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that only renders children if user has valid license
 */
export function LicenseGate({ children, fallback }: LicenseGateProps) {
  const { isLicensed, isLoading } = useLicense();
  
  if (isLoading) {
    return null; // Or a loading spinner
  }
  
  if (!isLicensed) {
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
}

// ============================================
// LICENSE INPUT COMPONENT
// ============================================

interface LicenseInputProps {
  onSuccess?: (license: LicenseInfo) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function LicenseInput({ onSuccess, onError, className = '' }: LicenseInputProps) {
  const { activateLicense, isLoading, error, license } = useLicense();
  const [inputValue, setInputValue] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedKey = inputValue.trim();
    if (!trimmedKey) {
      setLocalError('Please enter a license key');
      return;
    }

    const result = await activateLicense(trimmedKey);
    
    if (result.success) {
      setInputValue('');
      onSuccess?.(license!);
    } else {
      setLocalError(result.error || 'Activation failed');
      onError?.(result.error || 'Activation failed');
    }
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label htmlFor="license-key" className="block text-sm font-medium text-zinc-300 mb-2">
          License Key
        </label>
        <input
          id="license-key"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="WG-XXXX-XXXX-XXXX"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
          disabled={isLoading}
        />
      </div>
      
      {displayError && (
        <p className="text-red-400 text-sm">{displayError}</p>
      )}
      
      <button
        type="submit"
        disabled={isLoading || !inputValue.trim()}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
      >
        {isLoading ? 'Activating...' : 'Activate License'}
      </button>
    </form>
  );
}
