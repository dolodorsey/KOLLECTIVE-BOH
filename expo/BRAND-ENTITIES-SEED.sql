-- ============================================================
-- KOLLECTIVE HOSPITALITY GROUP - BRAND ENTITIES SETUP
-- Run this after initial database setup
-- ============================================================

-- First, ensure we have the organization
DO $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get or create KOLLECTIVE HOSPITALITY GROUP organization
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'kollective-hospitality-group';
  
  IF v_org_id IS NULL THEN
    INSERT INTO organizations (name, slug, created_by)
    VALUES ('KOLLECTIVE HOSPITALITY GROUP', 'kollective-hospitality-group', auth.uid())
    RETURNING id INTO v_org_id;
  END IF;

  -- ============================================================
  -- CASPER GROUP (FOOD BRANDS)
  -- ============================================================
  
  INSERT INTO entities (org_id, name, entity_type, status, meta) VALUES
  (v_org_id, 'ANGEL WINGS', 'restaurant', 'active', jsonb_build_object(
    'division', 'CASPER GROUP',
    'category', 'Wings & Chicken',
    'cities', ARRAY['Atlanta', 'Houston', 'Las Vegas', 'Washington DC', 'Charlotte', 'Miami', 'New York', 'Los Angeles'],
    'brand_color', '#FF4444',
    'instagram', '@angelwingskollective',
    'website', 'angelwings.kollective.com'
  )),
  (v_org_id, 'PASTA BISH', 'restaurant', 'active', jsonb_build_object(
    'division', 'CASPER GROUP',
    'category', 'Italian Cuisine',
    'cities', ARRAY['Atlanta', 'Houston', 'Las Vegas', 'Washington DC'],
    'brand_color', '#00AA00',
    'instagram', '@pastabish',
    'website', 'pastabish.kollective.com'
  )),
  (v_org_id, 'TACO YAKI', 'restaurant', 'active', jsonb_build_object(
    'division', 'CASPER GROUP',
    'category', 'Mexican-Japanese Fusion',
    'cities', ARRAY['Atlanta', 'Houston', 'Los Angeles'],
    'brand_color', '#FFA500',
    'instagram', '@tacoyaki',
    'website', 'tacoyaki.kollective.com'
  )),
  (v_org_id, 'PATTY DADDY', 'restaurant', 'active', jsonb_build_object(
    'division', 'CASPER GROUP',
    'category', 'Burgers & Smash',
    'cities', ARRAY['Atlanta', 'Charlotte', 'Miami'],
    'brand_color', '#8B4513',
    'instagram', '@pattydaddy',
    'website', 'pattydaddy.kollective.com'
  )),
  (v_org_id, 'ESPRESSO CO', 'restaurant', 'active', jsonb_build_object(
    'division', 'CASPER GROUP',
    'category', 'Coffee & Espresso',
    'cities', ARRAY['Atlanta', 'Washington DC', 'Charlotte', 'Houston'],
    'brand_color', '#654321',
    'instagram', '@espressoco',
    'website', 'espresso.kollective.com'
  )),
  (v_org_id, 'MORNING AFTER', 'restaurant', 'active', jsonb_build_object(
    'division', 'CASPER GROUP',
    'category', 'Brunch & Breakfast',
    'cities', ARRAY['Atlanta', 'Houston', 'Los Angeles'],
    'brand_color', '#FFD700',
    'instagram', '@morningafterkollective',
    'website', 'morningafter.kollective.com'
  )),
  (v_org_id, 'TOSS''D', 'restaurant', 'active', jsonb_build_object(
    'division', 'CASPER GROUP',
    'category', 'Salads & Bowls',
    'cities', ARRAY['Atlanta', 'Washington DC', 'New York'],
    'brand_color', '#00CC66',
    'instagram', '@tossdkollective',
    'website', 'tossd.kollective.com'
  )),
  (v_org_id, 'SWEET TOOTH', 'restaurant', 'active', jsonb_build_object(
    'division', 'CASPER GROUP',
    'category', 'Desserts & Sweets',
    'cities', ARRAY['Atlanta', 'Houston', 'Miami'],
    'brand_color', '#FF69B4',
    'instagram', '@sweettooth',
    'website', 'sweettooth.kollective.com'
  )),
  (v_org_id, 'MOJO JUICE', 'restaurant', 'active', jsonb_build_object(
    'division', 'CASPER GROUP',
    'category', 'Juices & Smoothies',
    'cities', ARRAY['Atlanta', 'Los Angeles', 'Miami'],
    'brand_color', '#32CD32',
    'instagram', '@mojojuice',
    'website', 'mojojuice.kollective.com'
  )),
  (v_org_id, 'MR. OYSTER', 'restaurant', 'active', jsonb_build_object(
    'division', 'CASPER GROUP',
    'category', 'Seafood & Oysters',
    'cities', ARRAY['Atlanta', 'Washington DC', 'Miami'],
    'brand_color', '#4682B4',
    'instagram', '@mroyster',
    'website', 'mroyster.kollective.com'
  ))
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- HUGLIFE (EVENTS)
  -- ============================================================
  
  INSERT INTO entities (org_id, name, entity_type, status, meta) VALUES
  (v_org_id, 'ESPRESSO', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Luxury Day Party',
    'frequency', 'Monthly',
    'cities', ARRAY['Washington DC', 'Los Angeles', 'Charlotte', 'Atlanta'],
    'brand_color', '#654321',
    '2026_dates', ARRAY['Apr 17 - DC', 'May 29 - LA', 'Jun 05 - Charlotte', 'Jul 31 - LA', 'Aug 07 - Atlanta', 'Sep 04 - DC']
  )),
  (v_org_id, 'TASTE OF ART', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Culinary Art Experience',
    'frequency', 'Bi-Monthly',
    'cities', ARRAY['Los Angeles', 'Atlanta', 'Washington DC', 'Houston', 'Miami'],
    '2026_dates', ARRAY['Apr 24 - LA', 'May 15 - Atlanta', 'Jun 12 - DC', 'Jul 10 - Houston', 'Aug 14 - Houston', 'Dec 04 - Miami (Art Basel)']
  )),
  (v_org_id, 'SHUT UP & DANCE', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Dance Party',
    'frequency', 'Quarterly',
    '2026_dates', ARRAY['May 02 - Charlotte', 'Jul 25 - Atlanta', 'Sep 26 - LA']
  )),
  (v_org_id, 'PAPARAZZI', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Celebrity Experience',
    'frequency', 'Monthly',
    '2026_dates', ARRAY['May 31 - LA', 'Jun 14 - LA (BET Weekend)', 'Jul 12 - DC', 'Aug 09 - Charlotte', 'Sep 13 - Atlanta']
  )),
  (v_org_id, 'SUNDAY''S BEST', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Sunday Brunch Experience',
    'frequency', 'Holiday Weekends',
    '2026_dates', ARRAY['May 24 - Memorial Day', 'Jul 05 - Independence', 'Sep 06 - Labor Day', 'Nov 29 - Thanksgiving']
  )),
  (v_org_id, 'GANGSTA GOSPEL', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Hip-Hop Sunday',
    'frequency', 'Quarterly',
    '2026_dates', ARRAY['Jun 19 - Atlanta (Juneteenth)', 'Aug 01 - Houston', 'Sep 05 - LA']
  )),
  (v_org_id, 'NAPKIN KING', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Dining Experience',
    'frequency', 'Monthly',
    '2026_dates', ARRAY['May 23 - Atlanta', 'Jul 18 - Houston', 'Aug 29 - LA', 'Sep 19 - Charlotte', 'Oct 10 - Fall Finale']
  )),
  (v_org_id, 'PAWCHELLA', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Pet Festival',
    'frequency', 'Annual - Summer',
    '2026_dates', ARRAY['Aug 22 - Atlanta']
  )),
  (v_org_id, 'BEAUTY & THE BEAST', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Couples Experience',
    'frequency', 'Annual',
    '2026_dates', ARRAY['Sep 12 - Atlanta']
  )),
  (v_org_id, 'BLACK BALL', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Formal Gala',
    'frequency', 'Annual',
    '2026_dates', ARRAY['Nov 21 - Atlanta']
  )),
  (v_org_id, 'HAUNTED HOUSE', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Halloween Experience',
    'frequency', 'Annual - October',
    '2026_dates', ARRAY['Oct 01-31 - Atlanta (Month-Long)']
  )),
  (v_org_id, 'MONSTER''S BALL', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Halloween Party',
    'frequency', 'Annual',
    '2026_dates', ARRAY['Oct 31 - Halloween Night']
  )),
  (v_org_id, 'SNOW BALL', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Winter Gala',
    'frequency', 'Annual',
    '2026_dates', ARRAY['Dec 12 - Atlanta']
  )),
  (v_org_id, 'WINTER WONDERLAND', 'event', 'active', jsonb_build_object(
    'division', 'HUGLIFE',
    'category', 'Holiday Experience',
    'frequency', 'Annual - December',
    '2026_dates', ARRAY['Dec 01-31 - Atlanta']
  ))
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SCENTED FLOWERS (MUSEUMS)
  -- ============================================================
  
  INSERT INTO entities (org_id, name, entity_type, status, meta) VALUES
  (v_org_id, 'FOREVER FUTBOL', 'museum', 'active', jsonb_build_object(
    'division', 'SCENTED FLOWERS',
    'category', 'World Cup Museum',
    'activation_period', 'Jun 11 - Jul 19, 2026',
    'cities', ARRAY['Atlanta', 'Houston', 'Los Angeles'],
    'description', 'Interactive World Cup History Museum'
  )),
  (v_org_id, 'LIVING LEGENDS', 'museum', 'planning', jsonb_build_object(
    'division', 'SCENTED FLOWERS',
    'category', 'Sports Icons Museum',
    'status', 'In Development'
  )),
  (v_org_id, 'WOMEN MAKE THE WORLD', 'museum', 'planning', jsonb_build_object(
    'division', 'SCENTED FLOWERS',
    'category', 'Women''s History Museum',
    'status', 'In Development'
  )),
  (v_org_id, 'FALLEN STARS', 'museum', 'planning', jsonb_build_object(
    'division', 'SCENTED FLOWERS',
    'category', 'Memorial Museum',
    'status', 'In Development'
  ))
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- THE UMBRELLA GROUP (SERVICES)
  -- ============================================================
  
  INSERT INTO entities (org_id, name, entity_type, status, meta) VALUES
  (v_org_id, 'UMBRELLA AUTO EXCHANGE', 'service', 'active', jsonb_build_object(
    'division', 'THE UMBRELLA GROUP',
    'category', 'Automotive Services'
  )),
  (v_org_id, 'UMBRELLA INJURY NETWORK', 'service', 'active', jsonb_build_object(
    'division', 'THE UMBRELLA GROUP',
    'category', 'Legal Referral Network'
  )),
  (v_org_id, 'UMBRELLA REALTY GROUP', 'service', 'active', jsonb_build_object(
    'division', 'THE UMBRELLA GROUP',
    'category', 'Real Estate Services'
  )),
  (v_org_id, 'UMBRELLA CLEAN SERVICES', 'service', 'active', jsonb_build_object(
    'division', 'THE UMBRELLA GROUP',
    'category', 'Cleaning & Maintenance'
  )),
  (v_org_id, 'THE PEOPLE''S DEPT', 'service', 'active', jsonb_build_object(
    'division', 'THE UMBRELLA GROUP',
    'category', 'Community Services'
  )),
  (v_org_id, 'UMBRELLA ACCOUNTING', 'service', 'active', jsonb_build_object(
    'division', 'THE UMBRELLA GROUP',
    'category', 'Financial Services'
  )),
  (v_org_id, 'THE BRAND STUDIO', 'service', 'active', jsonb_build_object(
    'division', 'THE UMBRELLA GROUP',
    'category', 'Creative & Branding'
  )),
  (v_org_id, 'THE AUTOMATION OFFICE', 'service', 'active', jsonb_build_object(
    'division', 'THE UMBRELLA GROUP',
    'category', 'Technology & Automation'
  )),
  (v_org_id, 'THE MIND STUDIO', 'service', 'active', jsonb_build_object(
    'division', 'THE UMBRELLA GROUP',
    'category', 'Mental Health & Wellness'
  )),
  (v_org_id, 'UMBRELLA LEGAL & COMPLIANCE', 'service', 'active', jsonb_build_object(
    'division', 'THE UMBRELLA GROUP',
    'category', 'Legal Services'
  ))
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- BODEGEA (PRODUCTS)
  -- ============================================================
  
  INSERT INTO entities (org_id, name, entity_type, status, meta) VALUES
  (v_org_id, 'INFINITY WATER', 'product', 'active', jsonb_build_object(
    'division', 'BODEGEA',
    'category', 'Bottled Water'
  )),
  (v_org_id, 'PRONTO ENERGY', 'product', 'active', jsonb_build_object(
    'division', 'BODEGEA',
    'category', 'Energy Drinks'
  )),
  (v_org_id, 'NOIR', 'product', 'active', jsonb_build_object(
    'division', 'BODEGEA',
    'category', 'Espresso Liqueur'
  )),
  (v_org_id, 'STUSH', 'product', 'active', jsonb_build_object(
    'division', 'BODEGEA',
    'category', 'Premium Beverage'
  ))
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- OPULENCE DESIGNS (ART)
  -- ============================================================
  
  INSERT INTO entities (org_id, name, entity_type, status, meta) VALUES
  (v_org_id, 'TORCHES', 'art', 'active', jsonb_build_object(
    'division', 'OPULENCE DESIGNS',
    'category', 'Art Installation'
  )),
  (v_org_id, 'ANGEL & ASTRONAUTS', 'art', 'active', jsonb_build_object(
    'division', 'OPULENCE DESIGNS',
    'category', 'Art Collection'
  )),
  (v_org_id, 'IZZY', 'art', 'active', jsonb_build_object(
    'division', 'OPULENCE DESIGNS',
    'category', 'Art Series'
  )),
  (v_org_id, 'COUNTRY BOY', 'art', 'active', jsonb_build_object(
    'division', 'OPULENCE DESIGNS',
    'category', 'Art Collection'
  ))
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- THE INNER CIRCLE (APPS)
  -- ============================================================
  
  INSERT INTO entities (org_id, name, entity_type, status, meta) VALUES
  (v_org_id, 'GOOD TIMES', 'app', 'active', jsonb_build_object(
    'division', 'THE INNER CIRCLE',
    'category', 'Nightlife Discovery Platform',
    'platform', 'iOS, Android, Web'
  )),
  (v_org_id, 'ROADSIDE', 'app', 'active', jsonb_build_object(
    'division', 'THE INNER CIRCLE',
    'category', 'Roadside Assistance App',
    'platform', 'iOS, Android'
  )),
  (v_org_id, 'ON CALL', 'app', 'active', jsonb_build_object(
    'division', 'THE INNER CIRCLE',
    'category', 'On-Demand Services',
    'platform', 'iOS, Android'
  ))
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- PLAYMAKERS SPORTS ASS. (NON-PROFIT)
  -- ============================================================
  
  INSERT INTO entities (org_id, name, entity_type, status, meta) VALUES
  (v_org_id, 'SOLE EXCHANGE', 'nonprofit', 'active', jsonb_build_object(
    'division', 'PLAYMAKERS SPORTS ASS.',
    'category', 'Sneaker Charity Program'
  )),
  (v_org_id, 'LETS TALK ABOUT IT', 'nonprofit', 'active', jsonb_build_object(
    'division', 'PLAYMAKERS SPORTS ASS.',
    'category', 'Mental Health Initiative'
  ))
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================================
-- VERIFICATION QUERY
-- ============================================================

-- Count entities by division
SELECT 
  meta->>'division' as division,
  entity_type,
  COUNT(*) as count
FROM entities
WHERE org_id = (SELECT id FROM organizations WHERE slug = 'kollective-hospitality-group')
GROUP BY meta->>'division', entity_type
ORDER BY meta->>'division', entity_type;

-- List all entities
SELECT 
  name,
  entity_type,
  meta->>'division' as division,
  meta->>'category' as category,
  status
FROM entities
WHERE org_id = (SELECT id FROM organizations WHERE slug = 'kollective-hospitality-group')
ORDER BY meta->>'division', name;
