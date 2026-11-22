# DESIGN.md — Madder: a quiet reading-room design system

## 1. Visual philosophy
Aporia is a daily reading ritual, so the interface behaves like a printed page that happens to be alive: one large passage, a ruled index of essays, and almost nothing else. Colour comes from madder, the rose-red dye of manuscript rubrication (bright coral-red on wine-black, or deep crimson ink on pale rose paper). Type comes from the Caslon tradition that printed the Enlightenment's philosophers.

- **Spend boldness in one place:** the passage. Everything else is quiet.
- **No cards, no gradients, no shadows.** Structure comes from whitespace, hairlines and a date gutter.
- **Sentence case everywhere.** No all-caps labels, no monospace, no middle-dot meta strings.
- **Dark by default**, with a flicker-free light theme.

## 2. Colour tokens (`src/app/globals.css`)

### Dark (default) — "Coral noir"
| Token | Value | Role |
| :-- | :-- | :-- |
| `--canvas` | `#150B0F` | Page background |
| `--raised` | `#1E1116` | Modal, hover wash, toast |
| `--line` | `#37212B` | Hairlines, the hero ring |
| `--ink` | `#F6EDEF` | Primary text |
| `--ink-2` | `#CBB0B8` | Secondary text, excerpts |
| `--ink-3` | `#A98A94` | Metadata (AA on canvas and raised) |
| `--accent` | `#FF6F61` | Coral-red: links, active state, primary button |
| `--accent-ink` | `#2A0711` | Text on accent fills |
| `--accent-wash` | `rgba(255, 111, 97, 0.13)` | Selection, subtle fills |
| `--live` | `#FF6F61` | Sync dot |

### Light — "Rose paper"
| Token | Value |
| :-- | :-- |
| `--canvas` | `#FBF3F4` |
| `--raised` | `#FFFAFA` |
| `--line` | `#EBD3D8` |
| `--ink` | `#2A1218` |
| `--ink-2` | `#5F3F48` |
| `--ink-3` | `#7A5560` |
| `--accent` | `#B3122F` |
| `--accent-ink` | `#FBF3F4` |
| `--accent-wash` | `rgba(179, 18, 47, 0.08)` |
| `--live` | `#B3122F` |

## 3. Typography (`next/font/google`)
| Role | Family | Use |
| :-- | :-- | :-- |
| `--font-display` | Libre Caslon Display 400 | The daily passage and page headings |
| `--font-serif` | Libre Caslon Text 400 + italic | Essay titles, attribution, the inquiry question |
| `--font-sans` | Hanken Grotesk 400/500/600 | Interface, excerpts, metadata |

Scale: passage `clamp(2.4rem, 1.2rem + 4.6vw, 4.75rem)` / 1.1, stepping down for long quotes (`data-size="m"` ≈ 3.25rem, `"s"` ≈ 2.35rem). Page heading 2.5rem display. Essay title 1.5rem serif / 1.25. Inquiry 1.6rem italic serif / 1.4. Body and excerpts 15–15.5px sans / 1.65. Metadata 13px sans. Line length stays under 70 characters in body text.

## 4. Layout
- `.wrap`: max-width `1040px`, side padding `20px` (mobile) / `32px`. Reading content lives in `.stream`, max-width `820px`.
- **Top bar:** 60px, transparent at the top of the page, gaining a hairline and blur once scrolled. Brand and edition number on the left; Today, Archive, Library, Notebook and Saved as text links (counts shown for Archive, Notebook and Saved); sync state, guide, settings and theme controls on the right.
- **Mobile (<760px):** the page links move to a fixed 56px bottom bar with a safe-area inset; the sync label and guide icon are hidden.
- **Hero (Today):** left-aligned passage in roughly 80% of the first viewport, attribution beneath, actions beneath that. A faint broken-circle ring (the Aporia mark, drawn in `--line`) sits cropped on the right edge.
- **Page head:** every other page opens with a 2.75rem display title and a one-sentence description.
- **Index rows:** `.entry` rows on an `88px` gutter + content column, separated by one hairline. The excerpt carries a 1px left rule, which signals "quoted from the source". Passages (Library, Saved) use the same row with the branch in the gutter.
- **Radius:** `6px` for kbd hints, `10px` for buttons, fields, the dialog and the toast. Nothing else is rounded.
- **No search field anywhere.** Narrowing is done with branch filters, a thinker or source select, and an unread-only switch.

## 5. Pages and components
| Page | Contents |
| :-- | :-- |
| Today `/` | Passage hero, Sit with a question (expands the question and a reflection box), Shuffle, Save, Copy as Markdown. Below: "New in philosophy" with a read-progress hairline, streak, branch filter, Mark all read, Copy digest, Export .md. |
| Archive `/archive` | Branch filter, source select, unread-only switch, newest/oldest toggle. Entries grouped by month, 40 at a time. |
| Library `/library` | All corpus passages with branch filter, thinker select and Surprise me. Each row: Show question, Reflect, Save, Copy as Markdown. |
| Notebook `/notebook` | Composer for any passage plus every saved reflection (edit, copy, delete with confirmation, export). |
| Saved `/saved` | Passages and essays with an Everything / Passages / Essays switch and branch filter. |
| Settings `/settings` | Theme (device, dark, light), text size, compact lists, activity figures, backup and restore, delete all data, Atom feed, shortcuts. |
| How it works `/guide` | The daily loop, last run figures, how to use each page, questions, fork guide. |

- **Entry row:** date and year in the gutter; serif title (external-link icon on hover and focus); source and read time; up to three excerpt lines; branch link, Save, Mark read, Copy quote. Read entries dim their title.
- **Compact lists:** `html[data-compact="true"]` hides excerpts. **Text size:** `html[data-size]` sets `--scale` (0.93, 1, 1.14), applied to body, excerpts, titles and the passage attribution.
- **Dialog:** the shortcuts list is a native `<dialog>`.

## 6. Voice
Plain verbs, sentence case, one name per action: *Save* produces "Saved", *Save reflection* produces "Reflection saved to your notebook", *Export .md* produces "Edition exported". Empty states say what to do next. Destructive actions ask once ("Delete for good" / "Keep").

## 7. Accessibility and motion
- Skip link, `aria-current` on the active page, `aria-pressed` on every toggle, `role="progressbar"` on read progress.
- Keyboard: `g` then `t a l n s , h` jump between pages, `?` lists shortcuts, `Esc` closes the dialog. Shortcuts never fire while typing.
- `2px solid var(--accent)` `focus-visible` outline on every interactive element.
- One orchestrated moment (the hero fade-in) plus responses to user actions. `prefers-reduced-motion` disables all of it.
- All text tokens meet WCAG AA on `--canvas` and `--raised`.
