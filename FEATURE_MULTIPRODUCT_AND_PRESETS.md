# CLAUDE CODE — Two Missing Features

Read this fully before starting. These are two separate features to add to the existing RFQ Editor v2.

---

## FEATURE 1: Default Spec Presets (Standaard Specificaties)

### What it is
Management wants to save "STM standard specifications" per product category. When someone creates a new RFQ for wall cladding, they should be able to load "STM Standaard — Wandbeplating" and all specs are pre-filled with STM's preferred values. Multiple presets per category are possible (e.g. wall vs roof variant).

### How it works

**Saving a preset:**
1. User fills in specs for a category (e.g. thickness=100, core=PIR, coating=HDX Granite)
2. Clicks "Standaard opslaan" (Save as default) button in top bar
3. Dialog appears: "Naam van de standaard:" with text input
4. User types "STM Standaard — Wandbeplating" → clicks Opslaan
5. Current spec values for ALL blocks in this category are saved as a named preset
6. Stored in localStorage under key `rfq-presets-{categoryId}`

**Loading a preset:**
1. User clicks "Standaard laden ▾" (Load default) dropdown in top bar
2. Shows list of saved presets for current category
3. User selects one → all spec values are filled from the preset
4. Existing manual edits are overwritten (confirm dialog: "Dit overschrijft de huidige specificaties. Doorgaan?")

**Managing presets:**
- Each preset shows: name, date saved, who saved it (from useUser())
- Delete button (×) per preset with confirmation
- "Exporteer standaarden" button — downloads all presets as JSON
- "Importeer standaarden" button — upload presets JSON (for sharing between team members)

### Data structure
```json
{
  "presets": {
    "metal_sandwich_panel": [
      {
        "name": "STM Standaard — Wandbeplating",
        "savedBy": "Ashkan",
        "savedAt": "2026-03-14T10:00:00Z",
        "values": {
          "b2_pan": {
            "thk": "100",
            "core": "PIR (B-s1-d0)",
            "extCoat": "HDX Granite 55µm",
            "extCol": "RAL 9007",
            "extProf": "Rib 14",
            "fixing": "Concealed",
            "intCoat": "Polyester 25µm",
            "intCol": "RAL 9002"
          }
        }
      },
      {
        "name": "STM Standaard — Dakbeplating",
        "savedBy": "René",
        "savedAt": "2026-03-15T14:00:00Z",
        "values": {
          "b2_pan": {
            "thk": "80",
            "core": "PIR (B-s1-d0)",
            "extProf": "Box",
            "extCoat": "Polyester 25µm"
          }
        }
      }
    ]
  }
}
```

### UI placement
In the top bar, between the category selector and the action buttons:

```
[Entity] [Category ▾] | [Standaard laden ▾] [Standaard opslaan] | [Ongedaan maken] [Opnieuw] ...
```

The "Standaard laden" is a dropdown button. The "Standaard opslaan" opens a small dialog/modal.

### Important
- Presets only save SPEC VALUES (the vals object), not text edits, not block selections, not delegate toggles
- Presets are per category — you can't apply a wall cladding preset to an overhead door
- When loading a preset, only the values that exist in the preset are filled — other specs keep their current value
- Presets survive page refresh (localStorage)
- Presets can be exported/imported as JSON for sharing between team members

---

## FEATURE 2: Multi-Product RFQ (Meerdere Producten per Aanvraag)

### What it is
Currently the editor creates an RFQ for ONE product category (e.g. wall cladding OR overhead doors). In reality, an RFQ often covers MULTIPLE products for the same supplier. For example:

- Cladding Point gets ONE RFQ for: wall panels + roof panels + flat sheets
- Novoferm gets ONE RFQ for: overhead doors + dock levellers + dock shelters
- Oosterveld gets ONE RFQ for: excavation + sewerage + paving
- Schelfhout gets ONE RFQ for: sandwich panels + plinths + cutouts/dagkanten

The editor must support combining multiple product categories into a single RFQ document.

### How it works

**Step 1: Entity selection** (unchanged)
Pick STM entity (STP / D&B BV / D&B GmbH / Group)

**Step 2: Product selection** (CHANGED — now multi-select)
Instead of picking ONE category, user can pick MULTIPLE:

