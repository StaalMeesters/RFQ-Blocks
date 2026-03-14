# RFQ Text Block Editor v2/v3 — Build Progress

## v2 Checkpoints

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
- [x] CP-F1–F9: Full feature set (multi-product, presets, contract types, master chapters, auto-save, help, JSZip Word export)

## v3 Checkpoints

- [x] CP-V3-BUG1: Fix chapter drag-reorder stale closure (useRef for chapterOrder)
- [x] CP-V3-BUG2: Fix blank pages between appendix images (page break only before first image)
- [x] CP-V3-1: Supplier catalog data (12 suppliers, cross-PG support, package_always/sometimes, price ranges)
- [x] CP-V3-2: Audit trail system (audit.js — push/load entries, per-block localStorage, user identity)
- [x] CP-V3-3: Generator Mode — 5-step wizard (Project, Leverancier, Producten, Specificaties, Controle & Export)
- [x] CP-V3-4: Smart Supplier Mode — autocomplete, supplier badge, product frequency grouping, package warnings
- [x] CP-V3-5: Editor/Generator mode toggle — EntitySelector dual buttons, TopBar mode switch
- [x] CP-V3-6: Audit trail UI — AuditPanel slide-in, LastEditBadge inline, Geschiedenis button per block
- [x] CP-V3-7: Draft save/load for Generator mode (localStorage concept persistence)
- [x] CP-V3-8: Build verification — 224 modules, Vite build passes

## Build Status
- **Vite build**: PASS (905 kB, 224 modules)
- **Category JSONs**: 24/24 valid
- **All text**: Dutch (NL)
- **Entities**: 4 (STP, D&B BV, D&B GmbH, STM Group)
- **Suppliers**: 12 (cross-PG, package intelligence)
- **Chapters**: 11 (revised structure, drag-reorderable)
- **Modes**: Editor + Generator (5-step wizard)
- **Features**: Multi-product, presets, contract types, master chapters, auto-save, help system, JSZip Word export, audit trail, smart supplier, generator wizard
