---
name: Smart Nanum
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#464555'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8a4cfc'
  on-secondary-container: '#fffbff'
  tertiary: '#474751'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f5f69'
  on-tertiary-container: '#dbdae5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#e3e1ed'
  tertiary-fixed-dim: '#c7c5d1'
  on-tertiary-fixed: '#1a1b23'
  on-tertiary-fixed-variant: '#46464f'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 20px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  section-gap: 40px
---

## Brand & Style

The brand identity centers on the concept of "Sharing" (Nanum) through a lens of modern efficiency and community trust. The personality is helpful, reliable, and approachable, designed to reduce the friction of social contribution or resource sharing.

The design style is **Modern Corporate with Soft Humanist influences**. It leverages generous whitespace and high-quality photography to build credibility, while using soft-focus elements to feel welcoming. The interface prioritizes clarity and action-oriented flows, ensuring the "Smart" aspect of the brand is reflected through a crisp, logical layout that avoids visual clutter.

## Colors

The palette is anchored by **Indigo Blue (#4F46E5)**, chosen for its stability and professional "tech-forward" feel. The **Purple (#7C3AED)** secondary color adds a touch of warmth and vibrancy, used primarily for accents and interactive highlights to differentiate the app from standard utility tools.

- **Primary**: Brand actions, active states, and core iconography.
- **Secondary**: Success states, progress indicators, and secondary calls-to-action.
- **Surface & Backgrounds**: A clean, white-dominant background with **Tertiary Lavender (#F5F3FF)** used for subtle section partitioning.
- **Neutrals**: Deep slate tones for high-legibility typography, ensuring accessibility and a premium feel.

## Typography

This design system utilizes **Manrope** for its entire type scale. Manrope is a modern geometric sans-serif that strikes a perfect balance between technical precision and friendly warmth. Its high x-height ensures excellent legibility on mobile screens.

Headlines use semi-bold and bold weights with tighter letter-spacing to create a strong visual anchor. Body text is set with generous line-height to maintain a "breathable" and friendly reading experience, especially during onboarding or instructional flows.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for mobile-first interactions. It utilizes a 4-column structure for mobile devices with a standard 20px outer margin to ensure content doesn't feel cramped against the screen edges.

Vertical rhythm is established through an 8px base unit. Component spacing is categorized by "Stacks":
- **Small (8px)**: Internal component spacing (icon to text).
- **Medium (16px)**: Between related components in a group.
- **Large (24px)**: Between distinct content blocks or card groups.
- **Section Gap (40px)**: Major transitions between the header, main content, and footer actions.

## Elevation & Depth

Depth is achieved through **Ambient Shadows** and **Tonal Layering**. Surfaces are rarely "flat" white; instead, they sit atop a subtle light-gray or lavender base.

- **Level 1 (Cards)**: Use a very soft, diffused shadow (0px 4px 20px rgba(79, 70, 229, 0.05)) to lift content slightly without creating harsh edges.
- **Level 2 (Buttons/Active)**: A more pronounced shadow with a hint of the primary indigo tint to suggest "pressability."
- **Overlays**: Use a backdrop blur (12px) for modals and navigation bars to maintain context of the underlying screen while focusing the user's attention.

## Shapes

The shape language is defined by **Rounded (0.5rem)** corners. This specific radius is used to soften the "tech" feel of the indigo palette, making the app feel more human and "bubbly" without losing its professional edge.

- **Standard Buttons & Inputs**: 8px (0.5rem) radius.
- **Large Cards & Image Containers**: 16px (1rem) radius.
- **Action Sheets**: 24px (1.5rem) top-only radius to create a distinct "drawer" feel.

## Components

### Buttons & Actions
Primary buttons use the Indigo Blue background with white text and a subtle 8px radius. Secondary buttons use the Tertiary Lavender background with Indigo text. Floating Action Buttons (FABs) utilize the Purple secondary color to stand out as the primary "Sharing" trigger.

### Input Fields
Inputs feature a light stroke (1px) in a soft neutral-200 color. On focus, the border transitions to Indigo with a subtle outer glow. Labels sit outside the input for maximum clarity.

### Cards & Image Placement
Cards are the primary container for content. Images within cards should use a "Top-Crop" 16:9 aspect ratio with a 16px radius. Text within cards should be padded by 16px to maintain the internal gutter.

### Navigation & Tab Bar
The bottom navigation utilizes a glassmorphism effect (frosted background) to let the primary brand colors peek through as the user scrolls. Icons are a mix of filled (active) and outlined (inactive) styles.

### Chips & Tags
Used for categorization, chips have a 100px (pill) radius and use a light tint of the primary color to indicate selection without overwhelming the visual hierarchy.