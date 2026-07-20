import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Refund Policy | Datalazo',
  description: 'Refund Policy governing onboarding, subscriptions, and usage for the Bank Statement Extraction Platform by Datalazo LLC.',
};

export default function RefundPage() {
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
            Refund <span className="text-accent-cyan">Policy</span>
          </h1>
          <p className="text-slate-400 text-sm uppercase font-black tracking-widest mb-10 pb-6 border-b border-white/5">
            Last Updated: July 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">1. Overview</h2>
              <p>
                This Refund Policy explains how Datalazo LLC (“Company”, “we”, “our”, “us”) handles refunds for onboarding fees, subscription payments, and additional services related to the Bank Statement Extraction Platform (“Service”). By subscribing to or using the Service, you agree to this Refund Policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">2. Onboarding Fees (Non Refundable)</h2>
              <p>All onboarding fees are non refundable, including:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>Standard Plan onboarding ($3,000)</li>
                <li>Flex Plan onboarding ($1,500)</li>
                <li>Zero Entry Plan onboarding ($0)</li>
                <li>Custom template development</li>
                <li>Custom GL rule creation</li>
                <li>Any setup or configuration work</li>
              </ul>
              <p className="mt-3">
                Onboarding fees cover labor, template creation, system configuration, and initial deployment. Once onboarding begins, refunds are not available under any circumstances.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">3. Monthly Subscription Fees (Non Refundable)</h2>
              <p>All monthly subscription payments are non refundable, including:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>Partial months</li>
                <li>Unused time</li>
                <li>Months where the Customer did not use the Service</li>
                <li>Months where OCR quotas were not consumed</li>
              </ul>
              <p className="mt-3">
                Subscription fees grant access to the cloud platform, OCR processing, and ongoing maintenance. Refunds are not provided once a billing cycle has started.
              </p>
              <p className="mt-3">
                Annual subscription payments are non refundable, except in the event the Company permanently discontinues the Service. In such cases, a pro rata refund may be issued at the Company’s discretion for the unused portion of the annual term.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">4. Add Ons and Extra Usage</h2>
              <p>Payments for add ons or usage based services are non refundable, including:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>Additional bank templates</li>
                <li>Extra Google Vision OCR images</li>
                <li>Custom development</li>
                <li>API usage fees</li>
                <li>Priority support upgrades</li>
              </ul>
              <p className="mt-3">These services are delivered immediately and cannot be reversed.</p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">5. No Refunds for OCR Accuracy</h2>
              <p>OCR accuracy may vary depending on: document quality, scanning resolution, bank formatting, image clarity, and PDF structure.</p>
              <p className="mt-2 font-bold text-slate-200">
                Because OCR results depend on external factors, no refunds are provided for:
              </p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-400">
                <li>OCR errors</li>
                <li>Misreads</li>
                <li>Missing fields</li>
                <li>Incorrect extraction</li>
                <li>Template mismatches</li>
              </ul>
              <p className="mt-3">
                Customers are responsible for reviewing extracted data before using it for accounting or financial reporting.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">6. No Refunds for Customer Mistakes</h2>
              <p>Refunds are not provided for:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>Uploading the wrong document</li>
                <li>Uploading corrupted or unreadable files</li>
                <li>Misconfigured templates</li>
                <li>Incorrect usage of the platform</li>
                <li>Failure to understand how the Service works</li>
              </ul>
              <p className="mt-3">Support is available to assist with proper usage.</p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">7. Service Downtime</h2>
              <p>
                If the Service experiences downtime: no refunds are provided, no credits are issued, and no compensation is offered. However, the Company will make reasonable efforts to restore service promptly. If you want, we can add an SLA later that includes uptime guarantees.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">8. Company Closure</h2>
              <p>If the Company permanently ceases operations:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>Monthly subscriptions terminate immediately.</li>
                <li>Onboarding fees remain non refundable.</li>
                <li>Monthly fees remain non refundable.</li>
                <li>Annual plans may receive a pro rata refund at the Company’s discretion.</li>
              </ul>
              <p className="mt-3 font-medium text-slate-400">
                Because the Company does not store customer documents, no data export will be available.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">9. Chargebacks</h2>
              <p>
                Any chargeback initiated by the Customer will result in: immediate suspension of the account, termination of access to all services, possible legal action to recover unpaid fees, and additional administrative fees. Customers must contact support before initiating a chargeback.
              </p>
            </section>

            <section className="pt-6 border-t border-white/5">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">10. Contact Information</h2>
              <p>For billing or refund questions:</p>
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
