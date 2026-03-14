# CLAUDE CODE — Final Fixes & Features (COMPREHENSIVE)

This document covers EVERYTHING that still needs to be done. Read it fully before starting.

Check PROGRESS.md first. If resuming, continue from the last completed checkpoint.

---

## ISSUES FOUND IN CURRENT BUILD

### Issue 1: Word Export — Too Much Spacing
The exported .docx has 54 empty paragraphs out of 159 total. There are unnecessary blank lines between almost every paragraph. 

**Fix:** Remove double-spacing. Only insert ONE empty paragraph between sections (before headings). No empty paragraphs between consecutive list items or between a paragraph and its bullet list. Match the density of René's reference document (STM_RFQ_PG07_Aluminium_Deuren_Ramen.docx).

### Issue 2: Word Export — Duplicate Closing
"Met vriendelijke groet" appears TWICE in the export (line 133 and line 139). Remove the duplicate. Only one closing block at the very end, before the Bijlagen.

### Issue 3: Word Export — Bijlagen Chapter Appears Twice  
The Bijlagen heading appears in the main body (chapter 11) AND again before the appendix images (line 144). Merge these into ONE. The chapter should list the appendices, then the image pages follow directly.

### Issue 4: Word Export — Blank Pages Between Appendix Images
After the Bijlagen heading there are 7 empty paragraphs creating blank pages before/between the appendix images. Remove all empty paragraphs between appendix image pages. Each image should be on its own page with just a page break before it, no empty content.

### Issue 5: Chapter Numbering Gaps
Current export shows: 1, 2, 4, 5, 6, 7, 9, 10, 11 — chapters 3, 8 are skipped. If a chapter is disabled (e.g. Montage is OFF, BIM is OFF), the remaining chapters should renumber automatically. No gaps.

### Issue 6: Bankgarantie/Verzekeringen/Retentie as Raw Text
Line 108 shows "Bankgarantie clausuleVerzekeringen (CAR/AVB/WA)Retentie (5%)" as a single run-on line. These should be proper toggle blocks — when enabled, they render as formatted paragraphs. When disabled, they don't appear at all.

---

## FEATURE: Master Chapter Override (Push to All Categories)

René or management edits a shared chapter (e.g. "Levering & Transport") and wants to push that edit to ALL 24 categories at once.

### How it works:
1. In the top bar, add a button: **"Hoofdstukken beheren"** (Manage chapters)
2. Opens a modal/panel showing all shared chapters:
   - Inleiding
   - Levering & Transport / Uitvoering
   - Prijs & Toeslagen
   - Financieel & Voorwaarden
   - Wettelijke Vereisten
   - Uitsluitingen
   - Offerte Vereisten
   - BIM & Trimble Connect
   - Bijlagen
3. Click a chapter → edit its master text and variables
4. **"Toepassen op alle categorieën"** (Apply to all categories) button
5. Confirmation: "Dit overschrijft hoofdstuk [X] in alle 24 categorieën die geen eigen versie hebben. Doorgaan?"
6. Categories that have overridden this chapter are listed with a warning
7. **"Terugzetten naar standaard"** (Reset to master) option per category per chapter

### Storage:
- Master chapters stored in localStorage under `rfq-master-chapters`
- Per-category overrides tracked with a flag: `useMaster: true/false`
- When `useMaster: true` → inherits from master
- When user edits a shared chapter within a category → `useMaster: false` (override created)

---

## FEATURE: Contract Type (Design / Supply / Build)

René's insight: different contract types have different payment structures.

### Implementation:
Add a **contract type selector** in the top bar or in the entity selection step:

```
Contracttype:
☐ Design (engineering/ontwerp)
☑ Supply (levering)
☐ Build (montage/uitvoering)
```

Multiple can be selected (Design+Supply, Supply+Build, Design+Supply+Build/EPC).

### Effect on Financial Chapter (ch_financieel):

The payment terms section adapts based on contract type:

**Supply only:**
```
Betalingsvoorwaarden: {{betalingsdagen}} dagen na factuurdatum.
```

