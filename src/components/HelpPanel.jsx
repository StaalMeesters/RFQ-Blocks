import { useState, useEffect } from 'react';
import { C } from '../utils/colors.js';

const WELCOME_KEY = 'rfq_v2_welcome_shown';

export function useWelcome() {
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(WELCOME_KEY)) {
      setShowWelcome(true);
    }
  }, []);
  const dismissWelcome = () => {
    localStorage.setItem(WELCOME_KEY, '1');
    setShowWelcome(false);
  };
  return { showWelcome, dismissWelcome };
}

export function WelcomeOverlay({ onDismiss }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400,
    }} onClick={onDismiss}>
      <div style={{
        background: C.wh, borderRadius: 12, padding: '32px 40px',
        maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.dk, marginBottom: 8 }}>
          Welkom bij de STM RFQ Editor
        </div>
        <p style={{ fontSize: 14, color: C.txt, lineHeight: 1.6, margin: '12px 0 20px' }}>
          Met deze tool stelt u professionele aanvraagdocumenten samen voor leveranciers.
        </p>
        <p style={{ fontSize: 13, color: C.txtL, marginBottom: 24 }}>
          Klik op <strong>"?"</strong> rechtsboven voor hulp en uitleg.
        </p>
        <button onClick={onDismiss} style={{
          padding: '10px 32px', background: C.o, color: C.wh, border: 'none',
          borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Aan de slag
        </button>
      </div>
    </div>
  );
}

