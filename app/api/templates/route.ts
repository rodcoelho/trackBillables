// @ts-nocheck - TODO: Fix Supabase client type definitions
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch templates
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (templatesError) {
      console.error('Failed to fetch templates:', templatesError);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // Fetch all tag assignments for user's templates
    const templateIds = templates.map((t: any) => t.id);

    if (templateIds.length === 0) {
      return NextResponse.json({ templates: [], tags: [] });
    }

    const { data: assignments, error: assignError } = await supabase
      .from('template_tag_assignments')
      .select('template_id, tag_id')
      .in('template_id', templateIds);

    if (assignError) {
      console.error('Failed to fetch tag assignments:', assignError);
      return NextResponse.json({ error: 'Failed to fetch tag assignments' }, { status: 500 });
    }

    // Fetch all user's tags
    const { data: tags, error: tagsError } = await supabase
      .from('template_tags')
      .select('*')
      .eq('user_id', user.id);

    if (tagsError) {
      console.error('Failed to fetch tags:', tagsError);
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    // Build tag map
    const tagMap: Record<string, any> = {};
    for (const tag of tags || []) {
      tagMap[tag.id] = tag;
    }

    // Attach tags to templates
    const templatesWithTags = templates.map((template: any) => {
      const templateAssignments = (assignments || []).filter(
        (a: any) => a.template_id === template.id
      );
      const templateTags = templateAssignments
        .map((a: any) => tagMap[a.tag_id])
        .filter(Boolean);
      return { ...template, tags: templateTags };
    });

    return NextResponse.json({ templates: templatesWithTags, tags: tags || [] });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, client, matter, time_amount, description, tags } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    // Validate time_amount if provided
    if (time_amount !== undefined && time_amount !== null) {
      if (time_amount < 0.1 || time_amount > 24) {
        return NextResponse.json(
          { error: 'Time amount must be between 0.1 and 24 hours' },
          { status: 400 }
        );
      }
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription tier for template limit
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Free tier: max 3 templates
    if (subscription.tier === 'free') {
      const { count, error: countError } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Failed to count templates:', countError);
        return NextResponse.json({ error: 'Failed to check template limit' }, { status: 500 });
      }

      if ((count || 0) >= 3) {
        return NextResponse.json(
          {
            error: 'Template limit reached',
            upgrade: true,
            message: "You've reached your free plan limit of 3 templates. Upgrade to Pro for unlimited templates!"
          },
          { status: 403 }
        );
      }
    }

    // Insert the template
    const { data: template, error: insertError } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        name: name.trim(),
        client: client?.trim() || null,
        matter: matter?.trim() || null,
        time_amount: time_amount || null,
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert template:', insertError);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    // Handle tags
    const templateTags: any[] = [];
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;

        // Upsert tag (create if not exists)
        let { data: existingTag } = await supabase
          .from('template_tags')
          .select('*')
          .eq('user_id', user.id)
          .eq('name', trimmed)
          .single();

        if (!existingTag) {
          const { data: newTag, error: tagError } = await supabase
            .from('template_tags')
            .insert({ user_id: user.id, name: trimmed })
            .select()
            .single();

          if (tagError) {
            console.error('Failed to create tag:', tagError);
            continue;
          }
          existingTag = newTag;
        }

        // Create assignment
        if (existingTag) {
          await supabase
            .from('template_tag_assignments')
            .insert({ template_id: template.id, tag_id: existingTag.id });

          templateTags.push(existingTag);
        }
      }
    }

    return NextResponse.json(
      { success: true, template: { ...template, tags: templateTags } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