**Build only (or Supply+Build):**
```
Betalingsvoorwaarden:
- Maandelijkse termijnbetalingen op basis van goedgekeurde voortgangsrapportage
- {{retentiePercentage}}% inhouding tot oplevering
- Retentie wordt vrijgegeven na oplevering en afhandeling van restpunten
```

**Design only (or Design+Supply):**
```
Betalingsvoorwaarden engineering:
- 30% bij opdrachtbevestiging
- 40% bij indiening voorlopig ontwerp / BIM-model
- 30% bij goedkeuring definitief ontwerp
```

**EPC (Design+Supply+Build):**
All three sections shown, each with their own terms.

### Effect on Montage Chapter:
- If "Build" is selected → ch_montage is auto-enabled
- If only "Supply" → ch_montage is auto-disabled
- User can still override

### Data:
```json
{
  "contractType": {
    "design": false,
    "supply": true,
    "build": false
  }
}
```

---

## FEATURE: Auto-Save (Replace Manual JSON Export/Import)

### Remove:
- "JSON ↓" export button
- "JSON ↑" import button

### Replace with:
- **Auto-save** every 30 seconds (or on every change, debounced 2 seconds)
- Small "Opgeslagen" (Saved) indicator that flashes briefly after each save
- **"Opslaan"** (Save) button for manual trigger (Ctrl+S)
- Auto-save to localStorage

### Keep:
- "Exporteer als JSON" in a menu/settings area (for backup/sharing, not primary workflow)
- "Importeer JSON" in same menu area

The primary workflow should be: edit → it saves automatically. No thinking about saving.

---

## FEATURE: Multi-Product RFQ

(Already described in FEATURE_MULTIPRODUCT_AND_PRESETS.md — implement per that spec)

One RFQ can cover multiple product categories for the same supplier. Shared chapters appear once, product-specific chapters get sub-sections per product.

---

## FEATURE: Default Spec Presets

(Already described in FEATURE_MULTIPRODUCT_AND_PRESETS.md — implement per that spec)

Save/load named spec presets per category. "STM Standaard — Wandbeplating" etc.

---

## REVISED CHAPTER STRUCTURE (Final)

Taking into account René's ChatGPT input + our existing design + all feedback:

| # | ID | Title (NL) | Type | Notes |
|---|---|---|---|---|
| 1 | ch_rfq_info | RFQ Informatie | Shared | Entity, date, reference numbers, contacts |
| 2 | ch_inleiding | Projectinleiding | Shared | Project description, documentation basis, scope statement |
| 3 | ch_scope | Scope van Levering | Per product | Product-specific scope blocks |
| 4 | ch_technisch | Technische Eisen | Per product | Detailed technical specs per product |
| 5 | ch_normering | Normering & Regelgeving | Per product + country | NEN/DIN/EN standards |
| 6 | ch_bim | Engineering / BIM Vereisten | Shared/toggle | BIM/Trimble Connect/LOD requirements |
| 7 | ch_montage | Montage / Uitvoering | Toggleable | Installation scope + montagegrenzen |
| 8 | ch_planning | Planning & Levering | Shared | Delivery schedule, lead times, transport |
| 9 | ch_financieel | Commerciële Voorwaarden | Shared per entity | Contract type, payment terms, conditions, insurance |
| 10 | ch_offerte | Offerte Vereisten | Shared + overrides | Submission deadline, required documents |
| 11 | ch_bijlagen | Bijlagen | Auto-generated | Appendix list + embedded document images |

**Changes from previous structure:**
- "Inleiding" split into "RFQ Informatie" (meta/header) + "Projectinleiding" (project context)
- "Levering & Transport" renamed to "Planning & Levering" — broader scope
- "Financieel" expanded to "Commerciële Voorwaarden" — includes contract type logic
- "Wettelijke Vereisten" (§13b/§48b) merged INTO ch_financieel as a conditional section
- "Uitsluitingen" merged into ch_scope per product (each product lists its own exclusions)
- Fewer shared chapters = less confusion about what's shared vs product-specific

