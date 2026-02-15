import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('queries')
      .select('*')
      .eq('is_template', true)
      .order('category');

    if (error) throw error;

    return NextResponse.json({ templates: data || [] });
  } catch (error) {
    console.error('Error fetching query templates:', error);
    return NextResponse.json({ error: 'Failed to fetch query templates' }, { status: 500 });
  }
}
