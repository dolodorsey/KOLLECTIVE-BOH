-- Multi-brand Social Engagement Rollout v2
-- Programs every currently known active-focus Instagram brand while preserving strict brand isolation.
-- All newly-added brands start setup_required + paused. No external engagement until readiness gates pass.

with brand_manifest(entity_key, account_handle, category, comment_cap, story_cap, total_cap, cooldown_hours, start_time, end_time, metadata) as (
  values
    ('fenyx','@FENYXWORLD','activewear',5,3,8,72,'09:00'::time,'22:30'::time,'{"focus":["athletes","trainers","fitness","activewear","training","team culture"]}'::jsonb),
    ('good-times','@GOODTIMESWORLDWIDE','local_discovery',5,3,8,72,'09:00'::time,'23:00'::time,'{"focus":["Atlanta events","restaurants","nightlife","sports","experiences","family"],"geo":"Atlanta-first"}'::jsonb),
    ('s-o-s','@SUPERHERO.ONSTANDBY','services',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["service providers","local businesses","trades","community reliability","provider onboarding"]}'::jsonb),
    ('iconic-live-entertainment','@THEICONICLIVE','live_entertainment',5,3,8,72,'10:00'::time,'23:00'::time,'{"focus":["concerts","artists","promoters","venues","nightlife","event production","sponsors"]}'::jsonb),
    ('the-kollective','@KOLLECTIVEHOSPITALITY','enterprise_hospitality',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["hospitality","venues","development","operators","partnerships","enterprise"]}'::jsonb),
    ('sole-exchange','@THESOLEEXCHANGEWORLDWIDE','impact_sneaker',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["sneakers","donations","community","youth impact","sponsors","collection drives"]}'::jsonb),
    ('casper-group','@THECASPERGROUPWORLDWIDE','food_service_ops',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["food service","venue kitchens","operators","partner properties","commercial kitchens","expansion"]}'::jsonb),
    ('iconic-music','@onlybeiconic','music',5,3,8,72,'10:00'::time,'23:00'::time,'{"focus":["artists","studio","music business","BTS","A&R","placements"]}'::jsonb),
    ('bevco-intl','@BEVCOHQ','beverage_parent',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["beverage distribution","retail","hospitality","sampling","reorders"],"parent_only":true}'::jsonb),
    ('infinity-water','@THEINFINITYWATER_','beverage',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["hydration","retail","hospitality","fitness","events"]}'::jsonb),
    ('pronto-energy','@THEPRONTOENERGY','beverage',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["energy","fitness","retail","events","culture"]}'::jsonb),
    ('tempo-electrolytes','@TEMPOELECTROLYTES','beverage',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["electrolytes","fitness","sports","retail","events"]}'::jsonb),
    ('casa-cantina','@DRINKCASACANTINA','adult_beverage',3,2,5,120,'11:00'::time,'22:00'::time,'{"focus":["hospitality","restaurants","adult beverage","events"],"adult_market_required":true,"no_youth_targeting":true}'::jsonb),
    ('double-zero','@DRINKDOUBLEZERO','beverage',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["mocktails","wellness","restaurants","hospitality","retail"]}'::jsonb),
    ('island-water','@ISLANDWATERCO','beverage',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["coconut water","wellness","retail","fitness","events"]}'::jsonb),
    ('ora-sparkling-water','@ORASPARKLING','beverage',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["sparkling water","restaurants","retail","wellness","events"]}'::jsonb),
    ('otini-espresso-martini','@OTINIESPRESSO','adult_beverage',3,2,5,120,'11:00'::time,'22:00'::time,'{"focus":["nightlife","hospitality","adult beverage","restaurants","events"],"adult_market_required":true,"no_youth_targeting":true}'::jsonb),
    ('make-atlanta-great-again','@MAKEATLANTA.GREATAGAIN','apparel_culture',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["Atlanta culture","apparel","community","style"]}'::jsonb),
    ('angel-wings','@theangelwingsofficial','food_brand',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["wings","food","hospitality","events","local culture"]}'::jsonb),
    ('espresso-co','@the.espressoco','food_beverage',4,3,7,96,'08:00'::time,'20:30'::time,'{"focus":["coffee","cafes","hospitality","morning culture","food service"]}'::jsonb),
    ('mojo-juice','@themojojuiceofficial','food_beverage',4,3,7,96,'08:00'::time,'20:30'::time,'{"focus":["juice","wellness","fitness","food service","retail"]}'::jsonb),
    ('morning-after','@tha.morning.after','food_brand',4,3,7,96,'08:00'::time,'20:30'::time,'{"focus":["breakfast","brunch","hospitality","food culture","events"]}'::jsonb),
    ('patty-daddy','@thepattydaddyofficial','food_brand',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["burgers","food culture","hospitality","events","local community"]}'::jsonb),
    ('sweet-tooth','@thesweettoothworldwide','food_brand',4,3,7,96,'09:00'::time,'21:00'::time,'{"focus":["desserts","food culture","events","family","hospitality"]}'::jsonb),
    ('on-call','@oncall.allday','services',4,3,7,96,'09:00'::time,'21:30'::time,'{"focus":["service providers","local business","urgent services","community reliability"]}'::jsonb)
),
existing as (
  select m.*, e.id as enterprise_entity_id, e.entity_name
  from brand_manifest m
  join public.enterprise_directory_records e on e.entity_key=m.entity_key
)
insert into public.social_engagement_programs(
  enterprise_entity_id,entity_key,platform,account_handle,status,audience_source,activation_goal,
  comment_enabled,dm_lane_enabled,dm_mode,daily_comment_cap,daily_dm_cap,daily_total_cap,
  target_cycle_size,daily_target_count,cooldown_hours,max_unanswered_dm_followups,
  stop_on_reply,stop_on_opt_out,metadata,created_at,updated_at
)
select
  x.enterprise_entity_id,x.entity_key,'instagram',x.account_handle,
  case when x.entity_key='stush' then 'active' else 'setup_required' end,
  case when x.entity_key='stush' then 'ig-export-20261004' else null end,
  'Build genuine, brand-specific Instagram relationships for '||x.entity_name||' through contextual research-first engagement without cross-brand audience reuse.',
  true,false,'disabled',
  x.comment_cap,0,x.total_cap,300,150,x.cooldown_hours,0,true,true,
  jsonb_build_object(
    'brand_isolation',true,
    'programmed_rollout','multi_brand_social_engagement_v2',
    'category',x.category,
    'setup_blocker',case when x.entity_key='stush' then null else 'provider_and_exact_target_readiness_gate' end,
    'auto_activate_when_ready',x.entity_key<>'stush',
    'background_scan_target_daily',3000,
    'steady_state_refresh_target_daily',750,
    'context_review_target_daily',150,
    'direct_touch_candidate_target_daily',40,
    'comment_draft_target_daily',20,
    'dm_draft_target_daily',0,
    'dm_policy','disabled until separately certified for exact brand',
    'copy_reuse_guard','v_social_engagement_similarity_guard_v2',
    'learning_view','v_social_engagement_learning_weights_v1'
  ) || x.metadata,
  now(),now()
