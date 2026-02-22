-- =====================================================
-- WISHLIST APP — ROW LEVEL SECURITY
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_wishlists ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES
-- =====================================================

-- Lectura pública de perfiles
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Solo el propietario puede actualizar su perfil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- WISHLISTS
-- =====================================================

-- Solo el propietario puede ver sus wishlists
CREATE POLICY "wishlists_select_own"
  ON wishlists FOR SELECT
  USING (auth.uid() = owner_id);

-- Solo el propietario puede crear wishlists
CREATE POLICY "wishlists_insert_own"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Solo el propietario puede actualizar sus wishlists
CREATE POLICY "wishlists_update_own"
  ON wishlists FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Solo el propietario puede eliminar sus wishlists
CREATE POLICY "wishlists_delete_own"
  ON wishlists FOR DELETE
  USING (auth.uid() = owner_id);

-- =====================================================
-- CATEGORIES
-- =====================================================

-- Solo el propietario puede ver sus categorías
CREATE POLICY "categories_select_own"
  ON categories FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "categories_insert_own"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "categories_update_own"
  ON categories FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "categories_delete_own"
  ON categories FOR DELETE
  USING (auth.uid() = owner_id);

-- =====================================================
-- WISHLIST ITEMS
-- =====================================================

-- Solo el propietario de la wishlist puede ver sus items
CREATE POLICY "wishlist_items_select_own"
  ON wishlist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.owner_id = auth.uid()
    )
  );

CREATE POLICY "wishlist_items_insert_own"
  ON wishlist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.owner_id = auth.uid()
    )
  );

CREATE POLICY "wishlist_items_update_own"
  ON wishlist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.owner_id = auth.uid()
    )
  );

CREATE POLICY "wishlist_items_delete_own"
  ON wishlist_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.owner_id = auth.uid()
    )
  );

-- Política especial: usuarios autenticados pueden reservar items
-- (actualizar solo status y reserved_by en wishlists compartidas)
CREATE POLICY "wishlist_items_reserve"
  ON wishlist_items FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND status = 'available'
    AND EXISTS (
      SELECT 1 FROM shared_wishlists sw
      JOIN wishlists w ON w.id = sw.wishlist_id
      WHERE w.id = wishlist_items.wishlist_id
      AND sw.is_active = true
      AND (sw.expires_at IS NULL OR sw.expires_at > now())
    )
  );

-- =====================================================
-- SHARED WISHLISTS
-- =====================================================

-- Lectura pública para validar tokens
CREATE POLICY "shared_wishlists_select_public"
  ON shared_wishlists FOR SELECT
  USING (true);

-- Solo el creador puede gestionar sus links
CREATE POLICY "shared_wishlists_insert_own"
  ON shared_wishlists FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "shared_wishlists_update_own"
  ON shared_wishlists FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "shared_wishlists_delete_own"
  ON shared_wishlists FOR DELETE
  USING (auth.uid() = created_by);
