# priya-lifepdf
Free, open-source PDF toolkit for pharma &amp; life science — GMP stamp, compress, merge, split, OCR and more. 100% client-side processing. No uploads. Built with Next.js 14.

# Priya LifePDF & Pharma Quality Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Compliance: GxP Ready](https://img.shields.io/badge/Compliance-GxP_Ready-green.svg)]()

## 🌟 Overview
Priya LifePDF is a free, open-source toolkit designed specifically for the pharmaceutical and life science industries. It provides high-performance, **100% client-side** PDF processing—ensuring that sensitive batch records, COAs, and quality documents **never leave your browser**. 

By processing locally, we satisfy strict data integrity, confidentiality, and verification controls required by **EU GMP Annex 11, 21 CFR Part 11, and GDPR**.

---

## 🚀 Web Applications

| Application | URL | Purpose |
| :--- | :--- | :--- |
| **Priya LifePDF Editor** | [pdf.priyalifescience.com](https://pdf.priyalifescience.com) | PDF editing, compression, signing, and OCR. |
| **Priya Pharma Tools** | [tools.priyalifescience.com](https://tools.priyalifescience.com) | GMP compliance calculators and trackers. |

---

## 📂 Tool Directories

### 1. Priya LifePDF Editor
* **Compression:** Manual control over DPI and JPEG quality.
* **Digital Signing:** PKCS#7 signature embedding and validation.
* **Redaction:** Smart data redaction for sensitive information.
* **Form Logic:** Dynamic form creation and logic design.

### 2. Priya Pharma Tools Suite
* **Calibration Tracker:** Tracking of HPLC, pH meters, and balance calibration intervals.
* **EM Limits Checker:** EU GMP Annex 1 (2022) compliance verdicts.
* **COA Generator:** Printable batch Certificate of Analysis editor.
* **MKT Excursion Report:** USP <1159> Arrhenius equation temperature excursion analysis.

---

## 🛡️ Security & Compliance
* **Zero-Server Upload:** All operations are executed within the local browser thread.
* **Client-Side Cryptography:** Self-signed certificates and digital signatures generated locally.
* **Mathematical Verification:** Custom PK/SPC matrices ensure exact validation of regulatory calculations.

---

## 🛠️ Credits & Dependencies
We extend our gratitude to the open-source community for the core technologies powering this suite:

### Core Frameworks
* [Next.js](https://nextjs.org/) (Vercel): Optimized static bundle exports.
* [React](https://react.dev/): Modular component architecture.
* [Tailwind CSS](https://tailwindcss.com/): UI styling and utility classes.

### PDF Rendering & Modification
* [pdf-lib](https://pdf-lib.js.org/): Document structure editing and manipulation.
* [PyMuPDF](https://pymupdf.readthedocs.io/): High-performance WASM rasterization.
* [pdfjs-dist](https://mozilla.github.io/pdf.js/): Document viewer and text rendering.

### Security, Cryptography & Signing
* [zgapdfsigner](https://github.com/zgadgeter/zgapdfsigner): PKCS#7 signature embedding.
* [node-forge](https://github.com/digitalbazaar/forge): X.509 certificate generation.

### Conversion & Utilities
* [Tesseract.js](https://tesseract.projectnaptha.com/): Local Optical Character Recognition.
* [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/): Table and chart rasterization.
* [ag-psd](https://github.com/yumu-too/ag-psd): Photoshop parser for prepress assets.
* [JSZip](https://stuk.github.io/jszip/): Batch file compression.

---

## 📜 License
This project is open-source and licensed under the MIT License.
