import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('queries')
            .select('*')
            .order('is_template', { ascending: false })
            .order('category');

        if (error) throw error;

        return NextResponse.json({ queries: data });
    } catch (error) {
        console.error('Error fetching queries:', error);
        return NextResponse.json(
            { error: 'Failed to fetch queries' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, category } = body;

        if (!text) {
            return NextResponse.json(
                { error: 'Query text is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('queries')
            .insert([{ text, category, is_template: false }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ query: data }, { status: 201 });
    } catch (error) {
        console.error('Error creating query:', error);
        return NextResponse.json(
            { error: 'Failed to create query' },
            { status: 500 }
        );
    }
}
