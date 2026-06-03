import { NextResponse } from 'next/server';
import { getRegistryEntries, getRegistryEntriesByCategory } from '@/lib/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const components = getRegistryEntries();
  const byCategory = getRegistryEntriesByCategory();

  return NextResponse.json({
    components,
    byCategory,
    total: components.length,
  });
}
