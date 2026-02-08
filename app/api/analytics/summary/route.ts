// @ts-nocheck - TODO: Fix Supabase client type definitions
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const period = request.nextUrl.searchParams.get('period') || '7days';

    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: string;
    let endDate: string = formatLocalDate(today);

    if (period === 'month') {
      // First day of current month
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = formatLocalDate(firstOfMonth);
    } else if (period === 'year') {
      // First day of current year
      const firstOfYear = new Date(today.getFullYear(), 0, 1);
      startDate = formatLocalDate(firstOfYear);
    } else {
      // Last 7 days (default)
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      startDate = formatLocalDate(sevenDaysAgo);
    }

    // Fetch billables for the period
    const { data, error } = await supabase
      .from('billables')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
    }

    const billables = data || [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Build chart data based on period
    let chartData: { label: string; date: string; hours: number; entries: number }[] = [];

    if (period === 'year') {
      // Group by month for yearly view
      const monthlyData = new Map<number, { hours: number; entries: number }>();
      for (let m = 0; m <= today.getMonth(); m++) {
        monthlyData.set(m, { hours: 0, entries: 0 });
      }

      billables.forEach((b) => {
        const d = new Date(b.date + 'T00:00:00');
        const m = d.getMonth();
        const existing = monthlyData.get(m) || { hours: 0, entries: 0 };
        existing.hours += b.time_amount;
        existing.entries += 1;
        monthlyData.set(m, existing);
      });

      monthlyData.forEach((val, m) => {
        chartData.push({
          label: monthNames[m],
          date: `${today.getFullYear()}-${String(m + 1).padStart(2, '0')}-01`,
          hours: Number(val.hours.toFixed(2)),
          entries: val.entries,
        });
      });
    } else if (period === 'month') {
      // Group by week for monthly view
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = today.getDate();

      // Build weekly buckets
      let weekStart = 1;
      while (weekStart <= lastDay) {
        const weekEnd = Math.min(weekStart + 6, lastDay);
        const label = weekStart === weekEnd ? `${monthNames[today.getMonth()]} ${weekStart}` : `${monthNames[today.getMonth()]} ${weekStart}-${weekEnd}`;
        chartData.push({
          label,
          date: formatLocalDate(new Date(today.getFullYear(), today.getMonth(), weekStart)),
          hours: 0,
          entries: 0,
        });
        weekStart = weekEnd + 1;
      }

      billables.forEach((b) => {
        const d = new Date(b.date + 'T00:00:00');
        const dayOfMonth = d.getDate();
        // Find which week bucket this belongs to
        let bucketStart = 1;
        let bucketIdx = 0;
        while (bucketStart <= lastDay) {
          const bucketEnd = Math.min(bucketStart + 6, lastDay);
          if (dayOfMonth >= bucketStart && dayOfMonth <= bucketEnd) {
            chartData[bucketIdx].hours = Number((chartData[bucketIdx].hours + b.time_amount).toFixed(2));
            chartData[bucketIdx].entries += 1;
            break;
          }
          bucketStart = bucketEnd + 1;
          bucketIdx++;
        }
      });
    } else {
      // Daily data for 7-day view
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(sevenDaysAgo.getDate() + i);
        const dateStr = formatLocalDate(date);
        const isToday = dateStr === formatLocalDate(today);
        chartData.push({
          label: isToday ? 'Today' : `${dayNames[date.getDay()]} ${date.getDate()}`,
          date: dateStr,
          hours: 0,
          entries: 0,
        });
      }

      const dataByDate = new Map<string, { hours: number; entries: number }>();
      billables.forEach((b) => {
        const existing = dataByDate.get(b.date) || { hours: 0, entries: 0 };
        existing.hours += b.time_amount;
        existing.entries += 1;
        dataByDate.set(b.date, existing);
      });

      chartData.forEach((day) => {
        const dayData = dataByDate.get(day.date);
        if (dayData) {
          day.hours = Number(dayData.hours.toFixed(2));
          day.entries = dayData.entries;
        }
      });
    }

    // Calculate stats
    const totalHours = billables.reduce((sum, b) => sum + b.time_amount, 0);
    const totalEntries = billables.length;

    // Daily average: total hours divided by number of days in the period
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const dailyAverage = totalEntries > 0 ? Number((totalHours / totalDays).toFixed(2)) : 0;

    // Most productive day & top client (only for 7-day view)
    let mostProductiveDay = null;
    let topClient = null;

    if (period === '7days') {
      const dayHours = new Map<string, { dayName: string; date: string; hours: number }>();
      billables.forEach((b) => {
        const d = new Date(b.date + 'T00:00:00');
        const existing = dayHours.get(b.date) || { dayName: dayNames[d.getDay()], date: b.date, hours: 0 };
        existing.hours += b.time_amount;
        dayHours.set(b.date, existing);
      });

      let maxDay = { dayName: '', date: '', hours: 0 };
      dayHours.forEach((val) => {
        if (val.hours > maxDay.hours) maxDay = val;
      });
      if (maxDay.hours > 0) {
        mostProductiveDay = { dayName: maxDay.dayName, date: maxDay.date, hours: Number(maxDay.hours.toFixed(2)) };
      }

      const clientHours = new Map<string, number>();
      billables.forEach((b) => {
        const existing = clientHours.get(b.client) || 0;
        clientHours.set(b.client, existing + b.time_amount);
      });

      let maxHours = 0;
      let maxClient = '';
      clientHours.forEach((hours, client) => {
        if (hours > maxHours) { maxHours = hours; maxClient = client; }
      });
      if (maxHours > 0) {
        topClient = { client: maxClient, hours: Number(maxHours.toFixed(2)) };
      }
    }

    return NextResponse.json({
      period,
      chartData,
      stats: {
        totalHours: Number(totalHours.toFixed(2)),
        dailyAverage,
        totalEntries,
        mostProductiveDay,
        topClient,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