**Chapter numbering:** Auto-renumbers when chapters are reordered or disabled. If BIM is disabled and Montage is disabled:
1. RFQ Informatie
2. Projectinleiding
3. Scope van Levering
4. Technische Eisen
5. Normering
6. Planning & Levering
7. Commerciële Voorwaarden
8. Offerte Vereisten
9. Bijlagen

---

## CHECKPOINTS

#### CP-F1: Fix Word export issues
```
□ Remove excessive empty paragraphs (max 1 between sections)
□ Remove duplicate "Met vriendelijke groet"
□ Merge duplicate Bijlagen chapter
□ Remove blank pages between appendix images
□ Auto-renumber chapters (no gaps when chapters disabled)
□ Fix Bankgarantie/Verzekeringen/Retentie — proper toggle blocks
□ Test: export → open in Word → clean professional layout, no blank pages
□ git commit "fix: word export spacing and structure"
```

#### CP-F2: Master chapter override system
```
□ "Hoofdstukken beheren" button in top bar
□ Modal: list all shared chapters, click to edit master text
□ "Toepassen op alle categorieën" button per chapter
□ Confirmation dialog with list of affected categories
□ Override tracking: useMaster flag per category per chapter
□ "Terugzetten naar standaard" per category
□ git commit "feature: master chapter override"
```

#### CP-F3: Contract type system (Design/Supply/Build)
```
□ Contract type selector: checkboxes for Design, Supply, Build
□ Payment terms in ch_financieel adapt based on selection
□ ch_montage auto-enables when Build is selected
□ Contract type shown in RFQ header
□ git commit "feature: contract type with payment logic"
```

#### CP-F4: Auto-save
```
□ Remove JSON export/import buttons from main UI
□ Auto-save to localStorage every 2 seconds (debounced from last change)
□ "Opgeslagen" flash indicator
□ Ctrl+S manual save
□ Move export/import to settings menu (not prominent)
□ git commit "feature: auto-save"
```

#### CP-F5: Revised chapter structure
```
□ Implement new 11-chapter structure per table above
□ Split Inleiding into RFQ Informatie + Projectinleiding
□ Merge Wettelijke Vereisten into Commerciële Voorwaarden (conditional per entity)
□ Move exclusions into per-product scope blocks
□ Rename chapters to match revised Dutch titles
□ Auto-renumber on reorder/disable
□ git commit "feature: revised chapter structure"
```

#### CP-F6: Multi-product RFQ
```
□ Step 2 becomes multi-select (checkboxes per category)
□ Shared chapters appear once, product chapters get sub-sections
□ Left panel: product sub-items under chapter headers
□ [+ Product toevoegen] / [- Product verwijderen]
□ Preview shows full combined document
□ Word export handles multi-product sub-sections
□ git commit "feature: multi-product RFQ"
```

#### CP-F7: Default spec presets
```
□ "Standaard opslaan" — save current specs as named preset
□ "Standaard laden ▾" — dropdown to load preset
□ Presets per category, stored in localStorage
□ Export/import presets as JSON (in settings)
□ Delete preset with confirmation
□ git commit "feature: default spec presets"
```

#### CP-F8: In-app help system
```
□ "?" button in top bar → opens help slide-in panel
□ Quick start guide in Dutch
□ Feature explanation table (badges, buttons, icons)
□ Keyboard shortcuts list
□ FAQ section (7+ questions)
□ Dutch tooltips on ALL interactive elements
□ First-time welcome overlay (shows once)
□ git commit "feature: help system"
```

#### CP-F9: Test everything + deploy
```
□ Test: create multi-product RFQ (3 products)
□ Test: Word export — no spacing issues, appendix images clean, no blank pages
□ Test: contract type toggle → payment terms change
□ Test: master chapter edit → push to all → verify 3 categories
□ Test: save preset → load preset → values correct
□ Test: auto-save → close browser → reopen → state restored
□ Test: all 4 entities → correct template, conditions, compliance
□ npm run build → npm run deploy
□ git commit "final: tested and deployed"
```

---

## TOTAL: 9 checkpoints (CP-F1 through CP-F9)

