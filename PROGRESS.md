# RFQ Text Block Editor v2 — Build Progress

## Checkpoints

- [x] CP-1: Scaffold v2 Vite project + dependencies + folder structure
- [x] CP-2: Entity configuration (entities.json) + data layer (categoryRegistry, colors, storage)
- [x] CP-3: Auth (MSAL — copied + translated from v1)
- [x] CP-4: Dutch master shared chapters (13 chapters, all Dutch)
- [x] CP-5: Merge logic (mergeChapters.js — entity-aware, montage/BIM toggles)
- [x] CP-6: Validation utilities
- [x] CP-7: PG03 category JSON (Dutch)
- [x] CP-8: PG04 category JSONs — 4 files (Dutch)
- [x] CP-9: PG05 category JSONs — 5 files (Dutch)
- [x] CP-10: PG07 category JSONs — 3 files (Dutch)
- [x] CP-11: PG08 category JSONs — 7 files (Dutch)
- [x] CP-12: PG09 category JSONs — 2 files (Dutch)
- [x] CP-13: PG10 category JSONs — 2 files (Dutch)
- [x] CP-14: Entity selection screen (Stap 1 + Stap 2)
- [x] CP-15: TopBar (entity badge, category dropdown, all Dutch buttons)
- [x] CP-16: LeftPanel (drag-reorderable chapters, block checkboxes, montage/BIM toggles)
- [x] CP-17: MiddlePanel (protected variable badges, contenteditable editor)
- [x] CP-18: SpecGrid (drag-reorderable spec cards, delegate/alt toggles)
- [x] CP-19: AddCustomSpec (inline form, Dutch labels)
- [x] CP-20: RFQPreview (live preview, variable pills, chapter headings #C52F05)
- [x] CP-21: Undo/Redo (50-step, debounced 300ms, Ctrl+Z/Y)
- [x] CP-22: Preset infrastructure (storage helpers — save/load/delete)
- [x] CP-23: JSON export/import
- [x] CP-24: Word export (HTML .doc, entity-aware, German compliance appendix)
- [x] CP-25: Freeze/review status
- [x] CP-26: State management hook (useCategoryData — full feature set)
- [x] CP-27: Main App (3-column resizable layout, keyboard shortcuts)
- [x] CP-28: Build verification — all 24 categories valid, Vite build passes

- [x] CP-F6: Multi-product RFQ (entity selector multi-select, product sections, left panel products, preview, export)
- [x] CP-F7: Default spec presets (save/load/delete, export/import, per-category localStorage)
- [x] CP-W1–W4: JSZip-based .docx export with entity templates + appendix image embedding
- [x] CP-F1: Fix Word export — remove excessive spacing, duplicate closing, duplicate bijlagen, blank appendix pages, auto-renumber chapters, fix toggleBlock vars (bankgarantie/verzekeringen/retentie)
- [x] CP-F2: Master chapter override — "Hoofdstukken beheren" modal, edit master texts, localStorage persistence, integrated into mergeChapters
- [x] CP-F3: Contract type system — Design/Supply/Build checkboxes, payment terms adapt per type, montage auto-enables on Build, shown in export header
- [x] CP-F4: Auto-save — 2s debounced auto-save, "Opgeslagen" flash indicator, JSON export/import moved to settings dropdown
- [x] CP-F5: Revised chapter structure — 11 chapters, split Inleiding into RFQ Info + Projectinleiding, merge Prijs+Wettelijk into Commerciële Voorwaarden, Uitsluitingen into scope, rename Levering→Planning
- [x] CP-F6: Multi-product RFQ (completed earlier)
- [x] CP-F7: Default spec presets (completed earlier)
- [x] CP-F8: In-app help system — "?" button, slide-in panel (Snelstart/Functies/Sneltoetsen/FAQ), first-time welcome overlay

## Build Status
- **Vite build**: PASS (845 kB, 218 modules)
- **Category JSONs**: 24/24 valid
- **All text**: Dutch (NL)
- **Entities**: 4 (STP, D&B BV, D&B GmbH, STM Group)
- **Chapters**: 13 (drag-reorderable)
