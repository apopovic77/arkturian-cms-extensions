import { loadStripe, Stripe } from '@stripe/stripe-js';

export interface StripeCheckoutConfig {
  publishableKey: string;
  apiEndpoint: string; // Backend API that creates checkout sessions
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutItem {
  id: string;
  name: string;
  price: number; // in cents
  quantity: number;
  image?: string;
  description?: string;
}

export class StripeCheckoutExtension {
  private stripe: Stripe | null = null;
  private config: StripeCheckoutConfig;
  private initialized = false;

  constructor(config: StripeCheckoutConfig) {
    this.config = {
      successUrl: window.location.origin + '/success',
      cancelUrl: window.location.origin + '/cancel',
      ...config
    };
  }

  /**
   * Initialize Stripe
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.stripe = await loadStripe(this.config.publishableKey);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      throw error;
    }
  }

  /**
   * Start checkout process
   */
  async checkout(items: CheckoutItem[]): Promise<void> {
    if (!this.initialized || !this.stripe) {
      throw new Error('Stripe not initialized. Call init() first.');
    }

    try {
      // Call backend to create checkout session
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          success_url: this.config.successUrl,
          cancel_url: this.config.cancelUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const { error } = await this.stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  }

  /**
   * Create a "Buy Now" button
   */
  createBuyButton(
    element: HTMLElement,
    item: CheckoutItem,
    options?: {
      buttonText?: string;
      buttonClass?: string;
    }
  ): void {
    const button = document.createElement('button');
    button.textContent = options?.buttonText || 'Buy Now';
    button.className = options?.buttonClass || 'arkturian-buy-button';
    
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      button.disabled = true;
      button.textContent = 'Loading...';

      try {
        await this.checkout([item]);
      } catch (error) {
        button.disabled = false;
        button.textContent = options?.buttonText || 'Buy Now';
        alert('Checkout failed. Please try again.');
      }
    });

    element.appendChild(button);
  }
}

// Global instance
let globalInstance: StripeCheckoutExtension | null = null;

/**
 * Initialize global Stripe checkout instance
 */
export function initStripeCheckout(config: StripeCheckoutConfig): StripeCheckoutExtension {
  globalInstance = new StripeCheckoutExtension(config);
  globalInstance.init();
  return globalInstance;
}

/**
 * Get global instance
 */
export function getStripeCheckout(): StripeCheckoutExtension | null {
  return globalInstance;
}

// Expose to window for CDN usage
if (typeof window !== 'undefined') {
  (window as any).ArkturianCMS = {
    ...(window as any).ArkturianCMS,
    StripeCheckout: {
      init: initStripeCheckout,
      get: getStripeCheckout,
      StripeCheckoutExtension,
    }
  };
}

export default {
  init: initStripeCheckout,
  get: getStripeCheckout,
  StripeCheckoutExtension,
};
