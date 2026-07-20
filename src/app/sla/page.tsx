import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Service Level Agreement (SLA) | Datalazo',
  description: 'Service Level Agreement explaining service performance standards for the Bank Statement Extraction Platform by Datalazo LLC.',
};

export default function SLAPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#050505]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Datalazo Logo" 
              width={50} 
              height={50}
              className="w-12 h-12 rounded-xl bg-orange-500 p-1.5 hover:scale-105 transition-transform" 
            />
          </Link>
          <Link 
            href="/" 
            className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-accent-cyan transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <div className="glass border-white/5 p-8 md:p-12 rounded-2xl relative overflow-hidden bg-white/[0.01]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-cyan/5 blur-[80px] -z-10" />

          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic mb-2">
            Service Level <span className="text-accent-cyan">Agreement (SLA)</span>
          </h1>
          <p className="text-slate-400 text-sm uppercase font-black tracking-widest mb-10 pb-6 border-b border-white/5">
            Last Updated: July 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">1. Introduction</h2>
              <p>
                This Service Level Agreement (“SLA”) describes the service performance standards provided by Datalazo LLC (“Company”, “we”, “our”, “us”) for the Bank Statement Extraction Platform (“Service”). This SLA forms part of the Terms & Conditions and applies to all subscribed Customers (“Customer”, “you”, “your”).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">2. Service Availability</h2>
              <p>We aim to provide reliable access to the Service.</p>
              
              <div className="mt-4 space-y-4 border-l border-accent-cyan/20 pl-4">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">2.1 Uptime Commitment</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    The Company targets 99% uptime for the cloud application, excluding:
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-400 text-sm">
                    <li>Scheduled maintenance</li>
                    <li>Emergency maintenance</li>
                    <li>Outages caused by third party providers</li>
                    <li>Outages caused by Google Vision API</li>
                    <li>Customer side network or device issues</li>
                    <li>Force majeure events</li>
                  </ul>
                  <p className="text-slate-400 text-sm mt-2 font-medium">
                    This uptime target is not a guarantee, but a reasonable effort standard.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">3. Scheduled Maintenance</h2>
              <p>We may perform scheduled maintenance to improve or update the Service.</p>
              
              <div className="mt-4 space-y-4 border-l border-accent-cyan/20 pl-4">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">3.1 Notice</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Scheduled maintenance will be announced at least 24 hours in advance and is typically performed during low traffic hours.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">3.2 Impact</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    During maintenance, the Service may be temporarily unavailable.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">4. OCR Processing Performance</h2>
              <p>OCR extraction is performed using Google Vision API.</p>
              
              <div className="mt-4 space-y-4 border-l border-accent-cyan/20 pl-4">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">4.1 Processing Time</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Typical OCR processing time is 1–10 seconds per document, depending on document size, image quality, bank formatting, and Google Vision API response time.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">4.2 OCR Accuracy</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    OCR accuracy varies based on document quality. The Company does not guarantee 100% accuracy, perfect extraction, correct interpretation of bank formats, or correct GL classification. Customers must verify extracted data before using it for accounting or financial reporting.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">5. Support Response Times</h2>
              <p>We provide support based on your subscription plan.</p>
              
              <div className="mt-4 space-y-4 border-l border-accent-cyan/20 pl-4">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">5.1 Standard Support (Flex & Zero Entry Plans)</h3>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-400 text-sm">
                    <li>Response within 48 hours</li>
                    <li>Email support only</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">5.2 Priority Support (Standard Plan)</h3>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-400 text-sm">
                    <li>Response within 24 hours</li>
                    <li>Email + optional live session scheduling</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">5.3 Support Limitations</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Support does not include: accounting advice, financial interpretation, custom development (unless purchased), or bank template redesign (unless purchased).
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">6. Data Handling & Security</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">6.1 No Data Storage</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    The Company does not store bank statements, images, PDFs, extracted text, OCR output, or financial data. All documents are processed in memory and destroyed immediately after extraction.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">6.2 Security Measures</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    We implement reasonable security measures for account access, authentication, and cloud infrastructure. Because no documents are stored, data breach risk is significantly reduced.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">7. Service Limitations</h2>
              <p>
                The Service may be affected by changes in bank statement formats, poor document quality, Google Vision API outages, internet connectivity issues, and customer misconfiguration. The Company is not responsible for failures caused by these factors.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">8. Third Party Dependencies</h2>
              <p>
                The Service relies on Google Vision API (OCR), cloud hosting providers, and payment processors. Outages or disruptions caused by third party services are outside the Company’s control and do not constitute SLA violations.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">9. Remedies</h2>
              <p>Because the Service does not store customer data and operates on a subscription basis:</p>
              
              <div className="mt-4 space-y-4 border-l border-accent-cyan/20 pl-4">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">9.1 No Financial Credits</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    The Company does not offer service credits, refunds, compensation, or penalties for downtime, OCR errors, or service interruptions.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">9.2 Best Effort Restoration</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    If an outage occurs, the Company will make reasonable efforts to restore service promptly.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">10. Customer Responsibilities</h2>
              <p>Customers must:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>Provide readable documents</li>
                <li>Maintain their own internet connection</li>
                <li>Use supported file formats</li>
                <li>Verify extracted data</li>
                <li>Keep login credentials secure</li>
              </ul>
              <p className="mt-3">The Company is not responsible for errors caused by customer misuse.</p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">11. Service Discontinuation</h2>
              <p>
                If the Company ceases operations: all subscriptions terminate, no data export is available (no data stored), and annual plans may receive pro rata refunds at the Company’s discretion. See Terms & Conditions for full details.
              </p>
            </section>

            <section className="pt-6 border-t border-white/5">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">12. Contact Information</h2>
              <p>For SLA or support inquiries:</p>
              <address className="not-italic text-slate-400 mt-2 space-y-1">
                <p><strong>Datalazo LLC</strong></p>
                <p>7682 Tahiti Ln Apt 203, Lake Worth, FL 33467</p>
                <p>Email: <a href="mailto:luislazo@datalazo.net" className="text-accent-cyan hover:underline">luislazo@datalazo.net</a></p>
                <p>Phone: 862-223-6914</p>
              </address>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
        © {new Date().getFullYear()} Datalazo LLC. All rights reserved.
      </footer>
    </div>
  );
}
