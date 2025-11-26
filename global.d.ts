declare global {
  interface Window {
    __ENV__?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      STRIPE_PUBLISHABLE_KEY?: string;
    };
  }
}

export {};

