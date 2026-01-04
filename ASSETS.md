# Kollective BOH - Asset Requirements

## Brand Identity
**Primary Colors:**
- Gold: #FFD700 (Kollective signature)
- Black: #121212 (Background)
- Accent: Various for entity differentiation

## Required Asset Replacements

### 1. App Icons & Launch Assets
**Location:** `assets/images/`

#### Icon.png (1024x1024)
- **Current:** Generic placeholder
- **Required:** Kollective BOH branded icon
  - Gold "K" monogram on black background
  - Minimal, professional design
  - High contrast for visibility

#### Splash-icon.png (Launch Screen)
- **Current:** Generic placeholder  
- **Required:** Kollective branded splash
  - Full brand wordmark "KOLLECTIVE BOH"
  - Gold on black with subtle glow effect
  - Centered composition

#### Adaptive-icon.png (Android)
- **Current:** Generic placeholder
- **Required:** Android adaptive icon
  - Foreground: Gold "K" symbol
  - Background: Solid black (#121212)

#### Favicon.png (Web)
- **Current:** Generic placeholder
- **Required:** 32x32 or 64x64 favicon
  - Simplified "K" monogram in gold

---

## 2. Profile & User Assets

### Default Avatar Placeholder
- **Location:** Components use lucide-react-native `<User>` icon
- **Enhancement:** Consider custom gold-bordered placeholder with Kollective branding

---

## 3. Entity/Brand Assets

### Brand Mascots
- **Current:** Text emoji stored in database (🏆, 🌟, etc.)
- **Future Enhancement:** Custom mascot illustrations
  - Unique visual identity per entity
  - Gold accent integration
  - Consistent art style across all mascots

---

## 4. UI Enhancement Assets

### Achievement Badges
- **Location:** To be created in `assets/badges/`
- **Types needed:**
  - Rank badges (Bronze, Silver, Gold, Platinum)
  - Achievement unlocks
  - Streak milestones
  - Team collaboration badges

### Status Icons
- **Current:** Using lucide-react-native icons
- **Enhancement:** Custom status indicators
  - Mission statuses (pending, active, completed)
  - Priority levels (low, medium, high, critical)
  - XP gain animations

---

## 5. Background & Atmospheric Assets

### Gradient Overlays
- **Current:** Using `expo-linear-gradient` with code-defined colors
- **Enhancement:** Pre-rendered gradient textures
  - Subtle gold-to-black transitions
  - Geometric pattern overlays
  - Noise textures for depth

### Decorative Elements
- **To be created:**
  - Gold accent lines/dividers
  - Corner ornaments for premium sections
  - Glow/shimmer effects for interactive elements

---

## Asset Generation Guidelines

### Design Principles
1. **Bold & Confident:** Kollective represents excellence
2. **Gold as Power:** Use gold intentionally for hierarchy
3. **Dark Sophistication:** Black backgrounds create premium feel
4. **High Contrast:** Ensure accessibility and visibility

### Technical Specs
- **Export Format:** PNG with transparency where applicable
- **Resolution:** @1x, @2x, @3x for mobile
- **Color Profile:** sRGB for cross-platform consistency
- **Optimization:** Compress without quality loss (TinyPNG, ImageOptim)

### File Naming Convention
```
asset-name@[1x|2x|3x].png
Example: kollective-icon@3x.png
```

---

## Implementation Priority

### Phase 1 (Critical - App Store Submission)
- [ ] Icon.png (1024x1024)
- [ ] Splash-icon.png
- [ ] Adaptive-icon.png (Android)
- [ ] Favicon.png

### Phase 2 (Enhanced UX)
- [ ] Achievement badge set
- [ ] Custom status indicators
- [ ] Rank badge illustrations

### Phase 3 (Polish)
- [ ] Entity mascot illustrations
- [ ] Decorative UI elements
- [ ] Atmospheric background assets

---

## Asset Resources & Tools

### Recommended Design Tools
- **Figma:** UI/UX design and prototyping
- **Adobe Illustrator:** Vector icon creation
- **Photoshop:** Raster asset preparation
- **Blender:** 3D renders (if needed for mascots)

### Color Testing
- Test all gold variations against black backgrounds
- Ensure WCAG AA compliance for text on backgrounds
- Verify visibility on both iOS and Android devices

### External Resources
- **Icons:** lucide-react-native (current implementation)
- **Inspiration:** High-end mobile apps (Nike Training, Headspace, Coinbase)

---

## Notes for Designers

The Kollective BOH brand embodies:
- **Visionary Leadership:** Assets should feel forward-thinking
- **Hustler Energy:** Dynamic, action-oriented imagery
- **Premium Quality:** No shortcuts, only excellence
- **Team Unity:** Collaborative spirit in visual language

Every asset should ask: "Does this represent the Kollective standard?"
