// @ts-nocheck - TODO: Fix Supabase client type definitions
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * Admin authentication result
 */
export interface AdminAuthResult {
  authorized: boolean;
  user: {
    id: string;
    email: string;
  } | null;
  response?: NextResponse;
}

/**
 * Verifies that the current user is authenticated and is an admin
 * Returns authorization result with user info or error response
 */
export async function verifyAdmin(): Promise<AdminAuthResult> {
  try {
    // First, check if user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        authorized: false,
        user: null,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    // Check if user is an admin using the is_admin function
    const { data: isAdmin, error: adminError } = await supabase
      .rpc('is_admin', { user_uuid: user.id });

    if (adminError) {
      console.error('Error checking admin status:', adminError);
      return {
        authorized: false,
        user: null,
        response: NextResponse.json(
          { error: 'Failed to verify admin status' },
          { status: 500 }
        ),
      };
    }

    if (!isAdmin) {
      return {
        authorized: false,
        user: null,
        response: NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        ),
      };
    }

    // User is authenticated and is an admin
    return {
      authorized: true,
      user: {
        id: user.id,
        email: user.email!,
      },
    };
  } catch (error) {
    console.error('Admin verification error:', error);
    return {
      authorized: false,
      user: null,
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Audit log action types
 */
export type AuditAction =
  | 'reset_usage'
  | 'change_tier'
  | 'change_status'
  | 'view_user'
  | 'view_dashboard'
  | 'export_data';

/**
 * Creates an audit log entry for an admin action
 */
export async function createAuditLog(params: {
  adminUserId: string;
  action: AuditAction;
  targetUserId?: string;
  details?: Record<string, any>;
  notes?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    const adminClient = createAdminClient();

    const { error } = await adminClient.from('admin_audit_log').insert({
      admin_user_id: params.adminUserId,
      action: params.action,
      target_user_id: params.targetUserId || null,
      details: params.details || null,
      notes: params.notes || null,
      ip_address: params.ipAddress || null,
    });

    if (error) {
      console.error('Error creating audit log:', error);
      // Don't throw - audit log failure shouldn't block the action
    }
  } catch (error) {
    console.error('Audit log creation error:', error);
    // Don't throw - audit log failure shouldn't block the action
  }
}

/**
 * Extracts IP address from request headers
 */
export function getIpAddress(request: Request): string | undefined {
  // Check common headers for IP address (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwardedFor.split(',')[0].trim();
  }

  return cfConnectingIp || realIp || undefined;
}

/**
 * Fetches user email by user ID using Auth Admin API
 * Returns the email or undefined
 */
export async function getUserEmailById(userId: string): Promise<string | undefined> {
  const adminClient = createAdminClient();
  const { data: authData } = await adminClient.auth.admin.getUserById(userId);
  return authData?.user?.email;
}

/**
 * Fetches user emails by user IDs using Auth Admin API
 * Returns a Map of userId -> email
 */
export async function getUserEmailsByIds(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const adminClient = createAdminClient();
  const emailMap = new Map<string, string>();

  // Fetch users in batches (Auth Admin API doesn't have bulk get, so we need to fetch individually or use listUsers)
  // For simplicity, we'll fetch all users and filter
  const { data: authData } = await adminClient.auth.admin.listUsers({
    perPage: 1000, // Maximum allowed
  });

  if (authData?.users) {
    authData.users.forEach((user) => {
      if (userIds.includes(user.id) && user.email) {
        emailMap.set(user.id, user.email);
      }
    });
  }

  return emailMap;
}
