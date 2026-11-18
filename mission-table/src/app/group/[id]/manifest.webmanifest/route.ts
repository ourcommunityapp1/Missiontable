import { NextResponse, type NextRequest } from 'next/server';
import { getGroupById, getMemberIdForToken } from '@/lib/queries';
import { appIconsFor } from '@/lib/appIcons';

export const dynamic = 'force-dynamic';

/**
 * Per-member web app manifest, so "Add to Home Screen" opens straight to this
 * member's group page (their private link is the start URL).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const group = await getGroupById(id);
  if (!group || !token || !(await getMemberIdForToken(id, token))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const icons = appIconsFor(group.countrySlug);
  const name = group.name ?? `${group.countryName} · Mission Table`;
  const shortName = name.length <= 14 ? name : name.split(' ').slice(0, 2).join(' ').slice(0, 14);
  return NextResponse.json(
    {
      id: `/group/${id}`,
      name,
      short_name: shortName,
      description: `Your Mission Table group praying for ${group.countryName}.`,
      start_url: `/group/${id}?token=${token}&source=app`,
      scope: '/',
      display: 'standalone',
      background_color: '#FBF9F4',
      theme_color: '#1C1B1B',
      // The group's country photo; it fills the whole square, so it also works as a maskable icon.
      icons: [
        { src: icons.icon192, sizes: '192x192', type: icons.type },
        { src: icons.icon512, sizes: '512x512', type: icons.type },
        { src: icons.type === 'image/jpeg' ? icons.icon512 : '/icons/icon-maskable-512.png', sizes: '512x512', type: icons.type, purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'private, no-store' } },
  );
}
