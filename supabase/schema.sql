-- QuoteDock Schema

-- profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'ILS',
  language TEXT DEFAULT 'he',
  vat_rate DECIMAL(5,2) DEFAULT 18,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- services catalog
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'unit',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- quotes
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  number TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  valid_until DATE,
  discount DECIMAL(10,2) DEFAULT 0,
  discount_type TEXT DEFAULT 'percent',
  discount_reason TEXT,
  include_vat BOOLEAN DEFAULT true,
  public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- quote line items
CREATE TABLE quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- signatures
CREATE TABLE signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL UNIQUE,
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signature_data TEXT NOT NULL,
  ip_address TEXT,
  signed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own clients" ON clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own services" ON services FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own quotes" ON quotes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view quote by token" ON quotes FOR SELECT USING (public_token IS NOT NULL);

CREATE POLICY "Users manage own quote items" ON quote_items FOR ALL USING (
  EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid())
);
CREATE POLICY "Public can view quote items" ON quote_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.public_token IS NOT NULL)
);

CREATE POLICY "Users view own signatures" ON signatures FOR SELECT USING (
  EXISTS (SELECT 1 FROM quotes WHERE quotes.id = signatures.quote_id AND quotes.user_id = auth.uid())
);
CREATE POLICY "Anyone can create signature" ON signatures FOR INSERT WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- FAQ items (publicly readable, admin-managed via Supabase dashboard)
CREATE TABLE faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQs are publicly readable" ON faqs FOR SELECT USING (true);

INSERT INTO faqs (question, answer, sort_order) VALUES
  ('איך שולחים הצעת מחיר ללקוח?', 'לוחצים על "תצוגה מקדימה" בהצעה ואז על "העתק קישור". שולחים את הקישור ללקוח — הוא רואה עמוד נקי ללא צורך בהרשמה.', 1),
  ('מה ההבדל בין סטטוס "נשלחה" ל"נצפתה"?', '"נצפתה" אומר שהלקוח פתח את הקישור. השינוי קורה אוטומטית בפעם הראשונה שהלקוח פותח את ההצעה.', 2),
  ('האם הלקוח יכול לחתום דיגיטלית?', 'כן. בתחתית עמוד ההצעה הלקוח יכול לאשר, לדחות, ולחתום חתימה דיגיטלית. אתה מקבל עדכון בזמן אמת.', 3),
  ('אני עוסק זעיר — האם יש תמיכה בפטור ממע"מ?', 'כן. בהגדרות ← "הגדרות מחירים" ← סמנו "עוסק זעיר (פטור ממע"מ)". ההצעות יציגו אוטומטית "פטור ממע"מ" ללא שורת מע"מ.', 4),
  ('איך מוסיפים לוגו להצעות?', 'בהגדרות ← "פרטי העסק" ← "העלה לוגו". הלוגו יופיע אוטומטית בכל ההצעות שתשלחו.', 5),
  ('האם ניתן לשלוח הצעה שוב לאחר שנשלחה?', 'כן, הקישור קבוע ותמיד פעיל. ניתן לשנות את תוכן ההצעה ואז לשלוח את אותו קישור מחדש.', 6),
  ('האם הנתונים שלי מאובטחים?', 'כן. הנתונים מאוחסנים ב-Supabase עם Row Level Security — אך ורק אתה רואה את ההצעות והלקוחות שלך.', 7),
  ('האם יש מגבלה על מספר ההצעות?', 'בשלב הנוכחי אין מגבלה על מספר ההצעות, הלקוחות, או השירותים.', 8),
  ('מה עושה "שירותים" בתפריט?', 'שירותים הם פריטים שמורים שאפשר להוסיף להצעה בלחיצה — חוסך הקלדה חוזרת של שמות ומחירים שגרתיים.', 9),
  ('האם ניתן לשנות את המטבע?', 'כן, בהגדרות ← "הגדרות מחירים" ← שדה מטבע. ניתן לבחור בין ₪ שקל, $ דולר, ו-€ אירו.', 10);

-- App-wide configuration (editable via Supabase dashboard or settings UI)
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App config is publicly readable" ON app_config FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update app config" ON app_config
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON app_config TO anon, authenticated;
GRANT UPDATE ON app_config TO authenticated;

INSERT INTO app_config (key, value) VALUES
  ('default_vat_rate', '18'),
  ('quote_number_prefix', 'QD'),
  ('default_quote_validity_days', '30');

-- Migration: add discount_type and discount_reason (run if upgrading from earlier schema)
-- ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percent';
-- ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_reason TEXT;
-- INSERT INTO app_config (key, value) VALUES ('quote_number_prefix', 'QD'), ('default_quote_validity_days', '30') ON CONFLICT (key) DO NOTHING;

-- Helper: get next quote number for a user
CREATE OR REPLACE FUNCTION get_next_quote_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COUNT(*) + 1 INTO v_count FROM quotes WHERE user_id = p_user_id;
  RETURN 'QD-' || v_year || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
