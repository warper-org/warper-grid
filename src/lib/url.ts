/**
 * Dynamic URL Configuration
 * 
 * Automatically detects the app URL from window.location,
 * making it easy to deploy without changing environment variables.
 */

/**
 * Get the base application URL
 * Uses VITE_APP_URL if set, otherwise auto-detects from window.location
 */
export function getAppUrl(): string {
  // Check if explicitly set in env
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // Auto-detect from window.location
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const portPart = port ? `:${port}` : '';
    return `${protocol}//${hostname}${portPart}`;
  }

  // Fallback for SSR or non-browser environments
  return 'http://localhost:5174';
}

/**
 * Get the payment success URL
 */
export function getPaymentSuccessUrl(): string {
  const path = import.meta.env.VITE_PAYMENT_SUCCESS_PATH || '#payment-success';
  return `${getAppUrl()}/${path}`;
}

/**
 * Get the payment cancel URL
 */
export function getPaymentCancelUrl(): string {
  const path = import.meta.env.VITE_PAYMENT_CANCEL_PATH || '#payment-cancelled';
  return `${getAppUrl()}/${path}`;
}

/**
 * Build a full URL from a path
 */
export function buildUrl(path: string): string {
  const base = getAppUrl();
  // Handle both /path and #hash routes
  if (path.startsWith('#') || path.startsWith('/')) {
    return `${base}/${path.replace(/^\//, '')}`;
  }
  return `${base}/${path}`;
}

/**
 * Get all URL configuration (useful for debugging)
 */
export function getUrlConfig() {
  return {
    appUrl: getAppUrl(),
    paymentSuccessUrl: getPaymentSuccessUrl(),
    paymentCancelUrl: getPaymentCancelUrl(),
    isAutoDetected: !import.meta.env.VITE_APP_URL,
  };
}
