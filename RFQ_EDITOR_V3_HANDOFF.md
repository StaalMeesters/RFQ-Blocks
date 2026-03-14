# STM Group — RFQ Editor v3 — Handoff Prompt

## CONTEXT

I am Ashkan (ak@staalmeesters.com), sole developer at STM Group (Staalmeesters), a Dutch steel construction company. I am building an internal RFQ (Request for Quotation) tool.

**Current state:**
- RFQ Editor v2 is LIVE at `https://staalmeesters.github.io/RFQ-Blocks/`
- Repo: `staalmeesters/RFQ-Blocks`
- v2 is a single `index.html` (React from CDN, no build step) with 20 product categories, editor mode only, localStorage persistence, Word export

**STM Brand:**
- Fonts: HK Grotesk (body), DP Bagoss (headings)
- Colors: `#242A35` navy, `#FE5000` orange, `#AB440A` terra, `#AEC4ED` steel blue, `#FFFFFF` white

---

## STEP 0 — TAG v2 FIRST, BEFORE TOUCHING ANYTHING

```bash
git add -A
git commit -m "chore: freeze v2 editor-only release"
git tag v2.0-editor-only
git push origin main --tags
```

Do this first. Do not proceed until the tag is pushed.

---

## WHAT v3 MUST BUILD

v3 is the **management demo**. Full system, static JSON data (no live DB, no AI). Must look and behave like the real final product.

### Two modes in the same app

| | Editor Mode | Generator Mode |
|---|---|---|
| **Who** | René, Floris, Bob, Jan (reviewers) | C. Harink, J. Bos (work preparators) |
| **Purpose** | Review / approve / edit text blocks | Create actual RFQ documents |
| **Specs** | Default values shown as examples | Required fields — must be filled |
| **Text blocks** | Editable, drag-reorder | Frozen (read-only) |
| **Validation** | None | Strict — cannot export until all required fields filled |
| **Audit trail** | YES | No |

Toggle in top bar: `[ ✏ Editor ] [ 📄 Generator ]`

---

## STATIC DATA FILES

Create a `public/data/` folder. Parse these from the project CSV files (semicolon-delimited):

### suppliers.json
Source: `SUppliers.csv` (~4900 rows)
Columns: `id; name; businesstype; address; postal_code; city; country_code; phone; email; website`
Country codes: `60`=NL, `50`=BE, `40`=DE. Map to ISO.

### contacts.json
Source: `Contacts_per_Suppliers.csv` (~6000 rows)
Columns: `supplier_name; supplier_id; first_name; last_name; email; mobile; phone; role`
Group contacts by `supplier_id` as an array.

### projects.json
Source: `Projects.csv` (~5700 rows)
Columns: `project_ref; project_name; address; postal_code; city; country; date`
Only include rows where `project_ref` starts with `STP`, `STPR`, or `STW`.
Filter out internal/inventory entries.

### supplier-catalog.json
Smart Supplier Mode data. Hardcode the following suppliers with their known products. Structure:

```json
{
  "Schelfhout NV": {
    "pg": "PG05",
    "products": [
      {
        "id": "sansi25",
        "name_nl": "SANSI 25 Sandwichpanelen",
        "name_en": "SANSI 25 Concrete Sandwich Panels",
        "category": "concrete_panels",
        "unit": "m²",
        "price_range": { "min": 83.63, "max": 89.50 },
        "quote_count": 4,
        "frequency": "always"
      }
    ],
    "package_always": ["panels", "anchors_frimeda", "dagkanten", "transport"],
    "package_sometimes": ["uitsparingen", "plinths"],
    "delivery_terms": "EXW Kinrooi, België",
    "typical_lead_time": "8-10 weken"
  }
}
```

`frequency`: `"always"` = ≥80% of quotes, `"often"` = 50–79%, `"sometimes"` = <50%

Include minimum:
- Schelfhout NV (SANSI 25/30, PABE, PLIBE + anchors + dagkanten + transport)
- Novoferm Nederland B.V. / Novoferm Verladetechnik (THERMO 40 doors, dock levellers, shelters)
- Cladding Point BV / SAB-profiel B.V. (sandwich panels, profiled sheeting)
- HD Daksystemen B.V. (PIR roofing, fall protection)
- HUISKAMP Enschede / Grondverzetbedrijf Oosterveld BV (excavation, sewerage, paving)
- Brinkers Montage B.V. (panel montage, steel assembly)
- Ploeg Montage B.V. (steel erection €0.25/kg, panel montage €300/st, gietmortel, pur, equipment hire, travel costs)
- Loohuis Installatietechnieken B.V. (electrical installations)

