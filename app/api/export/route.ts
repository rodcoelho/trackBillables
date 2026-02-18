// @ts-nocheck - TODO: Fix Supabase client type definitions
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

const MAX_ROWS = 100000;
const WARNING_ROWS = 10000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      startDate,
      endDate,
      format,
      clientFilter,
      matterFilter,
      customFilename,
    } = body;

    // Validate required fields
    if (!startDate || !endDate || !format) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json(
        { error: 'Start date must be before or equal to end date' },
        { status: 400 }
      );
    }

    // Check if date range exceeds 6 months
    const sixMonthsLater = new Date(start);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    if (end > sixMonthsLater) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 6 months. Please select a shorter range.' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check subscription and export limits
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check if user can export (free tier: 1 export/month)
    if (subscription.tier === 'free') {
      // Check if we need to reset the counter (new month)
      const resetDate = new Date(subscription.usage_reset_date);
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      if (resetDate < firstOfMonth) {
        // Reset counters
        await supabase
          .from('subscriptions')
          .update({
            entries_count_current_month: 0,
            exports_count_current_month: 0,
            usage_reset_date: firstOfMonth.toISOString().split('T')[0],
          })
          .eq('user_id', user.id);

        // Refresh subscription data
        const { data: refreshedSub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (refreshedSub) {
          Object.assign(subscription, refreshedSub);
        }
      }

      // Check limit
      if (subscription.exports_count_current_month >= 1) {
        return NextResponse.json(
          {
            error: 'Export limit reached',
            upgrade: true,
            message: 'You\'ve used your 1 free export for this month. Upgrade to Pro for unlimited exports!'
          },
          { status: 403 }
        );
      }
    }

    // Pro users have unlimited exports (skip limit check)

    // First, get the count to check if we're within limits
    let countQuery = supabase
      .from('billables')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (clientFilter) {
      countQuery = countQuery.eq('client', clientFilter);
    }

    if (matterFilter) {
      countQuery = countQuery.eq('matter', matterFilter);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Database error:', countError);
      return NextResponse.json(
        { error: 'Failed to count billables' },
        { status: 500 }
      );
    }

    // Check row limit
    if (count && count > MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows to export (${count}). Maximum is ${MAX_ROWS}. Please narrow your date range or filters.` },
        { status: 400 }
      );
    }

    // Fetch data in batches to handle large datasets (Supabase has a 1000 row default limit)
    const BATCH_SIZE = 1000;
    const allData: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore && allData.length < MAX_ROWS) {
      let batchQuery = supabase
        .from('billables')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .range(from, from + BATCH_SIZE - 1);

      if (clientFilter) {
        batchQuery = batchQuery.eq('client', clientFilter);
      }

      if (matterFilter) {
        batchQuery = batchQuery.eq('matter', matterFilter);
      }

      const { data: batchData, error: batchError } = await batchQuery;

      if (batchError) {
        console.error('Database error:', batchError);
        return NextResponse.json(
          { error: 'Failed to fetch billables' },
          { status: 500 }
        );
      }

      if (!batchData || batchData.length === 0) {
        break;
      }

      allData.push(...batchData);
      hasMore = batchData.length === BATCH_SIZE;
      from += BATCH_SIZE;
    }

    const data = allData;

    // Generate filename
    const filename = customFilename || generateFilename(
      clientFilter,
      matterFilter,
      startDate,
      endDate,
      format
    );

    // Increment export count for free tier users
    if (subscription.tier === 'free') {
      await supabase
        .from('subscriptions')
        .update({
          exports_count_current_month: subscription.exports_count_current_month + 1,
        })
        .eq('user_id', user.id);
    }

    // Generate file based on format
    if (format === 'csv') {
      const csv = generateCSV(data || []);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else if (format === 'xlsx') {
      const buffer = await generateExcel(data || []);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateFilename(
  client: string | undefined,
  matter: string | undefined,
  startDate: string,
  endDate: string,
  format: string
): string {
  const parts: string[] = [];

  if (client) {
    parts.push(sanitizeFilename(client));
  }

  if (matter) {
    parts.push(sanitizeFilename(matter));
  }

  // Format dates as DDMMYYYY
  const startFormatted = formatDateForFilename(startDate);
  const endFormatted = formatDateForFilename(endDate);

  parts.push(`${startFormatted}_${endFormatted}`);

  const extension = format === 'csv' ? 'csv' : 'xlsx';
  return `${parts.join('_')}.${extension}`;
}

function sanitizeFilename(str: string): string {
  return str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
}

function formatDateForFilename(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

function formatDateAmerican(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function generateCSV(data: any[]): string {
  const headers = ['Date', 'Client', 'Case Number', 'Matter', 'Hours', 'Description'];
  const rows = data.map(row => [
    formatDateAmerican(row.date),
    escapeCsvField(row.client || ''),
    escapeCsvField(row.case_number || ''),
    escapeCsvField(row.matter || ''),
    row.time_amount,
    escapeCsvField(row.description || ''),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

async function generateExcel(data: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Billables');

  // Add headers
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Client', key: 'client', width: 20 },
    { header: 'Case Number', key: 'case_number', width: 15 },
    { header: 'Matter', key: 'matter', width: 30 },
    { header: 'Hours', key: 'hours', width: 10 },
    { header: 'Description', key: 'description', width: 50 },
  ];

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data
  data.forEach(row => {
    worksheet.addRow({
      date: formatDateAmerican(row.date),
      client: row.client || '',
      case_number: row.case_number || '',
      matter: row.matter || '',
      hours: row.time_amount,
      description: row.description || '',
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
