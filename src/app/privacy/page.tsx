import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Privacy Policy | Datalazo',
  description: 'Privacy Policy governing the use of the Bank Statement Extraction Platform by Datalazo LLC.',
};

export default function PrivacyPage() {
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
            Privacy <span className="text-accent-cyan">Policy</span>
          </h1>
          <p className="text-slate-400 text-sm uppercase font-black tracking-widest mb-10 pb-6 border-b border-white/5">
            Last Updated: July 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">1. Introduction</h2>
              <p>
                This Privacy Policy explains how Datalazo LLC (“Company”, “we”, “our”, “us”) handles information when you use our Bank Statement Extraction Platform (“Service”). We are committed to protecting your privacy and being transparent about how data is processed. By using the Service, you agree to the practices described in this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">2. Information We Collect</h2>
              <p>We collect only the minimum information required to operate the Service.</p>
              
              <div className="mt-4 space-y-4 border-l border-accent-cyan/20 pl-4">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">2.1 Account Information</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    When you create an account, we may collect: Name, email address, login credentials, and optional company name. This information is used solely to provide access to the Service.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">2.2 Usage Information</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    We may collect basic technical information such as: IP address, browser type, device type, access timestamps, and error logs. This is standard for cloud applications and helps maintain system security and performance.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">3. No Storage of Customer Documents</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">3.1 No Document Retention</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    The Company does not store: Bank statements, images, PDFs, extracted text, OCR output, financial data, or any uploaded documents. All documents are processed in memory only and are destroyed immediately after extraction.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">3.2 No Backup Copies</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    We do not: Save documents to disk, store documents in databases, keep documents in logs, retain documents in backups, or archive any customer files. Once processing is complete, the data is permanently deleted.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">4. OCR Processing via Google Vision</h2>
              <p>The Service uses Google Vision API to perform OCR extraction.</p>
              
              <div className="mt-4 space-y-4 border-l border-accent-cyan/20 pl-4">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">4.1 Temporary Processing</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Google Vision may temporarily process the image to extract text. However:
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-400 text-sm">
                    <li>The Company does not store the image before or after OCR</li>
                    <li>The Company does not store the OCR output</li>
                    <li>Google Vision’s temporary processing files are destroyed automatically by Google</li>
                    <li>No document or extracted data is retained by the Company</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">4.2 Customer Responsibility</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    You acknowledge that OCR accuracy may vary depending on document quality and formatting.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">5. How We Use Account Information</h2>
              <p>We use account level information only for:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>Providing access to the Service</li>
                <li>Authentication</li>
                <li>Billing</li>
                <li>Customer support</li>
                <li>Security and fraud prevention</li>
                <li>Service improvements</li>
              </ul>
              <p className="mt-3 font-bold text-slate-200">We do not use customer data for advertising, marketing, data resale, AI training, or profiling.</p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">6. Sharing of Information</h2>
              <p>
                We do not sell, rent, or trade your information. We may share limited information only with Google Vision (for OCR processing), cloud hosting providers, payment processors, and legal authorities if required by law. These partners are required to follow strict data protection standards.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">7. Data Security</h2>
              <p>
                Although we do not store customer documents, we still implement strong security measures for account information, including: encrypted connections (HTTPS), secure authentication, access controls, and monitoring for suspicious activity. No system is 100% secure, but we take reasonable steps to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">8. Data Retention</h2>
              <p>Because we do not store customer documents or extracted data:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>We cannot recover or restore any processed files.</li>
                <li>We cannot re download or re extract past documents.</li>
                <li>You must keep your own copies of all documents and results.</li>
              </ul>
              <p className="mt-3">
                Account information (email, login credentials, billing info) is retained only as long as your subscription is active or as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">9. Children’s Privacy</h2>
              <p>
                The Service is not intended for individuals under 18. We do not knowingly collect information from minors.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">10. Your Rights</h2>
              <p>
                Depending on your location, you may have rights such as: access to your account information, correction of inaccurate information, deletion of your account, or requesting information about how your data is used. Since we do not store documents, these rights apply only to account level data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">11. Service Discontinuation</h2>
              <p>
                If the Company ceases operations: all accounts will be closed, no customer documents will be affected (none are stored), and account information may be deleted after legal retention periods. See our Terms & Conditions for full details.
              </p>
            </section>

            <section className="pt-6 border-t border-white/5">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-3 italic">12. Contact Information</h2>
              <p>For questions or privacy requests:</p>
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
