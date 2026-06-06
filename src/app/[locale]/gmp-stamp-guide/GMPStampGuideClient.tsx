'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FlaskConical,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lock,
  BookOpen,
  Users,
  Globe,
  Layers,
  Activity,
  Eye,
  Upload,
  MousePointer,
  Download,
  Settings,
  ChevronRight,
  Home,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { type Locale } from '@/lib/i18n/config';

interface Props {
  locale: Locale;
}

const REGULATORY_FRAMEWORKS = [
  {
    flag: '🇪🇺',
    name: 'EU GMP Annex 1',
    subtitle: '2022 Revision — Sterile Manufacturing',
    color: 'blue',
    points: [
      'Mandatory document status visibility on all controlled documents',
      'Controlled Copy stamps required before shop-floor issue',
      'Superseded documents must be clearly marked and withdrawn',
    ],
  },
  {
    flag: '🇺🇸',
    name: 'FDA 21 CFR Part 11',
    subtitle: 'Electronic Records & Signatures',
    color: 'red',
    points: [
      'Client-side processing: zero third-party record storage',
      'Audit trail preserved — no external system holds your records',
      'Permanent embedded stamps support record integrity requirements',
    ],
  },
  {
    flag: '🇺🇸',
    name: 'FDA 21 CFR Part 820',
    subtitle: 'Quality System Regulation — Medical Devices',
    color: 'red',
    points: [
      'Document control requires only approved documents in use',
      'APPROVED and SUPERSEDED stamps enforce version control',
      'Supports ISO 13485 and MDR technical file management',
    ],
  },
  {
    flag: '🌐',
    name: 'ICH Q10',
    subtitle: 'Pharmaceutical Quality System',
    color: 'purple',
    points: [
      'PQS requires robust document lifecycle management',
      'Version status visibility is an ICH Q10 foundational expectation',
      'Supports all product lifecycle stages from development to post-market',
    ],
  },
  {
    flag: '🇮🇪',
    name: 'HPRA — Ireland',
    subtitle: 'Health Products Regulatory Authority',
    color: 'green',
    points: [
      'HPRA inspections routinely cite inadequate document control',
      'Consistent stamp usage demonstrates an auditable QMS',
      'Operated from Ireland — aligned with Irish Data Protection Act 2018',
    ],
  },
  {
    flag: '🇪🇺',
    name: 'GDPR Article 25',
    subtitle: 'Privacy by Design',
    color: 'green',
    points: [
      'Zero file upload — your documents never leave your device',
      'No cloud storage, no third-party processors, no data sharing',
      'Full compliance with Irish and EU data protection law',
    ],
  },
];

const WHO_USES = [
  { icon: ShieldCheck, role: 'QA Manager', desc: 'Issues APPROVED / SUPERSEDED stamps to controlled documents before distribution to the manufacturing floor.' },
  { icon: FileCheck2, role: 'Regulatory Affairs Officer', desc: 'Stamps dossier components as DRAFT or CONTROLLED COPY during internal review and HPRA/EMA/FDA submission preparation.' },
  { icon: FlaskConical, role: 'Validation Engineer', desc: 'Marks IQ/OQ/PQ protocols as FOR REVIEW before routing for subject matter expert and QA sign-off.' },
  { icon: Activity, role: 'Manufacturing / Operations', desc: 'Receives GMP COMPLIANT or CONTROLLED COPY stamped batch records and manufacturing instructions for the production floor.' },
  { icon: Lock, role: 'Clinical Trial Coordinator', desc: 'Applies CONFIDENTIAL or DRAFT status to Investigator Brochures, ICFs, and study protocols under ICH E6 GCP.' },
  { icon: Layers, role: 'MedTech / Device Teams', desc: 'Maintains 21 CFR Part 820 and MDR-compliant document lifecycles for DHFs, risk files, and device master records.' },
  { icon: Users, role: 'Document Control Specialist', desc: 'Maintains a consistent, auditable visual status system across all QMS-controlled document categories.' },
  { icon: BookOpen, role: 'Training Coordinator', desc: 'Marks training materials as SAMPLE or FOR REVIEW to distinguish them from issued controlled versions.' },
];

