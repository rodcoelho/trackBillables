// @ts-nocheck - TODO: Fix Supabase client type definitions
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Calculate date range (last 7 days including today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Today + 6 previous days = 7 days

    const startDate = formatLocalDate(sevenDaysAgo);
    const endDate = formatLocalDate(today);

    // Fetch all billables for the last 7 days
    const { data, error } = await supabase
      .from('billables')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Process data for analytics
    const billables = data || [];

    // Initialize data structure for all 7 days
    const last7Days: { date: string; dayName: string; hours: number; entries: number }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      const dateStr = formatLocalDate(date);
      const dayName = dayNames[date.getDay()];

      last7Days.push({
        date: dateStr,
        dayName,
        hours: 0,
        entries: 0,
      });
    }

    // Aggregate data by date
    const dataByDate = new Map<string, { hours: number; entries: number }>();

    billables.forEach((billable) => {
      const existing = dataByDate.get(billable.date) || { hours: 0, entries: 0 };
      existing.hours += billable.time_amount;
      existing.entries += 1;
      dataByDate.set(billable.date, existing);
    });

    // Populate the last7Days array with actual data
    last7Days.forEach((day) => {
      const dayData = dataByDate.get(day.date);
      if (dayData) {
        day.hours = Number(dayData.hours.toFixed(2));
        day.entries = dayData.entries;
      }
    });

    // Calculate stats
    const totalHours = last7Days.reduce((sum, day) => sum + day.hours, 0);
    const totalEntries = last7Days.reduce((sum, day) => sum + day.entries, 0);
    const dailyAverage = totalEntries > 0 ? Number((totalHours / 7).toFixed(2)) : 0;

    // Find most productive day
    const mostProductiveDay = last7Days.reduce((max, day) =>
      day.hours > max.hours ? day : max,
      last7Days[0]
    );

    // Calculate top client by hours
    const clientHours = new Map<string, number>();
    billables.forEach((billable) => {
      const existing = clientHours.get(billable.client) || 0;
      clientHours.set(billable.client, existing + billable.time_amount);
    });

    let topClient = null;
    if (clientHours.size > 0) {
      let maxHours = 0;
      let maxClient = '';
      clientHours.forEach((hours, client) => {
        if (hours > maxHours) {
          maxHours = hours;
          maxClient = client;
        }
      });
      topClient = { client: maxClient, hours: Number(maxHours.toFixed(2)) };
    }

    return NextResponse.json({
      dailyData: last7Days,
      stats: {
        totalHours: Number(totalHours.toFixed(2)),
        dailyAverage,
        mostProductiveDay: {
          dayName: mostProductiveDay.dayName,
          date: mostProductiveDay.date,
          hours: mostProductiveDay.hours,
        },
        totalEntries,
        topClient,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
