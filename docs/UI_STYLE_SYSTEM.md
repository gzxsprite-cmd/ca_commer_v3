# UI_STYLE_SYSTEM

## Style Intent
A **light, trustworthy, efficient** commercial workspace UI. Prioritize operational clarity over decoration.

## Mandatory Style Principles
- Consistency first across all pages
- Fast scanning and low cognitive load
- Clear action paths
- Reusable visual patterns

## Explicitly Forbidden Styles
- Heavy traditional admin look (dense blocks, overly dark/heavy chrome)
- Over-decorated landing-page style (hero-first, marketing-heavy visuals)

## Baseline Visual Tokens

### Core Colors
- Primary: calm blue range for key actions and active states
- Neutral: gray scale for text, borders, surfaces
- Background: light neutral, high readability

### Status Colors
- Success: green
- Warning: amber/orange
- Risk/Blocked: red
- Info/In-progress: blue
Use status colors as signals, not page decoration.

## Component Baselines
### Shell
- Fixed global header + consistent content container
- Stable spacing and alignment rules

### Cards
- Lightweight surface, subtle border/shadow
- Clear title and key value/action

### Tables / Lists
- Prioritize readability and scan speed
- Keep columns minimal in Stage-0
- Support clear status/owner/next-step columns where applicable

### Buttons
- One primary action per region
- Secondary and tertiary actions visually lower priority

### Inputs / Forms
- Simple vertical rhythm
- Clear labels and helper text
- Avoid multi-layer interaction traps

## Spacing Baseline
- Use a consistent spacing scale (small/medium/large)
- Avoid irregular one-off spacing decisions

## Operational Clarity Requirement
Where applicable, each record or task view must clearly display:
- **Current Status**
- **Current Owner**
- **Next Step**
