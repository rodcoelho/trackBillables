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

    // Check what data is requested
    const includeRevenue = searchParams.get('revenue') === 'true';
    const includeActivity = searchParams.get('activity') === 'true';
    const isBasic = searchParams.get('basic') === 'true' || (!includeRevenue && !includeActivity);

    // Get current date and calculate date ranges
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    let response: any = {};

    // Always fetch basic user and subscription data
    if (isBasic) {
      // Fetch all users using Auth Admin API (need to calculate counts client-side)
      const { data: authData } = await adminClient.auth.admin.listUsers({
        perPage: 1000, // Get all users (increase if you have more than 1000 users)
      });

      const allUsers = authData?.users || [];

      // Fetch subscriptions
      const { data: subscriptions } = await adminClient
        .from('subscriptions')
        .select('tier, status, canceled_at') as { data: Array<{ tier: 'free' | 'pro', status: string, canceled_at: string | null }> | null };

      // Calculate user counts from fetched data
      const totalUsers = allUsers.length;
      const newUsers7Days = allUsers.filter(
        (u) => new Date(u.created_at) >= sevenDaysAgo
      ).length;
      const newUsers30Days = allUsers.filter(
        (u) => new Date(u.created_at) >= thirtyDaysAgo
      ).length;
      const newUsers30To60Days = allUsers.filter(
        (u) => new Date(u.created_at) >= sixtyDaysAgo && new Date(u.created_at) < thirtyDaysAgo
      ).length;

      // Calculate growth rate (month-over-month)
      const growthRate =
        newUsers30To60Days > 0
          ? ((newUsers30Days - newUsers30To60Days) / newUsers30To60Days) * 100
          : newUsers30Days > 0
          ? 100
          : 0;

      // Process subscriptions data
      const freeUsers = (subscriptions || []).filter((s) => s.tier === 'free').length;
      const proUsers = (subscriptions || []).filter(
        (s) => s.tier === 'pro' && ['active', 'trialing', 'past_due'].includes(s.status)
      ).length;
      const trialUsers = (subscriptions || []).filter((s) => s.status === 'trialing').length;

      // Calculate canceled this month
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const canceledThisMonth = (subscriptions || []).filter((s) => {
        if (!s.canceled_at) return false;
        const canceledDate = new Date(s.canceled_at);
        return canceledDate >= thisMonthStart;
      }).length;

      response = {
        totalUsers,
        newUsers: {
          last7Days: newUsers7Days,
          last30Days: newUsers30Days,
          growthRate: Math.round(growthRate * 100) / 100,
        },
        subscriptions: {
          free: {
            count: freeUsers,
            percentage: totalUsers > 0 ? Math.round((freeUsers / totalUsers) * 100) : 0,
          },
          pro: {
            count: proUsers,
            percentage: totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0,
          },
          trial: {
            count: trialUsers,
            percentage: totalUsers > 0 ? Math.round((trialUsers / totalUsers) * 100) : 0,
          },
          canceledThisMonth,
        },
      };
    }

    // Fetch revenue data if requested
    if (includeRevenue) {
      const { data: subscriptions } = await adminClient
        .from('subscriptions')
        .select('tier, status, billing_interval') as { data: Array<{ tier: 'free' | 'pro', status: string, billing_interval: 'month' | 'year' | null }> | null };

      // Calculate revenue metrics (simplified - assumes $10/month, $100/year)
      // TODO: Fetch actual prices from Stripe when implementing full integration
      const monthlyRevenue = (subscriptions || [])
        .filter((s) => s.tier === 'pro' && s.status === 'active' && s.billing_interval === 'month')
        .length * 10;
      const yearlyRevenue = (subscriptions || [])
        .filter((s) => s.tier === 'pro' && s.status === 'active' && s.billing_interval === 'year')
        .length * 100;

      const mrr = monthlyRevenue + yearlyRevenue / 12;
      const arr = mrr * 12;

      response.revenue = {
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        thisMonth: Math.round((monthlyRevenue + yearlyRevenue / 12) * 100) / 100,
      };
    }

    // Fetch activity data if requested
    if (includeActivity) {
      // Fetch all users to calculate active users
      const { data: authData } = await adminClient.auth.admin.listUsers({
        perPage: 1000,
      });

      const allUsers = authData?.users || [];

      const [
        billablesAllTimeResult,
        billables30DaysResult,
      ] = await Promise.all([
        // Total billables count
        adminClient.from('billables').select('id', { count: 'exact', head: true }),

        // Billables last 30 days
        adminClient.from('billables').select('id, user_id', { count: 'exact' })
          .gte('created_at', thirtyDaysAgo.toISOString()),
      ]);

      // Calculate billables metrics
      const totalBillables = billablesAllTimeResult.count || 0;
      const billables30Days = billables30DaysResult.count || 0;

      // Calculate active users (signed in last 30 days)
      const activeUsers = allUsers.filter(
        (u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= thirtyDaysAgo
      ).length;
      const avgEntriesPerActiveUser = activeUsers > 0 ? billables30Days / activeUsers : 0;

      // Get top users by billables count
      const topUsersMap = new Map<string, number>();
      if (billables30DaysResult.data) {
        billables30DaysResult.data.forEach((billable: any) => {
          const count = topUsersMap.get(billable.user_id) || 0;
          topUsersMap.set(billable.user_id, count + 1);
        });
      }

      const topUserIds = Array.from(topUsersMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId]) => userId);

      // Fetch top user details
      let topUsers: any[] = [];
      if (topUserIds.length > 0) {
        const topUsersEmailMap = await getUserEmailsByIds(topUserIds);

        const { data: topUsersSubscriptions } = await adminClient
          .from('subscriptions')
          .select('user_id, tier, status')
          .in('user_id', topUserIds) as { data: Array<{ user_id: string, tier: 'free' | 'pro', status: string }> | null };

        const subscriptionMap = new Map(
          topUsersSubscriptions?.map((s) => [s.user_id, s]) || []
        );

        topUsers = topUserIds.map((userId) => {
          const subscription = subscriptionMap.get(userId);
          return {
            email: topUsersEmailMap.get(userId) || 'Unknown',
            billables: topUsersMap.get(userId) || 0,
            tier: subscription?.tier === 'pro' && ['active', 'trialing'].includes(subscription?.status)
              ? 'pro'
              : 'free',
          };
        });
      }

      response.activity = {
        totalBillables,
        billablesLast30Days: billables30Days,
        avgEntriesPerActiveUser: Math.round(avgEntriesPerActiveUser * 10) / 10,
        activeUsers,
        topUsers,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
}