---

## GENERATOR MODE — 5-STEP WIZARD

Full-screen wizard, activated from "Nieuwe Offerte Aanvragen" button.

### Step 1: Project & Entiteit
- Project search autocomplete from projects.json (shows ref + name + city)
- Entity: Staalmeesters Projects BV / D&B Construct BV / D&B Construct GmbH / STM Group
- Document language: Nederlands / English / Deutsch
- Project + entity REQUIRED to proceed

### Step 2: Leverancier
- Supplier search autocomplete from suppliers.json
- "Nieuwe leverancier" option for unknown suppliers
- When selected → contact person dropdown from contacts.json
- Check supplier-catalog.json → Smart Mode if found, Generic Mode if not

### Step 3: Producten & Diensten

**Smart Mode** (supplier in catalog):
- Checklist of known products grouped by frequency
- `always` → checked by default
- `often` → checked by default, amber badge "Meestal inbegrepen"
- `sometimes` → unchecked, shown as suggestions
- Package warning if `always` item is unchecked: orange warning banner
- "+ Voeg product toe" for custom additions

**Generic Mode** (supplier not in catalog):
- Product category selector based on PG groups
- Manual product/service entry

### Step 4: Specificaties
- Spec fields per selected product
- 🔴 Required — blocks export
- 🟡 Recommended — warning only
- ⚪ Optional
- "Leverancier specificeren" delegate button per field → blue italic in preview

### Step 5: Controle & Export
- Full document preview (3-column layout like editor)
- Red pills for missing required fields — cannot export until resolved
- Export → Word .doc STM branded
- "Opslaan als concept" → localStorage

Progress bar steps 1–5 at top. Back button always works.

---

## EDITOR MODE — ADDITIONS OVER v2

Keep all existing v2 functionality PLUS:

### Audit Trail
Every change logged per block:
```
[14 mrt 14:23] Ashkan — Regel toegevoegd: "De leverancier dient VCA** gecertificeerd te zijn"
[14 mrt 14:25] René — Tekst gewijzigd: "specificatie" → "technische specificatie"
```
- Stored in localStorage per block
- "Geschiedenis" button per block → side panel with full log
- User identity: "Wie ben jij?" prompt on first use, stored in localStorage
- Track: text edits, spec add/remove, spec value changes, block toggle on/off

### Other improvements
- Drag-reorder chapters and specs (fully working)
- "Alles opslaan" → exports full state as JSON file
- "Importeer JSON" → loads previously saved state

---

## CROSS-PG SUPPLIER SUPPORT

Some suppliers work across multiple product categories:
- Ploeg Montage → steel erection (PG06) + panel montage (PG08) + foundation grouting
- Brinkers → panel montage + steel zetwerk
- Oosterveld → excavation + sewerage + paving

In Step 3, show ALL their services across categories — do NOT restrict to one PG. RFQ assembles text blocks from multiple chapters automatically.

---

## DEPLOYMENT

```bash
git add -A
git commit -m "feat: v3 full system with generator mode"
git tag v3.0-full-system
git push origin main --tags
```

GitHub Pages auto-deploys from main. URL stays `https://staalmeesters.github.io/RFQ-Blocks/`

---

## CRITICAL RULES — NEVER BREAK THESE

- STM is ALWAYS the buyer. Text protects STM's interests, never the supplier's.
- "De Leverancier ZAL..." / "The Supplier SHALL..." — never "Please provide"
- "Meerwerk niet opgegeven wordt geacht inbegrepen te zijn" — mandatory every Ch.5
- "STM behoudt het recht niet-conforme alternatieven af te wijzen" — mandatory every Ch.2
- Single `index.html` — React from CDN, no build step, no npm
- localStorage keys unique per category — no state collisions
- No login screens, no over-engineering
- Show one working step before building all 5

---

## KEY PEOPLE

- Ashkan (ak@staalmeesters.com) — developer, Final Approver
- René Bos (rb@staalmeesters.com) — senior approver
- C. Harink, J. Bos — work preparators (generator mode users)
- Floris, Marek, Bob, Jan Barelds — review team (editor mode users)