---

## REGARDING RENÉ'S CHATGPT SUGGESTIONS

Most of it we already have. Here's the mapping:

| René/ChatGPT | Our system | Status |
|---|---|---|
| Core Modules (always included) | Shared chapters (Inleiding, Planning, Financieel, Offerte) | ✅ Already designed |
| Discipline Modules | Product categories (24 of them) | ✅ Already built |
| Project Modules (BIM, Planning, Safety) | Toggleable chapters (BIM, Montage) | ✅ Already designed |
| Contract type (Design/Supply/Build) | NEW — adding in CP-F3 | 🔨 In this prompt |
| Payment terms per contract type | NEW — adding in CP-F3 | 🔨 In this prompt |
| Financial model separation | ch_financieel with conditional sections | ✅ Designed, needs contract type |
| Database structure for RFQ generator | Our JSON data structure | ✅ Already built |

**What ChatGPT missed that we have:**
- Entity-aware system (4 STM companies with different requirements)
- Appendix documents embedded in Word export
- Protected variable badges (not raw text)
- Spec presets
- Bi-directional spec ↔ text sync
- Real supplier data defaults from SI database

**What ChatGPT suggested that's genuinely useful and we're adding:**
- Contract type toggle (Design/Supply/Build)
- Payment terms varying by contract type
- Cleaner chapter naming ("Commerciële Voorwaarden" instead of just "Financieel")

---

## FEATURE: In-App Help System

This tool is getting complex. Non-developer users (René, Floris, Rob, Jan, Bob, Marek) need guidance. Build a help system.

### Help Button
Top bar, right side: **"?"** button → opens a help panel (slide-in from right, overlays the preview panel).

### Help Panel Contents

**Quick Start (Snelstart):**
```
1. Selecteer uw STM entiteit (STP, D&B BV, D&B GmbH, Group)
2. Kies één of meerdere productcategorieën
3. Selecteer het contracttype (Design / Levering / Uitvoering)
4. Klik op "Start Editor"

In de editor:
- Links: hoofdstukken en blokken aan/uit vinken
- Midden: tekst bewerken en specificaties invullen
- Rechts: live voorbeeld van het RFQ-document
```

**Feature Explanations (Functies):**

| Icon/Element | Uitleg |
|---|---|
| Oranje badge in tekst | Een variabele die nog ingevuld moet worden. Klik om naar de specificatie te gaan. |
| Groene badge | Ingevulde variabele. |
| Blauwe badge | Gedelegeerd aan leverancier — de leverancier moet zelf een voorstel doen. |
| Amberkleurige badge | Alternatief gevraagd — de leverancier dient een alternatief aan te bieden. |
| "Delegeren" knop | Schuif een specificatie naar de leverancier. STM geeft geen waarde op, maar vraagt de leverancier om een voorstel. |
| "Alternatief" knop | Vraag de leverancier om naast de specificatie ook een alternatief aan te bieden. |
| ≡ (sleep-icoon) | Sleep om de volgorde van specificaties te wijzigen. |
| × (verwijder) | Verwijder een specificatie uit dit blok. Kan altijd worden hersteld via "Herstellen". |
| "Standaard laden" | Laad een opgeslagen set STM-standaard specificaties. |
| "Standaard opslaan" | Sla de huidige specificaties op als STM-standaard voor toekomstig gebruik. |
| Rode stip naast blok | De tekst van dit blok is gewijzigd ten opzichte van de standaardtekst. |
| "M" badge | Dit hoofdstuk wordt gedeeld met alle categorieën (master hoofdstuk). |
| 🔒 Bevroren | Dit blok is goedgekeurd en vergrendeld. Alleen specificatiewaarden kunnen nog worden ingevuld. |

**Keyboard Shortcuts (Sneltoetsen):**
```
Ctrl+S     Opslaan
Ctrl+Z     Ongedaan maken
Ctrl+Y     Opnieuw
Ctrl+E     Word exporteren
```

