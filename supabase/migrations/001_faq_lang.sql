-- Add lang column to faqs (existing rows default to 'he')
ALTER TABLE faqs ADD COLUMN lang TEXT NOT NULL DEFAULT 'he';

-- New Hebrew question: does the client need an account? (appears first)
INSERT INTO faqs (question, answer, sort_order, lang) VALUES
  ('האם הלקוח צריך חשבון?', 'לא. הלקוח מקבל קישור ויכול לצפות בהצעה, לאשר ולחתום — הכל ללא הרשמה.', 0, 'he');

-- English versions of all 11 questions
INSERT INTO faqs (question, answer, sort_order, lang) VALUES
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
