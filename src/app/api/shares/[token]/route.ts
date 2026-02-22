import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PublicItem, PublicWishlist } from '@/lib/types/database'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient()

  // Validar token
  const { data: share, error: shareError } = await supabase
    .from('shared_wishlists')
    .select('wishlist_id, is_active, expires_at')
    .eq('share_token', params.token)
    .single()

  if (shareError || !share) {
    return NextResponse.json({ error: 'Link no válido' }, { status: 404 })
  }

  if (!share.is_active) {
    return NextResponse.json({ error: 'Este link ha sido desactivado' }, { status: 410 })
  }

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Este link ha expirado' }, { status: 410 })
  }

  // Obtener wishlist con items y perfil del dueño
  const { data: wishlist, error: wishlistError } = await supabase
    .from('wishlists')
    .select(`
      id, name, description, surprise_mode, owner_id,
      wishlist_items(
        id, name, description, image_url, price, currency,
        external_link, priority, status, reserved_by,
        categories(name, icon, color)
      ),
      profiles!wishlists_owner_id_fkey(username, full_name, avatar_url)
    `)
    .eq('id', share.wishlist_id)
    .single()

  if (wishlistError || !wishlist) {
    return NextResponse.json({ error: 'Lista no encontrada' }, { status: 404 })
  }

  const isSurpriseMode = wishlist.surprise_mode
  const profile = (wishlist as Record<string, unknown>).profiles as {
    username: string
    full_name: string | null
    avatar_url: string | null
  }

  const items: PublicItem[] = ((wishlist.wishlist_items as Record<string, unknown>[]) ?? []).map((item) => {
    const typedItem = item as {
      id: string
      name: string
      description: string | null
      image_url: string | null
      price: number | null
      currency: string
      external_link: string | null
      priority: 0 | 1 | 2
      status: 'available' | 'reserved' | 'purchased'
      reserved_by: string | null
      categories: { name: string; icon: string | null; color: string } | null
    }

    // En modo sorpresa: ocultar items reservados y el reserved_by
    if (isSurpriseMode && typedItem.status === 'reserved') {
      return {
        id: typedItem.id,
        name: typedItem.name,
        description: typedItem.description,
        image_url: typedItem.image_url,
        price: typedItem.price,
        currency: typedItem.currency,
        external_link: typedItem.external_link,
        priority: typedItem.priority,
        status: 'reserved' as const,
        category: typedItem.categories,
      }
    }

    return {
      id: typedItem.id,
      name: typedItem.name,
      description: typedItem.description,
      image_url: typedItem.image_url,
      price: typedItem.price,
      currency: typedItem.currency,
      external_link: typedItem.external_link,
      priority: typedItem.priority,
      status: typedItem.status,
      category: typedItem.categories,
    }
  })

  const publicWishlist: PublicWishlist = {
    id: wishlist.id,
    name: wishlist.name,
    description: wishlist.description,
    surprise_mode: wishlist.surprise_mode,
    owner: {
      username: profile?.username ?? 'usuario',
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
    items,
  }

  return NextResponse.json(publicWishlist)
}

// Reservar un item (acción pública desde la vista compartida)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Debes iniciar sesión para reservar' }, { status: 401 })
  }

  const body = await request.json()
  const { itemId, action } = body as { itemId: string; action: 'reserve' | 'unreserve' }

  // Validar token y obtener wishlist_id
  const { data: share } = await supabase
    .from('shared_wishlists')
    .select('wishlist_id, is_active, expires_at')
    .eq('share_token', params.token)
    .single()

  if (!share?.is_active) {
    return NextResponse.json({ error: 'Link no válido' }, { status: 404 })
  }

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
  }

  if (action === 'reserve') {
    const { data, error } = await supabase
      .from('wishlist_items')
      .update({ status: 'reserved', reserved_by: user.id })
      .eq('id', itemId)
      .eq('wishlist_id', share.wishlist_id)
      .eq('status', 'available')
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'No se pudo reservar' }, { status: 400 })
    }
    return NextResponse.json(data)
  }

  if (action === 'unreserve') {
    const { data, error } = await supabase
      .from('wishlist_items')
      .update({ status: 'available', reserved_by: null })
      .eq('id', itemId)
      .eq('wishlist_id', share.wishlist_id)
      .eq('reserved_by', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'No se pudo cancelar la reserva' }, { status: 400 })
    }
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