```
┌────────────────────────────────────────────────────┐
│  Stap 2: Selecteer producten voor deze aanvraag     │
│                                                     │
│  PG05 — Beton                                       │
│  ☑ Betonnen Sandwichpanelen                         │
│  ☐ Massief Betonpaneel                              │
│  ☑ Betonnen Plint                                   │
│  ☐ Kanaalplaatvloer                                 │
│  ☐ Cellenbeton                                      │
│                                                     │
│  PG07 — Deuren & Laadkleppen                        │
│  ☐ Overheaddeuren                                   │
│  ☐ Laadklep                                         │
│  ☐ Dockshelter                                      │
│                                                     │
│  PG08 — Beplating & Dak                             │
│  ☑ Metalen Sandwichpaneel                           │
│  ☐ Geprofileerde Staalplaat                         │
│  ...                                                │
│                                                     │
│  Geselecteerd: 3 producten                           │
│              [ Start Editor → ]                      │
└────────────────────────────────────────────────────┘
```

**Step 3: Editor with combined chapters**

The shared chapters (Inleiding, Levering, Prijs, Financieel, etc.) appear ONCE.
The product-specific chapters (Scope, Technisch, Normering) appear PER PRODUCT.

Chapter structure for a multi-product RFQ:

```
1. Inleiding                          ← shared (one for all products)
2. Scope van Levering                  ← combined: lists all products
  2A. Betonnen Sandwichpanelen         ← product 1 scope blocks
  2B. Betonnen Plint                   ← product 2 scope blocks
  2C. Metalen Sandwichpaneel           ← product 3 scope blocks
3. Technische Specificatie
  3A. Betonnen Sandwichpanelen         ← product 1 specs
  3B. Betonnen Plint                   ← product 2 specs
  3C. Metalen Sandwichpaneel           ← product 3 specs
4. Montage / Installatie               ← shared toggle (if any product needs it)
5. Normering
  5A. Betonnen Sandwichpanelen         ← product 1 standards
  5B. Betonnen Plint                   ← product 2 standards
  5C. Metalen Sandwichpaneel           ← product 3 standards
6. BIM, IFC & Trimble Connect          ← shared
7. Levering & Transport                ← shared
8. Prijs & Toeslagen                   ← combined: price items from all products
9. Financieel & Voorwaarden            ← shared
10. Wettelijke Vereisten               ← shared per entity
11. Uitsluitingen                      ← combined: exclusions from all products
12. Offerte Vereisten                  ← combined: required docs from all products
13. Bijlagen                           ← shared
```

### Left panel — navigation for multi-product

```
┌──────────────────────────┐
│ HOOFDSTUKKEN             │
│                          │
│ [1] Inleiding            │
│                          │
│ [2] Scope van Levering   │
│  ├─ Sandwichpanelen  [▸] │  ← click expands product blocks
│  ├─ Betonnen Plint   [▸] │
│  └─ Metalen Panel    [▸] │
│                          │
│ [3] Technische Spec.     │
│  ├─ Sandwichpanelen  [▸] │
│  ├─ Betonnen Plint   [▸] │
│  └─ Metalen Panel    [▸] │
│                          │
│ [4] Montage              │
│ [5] Normering            │
│  ├─ Sandwichpanelen      │
│  ├─ Betonnen Plint       │
│  └─ Metalen Panel        │
│                          │
│ [6] BIM & Trimble        │
│ [7] Levering             │
│ [8] Prijs & Toeslagen    │
│ [9] Financieel           │
│ [10] Wettelijk           │
│ [11] Uitsluitingen       │
│ [12] Offerte Vereisten   │
│ [13] Bijlagen            │
│                          │
│ [+ Product toevoegen]    │  ← add another product mid-edit
│ [− Product verwijderen]  │  ← remove a product
└──────────────────────────┘
```

### Adding/removing products mid-edit
- [+ Product toevoegen] button at bottom of left panel → opens category picker
- New product's blocks are added to the chapter structure
- [− Product verwijderen] — right-click or × on a product header → removes with confirmation
- Shared chapters automatically update (pricing items, exclusions, required docs merge from all active products)

### Word export for multi-product
- Single document with all products
- Chapter 2 has sub-sections (2A, 2B, 2C) per product
- Chapter 3 has sub-sections per product
- Pricing chapter merges all product price items
- Exclusions chapter merges all product exclusions
- One set of shared chapters (not repeated per product)

### Data structure for multi-product state

