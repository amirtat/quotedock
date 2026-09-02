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
  quote_number_prefix TEXT DEFAULT 'QD',
  default_quote_validity_days INTEGER DEFAULT 30,
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
  deleted_at TIMESTAMPTZ DEFAULT NULL,
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
  item_type TEXT DEFAULT 'one_time',
  recurring_interval TEXT,
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
  lang TEXT NOT NULL DEFAULT 'he',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQs are publicly readable" ON faqs FOR SELECT USING (true);

INSERT INTO faqs (question, answer, sort_order, lang) VALUES
  -- Hebrew
  ('האם הלקוח צריך חשבון?', 'לא. הלקוח מקבל קישור ויכול לצפות בהצעה, לאשר ולחתום — הכל ללא הרשמה.', 0, 'he'),
  ('איך שולחים הצעת מחיר ללקוח?', 'לוחצים על "תצוגה מקדימה" בהצעה ואז על "העתק קישור". שולחים את הקישור ללקוח — הוא רואה עמוד נקי ללא צורך בהרשמה.', 1, 'he'),
  ('מה ההבדל בין סטטוס "נשלחה" ל"נצפתה"?', '"נצפתה" אומר שהלקוח פתח את הקישור. השינוי קורה אוטומטית בפעם הראשונה שהלקוח פותח את ההצעה.', 2, 'he'),
  ('האם הלקוח יכול לחתום דיגיטלית?', 'כן. בתחתית עמוד ההצעה הלקוח יכול לאשר, לדחות, ולחתום חתימה דיגיטלית. אתה מקבל עדכון בזמן אמת.', 3, 'he'),
  ('אני עוסק זעיר — האם יש תמיכה בפטור ממע"מ?', 'כן. בהגדרות ← "הגדרות מחירים" ← סמנו "עוסק זעיר (פטור ממע"מ)". ההצעות יציגו אוטומטית "פטור ממע"מ" ללא שורת מע"מ.', 4, 'he'),
  ('איך מוסיפים לוגו להצעות?', 'בהגדרות ← "פרטי העסק" ← "העלה לוגו". הלוגו יופיע אוטומטית בכל ההצעות שתשלחו.', 5, 'he'),
  ('האם ניתן לשלוח הצעה שוב לאחר שנשלחה?', 'כן, הקישור קבוע ותמיד פעיל. ניתן לשנות את תוכן ההצעה ואז לשלוח את אותו קישור מחדש.', 6, 'he'),
  ('האם הנתונים שלי מאובטחים?', 'כן. הנתונים מאוחסנים ב-Supabase עם Row Level Security — אך ורק אתה רואה את ההצעות והלקוחות שלך.', 7, 'he'),
  ('האם יש מגבלה על מספר ההצעות?', 'בשלב הנוכחי אין מגבלה על מספר ההצעות, הלקוחות, או השירותים.', 8, 'he'),
  ('מה עושה "שירותים" בתפריט?', 'שירותים הם פריטים שמורים שאפשר להוסיף להצעה בלחיצה — חוסך הקלדה חוזרת של שמות ומחירים שגרתיים.', 9, 'he'),
  ('האם ניתן לשנות את המטבע?', 'כן, בהגדרות ← "הגדרות מחירים" ← שדה מטבע. ניתן לבחור בין ₪ שקל, $ דולר, ו-€ אירו.', 10, 'he'),
  -- English
  ('Does the client need an account?', 'No. The client receives a link and can view the quote, accept it, and sign — all without registering.', 0, 'en'),
  ('How do I send a quote to a client?', 'Click "Preview" on the quote, then "Copy link". Send the link to your client — they see a clean page with no sign-up required.', 1, 'en'),
  ('What''s the difference between "Sent" and "Viewed" status?', '"Viewed" means the client opened the link. It updates automatically the first time they open the quote.', 2, 'en'),
  ('Can the client sign digitally?', 'Yes. At the bottom of the quote page, the client can accept, decline, and sign digitally. You get a real-time update.', 3, 'en'),
  ('I''m self-employed — is VAT exemption supported?', 'Yes. In Settings → "Pricing Settings" → check "Small business (VAT exempt)". Quotes will automatically show "VAT exempt" with no VAT line.', 4, 'en'),
  ('How do I add a logo to quotes?', 'In Settings → "Business Details" → "Upload logo". The logo will appear automatically on all quotes you send.', 5, 'en'),
  ('Can I resend a quote after it''s been sent?', 'Yes, the link is fixed and always active. You can edit the quote content and resend the same link.', 6, 'en'),
  ('Is my data secure?', 'Yes. Data is stored in Supabase with Row Level Security — only you can see your quotes and clients.', 7, 'en'),
  ('Is there a limit on the number of quotes?', 'Currently there is no limit on the number of quotes, clients, or services.', 8, 'en'),
  ('What does "Services" in the menu do?', 'Services are saved items you can quickly add to a quote — a shortcut that saves names and prices you use repeatedly.', 9, 'en'),
  ('Can I change the currency?', 'Yes. In Settings → "Pricing Settings" → Currency field. You can choose between ₪ Shekel, $ Dollar, and € Euro.', 10, 'en');

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
  ('default_vat_rate', '18');

-- Note templates (saved reusable texts for quote notes)
CREATE TABLE note_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own note templates" ON note_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON note_templates TO authenticated;

-- Migration: add recurring items (run if upgrading from earlier schema)
-- ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'one_time';
-- ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS recurring_interval TEXT;

-- Migration: add per-user quote settings (run if upgrading from earlier schema)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quote_number_prefix TEXT DEFAULT 'QD';
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_quote_validity_days INTEGER DEFAULT 30;

-- Migration: add discount_type and discount_reason (run if upgrading from earlier schema)
-- ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percent';
-- ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_reason TEXT;
-- INSERT INTO app_config (key, value) VALUES ('quote_number_prefix', 'QD'), ('default_quote_validity_days', '30') ON CONFLICT (key) DO NOTHING;

-- Migration: quote sections (run if upgrading from earlier schema)
-- CREATE TABLE IF NOT EXISTS quote_sections (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
--   title TEXT NOT NULL DEFAULT '',
--   content TEXT NOT NULL DEFAULT '',
--   position TEXT NOT NULL DEFAULT 'start',
--   sort_order INTEGER DEFAULT 0
-- );
-- ALTER TABLE quote_sections ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users manage own quote sections" ON quote_sections FOR ALL USING (
--   EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_sections.quote_id AND quotes.user_id = auth.uid())
-- );
-- CREATE POLICY "Public can view quote sections" ON quote_sections FOR SELECT USING (
--   EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_sections.quote_id AND quotes.public_token IS NOT NULL)
-- );
-- GRANT SELECT, INSERT, UPDATE, DELETE ON quote_sections TO authenticated;
-- GRANT SELECT ON quote_sections TO anon;

-- Migration: optional items (run if upgrading from earlier schema)
-- ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false;

-- Migration: freelancer signature + per-item discount (run if upgrading from earlier schema)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS freelancer_signature TEXT;
-- ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0;

-- Migration: widen discount column to support fixed amounts > 999 (run if upgrading from earlier schema)
-- ALTER TABLE quotes ALTER COLUMN discount TYPE DECIMAL(10,2);

-- Migration: quote templates (run if upgrading from earlier schema)
-- ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- Migration: share message template + quote items header (run if upgrading from earlier schema)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_message_template TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quote_items_header TEXT;

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