const STEPS = [
  {
    n: 1,
    icon: Globe,
    title: 'Open the Tool — No Login Required',
    desc: 'Navigate to the GMP Stamp Tool at pdf.priyalifescience.com. No account, plugin, installation, or subscription is needed. The full tool runs in any modern browser.',
  },
  {
    n: 2,
    icon: Upload,
    title: 'Upload Your Pharmaceutical PDF',
    desc: 'Drag and drop your SOP, batch record, validation protocol, dossier component, or any GxP document into the upload zone. The PDF is loaded into your local browser memory — it is never transmitted to any server or third party.',
  },
  {
    n: 3,
    icon: Settings,
    title: 'Select a GMP Stamp Preset',
    desc: 'Choose from 10 standardised GxP presets colour-coded by status: green (APPROVED, CONTROLLED COPY, FOR REVIEW, GMP COMPLIANT), blue (SAMPLE), or red (DRAFT, SUPERSEDED, VOID, CONFIDENTIAL, NOT FOR DISTRIBUTION).',
  },
  {
    n: 4,
    icon: Eye,
    title: 'Adjust Opacity',
    desc: 'Use the opacity slider (30%–100%) to set stamp transparency. A lower opacity ensures the stamp is clearly visible without obscuring critical document text beneath it — essential for GMP readability compliance.',
  },
  {
    n: 5,
    icon: MousePointer,
    title: 'Place and Drag to Position',
    desc: 'Click "Place Stamp on Page" to add the stamp to the centre of the current page. Drag it to your preferred location — top-right corner, document header, or diagonal placement — to match your site QMS standard.',
  },
  {
    n: 6,
    icon: ChevronRight,
    title: 'Stamp Multiple Pages',
    desc: 'Use Previous / Next page controls to navigate through multi-page documents. Add stamps to each page as required by your document control procedure. Stamps across all pages are tracked in the sidebar.',
  },
  {
    n: 7,
    icon: Download,
    title: 'Save and Download',
    desc: 'Click "Save Stamped PDF". Stamps are permanently embedded into the PDF using pdf-lib running entirely locally. Your browser downloads the finished document — no server request is made at any stage.',
  },
];

const DOCUMENT_TYPES = [
  { name: 'Standard Operating Procedures (SOPs)', stamp: 'APPROVED / SUPERSEDED' },
  { name: 'Batch Manufacturing Records (BMRs)', stamp: 'CONTROLLED COPY / GMP COMPLIANT' },
  { name: 'Validation Protocols (IQ / OQ / PQ)', stamp: 'FOR REVIEW / APPROVED' },
  { name: 'Regulatory Submission Dossiers', stamp: 'DRAFT / CONTROLLED COPY' },
  { name: 'Investigator Brochures (IB)', stamp: 'CONFIDENTIAL / DRAFT' },
  { name: 'Informed Consent Forms (ICF)', stamp: 'FOR REVIEW / APPROVED' },
  { name: 'CAPA & Deviation Reports', stamp: 'DRAFT / APPROVED' },
  { name: 'Change Control Documentation', stamp: 'FOR REVIEW / APPROVED' },
  { name: 'Quality Agreements', stamp: 'CONTROLLED COPY' },
  { name: 'Medical Device Technical Files', stamp: 'APPROVED / SUPERSEDED' },
  { name: 'Design History Files (DHF)', stamp: 'CONTROLLED COPY / APPROVED' },
  { name: 'GMP Training Materials', stamp: 'SAMPLE / FOR REVIEW' },
];

