-- ===== roles =====
CREATE TYPE public.app_role AS ENUM ('admin','customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== settings =====
CREATE TABLE public.restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Shivansi Restaurant & Sweet Shop',
  tagline text NOT NULL DEFAULT 'Sweets, spice and everything nice',
  logo_url text,
  banner_url text,
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  gst_number text NOT NULL DEFAULT '',
  opening_time text NOT NULL DEFAULT '09:00',
  closing_time text NOT NULL DEFAULT '23:00',
  upi_id text NOT NULL DEFAULT '',
  tax_percent numeric NOT NULL DEFAULT 5,
  packing_charge numeric NOT NULL DEFAULT 20,
  delivery_charge numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT '₹',
  theme text NOT NULL DEFAULT 'dark',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurant_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.restaurant_settings TO authenticated;
GRANT ALL ON public.restaurant_settings TO service_role;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.restaurant_settings FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.restaurant_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER t_settings BEFORE UPDATE ON public.restaurant_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== categories =====
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER t_categories BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== products =====
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  offer_price numeric CHECK (offer_price >= 0),
  rating numeric NOT NULL DEFAULT 4.5,
  review_count int NOT NULL DEFAULT 0,
  prep_time_mins int NOT NULL DEFAULT 15,
  is_available boolean NOT NULL DEFAULT true,
  is_veg boolean NOT NULL DEFAULT true,
  is_spicy boolean NOT NULL DEFAULT false,
  calories int NOT NULL DEFAULT 0,
  is_special boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  is_recommended boolean NOT NULL DEFAULT false,
  sold_by_weight boolean NOT NULL DEFAULT false,
  price_per_kg numeric,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_available ON public.products(is_available);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER t_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== tables =====
CREATE TABLE public.restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number int NOT NULL UNIQUE,
  seats int NOT NULL DEFAULT 4,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurant_tables TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.restaurant_tables TO authenticated;
GRANT ALL ON public.restaurant_tables TO service_role;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tables public read" ON public.restaurant_tables FOR SELECT USING (true);
CREATE POLICY "tables admin write" ON public.restaurant_tables FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== customers =====
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  birthday date,
  visits int NOT NULL DEFAULT 0,
  reward_points int NOT NULL DEFAULT 0,
  total_spend numeric NOT NULL DEFAULT 0,
  favourite_item text,
  saved_address text,
  last_visit timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_phone ON public.customers(phone);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers admin all" ON public.customers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "customers own read" ON public.customers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER t_customers BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== orders =====
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  session_token uuid NOT NULL DEFAULT gen_random_uuid(),
  table_number int,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'cash',
  payment_status text NOT NULL DEFAULT 'unpaid',
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  discount_label text,
  tax numeric NOT NULL DEFAULT 0,
  packing_charge numeric NOT NULL DEFAULT 0,
  delivery_charge numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders admin all" ON public.orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "orders own read" ON public.orders FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));
CREATE TRIGGER t_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1,
  weight_label text,
  instructions text,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items admin all" ON public.order_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "order_items own read" ON public.order_items FOR SELECT TO authenticated
  USING (order_id IN (SELECT o.id FROM public.orders o JOIN public.customers c ON c.id = o.customer_id WHERE c.user_id = auth.uid()));

-- ===== offers =====
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  banner_url text,
  discount_percent numeric NOT NULL DEFAULT 0,
  coupon_code text,
  category_ids uuid[] NOT NULL DEFAULT '{}',
  product_ids uuid[] NOT NULL DEFAULT '{}',
  starts_at date,
  ends_at date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.offers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers public read" ON public.offers FOR SELECT USING (true);
CREATE POLICY "offers admin write" ON public.offers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER t_offers BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== discount campaigns =====
CREATE TABLE public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'percentage',
  coupon_code text,
  value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  category_ids uuid[] NOT NULL DEFAULT '{}',
  product_ids uuid[] NOT NULL DEFAULT '{}',
  starts_at date,
  ends_at date,
  start_hour int,
  end_hour int,
  is_active boolean NOT NULL DEFAULT true,
  usage_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discounts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.discounts TO authenticated;
GRANT ALL ON public.discounts TO service_role;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discounts public read" ON public.discounts FOR SELECT USING (true);
CREATE POLICY "discounts admin write" ON public.discounts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER t_discounts BEFORE UPDATE ON public.discounts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== loyalty =====
CREATE TABLE public.loyalty_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visits_required int NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 0,
  reward_points int NOT NULL DEFAULT 0,
  expiry_days int NOT NULL DEFAULT 365,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_rules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.loyalty_rules TO authenticated;
GRANT ALL ON public.loyalty_rules TO service_role;
ALTER TABLE public.loyalty_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty public read" ON public.loyalty_rules FOR SELECT USING (true);
CREATE POLICY "loyalty admin write" ON public.loyalty_rules FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER t_loyalty BEFORE UPDATE ON public.loyalty_rules FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== inventory =====
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  quantity numeric NOT NULL DEFAULT 0,
  low_stock_threshold numeric NOT NULL DEFAULT 5,
  cost_per_unit numeric NOT NULL DEFAULT 0,
  expiry_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory admin all" ON public.inventory_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER t_inventory BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== reviews =====
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (is_published);
CREATE POLICY "reviews admin write" ON public.reviews FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== notifications =====
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications admin all" ON public.notifications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- realtime
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ===== seed =====
INSERT INTO public.restaurant_settings (address, phone, gst_number, upi_id)
VALUES ('Main Market Road, Indore, Madhya Pradesh', '+91 98765 43210', '23ABCDE1234F1Z5', 'shivansi@upi');

INSERT INTO public.categories (name, slug, description, sort_order) VALUES
 ('Breakfast','breakfast','Fresh morning starters',1),
 ('Snacks','snacks','Crispy evening bites',2),
 ('Main Course','main-course','Hearty Indian mains',3),
 ('Sweet Shop','sweet-shop','Fresh mithai by weight',4),
 ('Drinks','drinks','Chilled and hot beverages',5),
 ('Desserts','desserts','Sweet endings',6),
 ('Combos','combos','Value meal combos',7);

INSERT INTO public.products (category_id,name,description,price,offer_price,prep_time_mins,is_veg,is_spicy,calories,is_special,is_popular,is_recommended,sold_by_weight,price_per_kg,rating)
SELECT c.id, v.name, v.description, v.price, v.offer_price, v.prep, v.veg, v.spicy, v.cal, v.special, v.popular, v.rec, v.weight, v.ppk, v.rating
FROM (VALUES
 ('breakfast','Poha Jalebi','Indori poha with crisp jalebi',60,50,10,true,false,420,true,true,true,false,NULL,4.8),
 ('breakfast','Masala Dosa','Crispy dosa with potato masala',120,NULL,15,true,true,510,false,true,false,false,NULL,4.6),
 ('breakfast','Aloo Paratha','Butter-topped stuffed paratha',80,NULL,12,true,false,480,false,false,true,false,NULL,4.5),
 ('snacks','Samosa (2 pcs)','Flaky potato samosas',40,30,8,true,true,320,false,true,false,false,NULL,4.7),
 ('snacks','Paneer Tikka','Char-grilled marinated paneer',220,199,18,true,true,390,true,true,true,false,NULL,4.9),
 ('snacks','Chicken Seekh Kebab','Smoky minced chicken skewers',260,NULL,20,false,true,450,false,false,true,false,NULL,4.6),
 ('main-course','Paneer Butter Masala','Creamy tomato gravy with paneer',280,249,22,true,false,620,true,true,true,false,NULL,4.9),
 ('main-course','Dal Makhani','Slow-cooked black lentils',220,NULL,25,true,false,540,false,true,false,false,NULL,4.7),
 ('main-course','Butter Chicken','Classic creamy chicken curry',340,299,25,false,true,700,true,true,true,false,NULL,4.9),
 ('main-course','Veg Biryani','Fragrant dum-cooked rice',240,NULL,28,true,true,610,false,false,true,false,NULL,4.5),
 ('sweet-shop','Kaju Katli','Premium cashew fudge',0,NULL,5,true,false,520,true,true,true,true,1200,4.9),
 ('sweet-shop','Motichoor Laddu','Soft saffron laddus',0,NULL,5,true,false,480,false,true,false,true,640,4.7),
 ('sweet-shop','Rasgulla','Spongy syrup-soaked rasgulla',0,NULL,5,true,false,380,false,false,true,true,520,4.6),
 ('sweet-shop','Gulab Jamun','Warm khoya jamuns',0,NULL,5,true,false,560,false,true,false,true,560,4.8),
 ('drinks','Masala Chai','Kadak spiced tea',30,NULL,6,true,false,120,false,true,false,false,NULL,4.8),
 ('drinks','Sweet Lassi','Thick chilled yoghurt drink',80,70,5,true,false,260,false,true,true,false,NULL,4.7),
 ('drinks','Fresh Lime Soda','Zesty sparkling lime',60,NULL,4,true,false,90,false,false,false,false,NULL,4.4),
 ('desserts','Gajar Halwa','Slow-cooked carrot halwa',140,120,10,true,false,430,true,false,true,false,NULL,4.8),
 ('desserts','Rabri Falooda','Chilled rabri with falooda',160,NULL,8,true,false,520,false,true,false,false,NULL,4.6),
 ('combos','Thali Combo','Dal, sabzi, roti, rice, sweet',260,229,20,true,false,880,true,true,true,false,NULL,4.8),
 ('combos','Family Feast','Serves 4: mains, breads, dessert',899,799,35,true,true,2400,false,false,true,false,NULL,4.7)
) AS v(cat,name,description,price,offer_price,prep,veg,spicy,cal,special,popular,rec,weight,ppk,rating)
JOIN public.categories c ON c.slug = v.cat;

INSERT INTO public.restaurant_tables (table_number, seats)
SELECT g, CASE WHEN g % 3 = 0 THEN 6 ELSE 4 END FROM generate_series(1,12) g;

INSERT INTO public.loyalty_rules (visits_required, discount_percent, reward_points, expiry_days) VALUES
 (5,5,50,365),(10,10,120,365),(20,15,300,365);

INSERT INTO public.offers (title, description, discount_percent, coupon_code, starts_at, ends_at, is_active)
VALUES
 ('Diwali Special','25% off on all sweets, freshly made every morning',25,'DIWALI25', CURRENT_DATE - 5, CURRENT_DATE + 40, true),
 ('Weekend Family Feast','Flat 15% off on combos every weekend',15,'WEEKEND15', CURRENT_DATE - 2, CURRENT_DATE + 60, true);

INSERT INTO public.discounts (name, type, coupon_code, value, min_order_amount, max_discount, is_active) VALUES
 ('Festival Diwali','festival','DIWALI25',25,300,300,true),
 ('Happy Hour 3-6 PM','happy_hour',NULL,10,200,150,true),
 ('Flat 50 Off','flat','FLAT50',50,400,50,true),
 ('Lunch Offer','lunch',NULL,12,250,200,true);

INSERT INTO public.inventory_items (name, unit, quantity, low_stock_threshold, cost_per_unit, expiry_date) VALUES
 ('Milk','litre',60,20,58,CURRENT_DATE + 3),
 ('Sugar','kg',80,25,46,CURRENT_DATE + 300),
 ('Paneer','kg',12,15,320,CURRENT_DATE + 5),
 ('Refined Oil','litre',40,15,140,CURRENT_DATE + 200),
 ('Basmati Rice','kg',100,30,110,CURRENT_DATE + 400),
 ('Dry Fruits','kg',8,10,900,CURRENT_DATE + 180);

INSERT INTO public.reviews (customer_name, rating, comment) VALUES
 ('Ananya Sharma',5,'The kaju katli is the best in the city. Ordering from the table QR was so easy!'),
 ('Rahul Verma',5,'Butter chicken and hot jalebi — perfect combination. Fast service too.'),
 ('Meera Joshi',4,'Loved the poha jalebi breakfast. Live order tracking is a nice touch.');
