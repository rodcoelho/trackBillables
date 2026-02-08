export interface Database {
  public: {
    Tables: {
      billables: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          client: string;
          matter: string;
          time_amount: number;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          client: string;
          matter: string;
          time_amount: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          client?: string;
          matter?: string;
          time_amount?: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          client: string | null;
          matter: string | null;
          time_amount: number | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          client?: string | null;
          matter?: string | null;
          time_amount?: number | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          client?: string | null;
          matter?: string | null;
          time_amount?: number | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      template_tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      template_tag_assignments: {
        Row: {
          template_id: string;
          tag_id: string;
        };
        Insert: {
          template_id: string;
          tag_id: string;
        };
        Update: {
          template_id?: string;
          tag_id?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: 'free' | 'pro';
          status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          billing_interval: 'month' | 'year' | null;
          trial_start: string | null;
          trial_end: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          entries_count_current_month: number;
          exports_count_current_month: number;
          usage_reset_date: string;
          attorney_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier?: 'free' | 'pro';
          status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' |
'unpaid';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          billing_interval?: 'month' | 'year' | null;
          trial_start?: string | null;
          trial_end?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          entries_count_current_month?: number;
          exports_count_current_month?: number;
          usage_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tier?: 'free' | 'pro';
          status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' |
'unpaid';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          billing_interval?: 'month' | 'year' | null;
          trial_start?: string | null;
          trial_end?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          entries_count_current_month?: number;
          exports_count_current_month?: number;
          usage_reset_date?: string;
          attorney_email?: string | null;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: {
          user_uuid: string;
        };
        Returns: boolean;
      };
    };
  };
}

export type Billable = Database['public']['Tables']['billables']['Row'];
export type BillableInsert = Database['public']['Tables']['billables']['Insert'];
export type BillableUpdate = Database['public']['Tables']['billables']['Update'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];
export type Template = Database['public']['Tables']['templates']['Row'];
export type TemplateInsert = Database['public']['Tables']['templates']['Insert'];
export type TemplateUpdate = Database['public']['Tables']['templates']['Update'];
export type TemplateTag = Database['public']['Tables']['template_tags']['Row'];
export type TemplateTagInsert = Database['public']['Tables']['template_tags']['Insert'];

export type TemplateWithTags = Template & {
  tags: TemplateTag[];
};