from existing x
on conflict (enterprise_entity_id) do update set
  account_handle=excluded.account_handle,
  activation_goal=excluded.activation_goal,
  metadata=coalesce(public.social_engagement_programs.metadata,'{}'::jsonb)||excluded.metadata,
  updated_at=now();

with brand_manifest(entity_key, comment_cap, story_cap, total_cap, cooldown_hours, start_time, end_time, metadata) as (
  values
    ('fenyx',5,3,8,72,'09:00'::time,'22:30'::time,'{}'::jsonb),
    ('good-times',5,3,8,72,'09:00'::time,'23:00'::time,'{}'::jsonb),
    ('s-o-s',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('iconic-live-entertainment',5,3,8,72,'10:00'::time,'23:00'::time,'{}'::jsonb),
    ('the-kollective',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('sole-exchange',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('casper-group',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('iconic-music',5,3,8,72,'10:00'::time,'23:00'::time,'{}'::jsonb),
    ('bevco-intl',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('infinity-water',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('pronto-energy',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('tempo-electrolytes',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('casa-cantina',3,2,5,120,'11:00'::time,'22:00'::time,'{"adult_market_required":true,"no_youth_targeting":true}'::jsonb),
    ('double-zero',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('island-water',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('ora-sparkling-water',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('otini-espresso-martini',3,2,5,120,'11:00'::time,'22:00'::time,'{"adult_market_required":true,"no_youth_targeting":true}'::jsonb),
    ('make-atlanta-great-again',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('angel-wings',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('espresso-co',4,3,7,96,'08:00'::time,'20:30'::time,'{}'::jsonb),
    ('mojo-juice',4,3,7,96,'08:00'::time,'20:30'::time,'{}'::jsonb),
    ('morning-after',4,3,7,96,'08:00'::time,'20:30'::time,'{}'::jsonb),
    ('patty-daddy',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb),
    ('sweet-tooth',4,3,7,96,'09:00'::time,'21:00'::time,'{}'::jsonb),
    ('on-call',4,3,7,96,'09:00'::time,'21:30'::time,'{}'::jsonb)
)
insert into public.social_engagement_cadence_policies(
  entity_key,timezone,phase,phase_started_at,next_review_at,
  comment_cap_day,story_cap_day,dm_cap_day,total_external_cap_day,
  rolling_60m_cap,rolling_4h_cap,min_gap_minutes,dm_min_gap_minutes,
  target_cooldown_hours,max_target_touches_7d,max_unanswered_dm_followups,
  proactive_start_local,proactive_end_local,auto_pause_on_provider_warning,
  warning_pause_hours,action_block_pause_hours,pause_reason,metadata,created_at,updated_at
)
select
  b.entity_key,'America/New_York','paused',now(),null,
  b.comment_cap,b.story_cap,0,b.total_cap,
  2,4,case when b.total_cap<=5 then 35 else 30 end,180,
  b.cooldown_hours,2,0,b.start_time,b.end_time,true,24,72,'setup_required',
  jsonb_build_object(
    'policy_kind','conservative_internal_safety_policy',
    'not_official_instagram_limit',true,
    'auto_activate_when_ready',true,
    'dm_disabled_until_separately_certified',true,
    'no_rate_limit_evasion',true,
    'no_mass_comments',true,
    'backoff_rule','Any provider warning, action block, rate-limit signal, suspicious-behavior warning, or quality concern pauses proactive execution while internal research continues.'
  ) || b.metadata,
  now(),now()
from brand_manifest b
on conflict (entity_key) do update set
  comment_cap_day=excluded.comment_cap_day,
  story_cap_day=excluded.story_cap_day,
  dm_cap_day=0,
  total_external_cap_day=excluded.total_external_cap_day,
  rolling_60m_cap=excluded.rolling_60m_cap,
  rolling_4h_cap=excluded.rolling_4h_cap,
  min_gap_minutes=excluded.min_gap_minutes,
  dm_min_gap_minutes=excluded.dm_min_gap_minutes,
  target_cooldown_hours=excluded.target_cooldown_hours,
  proactive_start_local=excluded.proactive_start_local,
  proactive_end_local=excluded.proactive_end_local,
  metadata=coalesce(public.social_engagement_cadence_policies.metadata,'{}'::jsonb)||excluded.metadata,
  updated_at=now();

-- Clone the safe non-DM action menu to every programmed brand.
with brands(entity_key) as (
  values
    ('fenyx'),('good-times'),('s-o-s'),('iconic-live-entertainment'),('the-kollective'),('sole-exchange'),
    ('casper-group'),('iconic-music'),('bevco-intl'),('infinity-water'),('pronto-energy'),('tempo-electrolytes'),
    ('casa-cantina'),('double-zero'),('island-water'),('ora-sparkling-water'),('otini-espresso-martini'),
    ('make-atlanta-great-again'),('angel-wings'),('espresso-co'),('mojo-juice'),('morning-after'),
    ('patty-daddy'),('sweet-tooth'),('on-call')
)
insert into public.social_engagement_action_menu(
  entity_key,action_key,trigger_rule,action_type,priority,approval_required,notes,active,metadata,created_at,updated_at
)
select
  b.entity_key,m.action_key,m.trigger_rule,m.action_type,m.priority,false,
  case when m.action_type='dm' then 'Disabled until the exact brand DM/conversation route is separately certified.' else m.notes end,
  case when m.action_type='dm' then false else m.active end,
  coalesce(m.metadata,'{}'::jsonb)||jsonb_build_object('copied_from','dr-dorsey','brand_adapted',true),
  now(),now()
from brands b
cross join public.social_engagement_action_menu m
where m.entity_key='dr-dorsey'
on conflict (entity_key,action_key) do update set
  trigger_rule=excluded.trigger_rule,
  action_type=excluded.action_type,
  priority=excluded.priority,
  approval_required=excluded.approval_required,
  notes=excluded.notes,
  active=excluded.active,
  metadata=excluded.metadata,
  updated_at=now();

-- Generic voice-library bootstrap: clone only safe, context-driven patterns appropriate to each category.
with brand_pattern_map(entity_key, source_entity_key, context_key) as (
  values
    ('fenyx','dr-dorsey','fitness_training'),('fenyx','dr-dorsey','sports'),('fenyx','dr-dorsey','basketball'),('fenyx','dr-dorsey','football'),
    ('fenyx','stush','menswear_fit'),('fenyx','stush','womenswear_fit'),('fenyx','stush','streetwear'),('fenyx','stush','sneakers'),
    ('fenyx','stush','creator_style'),('fenyx','stush','photo_editorial'),('fenyx','stush','product_detail'),('fenyx','stush','customer_fit'),
    ('good-times','dr-dorsey','food_restaurant'),('good-times','dr-dorsey','brunch_cafe'),('good-times','dr-dorsey','cocktail_bar'),('good-times','dr-dorsey','nightlife_event'),
    ('good-times','dr-dorsey','concert_live'),('good-times','dr-dorsey','sports'),('good-times','dr-dorsey','travel_lifestyle'),('good-times','dr-dorsey','community_support'),
    ('good-times','dr-dorsey','humor_light'),('good-times','dr-dorsey','general_curiosity'),
    ('s-o-s','dr-dorsey','founder_business'),('s-o-s','dr-dorsey','build_progress'),('s-o-s','dr-dorsey','achievement_win'),('s-o-s','dr-dorsey','community_support'),
    ('s-o-s','dr-dorsey','team_hiring'),('s-o-s','dr-dorsey','product_launch'),('s-o-s','dr-dorsey','partnership_announcement'),('s-o-s','dr-dorsey','general_curiosity'),
    ('iconic-live-entertainment','dr-dorsey','nightlife_event'),('iconic-live-entertainment','dr-dorsey','nightlife_dj'),('iconic-live-entertainment','dr-dorsey','nightlife_promoter'),
    ('iconic-live-entertainment','dr-dorsey','concert_live'),('iconic-live-entertainment','dr-dorsey','artist_release'),('iconic-live-entertainment','dr-dorsey','music_culture'),
    ('iconic-live-entertainment','dr-dorsey','creative_design'),('iconic-live-entertainment','dr-dorsey','video_directing'),('iconic-live-entertainment','dr-dorsey','general_curiosity'),
    ('iconic-music','dr-dorsey','music_culture'),('iconic-music','dr-dorsey','artist_release'),('iconic-music','dr-dorsey','creator_process'),('iconic-music','dr-dorsey','creator_launch'),
    ('iconic-music','dr-dorsey','video_directing'),('iconic-music','dr-dorsey','photography'),('iconic-music','dr-dorsey','podcast_interview'),('iconic-music','dr-dorsey','general_curiosity'),
    ('the-kollective','dr-dorsey','hospitality'),('the-kollective','dr-dorsey','venue_opening'),('the-kollective','dr-dorsey','hotel_hospitality'),
    ('the-kollective','dr-dorsey','architecture_space'),('the-kollective','dr-dorsey','real_estate_development'),('the-kollective','dr-dorsey','founder_business'),
    ('the-kollective','dr-dorsey','team_hiring'),('the-kollective','dr-dorsey','partnership_announcement'),('the-kollective','dr-dorsey','general_curiosity'),
    ('casper-group','dr-dorsey','hospitality'),('casper-group','dr-dorsey','restaurant_opening'),('casper-group','dr-dorsey','chef_kitchen'),
    ('casper-group','dr-dorsey','founder_business'),('casper-group','dr-dorsey','build_progress'),('casper-group','dr-dorsey','real_estate_development'),
    ('casper-group','dr-dorsey','partnership_announcement'),('casper-group','dr-dorsey','expansion_opening'),('casper-group','dr-dorsey','general_curiosity'),
    ('sole-exchange','stush','sneakers'),('sole-exchange','stush','streetwear'),('sole-exchange','dr-dorsey','community_support'),
    ('sole-exchange','dr-dorsey','achievement_win'),('sole-exchange','dr-dorsey','partnership_announcement'),('sole-exchange','dr-dorsey','sports'),
    ('sole-exchange','dr-dorsey','family_personal'),('sole-exchange','dr-dorsey','general_curiosity'),
    ('make-atlanta-great-again','stush','streetwear'),('make-atlanta-great-again','stush','menswear_fit'),('make-atlanta-great-again','stush','womenswear_fit'),
    ('make-atlanta-great-again','stush','sneakers'),('make-atlanta-great-again','stush','graphic_design'),('make-atlanta-great-again','stush','color_story'),
    ('make-atlanta-great-again','dr-dorsey','community_support'),('make-atlanta-great-again','dr-dorsey','humor_light')
),
beverage_brands(entity_key) as (
  values ('bevco-intl'),('infinity-water'),('pronto-energy'),('tempo-electrolytes'),('casa-cantina'),('double-zero'),('island-water'),('ora-sparkling-water'),('otini-espresso-martini')
),
food_brands(entity_key) as (
  values ('angel-wings'),('espresso-co'),('mojo-juice'),('morning-after'),('patty-daddy'),('sweet-tooth')
),
service_brands(entity_key) as (
  values ('on-call')
),
expanded as (
  select * from brand_pattern_map
  union all
  select b.entity_key,'dr-dorsey',p.context_key
  from beverage_brands b
  cross join (values ('product_launch'),('food_restaurant'),('cocktail_bar'),('nightlife_event'),('hospitality'),('retail_store'),('fitness_training'),('creator_style'),('general_curiosity'),('community_support')) p(context_key)
  union all
  select f.entity_key,'dr-dorsey',p.context_key
  from food_brands f
  cross join (values ('food_restaurant'),('brunch_cafe'),('chef_kitchen'),('hospitality'),('community_support'),('creator_style'),('achievement_win'),('humor_light'),('general_curiosity'),('family_personal')) p(context_key)
  union all
  select s.entity_key,'dr-dorsey',p.context_key
  from service_brands s
  cross join (values ('founder_business'),('build_progress'),('achievement_win'),('community_support'),('team_hiring'),('product_launch'),('partnership_announcement'),('general_curiosity'),('family_personal'),('opinion_take')) p(context_key)
)
insert into public.social_engagement_voice_patterns(
  id,entity_key,context_key,action_type,voice_mode,intent,formula,opener_bank,closer_bank,
  observation_prompts,banned_phrases,max_words,question_allowed,emoji_allowed,reuse_cooldown_days,
  active,metadata,created_at,updated_at
)
select
  gen_random_uuid(),x.entity_key,v.context_key,v.action_type,v.voice_mode,v.intent,v.formula,
  v.opener_bank,v.closer_bank,v.observation_prompts,v.banned_phrases,v.max_words,
  v.question_allowed,v.emoji_allowed,v.reuse_cooldown_days,true,
  coalesce(v.metadata,'{}'::jsonb)||jsonb_build_object('brand_adapted_from',x.source_entity_key),
  now(),now()
from expanded x
join public.social_engagement_voice_patterns v
  on v.entity_key=x.source_entity_key and v.context_key=x.context_key and v.active=true
on conflict (entity_key,context_key,action_type,voice_mode) do nothing;
