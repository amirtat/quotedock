export interface TemplateItem {
  name: { he: string; en: string }
  description: { he: string; en: string }
  unit_price: number
  quantity: number
}

export interface Template {
  slug: string
  industry: { he: string; en: string }
  title: { he: string; en: string }
  subtitle: { he: string; en: string }
  notes: { he: string; en: string }
  items: TemplateItem[]
  valid_days: number
  include_vat: boolean
}

export const templates: Template[] = [
  {
    slug: 'real-estate',
    industry: { he: 'נדל"ן', en: 'Real Estate' },
    title: { he: 'שירותי תיווך נדל"ן', en: 'Real Estate Brokerage Services' },
    subtitle: { he: 'ליווי מלא ממכירה עד חתימה', en: 'Full service from listing to closing' },
    notes: {
      he: 'שכר הטרחה ישולם עם חתימת חוזה המכר. במקרה של ביטול העסקה לאחר חתימה, ישולם תשלום חלקי בהתאם לשלב. המחירים אינם כוללים מע"מ.',
      en: 'Fee is due upon signing the purchase agreement. In case of cancellation after signing, partial payment applies based on stage. Prices exclude VAT.',
    },
    items: [
      {
        name: { he: 'ייעוץ ראשוני והערכת שווי', en: 'Initial consultation & valuation' },
        description: { he: 'פגישת היכרות, סיור בנכס והערכת שווי מקצועית', en: 'Introduction meeting, property tour and professional valuation' },
        unit_price: 500, quantity: 1,
      },
      {
        name: { he: 'שיווק ופרסום הנכס', en: 'Property marketing & advertising' },
        description: { he: 'צילום מקצועי, רישום ביד2/מדלן, פרסום ברשתות חברתיות', en: 'Professional photography, listing on major portals, social media ads' },
        unit_price: 1500, quantity: 1,
      },
      {
        name: { he: 'ניהול משא ומתן', en: 'Negotiation management' },
        description: { he: 'ניהול כל שלבי המשא ומתן מול הצד השני', en: 'Managing all negotiation stages with the counterpart' },
        unit_price: 2000, quantity: 1,
      },
      {
        name: { he: 'ליווי עד חתימת חוזה', en: 'Closing accompaniment' },
        description: { he: 'נוכחות בישיבת החתימות, תיאום עם עו"ד ובנק', en: 'Presence at signing, coordination with lawyer and bank' },
        unit_price: 3000, quantity: 1,
      },
    ],
    include_vat: true,
    valid_days: 30,
  },
  {
    slug: 'legal',
    industry: { he: 'משפטים', en: 'Legal' },
    title: { he: 'שירותים משפטיים - עסקת נדל"ן', en: 'Legal Services - Real Estate Transaction' },
    subtitle: { he: 'ייצוג מלא ברכישת נכס מגורים', en: 'Full representation in residential property purchase' },
    notes: {
      he: 'הצעה זו מתייחסת לעסקה בנכס מגורים בודד. עסקאות מסחריות ייתומחרו בנפרד. תשלום ראשון עם פתיחת תיק, יתרה עם חתימת חוזה.',
      en: 'This quote covers a single residential property transaction. Commercial transactions priced separately. First payment on file opening, balance on contract signing.',
    },
    items: [
      {
        name: { he: 'בדיקת נסח טאבו ומסמכים', en: 'Title search & document review' },
        description: { he: 'בדיקת רישום, שעבודים, היטלים ועיקולים', en: 'Checking registration, liens, levies and attachments' },
        unit_price: 800, quantity: 1,
      },
      {
        name: { he: 'ניסוח חוזה מכר', en: 'Purchase agreement drafting' },
        description: { he: 'ניסוח חוזה מקיף הכולל את כל הסעיפים והנספחים', en: 'Comprehensive contract with all clauses and appendices' },
        unit_price: 3500, quantity: 1,
      },
      {
        name: { he: 'ייצוג בישיבת חתימות', en: 'Representation at signing' },
        description: { he: 'נוכחות בישיבה, בדיקה וחתימה על כל המסמכים', en: 'Presence, review and execution of all documents' },
        unit_price: 1200, quantity: 1,
      },
      {
        name: { he: 'ניהול רישום בטאבו', en: 'Land registry filing' },
        description: { he: 'הגשת כל המסמכים לרשות המיסים ורישום הנכס', en: 'Filing all documents with tax authority and completing registration' },
        unit_price: 1500, quantity: 1,
      },
    ],
    include_vat: true,
    valid_days: 14,
  },
  {
    slug: 'renovation',
    industry: { he: 'שיפוצים', en: 'Renovation' },
    title: { he: 'שיפוץ דירה מלא', en: 'Full Apartment Renovation' },
    subtitle: { he: 'מפירוק עד צביעה - הכל במחיר אחד', en: 'From demolition to painting - all in one quote' },
    notes: {
      he: 'הצעה לדירת 4 חדרים עד 100 מ"ר. שינוי היקף העבודה ייתומחר בנפרד. חומרים אינם כלולים אלא אם צוין אחרת. לוח זמנים משוער: 8-10 שבועות.',
      en: 'Quote for 4-room apartment up to 100 sqm. Scope changes priced separately. Materials not included unless stated. Estimated timeline: 8-10 weeks.',
    },
    items: [
      {
        name: { he: 'פירוק וגריסה', en: 'Demolition & clearing' },
        description: { he: 'פירוק ריצוף ישן, קירות גבס, ארונות ואסלות', en: 'Removal of old flooring, drywall, cabinets and fixtures' },
        unit_price: 4000, quantity: 1,
      },
      {
        name: { he: 'עבודות אינסטלציה', en: 'Plumbing work' },
        description: { he: 'החלפת צינורות, נקודות מים, אסלות וכיורים', en: 'Pipe replacement, water points, toilets and sinks' },
        unit_price: 6000, quantity: 1,
      },
      {
        name: { he: 'עבודות חשמל', en: 'Electrical work' },
        description: { he: 'החלפת לוח חשמל, נקודות שקע ותאורה', en: 'Electrical panel, outlets and lighting points' },
        unit_price: 5000, quantity: 1,
      },
      {
        name: { he: 'ריצוף וטיח', en: 'Flooring & plastering' },
        description: { he: 'הנחת ריצוף חדש, טיח קירות ותקרות', en: 'New flooring, wall and ceiling plastering' },
        unit_price: 12000, quantity: 1,
      },
      {
        name: { he: 'צביעה - כל הדירה', en: 'Full apartment painting' },
        description: { he: 'שתי שכבות צבע לכל הקירות והתקרות', en: 'Two coats of paint on all walls and ceilings' },
        unit_price: 3500, quantity: 1,
      },
    ],
    include_vat: true,
    valid_days: 21,
  },
  {
    slug: 'travel',
    industry: { he: 'תכנון טיולים', en: 'Travel Planning' },
    title: { he: 'תכנון טיול מותאם אישית', en: 'Custom Travel Planning' },
    subtitle: { he: 'מהמסלול עד הכרטיסים, בלי כאב ראש', en: 'From itinerary to tickets, stress-free' },
    notes: {
      he: 'עמלות הזמנה מלונות וטיסות כלולות בעלות. ביטוח נסיעות הכרחי ואינו אופציונלי. שינויים לאחר אישור ייגבו תוספת. ההצעה תקפה ל-7 ימים.',
      en: 'Hotel and flight booking fees are included. Travel insurance is mandatory, not optional. Post-approval changes incur additional charges. Quote valid for 7 days.',
    },
    items: [
      {
        name: { he: 'תכנון מסלול מותאם', en: 'Custom itinerary planning' },
        description: { he: 'תכנון יום-יום עם המלצות, מפה ורשימת אטרקציות', en: 'Day-by-day plan with recommendations, map and attractions' },
        unit_price: 1200, quantity: 1,
      },
      {
        name: { he: 'הזמנת מלונות', en: 'Hotel bookings' },
        description: { he: 'חיפוש והזמנת 7 לילות - 3 אפשרויות לכל יעד', en: 'Search and booking of 7 nights - 3 options per destination' },
        unit_price: 500, quantity: 1,
      },
      {
        name: { he: 'הזמנת טיסות', en: 'Flight bookings' },
        description: { he: 'חיפוש עסקאות, הזמנה ותיאום לוח זמנים', en: 'Deal search, booking and schedule coordination' },
        unit_price: 400, quantity: 1,
      },
      {
        name: { he: 'ביטוח נסיעות', en: 'Travel insurance' },
        description: { he: 'דמי טיפול בהסדרת ביטוח נסיעות מקיף', en: 'Handling fee for arranging comprehensive travel insurance' },
        unit_price: 350, quantity: 1,
      },
      {
        name: { he: 'ליווי ותמיכה בנסיעה', en: 'On-trip support' },
        description: { he: 'זמינות טלפונית לאורך הטיול לפתרון בעיות', en: 'Phone availability throughout the trip for problem-solving' },
        unit_price: 800, quantity: 1,
      },
    ],
    include_vat: true,
    valid_days: 7,
  },
  {
    slug: 'sports',
    industry: { he: 'ספורט', en: 'Sports' },
    title: { he: 'ניהול עונת ספורט', en: 'Sports Season Management' },
    subtitle: { he: 'שיבוץ, אימונים וניהול ליגה - הכל מטופל', en: 'Scheduling, training and league management - handled' },
    notes: {
      he: 'חבילה לעונה אחת (ספטמבר-מאי). תשלום ב-3 תשלומים: תחילת עונה, ינואר ומרץ. נזקים לציוד שיגרמו על ידי שחקנים אינם כלולים.',
      en: 'Package for one season (September-May). Payment in 3 installments: season start, January and March. Equipment damage by players not covered.',
    },
    items: [
      {
        name: { he: 'שכירת מגרש לעונה', en: 'Field rental for season' },
        description: { he: 'שכירת מגרש לכל אימוני הקבוצה - 36 שבועות', en: 'Field rental for all team practices - 36 weeks' },
        unit_price: 8000, quantity: 1,
      },
      {
        name: { he: 'אימון שבועי מקצועי', en: 'Weekly professional coaching' },
        description: { he: '20 אימונים של שעה וחצי + ניתוח משחקים', en: '20 sessions of 90 minutes + match analysis' },
        unit_price: 300, quantity: 20,
      },
      {
        name: { he: 'ניהול ליגה ושיבוץ', en: 'League & scheduling management' },
        description: { he: 'תיאום יריבים, שופטים ולוח משחקים לכל העונה', en: 'Coordinating opponents, referees and full-season match schedule' },
        unit_price: 3000, quantity: 1,
      },
      {
        name: { he: 'ציוד קבוצתי', en: 'Team equipment' },
        description: { he: 'כדורים, קונוסים, גופיות אימון ואביזרים', en: 'Balls, cones, training vests and accessories' },
        unit_price: 2500, quantity: 1,
      },
    ],
    include_vat: true,
    valid_days: 14,
  },
]

export function getTemplate(slug: string): Template | undefined {
  return templates.find(t => t.slug === slug)
}

export function calcTemplateSubtotal(template: Template): number {
  return template.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
}