const FAQS = [
  {
    q: 'What is GMP document stamping and why is it required?',
    a: 'GMP document stamping is the process of visibly marking a controlled pharmaceutical or medical device document with its current status — such as APPROVED, DRAFT, SUPERSEDED, or CONTROLLED COPY. Regulatory frameworks including EU GMP Annex 1, FDA 21 CFR Part 11, FDA 21 CFR Part 820, and ICH Q10 all require that controlled documents display clear version and approval status. Missing or inconsistent status markings are among the most commonly cited findings in HPRA, EMA, and FDA GMP inspections.',
  },
  {
    q: 'Is this tool suitable for FDA 21 CFR Part 11 environments?',
    a: 'FDA 21 CFR Part 11 requires electronic records to be trustworthy, reliable, and not subject to unauthorised alteration. Because this tool operates entirely client-side — no third party receives, stores, or processes a copy of your records — it removes a significant source of Part 11 audit risk associated with cloud-based tools. The embedded PDF stamp creates a permanent, visible status indicator consistent with electronic record requirements. Consult your Compliance team to assess fit within your specific 21 CFR Part 11 programme.',
  },
  {
    q: 'Does the tool upload my pharmaceutical documents to a server?',
    a: 'No. Zero bytes of your document are transmitted externally at any stage. All PDF processing — loading, stamp rendering, and saving — runs entirely inside your browser using WebAssembly (WASM) and the pdf-lib library. This is independently verifiable: open your browser DevTools, go to the Network tab, run the tool, and observe that no requests are made for your file. Suitable for SOPs, batch records, clinical trial materials, and regulatory dossiers under any data classification.',
  },
  {
    q: 'Which GMP stamp presets are available?',
    a: 'Ten standardised presets are included, colour-coded by GxP convention: APPROVED (green), CONTROLLED COPY (green), FOR REVIEW (green), GMP COMPLIANT (green), SAMPLE (blue), DRAFT (red), SUPERSEDED (red), VOID (red), CONFIDENTIAL (red), and NOT FOR DISTRIBUTION (red). Green indicates valid/active status; red indicates restricted, withdrawn, or work-in-progress; blue indicates informational copies.',
  },
  {
    q: 'Can I stamp multiple pages or multiple documents?',
    a: 'Yes. Within a single document, you can navigate page-by-page and place stamps on as many pages as required. All stamps are compiled and saved in one download. For stamping multiple documents, process them one at a time through the tool.',
  },
  {
    q: 'How does this tool compare to printing and hand-stamping?',
    a: 'Physical stamping requires printing, hand-stamping, scanning, and re-filing — adding time, paper waste, and version-control risk from re-scan quality degradation. Digital PDF stamps are permanent, consistent, scalable, instantly verifiable, and aligned with electronic document management expectations under ICH Q10 and modern QMS standards. They also eliminate the risk of a scan inadvertently capturing an incorrect revision.',
  },
  {
    q: 'Is this tool free? Are there any subscriptions or upload fees?',
    a: 'Yes, completely free. Priya PDF Editor is open source under the AGPL-3.0 licence. Source code is publicly available on GitHub. There are no accounts, subscriptions, pay-per-use charges, or data-sharing arrangements of any kind.',
  },
  {
    q: 'What browsers are supported?',
    a: 'Any modern browser with WebAssembly support: Google Chrome (recommended), Mozilla Firefox, Microsoft Edge, and Safari. The tool works on Windows, macOS, and Linux desktops. Mobile browser support is functional but desktop is recommended for precise stamp positioning.',
  },
  {
    q: 'Can I use a custom stamp text instead of the presets?',
    a: 'The current version provides 10 GMP-standard presets. Custom stamp text is on the development roadmap. For now, the presets cover the most common GxP document lifecycle statuses used in EU and US-regulated pharma and medical device environments.',
  },
  {
    q: 'Is this tool GDPR compliant?',
    a: 'Yes. Because no document data is ever transmitted to any server, the tool satisfies GDPR Article 25 (Privacy by Design and by Default) and is fully compliant with the Irish Data Protection Act 2018. There is no data processing agreement required because no personal or clinical data ever leaves the user\'s device. Operated by Priya Life Science, registered in Ireland.',
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   badge: 'bg-blue-100 text-blue-700' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    badge: 'bg-red-100 text-red-700' },
  green:  { bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-800',badge: 'bg-emerald-100 text-emerald-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700' },
};

export default function GMPStampGuideClient({ locale }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      <Header locale={locale} />

      <main className="flex-1 pt-[72px]">

        {/* Sector ticker */}
        <div className="w-full overflow-hidden select-none" style={{ background: '#151B1F', borderBottom: '1px solid #2a3540' }}>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes guideticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}` }} />
          <div className="flex whitespace-nowrap py-2 gap-10 text-xs font-semibold tracking-widest uppercase animate-[guideticker_40s_linear_infinite]" style={{ color: '#86bc24' }}>
            {[0, 1].map(i => (
              <div key={i} className="flex gap-10 items-center" aria-hidden={i === 1 ? 'true' : undefined}>
                <span>🧬 Pharma</span><span style={{ color: '#2a3540' }}>◆</span>
                <span>🔬 Biotech &amp; MedTech</span><span style={{ color: '#2a3540' }}>◆</span>
                <span>🇮🇪 Life Science Ireland</span><span style={{ color: '#2a3540' }}>◆</span>
                <span>🛡️ FDA · EU GMP · HPRA Compliance</span><span style={{ color: '#2a3540' }}>◆</span>
                <span>🔒 Zero File Upload · GDPR Article 25</span><span style={{ color: '#2a3540' }}>◆</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1 text-sm text-gray-500">
            <Link href={`/${locale}`} className="hover:text-[#86bc24] transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <Link href={`/${locale}/tools/gmp-stamp`} className="hover:text-[#86bc24] transition-colors">GMP Stamp Tool</Link>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="text-gray-700 font-medium">Full Guide</span>
          </nav>

          {/* Hero */}
          <div className="rounded-2xl overflow-hidden mb-10" style={{ background: 'linear-gradient(135deg, #151B1F 0%, #1e2c22 100%)', border: '1px solid #2a3540' }}>
            <div className="px-8 py-10 md:px-12 md:py-12">
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase" style={{ background: 'rgba(134,188,36,0.15)', color: '#86bc24', border: '1px solid rgba(134,188,36,0.3)' }}>Complete Guide</span>
                <span className="rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase" style={{ background: 'rgba(134,188,36,0.15)', color: '#86bc24', border: '1px solid rgba(134,188,36,0.3)' }}>🇮🇪 Ireland</span>
                <span className="rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase" style={{ background: 'rgba(134,188,36,0.15)', color: '#86bc24', border: '1px solid rgba(134,188,36,0.3)' }}>FDA · EU GMP · HPRA</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
                GMP Document Stamping:<br />
                <span style={{ color: '#86bc24' }}>The Complete Pharma Guide</span>
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mb-8 leading-relaxed">
                Why document status stamps are a regulatory requirement, which stamps to use for each document type, and how to apply them to PDFs privately — without uploading to any server.
              </p>
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#86bc24]" />
                  <span className="text-sm text-gray-300">FDA 21 CFR Part 11</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#86bc24]" />
                  <span className="text-sm text-gray-300">EU GMP Annex 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#86bc24]" />
                  <span className="text-sm text-gray-300">HPRA · ICH Q10</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#86bc24]" />
                  <span className="text-sm text-gray-300">GDPR Article 25</span>
                </div>
              </div>
              <Link
                href={`/${locale}/tools/gmp-stamp`}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90 shadow-lg"
                style={{ background: '#86bc24' }}
              >
                Open GMP Stamp Tool — Free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Why This Tool Exists */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why GMP Document Stamping Exists</h2>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800 mb-1">A common HPRA, EMA and FDA inspection finding:</p>
                  <p className="text-sm text-amber-700">"Documents in use on the manufacturing floor were not clearly marked with their approval status / revision number / controlled copy designation."</p>
                </div>
              </div>
            </div>
            <div className="prose prose-gray max-w-none text-gray-700 space-y-4">
              <p>
                Document control is a legal and regulatory obligation in every GMP-regulated industry. When a QA Manager approves a new SOP, when a Validation Engineer issues an IQ protocol for review, or when a Regulatory Affairs team marks a submission dossier as a controlled copy — that status must be <strong>visibly and permanently embedded</strong> on the document.
              </p>
              <p>
                Most stamp tools require cloud upload, subscription accounts, or desktop software. Every upload of a pharmaceutical document to a third-party cloud creates a data-privacy risk under <strong>GDPR Article 25 (Privacy by Design)</strong> and the confidentiality obligations within GxP systems.
              </p>
              <p>
                This tool solves both problems: it applies GMP-standardised status stamps to any PDF — entirely inside your browser — with zero server upload. Your SOPs, batch records, and regulatory dossiers never leave your device.
              </p>
            </div>
          </section>

          {/* Regulatory Frameworks */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Regulatory Compliance Framework</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {REGULATORY_FRAMEWORKS.map((f) => {
                const c = colorMap[f.color];
                return (
                  <div key={f.name} className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{f.flag}</span>
                      <div>
                        <div className={`font-bold ${c.text}`}>{f.name}</div>
                        <div className="text-xs text-gray-500">{f.subtitle}</div>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {f.points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Who Uses This */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Who Uses This Tool</h2>
            <p className="text-gray-500 mb-6 text-sm">Designed for regulated pharmaceutical and life science professionals across Ireland and the EU.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {WHO_USES.map(({ icon: Icon, role, desc }) => (
                <div key={role} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg mb-3" style={{ background: 'rgba(134,188,36,0.12)' }}>
                    <Icon className="h-5 w-5" style={{ color: '#66B539' }} />
                  </div>
                  <div className="font-semibold text-gray-900 text-sm mb-1">{role}</div>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Step-by-Step Guide */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Step-by-Step Guide</h2>
            <p className="text-gray-500 mb-6 text-sm">From upload to download — the complete workflow.</p>
            <div className="space-y-4">
              {STEPS.map(({ n, icon: Icon, title, desc }) => (
                <div key={n} className="flex gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm shadow" style={{ background: '#86bc24' }}>
                      {n}
                    </div>
                    {n < STEPS.length && <div className="w-0.5 flex-1 mt-2" style={{ background: '#e2e8f0', minHeight: '20px' }} />}
                  </div>
                  <div className="flex-1 pt-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-gray-400" />
                      <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Document Types */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Types &amp; Recommended Stamps</h2>
            <p className="text-gray-500 mb-6 text-sm">Reference guide for common GxP document lifecycle status assignments.</p>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#151B1F' }}>
                    <th className="text-left px-5 py-3 font-semibold text-gray-300">Document Type</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-300">Recommended Stamp(s)</th>
                  </tr>
                </thead>
                <tbody>
                  {DOCUMENT_TYPES.map((dt, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-5 py-3 text-gray-800 font-medium">{dt.name}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          {dt.stamp}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Privacy Architecture */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Architecture — Zero File Upload</h2>
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                    <ShieldCheck className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div className="font-bold text-emerald-800 mb-1">100% Client-Side</div>
                  <p className="text-xs text-emerald-600">All PDF processing runs in your browser using WebAssembly. No network request is made for your file.</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                    <Lock className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div className="font-bold text-emerald-800 mb-1">No Third-Party Storage</div>
                  <p className="text-xs text-emerald-600">Your SOPs, batch records, and dossiers never touch any cloud infrastructure, removing 21 CFR Part 11 and GDPR risk.</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                    <FileCheck2 className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div className="font-bold text-emerald-800 mb-1">Verifiable Privacy</div>
                  <p className="text-xs text-emerald-600">Open DevTools → Network tab → run the tool — you will observe zero requests made for your document. Independently auditable.</p>
                </div>
              </div>
              <div className="rounded-xl bg-white border border-emerald-100 p-5">
                <div className="font-semibold text-gray-800 mb-2 text-sm">Technical Stack</div>
                <div className="flex flex-wrap gap-2">
                  {['WebAssembly (WASM)', 'pdf-lib', 'pdfjs-dist', 'Next.js Static Export', 'No server-side PDF processing'].map(t => (
                    <span key={t} className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12" itemScope itemType="https://schema.org/FAQPage">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors text-sm"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span itemProp="name">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 ml-4" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-4" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 pt-0" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                      <p className="text-sm text-gray-600 leading-relaxed" itemProp="text">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #151B1F 0%, #1e2c22 100%)', border: '1px solid #2a3540' }}>
            <div className="px-8 py-10 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">Ready to Stamp Your Pharma Documents?</h2>
              <p className="text-gray-400 mb-6 max-w-xl mx-auto text-sm">
                Free, private, browser-only. FDA · EU GMP · HPRA · GDPR compliant. No account required.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href={`/${locale}/tools/gmp-stamp`}
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 shadow-lg"
                  style={{ background: '#86bc24' }}
                >
                  Open GMP Stamp Tool — Free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/${locale}/tools`}
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold border transition-all hover:bg-white/5"
                  style={{ color: '#86bc24', borderColor: 'rgba(134,188,36,0.4)' }}
                >
                  All PDF Tools
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
