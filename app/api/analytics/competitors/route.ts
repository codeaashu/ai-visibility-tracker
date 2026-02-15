import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: brands, error: brandsError } = await supabase.from('brands').select('id, name, category');
    if (brandsError) throw brandsError;

    const { data: mentions, error: mentionsError } = await supabase.from('mentions').select('brand_id');
    if (mentionsError) throw mentionsError;

    const counts = new Map<string, number>();
    for (const mention of mentions || []) {
      counts.set(mention.brand_id, (counts.get(mention.brand_id) || 0) + 1);
    }

    const competitors = (brands || []).map((brand) => ({
      brand_id: brand.id,
      name: brand.name,
      category: brand.category,
      mentions: counts.get(brand.id) || 0,
    })).sort((a, b) => b.mentions - a.mentions);

    return NextResponse.json({ competitors });
  } catch (error) {
    console.error('Error fetching competitor analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch competitor analytics' }, { status: 500 });
  }
}
