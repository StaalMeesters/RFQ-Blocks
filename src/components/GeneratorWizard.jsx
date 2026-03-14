import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { C } from '../utils/colors.js';
import entities from '../data/entities.json';
import supplierCatalog from '../data/supplier-catalog.json';
import { CATEGORY_LIST, CATEGORY_DATA, PG_GROUPS, DEFAULT_CHAPTER_ORDER } from '../data/categoryRegistry.js';
import { mergeMultiProductChapters, orderChapters } from '../utils/mergeChapters.js';
import { exportWord } from '../utils/exportWord.js';
import RFQPreview from './RFQPreview.jsx';

const STEPS = [
  { id: 1, label: 'Project & Entiteit' },
  { id: 2, label: 'Leverancier' },
  { id: 3, label: 'Producten & Diensten' },
  { id: 4, label: 'Specificaties' },
  { id: 5, label: 'Controle & Export' },
];

const entityList = [
  { id: 'stp', ...entities.stp },
  { id: 'db_bv', ...entities.db_bv },
  { id: 'db_gmbh', ...entities.db_gmbh },
  { id: 'stm_group', ...entities.stm_group },
];

const DRAFT_KEY = 'rfq_v2_generator_draft';

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(state) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch (e) { console.error('Draft save failed:', e); }
}

