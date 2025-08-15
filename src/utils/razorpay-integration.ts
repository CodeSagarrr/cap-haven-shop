import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open(): void };
  }
}

/**
 * Complete Razorpay Payment Integration
 */
export class RazorpayIntegration {
  private static async loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  static async processPayment({
    amount,
    user,
    orderData,
    onSuccess,
    onError,
  }: {
    amount: number;
    user: any;
    orderData: any;
    onSuccess: (orderId: string, paymentId: string) => void;
    onError: (error: string) => void;
  }) {
    try {
      // Load Razorpay script
      const scriptLoaded = await this.loadScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Create order via Edge Function
      const { data: orderResponse, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: {
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderData,
          },
        }
      );

      if (orderError || !orderResponse.success) {
        throw new Error(orderResponse?.error || 'Failed to create order');
      }

      const { order: razorpayOrder, order_record_id } = orderResponse;

      // Configure Razorpay
      const options: RazorpayOptions = {
        key: razorpayOrder.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'CAPSTORE',
        description: 'Payment for your order',
        order_id: razorpayOrder.id,
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment
            const { data: verifyResponse, error: verifyError } = await supabase.functions.invoke(
              'verify-razorpay-payment',
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_record_id,
                },
              }
            );

            if (verifyError || !verifyResponse.success) {
              throw new Error('Payment verification failed');
            }

            onSuccess(order_record_id, response.razorpay_payment_id);
          } catch (error) {
            onError(error instanceof Error ? error.message : 'Payment verification failed');
          }
        },
        prefill: {
          name: orderData.shipping_address?.fullName || '',
          email: orderData.user_email || '',
          contact: orderData.shipping_address?.phone || '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            onError('Payment cancelled by user');
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment initialization failed');
    }
  }
}

/**
 * Utility functions for Razorpay
 */
export const razorpayUtils = {
  convertToSmallestUnit: (amount: number): number => Math.round(amount * 100),
  generateReceiptId: (): string => `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  // Simple payment method for components
  initiatePayment: async ({
    amount,
    user,
    orderData,
    onSuccess,
    onError,
  }: {
    amount: number;
    user: any;
    orderData: any;
    onSuccess?: (orderId: string, paymentId: string) => void;
    onError?: (error: string) => void;
  }) => {
    await RazorpayIntegration.processPayment({
      amount,
      user,
      orderData,
      onSuccess: onSuccess || (() => {}),
      onError: onError || ((error) => {
        toast({
          title: 'Payment Failed',
          description: error,
          variant: 'destructive',
        });
      }),
    });
  },
};