```json
{
  "entity": "stp",
  "products": [
    {
      "categoryId": "concrete_sandwich_panel",
      "label": "Betonnen Sandwichpanelen",
      "state": {
        "selected": ["b2_sandwich", "b2_cutouts", "b2_surcharges"],
        "vals": { "b2_sandwich": { "panelType": "SAFESI 25", ... } },
        "supVars": {},
        "removedVars": {},
        "altVars": {},
        "editedTexts": {},
        "specOrder": {}
      }
    },
    {
      "categoryId": "concrete_plinth",
      "label": "Betonnen Plint",
      "state": { ... }
    },
    {
      "categoryId": "metal_sandwich_panel",
      "label": "Metalen Sandwichpaneel",
      "state": { ... }
    }
  ],
  "sharedState": {
    "ch_inleiding": { "vals": { "supplierName": "NV Schelfhout", ... } },
    "ch_levering": { "vals": { ... } },
    "ch_prijs": { "vals": { ... } },
    "ch_financieel": { "vals": { ... } },
    "ch_montage": { "enabled": false },
    "ch_bim": { "enabled": true },
    "chapterOrder": ["ch_inleiding", "ch_scope", "ch_technisch", ...]
  }
}
```

### Important design decisions
- Each product maintains its OWN spec values, selections, edits — completely independent
- Shared chapters are shared — one set of values for the entire RFQ
- When switching between products in the editor, the middle panel shows that product's blocks
- The preview (right panel) always shows the FULL combined document
- JSON export contains the full multi-product state
- Presets (Feature 1) work per product — you can load "STM Standaard — Wandbeplating" for the wall panel product and "STM Standaard — Dakbeplating" for the roof panel product within the same RFQ
- localStorage key for multi-product: `rfq-multi-{entity}-{timestamp}` (since it's not tied to one category anymore)

### Single product is just multi-product with 1 item
The single-product flow still works — it's just a multi-product RFQ with one product selected. The UI adapts: if only one product, the sub-section labels (2A, 2B) are hidden and it looks like v1.

---

## IMPLEMENTATION ORDER

1. **Feature 2 first (multi-product)** — this is architectural, changes how the whole app works
2. **Feature 1 second (presets)** — this layers on top of the multi-product structure

### Checkpoints for these features:

#### CP-A: Multi-product data model
```
□ Refactor state from single-category to products[] array
□ Shared state separate from per-product state
□ Update localStorage to handle multi-product
□ Update mergeChapters to combine product-specific chapters
□ Verify: existing single-product flow still works
□ git commit "multi-product: data model"
```

#### CP-B: Multi-product selection UI
```
□ Change Step 2 from single dropdown to multi-select checklist
□ Grouped by PG with checkboxes
□ "Geselecteerd: N producten" counter
□ Start button enabled when ≥1 selected
□ git commit "multi-product: selection UI"
```

#### CP-C: Multi-product editor — left panel
```
□ Product sub-sections under chapter headers
□ Click product → loads its blocks in middle panel
□ [+ Product toevoegen] button
□ [− Product verwijderen] with confirmation
□ Active product highlighted
□ git commit "multi-product: left panel navigation"
```

#### CP-D: Multi-product editor — middle + preview
```
□ Middle panel shows active product's blocks when product chapter selected
□ Middle panel shows shared chapter when shared chapter selected
□ Preview renders full combined document with sub-sections
□ Sub-section numbering: 2A, 2B, 2C (hidden if single product)
□ Pricing/exclusions/offerte merge from all products
□ git commit "multi-product: editor + preview"
```

#### CP-E: Multi-product Word export
```
□ Single document with all products
□ Sub-sections per product in scope/specs/standards chapters
□ Merged pricing, exclusions, required docs
□ git commit "multi-product: word export"
```

#### CP-F: Default spec presets
```
□ "Standaard opslaan" button + dialog (name input)
□ "Standaard laden ▾" dropdown per product
□ Presets stored per category in localStorage
□ Preset only saves spec values (not text edits, not selections)
□ Export/import presets as JSON
□ Delete preset with confirmation
□ git commit "presets: save load export import"
```

#### CP-G: Test + deploy
```
□ Test: create multi-product RFQ (3 products)
□ Test: save preset, reload, load preset
□ Test: Word export with multiple products
□ Test: JSON export/import with multiple products
□ npm run deploy
□ git commit "multi-product + presets: deployed"
```
