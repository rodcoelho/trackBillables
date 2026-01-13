import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/helpers';
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier') || 'all';
    const status = searchParams.get('status') || 'all';
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    // Fetch users using auth admin API (auth.users table cannot be queried directly)
    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({
      page,
      perPage: limit,
    });

    if (authError) {
      console.error('Error fetching users from auth API:', authError);
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: authError.message || 'Unknown error'
      }, { status: 500 });
    }

    const users = authData?.users || [];

    if (users.length === 0) {
      return NextResponse.json({
        users: [],
        pagination: {
          page,
          limit,
          totalUsers: 0,
          totalPages: 0,
        },
      });
    }

    // Fetch subscriptions for all users in this page
    const userIds = users.map((u) => u.id);
    const { data: subscriptions, error: subscriptionsError } = await adminClient
      .from('subscriptions')
      .select('user_id, tier, status, entries_count_current_month, exports_count_current_month')
      .in('user_id', userIds);

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
    }

    // Fetch billables count for all users in this page
    const { data: billablesCount, error: billablesError } = await adminClient
      .from('billables')
      .select('user_id, id')
      .in('user_id', userIds);

    if (billablesError) {
      console.error('Error fetching billables:', billablesError);
    }

    // Fetch admin status for all users in this page
    const { data: admins, error: adminsError } = await adminClient
      .from('admins')
      .select('user_id')
      .in('user_id', userIds);

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
    }

    const adminUserIds = new Set(admins?.map((a) => a.user_id) || []);

    // Build user-subscription map
    const subscriptionMap = new Map(
      subscriptions?.map((s) => [s.user_id, s]) || []
    );

    // Build user-billables count map
    const billablesCountMap = new Map<string, number>();
    for (const userId of userIds) {
      const userBillables = billablesCount?.filter((b) => b.user_id === userId) || [];
      billablesCountMap.set(userId, userBillables.length);
    }

    // Combine data
    let combinedUsers = users.map((user) => {
      const subscription = subscriptionMap.get(user.id);
      const billablesTotal = billablesCountMap.get(user.id) || 0;
      const isAdmin = adminUserIds.has(user.id);

      return {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || null,
        is_admin: isAdmin,
        subscription: {
          tier: subscription?.tier || 'free',
          status: subscription?.status || 'active',
          entries_count_current_month: subscription?.entries_count_current_month || 0,
          exports_count_current_month: subscription?.exports_count_current_month || 0,
          billables_total: billablesTotal,
        },
      };
    });

    // Apply search filter
    if (search) {
      combinedUsers = combinedUsers.filter((u) =>
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply tier filter
    if (tier !== 'all') {
      if (tier === 'trial') {
        combinedUsers = combinedUsers.filter((u) => u.subscription.status === 'trialing');
      } else {
        combinedUsers = combinedUsers.filter((u) => u.subscription.tier === tier);
      }
    }

    // Apply status filter
    if (status !== 'all') {
      combinedUsers = combinedUsers.filter((u) => u.subscription.status === status);
    }

    // Apply sorting
    combinedUsers.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sort === 'email') {
        aValue = a.email;
        bValue = b.email;
      } else if (sort === 'created_at') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      } else if (sort === 'last_sign_in_at') {
        aValue = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
        bValue = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      }

      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Get total count from auth API response
    const totalUsers = authData?.total || combinedUsers.length;
    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({
      users: combinedUsers,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error in /api/admin/users:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
