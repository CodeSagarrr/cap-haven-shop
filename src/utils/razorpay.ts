export interface RazorpayOptions {
  key: string;
  amount: number;
  currency?: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayInstance {
  open(): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/**
 * Loads the Razorpay checkout script dynamically
 * @returns Promise that resolves when script is loaded
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script already exists
    const existingScript = document.getElementById('razorpay-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    
    document.body.appendChild(script);
  });
};

/**
 * Converts amount to smallest currency unit (paise for INR)
 * @param amount Amount in rupees
 * @returns Amount in paise
 */
export const convertToSmallestUnit = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Generates a unique receipt ID for Razorpay orders
 * @returns Unique receipt ID
 */
export const generateReceiptId = (): string => {
  return `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};