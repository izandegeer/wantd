import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const createShareSchema = z.object({
  wishlist_id: z.string().uuid(),
  expires_at: z.string().datetime().nullable().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createShareSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Verificar que la wishlist pertenece al usuario
  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('id')
    .eq('id', parsed.data.wishlist_id)
    .eq('owner_id', user.id)
    .single()

  if (!wishlist) {
    return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 })
  }

  // Desactivar shares anteriores activos
  await supabase
    .from('shared_wishlists')
    .update({ is_active: false })
    .eq('wishlist_id', parsed.data.wishlist_id)
    .eq('created_by', user.id)
    .eq('is_active', true)

  // Generar token único
  const share_token = randomBytes(16).toString('hex')

  const { data, error } = await supabase
    .from('shared_wishlists')
    .insert({
      wishlist_id: parsed.data.wishlist_id,
      share_token,
      created_by: user.id,
      expires_at: parsed.data.expires_at ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('shared_wishlists')
    .update({ is_active: false })
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
