import { NextResponse } from 'next/server';
import { verifyAdmin, getUserEmailsByIds } from '@/lib/admin/helpers';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  // Verify admin authentication
  const auth = await verifyAdmin();
  if (!auth.authorized || !auth.user) {
    return auth.response;
  }

  try {
    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const adminUserId = searchParams.get('admin_user_id') || '';
    const targetUserId = searchParams.get('target_user_id') || '';
    const action = searchParams.get('action') || '';

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = adminClient
      .from('admin_audit_log')
      .select('id, admin_user_id, action, target_user_id, notes, details, created_at', {
        count: 'exact',
      });

    // Apply filters
    if (adminUserId) {
      query = query.eq('admin_user_id', adminUserId);
    }

    if (targetUserId) {
      query = query.eq('target_user_id', targetUserId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    // Apply sorting and pagination
    query = query.order('created_at', { ascending: false }).range(from, to);

    // Execute query
    const { data: logs, error: logsError, count: totalLogs } = await query;

    if (logsError) {
      console.error('Error fetching audit logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        logs: [],
        pagination: {
          page,
          limit,
          totalLogs: 0,
          totalPages: 0,
        },
      });
    }

    // Fetch admin and target user emails
    const adminUserIds = [...new Set(logs.map((log) => log.admin_user_id))];
    const targetUserIds = [...new Set(logs.map((log) => log.target_user_id).filter(Boolean))] as string[];
    const allUserIds = [...new Set([...adminUserIds, ...targetUserIds])];

    const userEmailMap = await getUserEmailsByIds(allUserIds);

    // Build response with user emails
    const logsWithEmails = logs.map((log) => ({
      id: log.id,
      admin_email: userEmailMap.get(log.admin_user_id) || 'Unknown',
      action: log.action,
      target_user_email: log.target_user_id ? userEmailMap.get(log.target_user_id) || 'Unknown' : null,
      notes: log.notes,
      details: log.details,
      created_at: log.created_at,
    }));

    // Calculate total pages
    const totalPages = Math.ceil((totalLogs || 0) / limit);

    return NextResponse.json({
      logs: logsWithEmails,
      pagination: {
        page,
        limit,
        totalLogs: totalLogs || 0,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
