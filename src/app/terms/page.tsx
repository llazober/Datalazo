import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Terms & Conditions | Datalazo',
  description: 'Terms and Conditions governing the use of the Bank Statement Extraction Platform by Datalazo LLC.',
};

export default function TermsPage() {
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
            Terms & <span className="text-accent-cyan">Conditions</span>
          </h1>
          <p className="text-slate-400 text-sm uppercase font-black tracking-widest mb-10 pb-6 border-b border-white/5">
            Last Updated: July 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">1. Introduction</h2>
              <p>
                These Terms and Conditions (“Terms”) govern the use of the Bank Statement Extraction Platform (“Service”), provided by Datalazo LLC (“Company”, “we”, “our”, “us”). By accessing or using the Service, the client (“Customer”, “you”, “your”) agrees to these Terms. If you do not agree, you may not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">2. Description of Service</h2>
              <p>The Service includes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>Bank statement extraction using predefined templates</li>
                <li>OCR processing via Google Vision API</li>
                <li>Cloud based application access</li>
                <li>Data normalization and optional GL classification logic</li>
                <li>Optional custom template development</li>
              </ul>
              <p className="mt-3">
                The Service is provided as is, with no guarantee of compatibility with all bank formats or document types.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">3. Onboarding Fees</h2>
              <p>Customers agree to pay the onboarding fee associated with their selected plan:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>Standard Plan: $3,000</li>
                <li>Flex Plan: $1,500</li>
                <li>Zero Entry Plan: $0</li>
              </ul>
              <p className="mt-3">Onboarding fees are non refundable, except where required by law.</p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">4. Subscription Fees</h2>
              <p>
                Monthly subscription fees apply based on the selected plan. Fees are billed automatically every month until canceled. Failure to pay may result in suspension or termination of access.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">5. OCR Usage Limits</h2>
              <p>
                Each plan includes a monthly quota of Google Vision OCR images. Additional usage is billed at the rate specified in the pricing page. OCR accuracy may vary depending on document quality, image resolution, and bank formatting. We do not guarantee 100% accuracy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">6. Bank Templates</h2>
              <p>
                The Service includes 5 predefined bank templates. Additional templates may be purchased separately. Templates are designed based on typical bank formats but may require adjustments if the bank changes its layout. We are not responsible for changes made by banks to their statement formats.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">7. Customer Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>Provide accurate and lawful documents</li>
                <li>Use the Service only for legal purposes</li>
                <li>Maintain confidentiality of your login credentials</li>
                <li>Ensure compliance with your local financial regulations</li>
              </ul>
              <p className="mt-3">
                You are responsible for verifying extracted data before using it for accounting, tax, or financial reporting.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">8. Data Ownership & Privacy</h2>
              <p>You retain ownership of all data you upload.</p>
              
              <div className="mt-4 space-y-4 border-l border-accent-cyan/20 pl-4">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">8.1 No Data Storage Policy</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    The Company does not store customer documents, images, or extracted data. Specifically:
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-400 text-sm">
                    <li>All uploaded bank statements are processed in memory and destroyed immediately after extraction.</li>
                    <li>No copies of documents, images, or extracted text are retained on Company servers.</li>
                    <li>No customer financial data is stored in logs, databases, or backups.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">8.2 Google Vision Temporary Processing</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    OCR processing is performed using Google Vision API. Google Vision may temporarily process the image for extraction, but:
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-400 text-sm">
                    <li>The Company does not store the image before or after OCR</li>
                    <li>The Company does not store the OCR output after delivering it to the Customer</li>
                    <li>All temporary processing files are destroyed immediately after extraction</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">8.3 No Data Retention</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Because the Company does not store customer data, we cannot recover, restore, or re download any documents or extracted results once processing is complete.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">9. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>We are not liable for financial losses, accounting errors, or decisions made based on extracted data.</li>
                <li>We are not liable for OCR inaccuracies or template misinterpretations.</li>
                <li>We are not liable for any loss of data, as the Service does not retain customer documents.</li>
                <li>Our total liability is limited to the amount paid by the Customer in the last 3 months.</li>
              </ul>
              <p className="mt-3">The Service is provided “as is” and “as available”.</p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">10. No Professional Advice</h2>
              <p>
                The Service does not provide accounting, tax, legal, or financial advice. You must consult qualified professionals before relying on extracted data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">11. Termination</h2>
              <p>We may suspend or terminate access if:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>Payments fail</li>
                <li>You violate these Terms</li>
                <li>You misuse the Service</li>
              </ul>
              <p className="mt-3">You may cancel at any time, but no refunds are provided for partial months.</p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">12. Intellectual Property</h2>
              <p>
                All software, templates, algorithms, and documentation are owned by the Company. You may not copy, modify, reverse engineer, or redistribute any part of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">13. Updates & Changes</h2>
              <p>
                We may update the Service or these Terms at any time. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">14. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the State of Florida, United States. Any disputes shall be resolved in courts located in Florida.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">15. Service Discontinuation & Company Closure</h2>
              <p>If the Company ceases operations or discontinues the Service:</p>
              <ol className="list-decimal pl-5 mt-2 space-y-2 text-slate-400">
                <li><strong className="text-slate-300 font-bold">Notice:</strong> We will make reasonable efforts to provide 30 days’ notice.</li>
                <li><strong className="text-slate-300 font-bold">Data Export:</strong> Because the Company does not store customer data, no data export will be available.</li>
                <li><strong className="text-slate-300 font-bold">End of Service:</strong> All subscriptions will terminate automatically.</li>
                <li>
                  <strong className="text-slate-300 font-bold">Refunds:</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-400">
                    <li>Monthly fees are non refundable</li>
                    <li>Onboarding fees are non refundable</li>
                    <li>Annual plans may receive a pro rata refund at our discretion</li>
                  </ul>
                </li>
                <li><strong className="text-slate-300 font-bold">Liability:</strong> Our total liability is limited to the amount paid in the last 30 days.</li>
                <li><strong className="text-slate-300 font-bold">Third Party Dependencies:</strong> If Google Vision or other required services become unavailable, the Company may discontinue the Service without liability.</li>
              </ol>
            </section>

            <section className="pt-6 border-t border-white/5">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">16. Contact Information</h2>
              <p>For questions or legal notices:</p>
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
