# Design System Specification: The Forensic Lens

## 1. Overview & Creative North Star: "The Digital Dossier"
This design system is built to transform complex AI data into a cinematic investigative experience. Our Creative North Star is **The Digital Dossier**—a high-fidelity, intelligence-agency interface that prioritizes clinical precision over decorative fluff. 

To move beyond "standard" dashboard templates, we employ **Hard-Edge Minimalism**. By utilizing a strict `0px` radius across all components, we evoke a sense of military-grade reliability and architectural brutalism. We break the grid through intentional asymmetry: heavy-weighted data columns juxtaposed with expansive, "breathing" monochromatic voids. This is not just a tool; it is a high-tech environment where information is the protagonist.

---

## 2. Colors & Atmospheric Depth
Our palette is rooted in the "Void"—a deep, layered black that provides the canvas for high-contrast forensic insights.

### Tonal Hierarchy
- **Primary (`#a5e7ff`):** The "Active Pulse." Used for verified data, active streams, and system "health."
- **Secondary (`#ffb3ac`):** The "Conflict." A muted, clinical red used exclusively for narrative discrepancies or criminal anomalies.
- **Tertiary (`#ffd79c`):** The "Intelligence." An amber hue reserved for AI-generated insights and high-priority attention.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. Boundaries must be defined solely through background shifts. 
- Use `surface-container-low` for secondary sidebars sitting on the `background`.
- Use `surface-container-high` to define nested data modules.
- The shift between `#131314` (Surface) and `#201f20` (Surface Container) is enough to guide the eye without cluttering the UI with lines.

### Glass & Texture
Floating panels (modals, context menus) must utilize **Glassmorphism**. Apply `surface-variant` at 60% opacity with a heavy `backdrop-filter: blur(20px)`. To ensure the "Cyberpunk" feel, a global `subtle-noise.png` texture should be applied at 3% opacity over the entire viewport to simulate a high-tech hardware monitor.

---

## 3. Typography: The Technical Edit
We use typography to establish a clear hierarchy between "System Data" and "Human Narrative."

- **Display & Headlines (`Space Grotesk`):** Our "Command" font. It is aggressive, modern, and wide. `display-lg` (3.5rem) should be used for high-level case titles, while `headline-sm` (1.5rem) identifies major data clusters.
- **Body (`Manrope`):** Our "Report" font. Highly legible and neutral. `body-md` (0.875rem) is the workhorse for case files and AI summaries.
- **Labels (`Space Grotesk` - 0.75rem):** All metadata (timestamps, coordinates, IDs) must be in labels to maintain a technical, "tagged" aesthetic.
- **Monospace Fallback:** For data conflicts and raw AI logs, use a monospace font to distinguish machine-generated text from editorialized content.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering**, not shadows. We treat the UI as a physical stack of light-absorbing materials.

- **The Layering Principle:** 
    1. Base: `surface-container-lowest` (The Deep Void).
    2. Section: `surface-container-low` (The Workspace).
    3. Content Card: `surface-container-highest` (The Evidence).
- **The "Ghost Border" Fallback:** If a container requires further definition (e.g., over a complex image), use a **Ghost Border**: `outline-variant` (`#3c494e`) at 15% opacity. Never use 100% opaque lines.
- **Ambient Glows:** For "Active" or "Conflict" states, replace drop shadows with a subtle outer glow using the `primary` or `secondary` color at 10% opacity, blurred to 40px. This simulates light emission from a high-tech display.

---

## 5. Components

### Buttons (The "Command" Units)
- **Primary:** Background `primary` (`#a5e7ff`), text `on_primary` (`#003543`). `0px` radius. No border.
- **Secondary:** Ghost style. No background. `outline` border at 30% opacity. Text `primary`.
- **States:** On hover, primary buttons should "flicker" (transition 50ms) to a slightly higher luminosity.

### Input Fields (The "Data Entry")
- **Style:** Underline only. No box. Use `outline-variant` for the underline. 
- **Active State:** The underline transitions to `primary` with a 2px height. 
- **Error State:** Underline becomes `secondary` (muted red) with `secondary_container` background at 10% opacity.

### Cards & Evidence Blocks
- **Construction:** Use `surface-container-high`. No borders. No rounded corners.
- **Separation:** Do not use dividers. Separate internal content using `0.5rem` to `1.5rem` of vertical whitespace (following the spacing scale).
- **Nesting:** When a card contains an AI sub-process, that sub-process should sit in a `surface-container-lowest` "well" to indicate it is "deeper" in the system.

### AI Conflict Chips
- Small, rectangular blocks using `secondary_container` for the background and `on_secondary_container` for text. These should feel like a warning "stamp" on a physical file.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace the Dark:** Keep 90% of the UI in the `surface` and `surface-container` range. Let the accent colors "pop" like neon in an alley.
- **Use Monospace for Meta:** Use it for coordinates, IDs, and timestamps to reinforce the "intelligence dashboard" vibe.
- **Animate Transitions:** Use "staggered" entry animations for data lists to mimic a system booting up or scanning.

### Don’t:
- **No Rounding:** Never use `border-radius`. Everything must be sharp, 90-degree angles.
- **No Standard Grey Shadows:** If you need lift, use color-tinted glows or background shifts. Standard shadows kill the "light-emitting" cyberpunk aesthetic.
- **No Clutter:** If a piece of data isn't essential to the "investigation," hide it. This is a high-stakes environment; clarity is the priority.
- **No Dividers:** If you feel the urge to draw a line between two items, increase the padding by 8px instead. Let the hierarchy breathe.