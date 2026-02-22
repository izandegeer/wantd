import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const itemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  price: z.number().positive().nullable().optional(),
  currency: z.string().length(3).default('EUR'),
  external_link: z.string().url().nullable().optional(),
  priority: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(1),
  category_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const updateItemSchema = itemSchema.partial().extend({
  status: z.enum(['available', 'reserved', 'purchased']).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verificar que la wishlist pertenece al usuario
  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('id')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single()

  if (!wishlist) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*, categories(*)')
    .eq('wishlist_id', params.id)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verificar propiedad
  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('id')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single()

  if (!wishlist) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = itemSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({ ...parsed.data, wishlist_id: params.id })
    .select('*, categories(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { itemId, ...rest } = body
  const parsed = updateItemSchema.safeParse(rest)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Verificar propiedad via wishlist
  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('id')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single()

  if (!wishlist) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('wishlist_items')
    .update(parsed.data)
    .eq('id', itemId)
    .eq('wishlist_id', params.id)
    .select('*, categories(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')

  if (!itemId) {
    return NextResponse.json({ error: 'itemId required' }, { status: 400 })
  }

  // Verificar propiedad
  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('id')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single()

  if (!wishlist) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', itemId)
    .eq('wishlist_id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
