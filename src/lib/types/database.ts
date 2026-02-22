export type Profile = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Wishlist = {
  id: string
  owner_id: string
  name: string
  description: string | null
  surprise_mode: boolean
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  owner_id: string
  name: string
  icon: string | null
  color: string
  sort_order: number
  created_at: string
}

export type WishlistItem = {
  id: string
  wishlist_id: string
  category_id: string | null
  name: string
  description: string | null
  image_url: string | null
  price: number | null
  currency: string
  external_link: string | null
  priority: 0 | 1 | 2
  status: 'available' | 'reserved' | 'purchased'
  reserved_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
  categories?: Category | null
}

export type SharedWishlist = {
  id: string
  wishlist_id: string
  share_token: string
  created_by: string
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export type WishlistWithItems = Wishlist & {
  wishlist_items: WishlistItem[]
  shared_wishlists?: SharedWishlist[]
}

export type PublicWishlist = {
  id: string
  name: string
  description: string | null
  surprise_mode: boolean
  owner: {
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  items: PublicItem[]
}

export type PublicItem = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  price: number | null
  currency: string
  external_link: string | null
  priority: 0 | 1 | 2
  status: 'available' | 'reserved' | 'purchased'
  category: Pick<Category, 'name' | 'icon' | 'color'> | null
}
