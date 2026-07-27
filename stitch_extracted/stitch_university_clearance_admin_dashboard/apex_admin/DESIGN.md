---
name: Apex Admin
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#5b403c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#8f706b'
  outline-variant: '#e4beb8'
  surface-tint: '#b91e17'
  primary: '#b51b15'
  on-primary: '#ffffff'
  primary-container: '#d9372a'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a9'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#4d5d73'
  on-tertiary: '#ffffff'
  tertiary-container: '#66768d'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4a9'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930004'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is engineered for high-density SaaS admin dashboards where clarity, speed of cognition, and professional reliability are paramount. The brand personality is efficient, precise, and energetic, utilizing a high-vibrancy primary red to denote action and importance against a calm, professional backdrop.

The design style follows **Corporate / Modern** principles with a focus on:
- **Clean Functionalism:** Maximum whitespace within data-heavy views to reduce cognitive load.
- **Subtle Layering:** Using soft shadows and tonal shifts rather than heavy borders to define hierarchy.
- **Dynamic Feedback:** High-contrast primary accents to guide the user toward successful task completion and critical status updates.

## Colors

The palette is anchored by the primary red, used purposefully for high-signal elements. 

- **Primary (#f44a3b):** Reserved for primary calls-to-action, active navigation states, and critical notifications.
- **Secondary / Slate (#1e293b):** Used for text and side navigation backgrounds to provide a grounded, professional contrast.
- **Surface & Backgrounds:** The interface utilizes a tiered gray scale. The main background is `#f8fafc`, while cards and containers use pure white (`#ffffff`) to create a clear visual lift.
- **Success/Warning/Info:** Standard semantic colors should be slightly desaturated to ensure they do not compete with the primary brand red for the user's attention.

## Typography

The typography system uses a tri-font approach to balance character with utility. 

1.  **Hanken Grotesk** is used for headlines and titles to provide a modern, sharp SaaS aesthetic. 
2.  **Inter** handles all body copy and data entry, chosen for its exceptional legibility in dense interfaces. 
3.  **Geist** is utilized for labels, captions, and monospaced data (like IDs or values), leaning into a clean, developer-friendly technical vibe.

Large display type should utilize tighter letter-spacing to maintain a "locked-in" professional look.

## Layout & Spacing

The design system employs a **12-column fluid grid** for the main content area, paired with a fixed-width left navigation sidebar (256px). 

- **Grid Logic:** Use 24px gutters between columns. Content should be grouped in cards that span 3, 4, 6, or 12 columns depending on the data complexity.
- **Vertical Rhythm:** A strict 4px baseline grid ensures consistent alignment between text and UI components.
- **Adaptive Rules:** On tablet (under 1024px), the sidebar collapses into a drawer. On mobile (under 640px), margins reduce to 16px and all grid columns stack to a single-column layout.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layers** and **Ambient Shadows**.

- **Level 0 (Background):** `#f8fafc`. The lowest layer.
- **Level 1 (Cards/Sidebar):** White `#ffffff` with a subtle 1px border (`#e2e8f0`) or a very soft shadow (0px 1px 3px rgba(0,0,0,0.05)).
- **Level 2 (Modals/Popovers):** White with a medium-diffusion shadow (0px 10px 15px -3px rgba(0,0,0,0.1)).
- **Active State Depth:** Buttons utilize a small, saturated shadow of the primary color (e.g., `#f44a3b` at 20% opacity) when hovered to create a sense of physical interaction.

## Shapes

The design system uses a **Rounded** shape language to soften the industrial feel of an admin dashboard while remaining professional.

- **Standard (8px):** Applied to buttons, input fields, and small UI widgets.
- **Large (16px):** Applied to primary content cards and dashboard modules.
- **Extra Large (24px):** Used for large empty-state containers or featured promotional banners within the dashboard.
- **Pill:** Reserved exclusively for Status Badges/Chips and toggle switches.

## Components

- **Buttons:** Primary buttons use the `#f44a3b` background with white text. Secondary buttons use a light gray ghost style. All buttons have a subtle 1px inner highlight for a tactile feel.
- **Inputs:** Fields use a white background with a 1px border. On focus, the border transitions to the primary red with a 2px outer glow (ring).
- **Cards:** Dashboard cards should feature a 16px padding as standard and use "Level 1" elevation. Headlines within cards should be `title-md`.
- **Navigation:** Active sidebar items use a vertical 4px bar on the left in primary red and a 5% opacity red background tint.
- **Chips/Badges:** Small, pill-shaped indicators. For "Active" status, use a light red tint background with primary red text.
- **Lists:** Data tables and lists should have minimal borders—horizontal separators only—using `#f1f5f9`. Row hover states should use a subtle `#f8fafc` tint.