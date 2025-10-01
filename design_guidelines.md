# Design Guidelines: Box Opening Betting Game

## Design Approach
**Reference-Based Approach**: Drawing inspiration from modern gaming platforms (Stake.com, CS:GO case opening sites) and casino-style interfaces. This gaming experience requires high visual impact, engaging animations, and clear reward feedback to drive user engagement.

## Core Design Principles
- **Excitement & Anticipation**: Every interaction should build suspense
- **Clear Value Communication**: Balance and winnings displayed prominently
- **Gaming Authenticity**: Premium casino aesthetic with modern web polish
- **Trust Through Design**: Professional polish to establish credibility

## Color Palette

**Dark Mode Primary** (Gaming Aesthetic):
- Background: 220 20% 12% (Deep navy-slate)
- Surface: 220 18% 16% (Elevated panels)
- Surface Elevated: 220 16% 20% (Cards, modals)
- Primary Accent: 280 70% 58% (Vibrant purple for CTAs and highlights)
- Success/Win: 142 76% 45% (Bright green for winnings)
- Warning: 45 93% 55% (Gold for special multipliers)
- Danger: 0 84% 60% (Red for losses/errors)
- Text Primary: 0 0% 98%
- Text Secondary: 220 8% 70%

**Visual Accents**:
- Glow effects using primary accent with 40% opacity
- Gradient overlays: From primary accent to darker variants for depth
- Gold shimmer effects for high-value multipliers (45 93% 55% to 38 95% 48%)

## Typography
- **Primary Font**: 'Inter' for UI elements and body text
- **Display Font**: 'Outfit' for large numbers, multipliers, and headings
- **Monospace**: 'JetBrains Mono' for precise values (balance, bet amounts)

**Scale**:
- Multiplier Display: text-7xl font-bold (when revealed)
- Balance/Winnings: text-3xl font-semibold
- Bet Amounts: text-xl font-medium
- Body/UI: text-base
- Small Labels: text-sm

## Layout System
**Spacing Units**: Use Tailwind units of 2, 4, 6, 8, 12, 16, and 24 for consistent rhythm

**Main Game Layout**:
- Full viewport height (min-h-screen) with centered game area
- Maximum content width: max-w-6xl mx-auto
- Vertical sections: py-8 to py-16 spacing between major elements
- Component padding: p-6 to p-8 for cards and panels

## Component Library

### Top Navigation Bar
- Fixed positioning (sticky top-0) with backdrop blur
- Height: h-16
- Contains: Logo (left), Balance display (center-right), Icon buttons (right)
- Balance card: Elevated surface with wallet icon, amount in monospace font
- Icon buttons: Circular (w-10 h-10), subtle hover glow effect
- Include notification badge on notification button (red dot indicator)

### Box Opening Zone (Hero/Main Game Area)
- Centered vertically in viewport
- 3D-style box illustration or animated SVG
- Box size: w-64 h-64 to w-80 h-80 on desktop
- Pulsing glow animation when idle
- Opening animation: 3-4 second dramatic reveal with rotation and scale effects
- Prize reveal: Slide up from box with scale-in animation and particle effects

### Bet Selection Carousel
- Horizontal scrolling container with momentum physics
- Individual bet chips: Rounded squares (aspect-square) with gradient backgrounds
- Chip sizes: w-20 h-20 to w-24 h-24
- Active selection: Larger scale (scale-110), bright glow, elevated
- Bet amounts styled as: "50", "100", "500", "1K", "5K", "10K", "50K"
- Carousel indicators: Dots or mini chips showing position

### Primary CTA (Open Box Button)
- Large, prominent placement below carousel
- Size: px-12 py-4, text-xl font-bold
- Pulsing animation to draw attention
- Disabled state when no bet selected (reduced opacity, no animation)

### Authentication Screens
- Centered modal or full-page card: max-w-md
- Split design: Left side with brand illustration, right side with form
- Form inputs: Elevated surface with focus glow
- Input height: h-12 with px-4 padding
- Clear visual feedback for validation errors (red border, shake animation)
- "Remember me" toggle styled as modern switch component

### Admin Panel
- Sidebar navigation (w-64) with main content area
- Dashboard cards in grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Data tables with alternating row backgrounds
- Action buttons: Icon + text, compact size
- Search and filter bar: Fixed at top of content area

### Wallet Modal
- Center-screen overlay (max-w-2xl)
- Transaction history: Timeline layout with icons
- Add funds section: Prominent at top with amount quick-select chips
- Withdrawal requests: Secondary section below

### Settings Panel
- Tabbed interface for different setting categories
- Toggle switches for preferences
- Dropdowns for language/currency selection
- Clear section dividers (border-b with subtle color)

### Notification Panel
- Slide-in from right (w-80 to w-96)
- List of notification cards with icons
- Unread indicators: Blue dot
- Action buttons inline with notifications
- Clear all button at top

## Animations

**Critical Animations** (High Impact):
- Box opening sequence: 3-4 seconds with multiple stages
- Prize reveal: Scale + fade in + particle burst
- Multiplier counter: Rapid number increment with haptic feel
- Win celebration: Confetti or particle effects for big wins

**Micro-interactions**:
- Bet chip selection: Scale + glow transition (150ms)
- Button hover: Subtle lift (2px translate) + glow
- Balance update: Smooth number counter animation
- Input focus: Border color transition + subtle scale

**Avoid**: Excessive bouncing, distracting background animations

## Images

**Hero/Main Game Area**:
- 3D rendered box illustration (closed state): Glossy surface with lighting effects, facing user
- 3D rendered box (open state): Lid lifted, interior glowing
- Prize icons: High-quality SVG or PNG icons for multiplier tiers (bronze, silver, gold, diamond based on value)

**Authentication Screens**:
- Abstract gaming illustration: Geometric shapes, boxes, or chips in brand colors
- Not needed for login - focus on simplicity

**Admin Panel**:
- Dashboard charts/graphs generated via libraries (no static images needed)
- User avatars: Default to initials on colored circles

**No large hero image needed** - the interactive box is the hero element.

## Responsive Behavior
- Desktop (lg:): Full feature set, side-by-side layouts
- Tablet (md:): Maintain game functionality, stack some nav elements
- Mobile: Single column, optimized touch targets (min h-12), bottom-fixed bet carousel
- Touch-friendly: All interactive elements minimum 44x44px

## Trust & Credibility Elements
- SSL badge in footer
- "Provably Fair" indicator near game
- User count or transaction volume display
- Professional error states with helpful messages
- Loading states for all async actions

This creates a premium gaming experience that balances excitement with trust, using bold colors and animations strategically while maintaining usability and professionalism.