export default function HelpPanel({ onClose }) {
  const [tab, setTab] = useState('start');

  const tabs = [
    { id: 'start', label: 'Snelstart' },
    { id: 'functies', label: 'Functies' },
    { id: 'toetsen', label: 'Sneltoetsen' },
    { id: 'faq', label: 'FAQ' },
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, maxWidth: '90vw',
      background: C.wh, boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', zIndex: 300,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: `1px solid ${C.bor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h2 style={{ margin: 0, fontSize: 16, color: C.dk }}>Help</h2>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: C.txtL,
          padding: '4px 8px',
        }}>x</button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${C.bor}`,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '8px 0', fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? C.o : C.txtL, background: 'transparent', border: 'none',
              borderBottom: tab === t.id ? `2px solid ${C.o}` : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {tab === 'start' && <QuickStart />}
        {tab === 'functies' && <Features />}
        {tab === 'toetsen' && <Shortcuts />}
        {tab === 'faq' && <FAQ />}
      </div>
    </div>
  );
}

function QuickStart() {
  return (
    <div style={{ fontSize: 13, lineHeight: 1.7, color: C.txt }}>
      <h3 style={{ fontSize: 14, color: C.dk, margin: '0 0 12px' }}>Hoe gebruik ik de RFQ Editor?</h3>
      <ol style={{ paddingLeft: 20, margin: 0 }}>
        <li style={{ marginBottom: 8 }}>Selecteer uw STM entiteit (STP, D&B BV, D&B GmbH, Group)</li>
        <li style={{ marginBottom: 8 }}>Kies een of meerdere productcategorieen</li>
        <li style={{ marginBottom: 8 }}>Selecteer het contracttype (Design / Supply / Build)</li>
        <li style={{ marginBottom: 8 }}>Klik op "Start Editor"</li>
      </ol>
      <h4 style={{ fontSize: 13, color: C.dk, margin: '16px 0 8px' }}>In de editor:</h4>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        <li style={{ marginBottom: 6 }}><strong>Links:</strong> hoofdstukken en blokken aan/uit vinken</li>
        <li style={{ marginBottom: 6 }}><strong>Midden:</strong> tekst bewerken en specificaties invullen</li>
        <li style={{ marginBottom: 6 }}><strong>Rechts:</strong> live voorbeeld van het RFQ-document</li>
      </ul>
      <p style={{ marginTop: 16, color: C.txtL, fontSize: 12 }}>
        Alles wordt automatisch opgeslagen. U kunt altijd terug naar de standaardtekst via "Herstellen".
      </p>
    </div>
  );
}

function Features() {
  const items = [
    { icon: '🟠', desc: 'Oranje badge in tekst: variabele die nog ingevuld moet worden.' },
    { icon: '🟢', desc: 'Groene badge: ingevulde variabele.' },
    { icon: '🔵', desc: 'Blauwe badge: gedelegeerd aan leverancier.' },
    { icon: '🟡', desc: 'Amberkleurige badge: alternatief gevraagd.' },
    { icon: 'D', desc: '"Delegeren" knop: schuif specificatie naar de leverancier.' },
    { icon: 'A', desc: '"Alternatief" knop: vraag de leverancier om een alternatief aan te bieden.' },
    { icon: '=', desc: 'Sleep-icoon: sleep om de volgorde te wijzigen.' },
    { icon: 'x', desc: 'Verwijder een specificatie (kan hersteld worden via "Herstellen").' },
    { icon: '📥', desc: '"Standaard laden": laad opgeslagen STM-standaard specificaties.' },
    { icon: '💾', desc: '"Standaard opslaan": sla huidige specificaties op als STM-standaard.' },
    { icon: '🔴', desc: 'Rode stip naast blok: tekst is gewijzigd t.o.v. standaard.' },
    { icon: '🔒', desc: 'Bevroren: blok is goedgekeurd en vergrendeld.' },
  ];

  return (
    <div style={{ fontSize: 13, color: C.txt }}>
      <h3 style={{ fontSize: 14, color: C.dk, margin: '0 0 12px' }}>Functies uitleg</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.bor}` }}>
              <td style={{ padding: '8px 8px 8px 0', width: 30, textAlign: 'center', fontSize: 14 }}>
                {item.icon}
              </td>
              <td style={{ padding: '8px 0', lineHeight: 1.5 }}>{item.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Shortcuts() {
  const shortcuts = [
    { key: 'Ctrl+S', desc: 'Opslaan' },
    { key: 'Ctrl+Z', desc: 'Ongedaan maken' },
    { key: 'Ctrl+Y', desc: 'Opnieuw' },
    { key: 'Ctrl+E', desc: 'Word exporteren' },
  ];

  return (
    <div style={{ fontSize: 13, color: C.txt }}>
      <h3 style={{ fontSize: 14, color: C.dk, margin: '0 0 12px' }}>Sneltoetsen</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {shortcuts.map((s, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.bor}` }}>
              <td style={{
                padding: '10px 12px 10px 0', width: 100, fontFamily: 'monospace',
                fontWeight: 700, color: C.dk, fontSize: 13,
              }}>
                {s.key}
              </td>
              <td style={{ padding: '10px 0' }}>{s.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FAQ() {
  const faqs = [
    {
      q: 'Hoe voeg ik een product toe aan mijn aanvraag?',
      a: 'Klik op "+ Product toevoegen" onderaan het linkerpaneel.',
    },
    {
      q: 'Hoe pas ik de volgorde van hoofdstukken aan?',
      a: 'Sleep de hoofdstukken in het linkerpaneel naar de gewenste volgorde.',
    },
    {
      q: 'Wat gebeurt er als ik een hoofdstuk uitschakel?',
      a: 'Het hoofdstuk verdwijnt uit het document en de nummering past zich automatisch aan.',
    },
    {
      q: 'Hoe werkt het contracttype?',
      a: 'Selecteer Design, Supply en/of Build. De betalingsvoorwaarden passen zich automatisch aan.',
    },
    {
      q: 'Kan ik mijn wijzigingen kwijtraken?',
      a: 'Nee, alles wordt automatisch opgeslagen. U kunt ook altijd terug naar de standaardtekst via "Herstellen".',
    },
    {
      q: 'Hoe deel ik mijn standaard specificaties met collega\'s?',
      a: 'Ga naar Instellingen (tandwiel-icoon) -> "Exporteer standaarden" en deel het JSON-bestand.',
    },
    {
      q: 'Wat is het verschil tussen "Delegeren" en "Alternatief"?',
      a: 'Delegeren: STM geeft geen waarde op, de leverancier doet een voorstel. Alternatief: STM geeft een waarde, maar vraagt de leverancier ook een alternatief aan te bieden.',
    },
  ];

  return (
    <div style={{ fontSize: 13, color: C.txt }}>
      <h3 style={{ fontSize: 14, color: C.dk, margin: '0 0 12px' }}>Veelgestelde vragen</h3>
      {faqs.map((faq, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: C.dk, marginBottom: 4 }}>V: {faq.q}</div>
          <div style={{ color: C.txt, lineHeight: 1.6 }}>A: {faq.a}</div>
        </div>
      ))}
    </div>
  );
}