export default function GeneratorWizard({ onBack }) {
  const [step, setStep] = useState(1);

  // Step 1
  const [projectRef, setProjectRef] = useState('');
  const [projectName, setProjectName] = useState('');
  const [siteCity, setSiteCity] = useState('');
  const [entityId, setEntityId] = useState('');
  const [contractType, setContractType] = useState({ design: false, supply: true, build: false });

  // Step 2
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');

  // Step 3
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [showPackageWarnings, setShowPackageWarnings] = useState([]);

  // Step 4
  const [specVals, setSpecVals] = useState({}); // { [categoryId]: { [varId]: value } }
  const [delegatedVars, setDelegatedVars] = useState(new Set());

  // Supplier match — search name and aliases (aliases may be absent)
  const matchedSupplier = useMemo(() => {
    if (!supplierName.trim()) return null;
    const lower = supplierName.toLowerCase().trim();
    return supplierCatalog.suppliers.find(s =>
      s.name.toLowerCase().includes(lower) ||
      (s.aliases || []).some(a => a.toLowerCase().includes(lower))
    );
  }, [supplierName]);

  // Supplier suggestions for autocomplete — search name + aliases
  const supplierSuggestions = useMemo(() => {
    if (!supplierSearch.trim() || supplierSearch.length < 2) return [];
    const lower = supplierSearch.toLowerCase();
    return supplierCatalog.suppliers.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      (s.aliases || []).some(a => a.toLowerCase().includes(lower))
    ).slice(0, 8);
  }, [supplierSearch]);

  // Supplier products grouped by frequency
  const supplierProducts = useMemo(() => {
    if (!matchedSupplier) return { always: [], often: [], sometimes: [] };
    const always = matchedSupplier.products.filter(p => p.frequency === 'always');
    const often = matchedSupplier.products.filter(p => p.frequency === 'often');
    const sometimes = matchedSupplier.products.filter(p => p.frequency === 'sometimes');
    return { always, often, sometimes };
  }, [matchedSupplier]);

  // Package warnings
  useEffect(() => {
    if (!matchedSupplier) { setShowPackageWarnings([]); return; }
    const warnings = [];
    for (const pid of matchedSupplier.package_always || []) {
      const prod = matchedSupplier.products.find(p => p.id === pid);
      if (prod && prod.category && !selectedCategories.has(prod.category)) {
        warnings.push(prod.name_nl);
      }
    }
    setShowPackageWarnings(warnings);
  }, [matchedSupplier, selectedCategories]);

  // Build chapters for preview (Step 5)
  const products = useMemo(() => {
    return [...selectedCategories].map(catId => {
      const catInfo = CATEGORY_LIST.find(c => c.id === catId);
      return { categoryId: catId, label: catInfo?.scope || catId };
    });
  }, [selectedCategories]);

  const productMergeData = useMemo(() => {
    return products.map(p => ({
      catJson: CATEGORY_DATA[p.categoryId],
      categoryId: p.categoryId,
      label: p.label,
    })).filter(p => p.catJson);
  }, [products]);

  const montageEnabled = contractType.build;
  const bimEnabled = products.some(p => {
    const ci = CATEGORY_LIST.find(c => c.id === p.categoryId);
    return ci?.defaultBIM;
  });

  const chapterMap = useMemo(() => {
    if (productMergeData.length === 0) return {};
    return mergeMultiProductChapters(productMergeData, entityId || 'stp', {
      montageEnabled, bimEnabled, contractType,
    });
  }, [productMergeData, entityId, montageEnabled, bimEnabled, contractType]);

  const chapters = useMemo(
    () => orderChapters(chapterMap, DEFAULT_CHAPTER_ORDER),
    [chapterMap]
  );

  // Build shared vals from wizard inputs
  const sharedVals = useMemo(() => ({
    leverancierNaam: supplierName || '[Leverancier]',
    projectNaam: projectName || '[Projectnaam]',
    projectReferentie: projectRef || '[Referentie]',
    stmContact: '',
    stmFunctie: 'Inkoper',
    locatie: siteCity || '[Locatie]',
  }), [supplierName, projectName, projectRef, siteCity]);

  // Build selected blocks (all defaultOn blocks)
  const selectedBlocks = useMemo(() => {
    const set = new Set();
    for (const ch of Object.values(chapterMap)) {
      if (ch.blocks) for (const b of ch.blocks) { if (b.defaultOn) set.add(b.id); }
      if (ch.productSections) {
        for (const sec of ch.productSections) {
          for (const b of sec.blocks) { if (b.defaultOn) set.add(b.id); }
        }
      }
    }
    return set;
  }, [chapterMap]);

  // Collect all spec variables for step 4
  const allSpecVars = useMemo(() => {
    const vars = [];
    for (const ch of chapters) {
      if (ch.productSections) {
        for (const sec of ch.productSections) {
          for (const block of sec.blocks) {
            if (!block.variables) continue;
            for (const v of block.variables) {
              vars.push({
                ...v,
                categoryId: sec.categoryId,
                categoryLabel: sec.label,
                blockId: block.id,
                blockLabel: block.label,
              });
            }
          }
        }
      }
    }
    return vars;
  }, [chapters]);

  // Count filled vs total required specs
  const specProgress = useMemo(() => {
    let total = 0;
    let filled = 0;
    for (const v of allSpecVars) {
      if (v.source === 'category' || v.source === 'entity') continue; // auto-filled
      total++;
      const val = specVals[v.categoryId]?.[v.id] || v.default || '';
      if (val && val !== '[' + v.label + ']') filled++;
    }
    return { total, filled };
  }, [allSpecVars, specVals]);

  // Validation per step
  const canProceed = (s) => {
    switch (s) {
      case 1: return projectRef.trim() && projectName.trim() && siteCity.trim() && entityId;
      case 2: return supplierName.trim() && supplierContact.trim();
      case 3: return selectedCategories.size > 0;
      case 4: return true; // can proceed but export may be blocked
      default: return true;
    }
  };

  // Missing required fields for Step 5 validation
  const missingRequired = useMemo(() => {
    const missing = [];
    for (const v of allSpecVars) {
      if (v.source === 'category' || v.source === 'entity') continue;
      const val = specVals[v.categoryId]?.[v.id] || v.default || '';
      if (!val || val.startsWith('[')) {
        missing.push({ label: v.label, category: v.categoryLabel });
      }
    }
    return missing;
  }, [allSpecVars, specVals]);

  const handleExport = async () => {
    const getValsForProduct = (productIndex) => {
      const catId = products[productIndex]?.categoryId;
      return catId ? (specVals[catId] || {}) : {};
    };
    const getRemovedVarsForProduct = () => new Set();
    const getAltVarsForProduct = () => new Set();
    const getAltProductForProduct = () => false;

    await exportWord({
      chapters,
      selectedBlocks,
      sharedVals,
      editedTexts: {},
      delBlocks: delegatedVars,
      entityId,
      products,
      catMetas: products.map(p => CATEGORY_DATA[p.categoryId]?._meta).filter(Boolean),
      contractType,
      getValsForProduct,
      getRemovedVarsForProduct,
      getAltVarsForProduct,
      getAltProductForProduct,
    });
  };

  const handleSaveDraft = () => {
    saveDraft({
      step, projectRef, projectName, siteCity, entityId, contractType,
      supplierName, supplierContact,
      selectedCategories: [...selectedCategories],
      specVals, delegatedVars: [...delegatedVars],
      savedAt: new Date().toISOString(),
    });
    alert('Concept opgeslagen!');
  };

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && confirm('Er is een opgeslagen concept gevonden. Wilt u dit laden?')) {
      setStep(draft.step || 1);
      setProjectRef(draft.projectRef || '');
      setProjectName(draft.projectName || '');
      setSiteCity(draft.siteCity || '');
      setEntityId(draft.entityId || '');
      if (draft.contractType) setContractType(draft.contractType);
      setSupplierName(draft.supplierName || '');
      setSupplierContact(draft.supplierContact || '');
      if (draft.selectedCategories) setSelectedCategories(new Set(draft.selectedCategories));
      if (draft.specVals) setSpecVals(draft.specVals);
      if (draft.delegatedVars) setDelegatedVars(new Set(draft.delegatedVars));
    }
  }, []);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: C.lt,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 24px', background: C.dk, color: C.wh,
      }}>
        <span style={{ color: C.o, fontWeight: 700, fontSize: 16 }}>STM</span>
        <span style={{ fontWeight: 300, fontSize: 13 }}>RFQ Generator</span>
        <div style={{ flex: 1 }} />
        <button onClick={handleSaveDraft} style={{
          padding: '5px 14px', background: 'transparent', border: `1px solid ${C.dk2}`,
          borderRadius: 4, fontSize: 11, color: C.wh, cursor: 'pointer',
        }}>Opslaan als concept</button>
        <button onClick={onBack} style={{
          padding: '5px 14px', background: 'transparent', border: `1px solid ${C.dk2}`,
          borderRadius: 4, fontSize: 11, color: '#ccc', cursor: 'pointer',
        }}>Terug</button>
      </div>

      {/* Progress bar */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${C.bor}`, background: C.wh,
      }}>
        {STEPS.map(s => (
          <div key={s.id} style={{
            flex: 1, padding: '12px 16px', textAlign: 'center',
            borderBottom: step === s.id ? `3px solid ${C.o}` : '3px solid transparent',
            background: step === s.id ? '#FFF5F2' : s.id < step ? '#F0FFF4' : 'transparent',
            cursor: s.id < step ? 'pointer' : 'default',
            opacity: s.id > step ? 0.5 : 1,
          }} onClick={() => { if (s.id < step) setStep(s.id); }}>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: step === s.id ? C.o : s.id < step ? C.gr : C.txtL,
            }}>
              {s.id < step ? '\u2713' : ''} Stap {s.id}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.dk, marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%', maxWidth: step === 5 ? 1200 : 680,
          padding: '32px 24px',
        }}>
          {step === 1 && (
            <Step1Project
              projectRef={projectRef} setProjectRef={setProjectRef}
              projectName={projectName} setProjectName={setProjectName}
              siteCity={siteCity} setSiteCity={setSiteCity}
              entityId={entityId} setEntityId={setEntityId}
              contractType={contractType} setContractType={setContractType}
            />
          )}
          {step === 2 && (
            <Step2Supplier
              supplierName={supplierName} setSupplierName={setSupplierName}
              supplierContact={supplierContact} setSupplierContact={setSupplierContact}
              supplierSearch={supplierSearch} setSupplierSearch={setSupplierSearch}
              supplierSuggestions={supplierSuggestions}
              matchedSupplier={matchedSupplier}
            />
          )}
          {step === 3 && (
            <Step3Products
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              matchedSupplier={matchedSupplier}
              supplierProducts={supplierProducts}
              showPackageWarnings={showPackageWarnings}
            />
          )}
          {step === 4 && (
            <Step4Specs
              allSpecVars={allSpecVars}
              specVals={specVals}
              setSpecVals={setSpecVals}
              delegatedVars={delegatedVars}
              setDelegatedVars={setDelegatedVars}
              specProgress={specProgress}
            />
          )}
          {step === 5 && (
            <Step5Review
              projectRef={projectRef}
              projectName={projectName}
              siteCity={siteCity}
              entityId={entityId}
              supplierName={supplierName}
              supplierContact={supplierContact}
              products={products}
              contractType={contractType}
              specProgress={specProgress}
              missingRequired={missingRequired}
              chapters={chapters}
              selectedBlocks={selectedBlocks}
              sharedVals={sharedVals}
              onExport={handleExport}
              onSaveDraft={handleSaveDraft}
              chapterMap={chapterMap}
              specVals={specVals}
            />
          )}
        </div>
      </div>

      {/* Bottom nav */}
      {step < 5 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px', borderTop: `1px solid ${C.bor}`, background: C.wh,
        }}>
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            style={{
              padding: '10px 24px', background: 'transparent',
              border: `1px solid ${step === 1 ? C.bor : C.dk}`,
              borderRadius: 6, fontSize: 14, fontWeight: 500,
              color: step === 1 ? C.txtL : C.dk, cursor: step === 1 ? 'default' : 'pointer',
            }}
          >
            Vorige
          </button>
          <button
            onClick={() => { if (canProceed(step)) setStep(s => s + 1); }}
            disabled={!canProceed(step)}
            style={{
              padding: '10px 32px',
              background: canProceed(step) ? C.o : C.bor,
              color: C.wh, border: 'none', borderRadius: 6,
              fontSize: 14, fontWeight: 600,
              cursor: canProceed(step) ? 'pointer' : 'default',
            }}
          >
            Volgende \u2192
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 1: Project & Entity ──

function Step1Project({
  projectRef, setProjectRef, projectName, setProjectName,
  siteCity, setSiteCity, entityId, setEntityId,
  contractType, setContractType,
}) {
  const inputStyle = {
    width: '100%', padding: '10px 14px', border: `1px solid ${C.bor}`,
    borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, color: C.dk, margin: '0 0 24px' }}>Project & Entiteit</h2>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.dk, display: 'block', marginBottom: 6 }}>
          Projectreferentie *
        </label>
        <input
          value={projectRef} onChange={e => setProjectRef(e.target.value)}
          placeholder="bijv. STP24002"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.dk, display: 'block', marginBottom: 6 }}>
          Projectnaam *
        </label>
        <input
          value={projectName} onChange={e => setProjectName(e.target.value)}
          placeholder="bijv. Bedrijfsverzamelgebouw Enschede"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.dk, display: 'block', marginBottom: 6 }}>
          Locatie (stad) *
        </label>
        <input
          value={siteCity} onChange={e => setSiteCity(e.target.value)}
          placeholder="bijv. Enschede"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.dk, display: 'block', marginBottom: 8 }}>
          STM Entiteit *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entityList.map(ent => (
            <label key={ent.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8,
              border: `2px solid ${entityId === ent.id ? C.o : C.bor}`,
              background: entityId === ent.id ? '#FFF5F2' : C.wh,
              cursor: 'pointer',
            }}>
              <input type="radio" name="entity" value={ent.id}
                checked={entityId === ent.id}
                onChange={() => setEntityId(ent.id)}
                style={{ accentColor: C.o }}
              />
              <span style={{ fontSize: 14, fontWeight: 500, color: C.dk, flex: 1 }}>{ent.name}</span>
              <span style={{
                fontSize: 11, fontWeight: 600, color: C.wh,
                background: ent.country === 'DE' ? C.dk2 : C.o,
                padding: '2px 8px', borderRadius: 4,
              }}>{ent.country}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.dk, display: 'block', marginBottom: 8 }}>
          Contracttype
        </label>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { key: 'design', label: 'Design' },
            { key: 'supply', label: 'Supply' },
            { key: 'build', label: 'Build' },
          ].map(ct => (
            <label key={ct.key} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8,
              border: `2px solid ${contractType[ct.key] ? C.o : C.bor}`,
              background: contractType[ct.key] ? '#FFF5F2' : C.wh,
              cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}>
              <input type="checkbox"
                checked={contractType[ct.key]}
                onChange={e => setContractType(prev => ({ ...prev, [ct.key]: e.target.checked }))}
                style={{ accentColor: C.o, width: 16, height: 16 }}
              />
              {ct.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Supplier ──

function Step2Supplier({
  supplierName, setSupplierName, supplierContact, setSupplierContact,
  supplierSearch, setSupplierSearch, supplierSuggestions, matchedSupplier,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: `1px solid ${C.bor}`,
    borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, color: C.dk, margin: '0 0 24px' }}>Leverancier</h2>

      <div style={{ marginBottom: 20, position: 'relative' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.dk, display: 'block', marginBottom: 6 }}>
          Leveranciersnaam *
        </label>
        <input
          value={supplierName}
          onChange={e => {
            setSupplierName(e.target.value);
            setSupplierSearch(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Typ leveranciersnaam..."
          style={inputStyle}
        />
        {/* Autocomplete dropdown */}
        {showSuggestions && supplierSuggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: C.wh, border: `1px solid ${C.bor}`, borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden',
          }}>
            {supplierSuggestions.map(s => (
              <div key={s.name}
                onMouseDown={() => {
                  setSupplierName(s.name);
                  setSupplierSearch('');
                  setShowSuggestions(false);
                }}
                style={{
                  padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                  borderBottom: `1px solid ${C.bor}`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FFF5F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 600, color: C.dk }}>{s.name}</div>
                <div style={{ fontSize: 11, color: C.txtL }}>
                  {s.country} {s.primary_pg ? `- ${s.primary_pg}` : ''} - {s.products?.length || 0} producten
                  {s.quotations ? ` - ${s.quotations} offertes` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supplier match badge */}
      {matchedSupplier && (
        <div style={{
          padding: '12px 16px', background: '#F0FFF4', border: `1px solid ${C.gr}`,
          borderRadius: 8, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>{'\u2713'}</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.dk }}>
              Leveranciersinformatie beschikbaar
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.txtL, marginBottom: 4 }}>
            {matchedSupplier.country}
            {matchedSupplier.primary_pg ? ` \u2014 ${matchedSupplier.primary_pg}` : ''}
            {matchedSupplier.quotations ? ` \u2014 ${matchedSupplier.quotations} offertes, ${matchedSupplier.total_items || 0} items` : ''}
          </div>
          {matchedSupplier.standards && matchedSupplier.standards.length > 0 && (
            <div style={{ fontSize: 11, color: C.bl, marginBottom: 4 }}>
              Normen: {matchedSupplier.standards.slice(0, 3).join(', ')}
              {matchedSupplier.standards.length > 3 ? ` (+${matchedSupplier.standards.length - 3})` : ''}
            </div>
          )}
          {matchedSupplier.typical_exclusions && matchedSupplier.typical_exclusions.length > 0 && (
            <div style={{ fontSize: 11, color: C.amber }}>
              Typische uitsluitingen: {matchedSupplier.typical_exclusions.slice(0, 3).join(', ')}
              {matchedSupplier.typical_exclusions.length > 3 ? ` (+${matchedSupplier.typical_exclusions.length - 3})` : ''}
            </div>
          )}
          {matchedSupplier.warning && (
            <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>
              Let op: {matchedSupplier.warning}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.dk, display: 'block', marginBottom: 6 }}>
          Contactpersoon leverancier *
        </label>
        <input
          value={supplierContact} onChange={e => setSupplierContact(e.target.value)}
          placeholder="Naam van contactpersoon"
          style={inputStyle}
        />
      </div>

      {matchedSupplier && (matchedSupplier.delivery_terms || matchedSupplier.typical_conditions?.length > 0) && (
        <div style={{
          padding: '12px 16px', background: C.lt, borderRadius: 8,
          fontSize: 12, color: C.txt,
        }}>
          {matchedSupplier.delivery_terms && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Leveringsvoorwaarden</div>
              <div style={{ marginBottom: 8 }}>{matchedSupplier.delivery_terms}</div>
            </>
          )}
          {matchedSupplier.typical_conditions && matchedSupplier.typical_conditions.length > 0 && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Typische voorwaarden</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {matchedSupplier.typical_conditions.slice(0, 5).map((c, i) => (
                  <li key={i} style={{ marginBottom: 2, fontSize: 11 }}>{c}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Products & Services ──

function Step3Products({
  selectedCategories, setSelectedCategories,
  matchedSupplier, supplierProducts, showPackageWarnings,
}) {
  const [showAllCategories, setShowAllCategories] = useState(!matchedSupplier);
  const [showSometimes, setShowSometimes] = useState(false);

  const toggleCategory = (catId) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Auto-select "always" products when supplier is matched
  useEffect(() => {
    if (matchedSupplier && selectedCategories.size === 0) {
      const auto = new Set();
      for (const p of supplierProducts.always) {
        if (p.category) auto.add(p.category);
      }
      if (auto.size > 0) setSelectedCategories(auto);
    }
  }, [matchedSupplier]);

  return (
    <div>
      <h2 style={{ fontSize: 20, color: C.dk, margin: '0 0 8px' }}>Producten & Diensten</h2>
      <p style={{ fontSize: 13, color: C.txtL, margin: '0 0 20px' }}>
        Selecteer de producten en diensten voor deze aanvraag.
      </p>

      {/* Package warnings */}
      {showPackageWarnings.length > 0 && (
        <div style={{
          padding: '12px 16px', background: C.amberL, border: `1px solid ${C.amber}`,
          borderRadius: 8, marginBottom: 16, fontSize: 12, color: C.dk,
        }}>
          <strong>Let op:</strong> Vorige offertes van {matchedSupplier?.name} bevatten altijd:{' '}
          {showPackageWarnings.join(', ')}. Wilt u dit uitsluiten?
        </div>
      )}

      {/* Supplier-specific products */}
      {matchedSupplier && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, color: C.dk, margin: '0 0 12px' }}>
            Producten van {matchedSupplier.name}
          </h3>

          {/* Always */}
          {supplierProducts.always.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.gr, textTransform: 'uppercase', marginBottom: 6 }}>
                Altijd inbegrepen
              </div>
              {supplierProducts.always.map(p => (
                <ProductRow key={p.id} product={p}
                  selected={p.category ? selectedCategories.has(p.category) : false}
                  onToggle={() => p.category && toggleCategory(p.category)}
                />
              ))}
            </div>
          )}

          {/* Often */}
          {supplierProducts.often.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, textTransform: 'uppercase', marginBottom: 6 }}>
                Meestal
              </div>
              {supplierProducts.often.map(p => (
                <ProductRow key={p.id} product={p}
                  selected={p.category ? selectedCategories.has(p.category) : false}
                  onToggle={() => p.category && toggleCategory(p.category)}
                />
              ))}
            </div>
          )}

          {/* Sometimes */}
          {supplierProducts.sometimes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <button onClick={() => setShowSometimes(p => !p)} style={{
                background: 'transparent', border: 'none', fontSize: 11,
                fontWeight: 700, color: C.txtL, textTransform: 'uppercase',
                cursor: 'pointer', marginBottom: 6, padding: 0,
              }}>
                {showSometimes ? '\u25BC' : '\u25B6'} Soms ({supplierProducts.sometimes.length})
              </button>
              {showSometimes && supplierProducts.sometimes.map(p => (
                <ProductRow key={p.id} product={p}
                  selected={p.category ? selectedCategories.has(p.category) : false}
                  onToggle={() => p.category && toggleCategory(p.category)}
                />
              ))}
            </div>
          )}

          <button onClick={() => setShowAllCategories(p => !p)} style={{
            marginTop: 8, padding: '6px 14px', background: 'transparent',
            border: `1px solid ${C.bor}`, borderRadius: 4, fontSize: 12,
            color: C.dk, cursor: 'pointer',
          }}>
            {showAllCategories ? 'Verberg alle categorieen' : '+ Voeg product/dienst toe'}
          </button>
        </div>
      )}

      {/* Full category list */}
      {(showAllCategories || !matchedSupplier) && (
        <div style={{
          border: `1px solid ${C.bor}`, borderRadius: 8, maxHeight: 400,
          overflow: 'auto',
        }}>
          {PG_GROUPS.map(g => {
            const cats = CATEGORY_LIST.filter(c => c.pg === g.pg);
            return (
              <div key={g.pg}>
                <div style={{
                  padding: '8px 14px', background: C.lt, fontSize: 12,
                  fontWeight: 700, color: C.dk, borderBottom: `1px solid ${C.bor}`,
                  position: 'sticky', top: 0, zIndex: 1,
                }}>
                  {g.pg} \u2014 {g.label}
                </div>
                {cats.map(cat => {
                  const isChecked = selectedCategories.has(cat.id);
                  return (
                    <label key={cat.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 14px 8px 28px', cursor: 'pointer',
                      background: isChecked ? '#FFF5F2' : 'transparent',
                      borderBottom: `1px solid ${C.bor}`,
                    }}>
                      <input type="checkbox" checked={isChecked}
                        onChange={() => toggleCategory(cat.id)}
                        style={{ accentColor: C.o, width: 15, height: 15 }}
                      />
                      <span style={{
                        fontSize: 13, color: isChecked ? C.dk : C.txt,
                        fontWeight: isChecked ? 600 : 400, flex: 1,
                      }}>{cat.scope}</span>
                      <span style={{ fontSize: 10, color: C.txtL }}>
                        {cat.scopeType === 'service' ? 'dienst' : 'materiaal'}
                      </span>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {selectedCategories.size > 0 && (
        <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: C.o }}>
          {selectedCategories.size} product{selectedCategories.size !== 1 ? 'en' : ''} geselecteerd
        </div>
      )}
    </div>
  );
}

function ProductRow({ product, selected, onToggle }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', borderRadius: 6,
      background: selected ? '#FFF5F2' : C.wh,
      border: `1px solid ${selected ? C.o : C.bor}`,
      marginBottom: 4, cursor: 'pointer',
    }}>
      <input type="checkbox" checked={selected} onChange={onToggle}
        style={{ accentColor: C.o, width: 15, height: 15 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.dk }}>{product.name_nl}</div>
        <div style={{ fontSize: 11, color: C.txtL }}>
          {product.unit}
          {product.price_range && ` \u2014 \u20ac${product.price_range.min} - \u20ac${product.price_range.max}`}
          {product.items_count ? ` (${product.items_count} items)` : ''}
          {product.pg ? ` \u2014 ${product.pg}` : ''}
        </div>
        {product.sample_products && product.sample_products.length > 0 && (
          <div style={{ fontSize: 10, color: C.txtL, marginTop: 2 }}>
            o.a. {product.sample_products.slice(0, 3).join(', ')}
          </div>
        )}
      </div>
    </label>
  );
}

// ── Step 4: Specifications ──

function Step4Specs({
  allSpecVars, specVals, setSpecVals, delegatedVars, setDelegatedVars, specProgress,
}) {
  // Group by category
  const grouped = useMemo(() => {
    const map = new Map();
    for (const v of allSpecVars) {
      if (!map.has(v.categoryId)) map.set(v.categoryId, { label: v.categoryLabel, vars: [] });
      map.get(v.categoryId).vars.push(v);
    }
    return [...map.entries()];
  }, [allSpecVars]);

  const handleSetVal = (categoryId, varId, value) => {
    setSpecVals(prev => ({
      ...prev,
      [categoryId]: { ...(prev[categoryId] || {}), [varId]: value },
    }));
  };

  const toggleDelegate = (varId) => {
    setDelegatedVars(prev => {
      const next = new Set(prev);
      if (next.has(varId)) next.delete(varId);
      else next.add(varId);
      return next;
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, color: C.dk, margin: 0 }}>Specificaties</h2>
        <div style={{
          padding: '6px 14px', borderRadius: 20,
          background: specProgress.filled === specProgress.total ? '#F0FFF4' : C.amberL,
          fontSize: 13, fontWeight: 600,
          color: specProgress.filled === specProgress.total ? C.gr : C.amber,
        }}>
          {specProgress.filled} van {specProgress.total} velden ingevuld
        </div>
      </div>

      {grouped.map(([categoryId, group]) => (
        <div key={categoryId} style={{
          marginBottom: 24, background: C.wh, border: `1px solid ${C.bor}`,
          borderRadius: 8, overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 16px', background: C.lt,
            fontSize: 13, fontWeight: 700, color: C.dk,
            borderBottom: `1px solid ${C.bor}`,
          }}>
            {group.label}
          </div>
          <div style={{ padding: '8px 16px' }}>
            {group.vars.map(v => {
              if (v.source === 'category' || v.source === 'entity') return null;
              const val = specVals[categoryId]?.[v.id] || '';
              const isDelegated = delegatedVars.has(v.id);
              const isFilled = !!(val || v.default);
              const statusColor = isDelegated ? C.bl : isFilled ? C.gr : C.o;

              return (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', borderBottom: `1px solid ${C.bor}`,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', background: statusColor,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.dk, marginBottom: 4 }}>
                      {v.label}
                    </div>
                    {v.type === 'select' && v.options ? (
                      <select
                        value={val || v.default || ''}
                        onChange={e => handleSetVal(categoryId, v.id, e.target.value)}
                        disabled={isDelegated}
                        style={{
                          width: '100%', padding: '6px 10px', border: `1px solid ${C.bor}`,
                          borderRadius: 4, fontSize: 13,
                        }}
                      >
                        <option value="">-- Selecteer --</option>
                        {v.options.map(opt => (
                          <option key={opt.value || opt} value={opt.value || opt}>
                            {opt.label || opt}
                          </option>
                        ))}
                      </select>
                    ) : v.type === 'textarea' ? (
                      <textarea
                        value={val || v.default || ''}
                        onChange={e => handleSetVal(categoryId, v.id, e.target.value)}
                        disabled={isDelegated}
                        rows={3}
                        style={{
                          width: '100%', padding: '6px 10px', border: `1px solid ${C.bor}`,
                          borderRadius: 4, fontSize: 13, resize: 'vertical', boxSizing: 'border-box',
                        }}
                      />
                    ) : (
                      <input
                        type={v.type === 'number' ? 'number' : 'text'}
                        value={val || v.default || ''}
                        onChange={e => handleSetVal(categoryId, v.id, e.target.value)}
                        disabled={isDelegated}
                        placeholder={v.label}
                        style={{
                          width: '100%', padding: '6px 10px', border: `1px solid ${C.bor}`,
                          borderRadius: 4, fontSize: 13, boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => toggleDelegate(v.id)}
                    title={isDelegated ? 'Zelf invullen' : 'Leverancier specificeren'}
                    style={{
                      padding: '4px 8px', fontSize: 10, fontWeight: 700,
                      background: isDelegated ? C.blL : 'transparent',
                      color: isDelegated ? C.bl : C.txtL,
                      border: `1px solid ${isDelegated ? C.bl : C.bor}`,
                      borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {isDelegated ? 'Gedelegeerd' : 'Delegeer'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {grouped.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: C.txtL, fontSize: 14 }}>
          Geen specificaties beschikbaar. Ga terug naar Stap 3 om producten te selecteren.
        </div>
      )}
    </div>
  );
}

// ── Step 5: Review & Export ──

function Step5Review({
  projectRef, projectName, siteCity, entityId, supplierName, supplierContact,
  products, contractType, specProgress, missingRequired,
  chapters, selectedBlocks, sharedVals,
  onExport, onSaveDraft, chapterMap, specVals,
}) {
  const entity = entities[entityId];
  const ctParts = [];
  if (contractType.design) ctParts.push('Design');
  if (contractType.supply) ctParts.push('Supply');
  if (contractType.build) ctParts.push('Build');
  const canExport = missingRequired.length === 0;

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {/* Left: Summary + Actions */}
      <div style={{ width: 360, flexShrink: 0 }}>
        <h2 style={{ fontSize: 20, color: C.dk, margin: '0 0 20px' }}>Controle & Export</h2>

        {/* Summary cards */}
        <div style={{ background: C.wh, border: `1px solid ${C.bor}`, borderRadius: 8, marginBottom: 16 }}>
          <SummaryRow label="Entiteit" value={entity?.name || entityId} />
          <SummaryRow label="Projectreferentie" value={projectRef} />
          <SummaryRow label="Project" value={projectName} />
          <SummaryRow label="Locatie" value={siteCity} />
          <SummaryRow label="Contracttype" value={ctParts.join(' + ') || '-'} />
          <SummaryRow label="Leverancier" value={supplierName} />
          <SummaryRow label="Contact" value={supplierContact} />
          <SummaryRow label="Producten" value={`${products.length} categorie${products.length !== 1 ? '\u00ebn' : ''}`} />
          <SummaryRow label="Specificaties" value={`${specProgress.filled}/${specProgress.total} ingevuld`}
            highlight={specProgress.filled < specProgress.total} />
        </div>

        {/* Missing required */}
        {missingRequired.length > 0 && (
          <div style={{
            background: '#FFF5F5', border: `1px solid ${C.red}`, borderRadius: 8,
            padding: '12px 16px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 8 }}>
              {missingRequired.length} verplicht(e) veld(en) niet ingevuld:
            </div>
            {missingRequired.slice(0, 10).map((m, i) => (
              <div key={i} style={{ fontSize: 12, color: C.dk, padding: '2px 0' }}>
                <span style={{ color: C.red, marginRight: 6 }}>{'\u25CF'}</span>
                {m.label} ({m.category})
              </div>
            ))}
            {missingRequired.length > 10 && (
              <div style={{ fontSize: 11, color: C.txtL, marginTop: 4 }}>
                ... en {missingRequired.length - 10} meer
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onExport}
            disabled={!canExport}
            style={{
              padding: '12px 24px', background: canExport ? C.o : C.bor,
              color: C.wh, border: 'none', borderRadius: 6,
              fontSize: 15, fontWeight: 700, cursor: canExport ? 'pointer' : 'default',
            }}
          >
            {canExport ? 'Exporteer naar Word' : 'Vul eerst alle verplichte velden in'}
          </button>
          <button onClick={onSaveDraft} style={{
            padding: '10px 24px', background: 'transparent',
            border: `1px solid ${C.bor}`, borderRadius: 6,
            fontSize: 13, color: C.dk, cursor: 'pointer',
          }}>
            Opslaan als concept
          </button>
        </div>
      </div>

      {/* Right: Preview */}
      <div style={{
        flex: 1, background: C.wh, border: `1px solid ${C.bor}`, borderRadius: 8,
        overflow: 'hidden', maxHeight: 'calc(100vh - 240px)',
      }}>
        <div style={{
          padding: '10px 16px', borderBottom: `1px solid ${C.bor}`,
          fontSize: 12, fontWeight: 700, color: C.txtL, textTransform: 'uppercase',
        }}>
          Documentvoorbeeld
        </div>
        <div style={{ overflow: 'auto', height: 'calc(100% - 38px)' }}>
          <RFQPreview
            chapters={chapters}
            products={products}
            selectedBlocks={selectedBlocks}
            sharedVals={sharedVals}
            editedTexts={{}}
            delBlocks={new Set()}
            getOriginalText={() => ''}
            entityId={entityId}
            getValsForProduct={(idx) => {
              const catId = products[idx]?.categoryId;
              return catId ? (specVals[catId] || {}) : {};
            }}
            getRemovedVarsForProduct={() => new Set()}
            getAltVarsForProduct={() => new Set()}
            getAltProductForProduct={() => false}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 16px', borderBottom: `1px solid ${C.bor}`,
    }}>
      <span style={{ fontSize: 12, color: C.txtL }}>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: 600,
        color: highlight ? C.amber : C.dk,
      }}>{value}</span>
    </div>
  );
}
