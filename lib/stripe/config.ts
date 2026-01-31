// @ts-nocheck - TODO: Fix Stripe type definitions
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  priceIds: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || '',
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL || '',
  },
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

// Pricing information (should match your Stripe prices)
export const PRICING = {
  monthly: {
    amount: 15,
    currency: 'USD',
    interval: 'month',
    priceId: STRIPE_CONFIG.priceIds.monthly,
  },
  annual: {
    amount: 144,
    currency: 'USD',
    interval: 'year',
    priceId: STRIPE_CONFIG.priceIds.annual,
    savings: 20, // 20% savings compared to monthly
  },
} as const;

export type BillingInterval = 'month' | 'year';