**FAQ:**
```
V: Hoe voeg ik een product toe aan mijn aanvraag?
A: Klik op "+ Product toevoegen" onderaan het linkerpaneel.

V: Hoe pas ik de volgorde van hoofdstukken aan?
A: Sleep de hoofdstukken in het linkerpaneel naar de gewenste volgorde.

V: Wat gebeurt er als ik een hoofdstuk uitschakel?
A: Het hoofdstuk verdwijnt uit het document en de nummering past zich automatisch aan.

V: Hoe werkt het contracttype?
A: Selecteer Design, Levering en/of Uitvoering. De betalingsvoorwaarden passen zich automatisch aan.

V: Kan ik mijn wijzigingen kwijtraken?
A: Nee, alles wordt automatisch opgeslagen. U kunt ook altijd terug naar de standaardtekst via "Herstellen".

V: Hoe deel ik mijn standaard specificaties met collega's?
A: Ga naar Instellingen → "Exporteer standaarden" en deel het JSON-bestand.
```

### Tooltips
Every button and interactive element should have a Dutch tooltip (title attribute) explaining what it does. Examples:
- "Delegeren" button → title="Delegeer deze specificatie aan de leverancier"
- "×" remove → title="Verwijder deze specificatie (kan hersteld worden)"
- "Standaard laden" → title="Laad opgeslagen STM-standaard specificaties"
- Chapter drag handle → title="Sleep om de volgorde te wijzigen"

### First-time Welcome
On first visit (no localStorage data), show a brief welcome overlay:
```
┌──────────────────────────────────────┐
│  Welkom bij de STM RFQ Editor        │
│                                      │
│  Met deze tool stelt u professionele │
│  aanvraagdocumenten samen voor       │
│  leveranciers.                       │
│                                      │
│  Klik op "?" rechtsboven voor hulp.  │
│                                      │
│         [ Aan de slag → ]            │
└──────────────────────────────────────┘
```
Shows once, then never again (stored in localStorage).

---

## NOTE FOR CLAUDE CODE: WHAT RENÉ ALREADY KNOWS

René consulted ChatGPT about RFQ generator structure. His suggestions:
- Core/Discipline/Project module split → **we already have this** (shared chapters + category chapters + toggleable chapters)
- Contract type (Design/Supply/Build) → **we're adding this** (CP-F3)
- Payment terms per contract type → **we're adding this** (CP-F3)
- Database structure suggestion → **our JSON structure is already more advanced** (entity-aware, multi-product, preset system)

What our system has that ChatGPT didn't suggest:
- 4 entity support with different templates/conditions/compliance
- Appendix documents embedded as images in Word
- Protected variable badges in text editor
- Bi-directional spec ↔ text reorder sync
- Default spec presets with save/load/share
- Real supplier data defaults from SI database
- MSAL authentication
- Master chapter push-to-all system

Do NOT redesign the architecture based on ChatGPT's suggestions. Our architecture is more complete. Only ADD the contract type feature (Design/Supply/Build) which is the one genuinely useful new thing.

---

## IMPORTANT CONTEXT FROM FULL CHAT HISTORY

Things Claude Code might not know:

1. **4 STM entities** with different templates, conditions, and compliance requirements
2. **MSAL auth** already implemented (clientId c2e1b443, tenant 33cedb1d)
3. **René's RFQ format** is the gold standard — match his language, chapter structure, style
4. **Dutch language** for all UI and content
5. **Protected variable badges** — contenteditable with non-editable spans
6. **Chapters drag-reorderable**, numbers auto-update
7. **Delegate + alternative on ALL specs** with generic Dutch fallback text
8. **Pre-rendered appendix PNG images** in public/appendices/ (already converted)
9. **4 .dotx templates** in public/templates/ for JSZip-based Word export
10. **§13b/§48b compliance** for German entity (D&B GmbH)
11. **Metaalunievoorwaarden** as default conditions, **AVA 2013** as alternative toggle
12. **"Niet vermelde toeslagen worden geacht inbegrepen te zijn"** — mandatory in every pricing chapter
13. **Buyer's perspective always** — "De Leverancier dient..." not "Wij bieden aan..."
