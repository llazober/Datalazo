"use client";

import React, { useState } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import Link from 'next/link';

export default function DiscoveryQuestionnaire() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [leadId, setLeadId] = useState<string | null>(null);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const turnstileRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setSiteKey(data.siteKey || '');
      })
      .catch(err => {
        console.error('Failed to load Turnstile config:', err);
        setSiteKey('');
      });
  }, []);

  React.useEffect(() => {
    if (!siteKey || !turnstileRef.current) return;

    let active = true;
    let widgetId: string | null = null;

    const renderWidget = () => {
      const turnstile = (window as any).turnstile;
      if (turnstile && turnstileRef.current && active) {
        try {
          turnstileRef.current.innerHTML = '';
          widgetId = turnstile.render(turnstileRef.current, {
            sitekey: siteKey,
            theme: 'dark',
          });
        } catch (e) {
          console.error('Turnstile render error:', e);
        }
      }
    };

    if ((window as any).turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          renderWidget();
          clearInterval(interval);
        }
      }, 100);
      return () => {
        active = false;
        clearInterval(interval);
        if (widgetId && (window as any).turnstile) {
          try {
            (window as any).turnstile.remove(widgetId);
          } catch (e) {
            // Ignore
          }
        }
      };
    }

    return () => {
      active = false;
      if (widgetId && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetId);
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [siteKey]);

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');
    if (id) {
      setLeadId(id);
      fetch(`/api/lead/${id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            const nameInput = document.querySelector('input[name="contactName"]') as HTMLInputElement;
            if (nameInput && data.name) nameInput.value = data.name;
            
            const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
            if (emailInput && data.email) emailInput.value = data.email;
            
            const companyInput = document.querySelector('input[name="businessName"]') as HTMLInputElement;
            if (companyInput && data.company) companyInput.value = data.company;
            
            const phoneInput = document.querySelector('input[name="phone"]') as HTMLInputElement;
            if (phoneInput && data.phone) phoneInput.value = data.phone;
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');

    const formData = new FormData(e.currentTarget);
    
    // Cloudflare Turnstile token
    const turnstileToken = formData.get('cf-turnstile-response');
    if (!turnstileToken && siteKey) {
      setStatus('error');
      return;
    }

    // Extract basic Lead fields
    const name = formData.get('contactName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const company = formData.get('businessName') as string;

    // Build the formatted message string with ALL answers
    let formattedMessage = "=== AI BUSINESS DISCOVERY QUESTIONNAIRE ===\n\n";
    
    // Helper to get all checked values for a given name
    const getChecked = (name: string) => formData.getAll(name).join(', ');
    
    formattedMessage += "1. Company Information\n";
    formattedMessage += `Industry: ${formData.get('industry')}\n`;
    formattedMessage += `Website: ${formData.get('website')}\n`;
    formattedMessage += `Employees: ${formData.get('employees')}\n\n`;

    formattedMessage += "2. Main Business Goals\n";
    formattedMessage += `${getChecked('goals')}\n`;
    if (formData.get('goalsOther')) formattedMessage += `Other: ${formData.get('goalsOther')}\n`;
    formattedMessage += "\n";

    formattedMessage += "3. Main Business Problems\n";
    formattedMessage += `${getChecked('problems')}\n`;
    if (formData.get('problemsOther')) formattedMessage += `Other: ${formData.get('problemsOther')}\n`;
    formattedMessage += "\n";

    formattedMessage += "4. Current Systems & Tools\n";
    formattedMessage += `${getChecked('systems')}\n`;
    if (formData.get('systemsOther')) formattedMessage += `Other: ${formData.get('systemsOther')}\n`;
    formattedMessage += "\n";

    formattedMessage += "5. Customer Support\n";
    formattedMessage += `Contact Methods: ${getChecked('contactMethods')}\n`;
    if (formData.get('contactMethodsOther')) formattedMessage += `Other Contact Methods: ${formData.get('contactMethodsOther')}\n`;
    formattedMessage += `Repetitive questions? ${formData.get('repetitiveQuestions')}\n`;
    formattedMessage += `Want AI support? ${formData.get('aiSupport')}\n\n`;

    formattedMessage += "6. Sales & Lead Generation\n";
    formattedMessage += `Lead Sources: ${getChecked('leadGen')}\n`;
    if (formData.get('leadGenOther')) formattedMessage += `Other Lead Sources: ${formData.get('leadGenOther')}\n`;
    formattedMessage += `Auto follow-up currently? ${formData.get('autoFollowUp')}\n`;
    formattedMessage += `Want AI lead qual? ${formData.get('aiLeadQual')}\n\n`;

    formattedMessage += "7. Internal Operations\n";
    formattedMessage += `Areas to automate: ${getChecked('operations')}\n`;
    if (formData.get('operationsOther')) formattedMessage += `Other: ${formData.get('operationsOther')}\n`;
    formattedMessage += "\n";

    formattedMessage += "8. AI Knowledge Systems\n";
    formattedMessage += `Has documents/SOPs? ${formData.get('hasDocs')}\n`;
    formattedMessage += `Want AI assistant? ${formData.get('wantAiAssistant')}\n\n`;

    formattedMessage += "9. Website & SEO\n";
    formattedMessage += `Satisfied with online presence? ${formData.get('satisfiedOnline')}\n`;
    formattedMessage += `Needs help with: ${getChecked('seoHelp')}\n\n`;

    formattedMessage += "10. Budget & Timeline\n";
    formattedMessage += `Budget: ${formData.get('budget')}\n`;
    formattedMessage += `Timeline: ${formData.get('timeline')}\n\n`;

    formattedMessage += "11. ONE major problem to solve\n";
    formattedMessage += `${formData.get('finalProblem')}\n`;

    // Construct the payload for the existing /api/lead endpoint
    const payload = {
      leadId: leadId,
      name,
      email,
      phone,
      company,
      service: "AI Discovery Questionnaire",
      message: "Discovery Form Submitted - See Notes",
      notes: formattedMessage,
      status: "IN_REVIEW",
      "cf-turnstile-response": turnstileToken
    };

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full glass p-10 text-center animate-in zoom-in duration-500 rounded-3xl">
          <div className="w-20 h-20 bg-accent-cyan/20 text-accent-cyan rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black italic uppercase mb-4">Questionnaire Received!</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Thank you for sharing your business details. Our intelligence engine is analyzing your profile, and our team will reach out shortly with a custom AI roadmap.
          </p>
          <Link 
            href="/"
            className="block w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest rounded-xl transition-all border border-white/10"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const SectionTitle = ({ num, title }: { num: string, title: string }) => (
    <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/10">
      <div className="w-10 h-10 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan flex items-center justify-center font-black italic">
        {num}
      </div>
      <h2 className="text-2xl font-black uppercase italic tracking-tight">{title}</h2>
    </div>
  );

  const InputLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{children}</label>
  );

  const CheckboxItem = ({ name, value, label }: { name: string, value: string, label: string }) => (
    <label className="flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent-cyan/30 cursor-pointer transition-all">
      <input type="checkbox" name={name} value={value} className="mt-1 w-4 h-4 accent-accent-cyan bg-white/10 border-white/20 rounded" />
      <span className="text-sm text-slate-200 leading-tight">{label}</span>
    </label>
  );

  const RadioItem = ({ name, value, label }: { name: string, value: string, label: string }) => (
    <label className="flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent-cyan/30 cursor-pointer transition-all">
      <input type="radio" name={name} value={value} required className="mt-1 w-4 h-4 accent-accent-cyan bg-white/10 border-white/20" />
      <span className="text-sm text-slate-200 leading-tight">{label}</span>
    </label>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-accent-cyan selection:text-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logo.png" alt="Datalazo" width={40} height={40} className="w-10 h-10 rounded-xl group-hover:scale-110 transition-transform" />
            <span className="font-black italic uppercase tracking-tighter text-lg hidden sm:block">Datalazo Intelligence</span>
          </Link>
          <div className="text-xs font-black uppercase tracking-widest text-accent-cyan border border-accent-cyan/20 bg-accent-cyan/10 px-4 py-2 rounded-full">
            Secure Form
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-16 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic mb-6">
              AI Business <br/><span className="text-accent-cyan">Discovery</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
              Complete this technical assessment to help us understand your business operations, bottlenecks, and automation goals.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-16">
            
            {/* Section 1 */}
            <section className="glass p-8 md:p-12 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-accent-cyan" />
              <SectionTitle num="1" title="Company Information" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <InputLabel>Business Name *</InputLabel>
                  <input type="text" name="businessName" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors" />
                </div>
                <div>
                  <InputLabel>Industry *</InputLabel>
                  <input type="text" name="industry" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors" />
                </div>
                <div>
                  <InputLabel>Website URL</InputLabel>
                  <input 
                    type="text" 
                    name="website" 
                    placeholder="datalazo.net" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors" 
                  />
                </div>
                <div>
                  <InputLabel>Number of Employees *</InputLabel>
                  <select name="employees" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors text-slate-300">
                    <option value="">Select size...</option>
                    <option value="1-5">1–5</option>
                    <option value="6-20">6–20</option>
                    <option value="21-50">21–50</option>
                    <option value="51-200">51–200</option>
                    <option value="200+">200+</option>
                  </select>
                </div>
                <div className="md:col-span-2 pt-4 border-t border-white/5 mt-2">
                  <InputLabel>Main Contact Name *</InputLabel>
                  <input type="text" name="contactName" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors" />
                </div>
                <div>
                  <InputLabel>Email Address *</InputLabel>
                  <input type="email" name="email" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors" />
                </div>
                <div>
                  <InputLabel>Phone Number *</InputLabel>
                  <input type="tel" name="phone" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors" />
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="glass p-8 md:p-12 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-accent-indigo" />
              <SectionTitle num="2" title="Main Business Goals" />
              <p className="text-slate-400 mb-6 text-sm">What is the main goal you want to achieve with AI or automation? (Select all that apply)</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <CheckboxItem name="goals" value="Generate more leads" label="Generate more leads" />
                <CheckboxItem name="goals" value="Improve customer support" label="Improve customer support" />
                <CheckboxItem name="goals" value="Reduce repetitive work" label="Reduce repetitive work" />
                <CheckboxItem name="goals" value="Automate business operations" label="Automate business operations" />
                <CheckboxItem name="goals" value="Increase sales conversions" label="Increase sales conversions" />
                <CheckboxItem name="goals" value="Improve response times" label="Improve response times" />
                <CheckboxItem name="goals" value="Reduce staffing workload" label="Reduce staffing workload" />
                <CheckboxItem name="goals" value="Improve online visibility (SEO)" label="Improve online visibility (SEO)" />
                <CheckboxItem name="goals" value="Automate appointment booking" label="Automate appointment booking" />
                <CheckboxItem name="goals" value="Build internal AI knowledge system" label="Build internal AI knowledge system" />
                <CheckboxItem name="goals" value="Improve customer follow-up" label="Improve customer follow-up" />
              </div>
              <input type="text" name="goalsOther" placeholder="Other goals..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-indigo transition-colors text-sm" />
            </section>

            {/* Section 3 */}
            <section className="glass p-8 md:p-12 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
              <SectionTitle num="3" title="Main Business Problems" />
              <p className="text-slate-400 mb-6 text-sm">What are the biggest challenges your business is currently facing?</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <CheckboxItem name="problems" value="Too many repetitive tasks" label="Too many repetitive tasks" />
                <CheckboxItem name="problems" value="Slow response to customers" label="Slow response to customers" />
                <CheckboxItem name="problems" value="Losing leads or opportunities" label="Losing leads or opportunities" />
                <CheckboxItem name="problems" value="Staff overloaded with manual work" label="Staff overloaded with manual work" />
                <CheckboxItem name="problems" value="Poor customer support experience" label="Poor customer support experience" />
                <CheckboxItem name="problems" value="Difficulty scaling operations" label="Difficulty scaling operations" />
                <CheckboxItem name="problems" value="Low website traffic" label="Low website traffic" />
                <CheckboxItem name="problems" value="Weak online presence" label="Weak online presence" />
                <CheckboxItem name="problems" value="Poor follow-up with leads" label="Poor follow-up with leads" />
                <CheckboxItem name="problems" value="Difficulty managing company information" label="Difficulty managing company information" />
                <CheckboxItem name="problems" value="Disconnected business systems" label="Disconnected business systems" />
                <CheckboxItem name="problems" value="High operational costs" label="High operational costs" />
              </div>
              <input type="text" name="problemsOther" placeholder="Other problems..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors text-sm" />
            </section>

            {/* Section 4 */}
            <section className="glass p-8 md:p-12 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
              <SectionTitle num="4" title="Current Systems & Tools" />
              <p className="text-slate-400 mb-6 text-sm">Which systems are you currently using?</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <CheckboxItem name="systems" value="CRM (General)" label="CRM" />
                <CheckboxItem name="systems" value="Google Workspace" label="Google Workspace" />
                <CheckboxItem name="systems" value="Microsoft 365" label="Microsoft 365" />
                <CheckboxItem name="systems" value="Shopify" label="Shopify" />
                <CheckboxItem name="systems" value="WordPress" label="WordPress" />
                <CheckboxItem name="systems" value="QuickBooks" label="QuickBooks" />
                <CheckboxItem name="systems" value="Stripe" label="Stripe" />
                <CheckboxItem name="systems" value="HubSpot" label="HubSpot" />
                <CheckboxItem name="systems" value="Salesforce" label="Salesforce" />
                <CheckboxItem name="systems" value="Slack" label="Slack" />
                <CheckboxItem name="systems" value="Custom Software" label="Custom Software" />
              </div>
              <input type="text" name="systemsOther" placeholder="Other software (e.g. specialized industry tools)..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-sm" />
            </section>

            {/* Section 5 */}
            <section className="glass p-8 md:p-12 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-accent-cyan" />
              <SectionTitle num="5" title="Customer Support" />
              
              <div className="mb-8">
                <InputLabel>How do customers currently contact your business?</InputLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 mt-3">
                  <CheckboxItem name="contactMethods" value="Phone" label="Phone" />
                  <CheckboxItem name="contactMethods" value="Email" label="Email" />
                  <CheckboxItem name="contactMethods" value="Website Chat" label="Website Chat" />
                  <CheckboxItem name="contactMethods" value="SMS/Text" label="SMS/Text" />
                  <CheckboxItem name="contactMethods" value="Social Media" label="Social Media" />
                  <CheckboxItem name="contactMethods" value="WhatsApp" label="WhatsApp" />
                </div>
                <input type="text" name="contactMethodsOther" placeholder="Other contact methods..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors text-sm" />
              </div>

              <div className="mb-8">
                <InputLabel>Do you receive repetitive customer questions?</InputLabel>
                <div className="flex gap-4 mt-3">
                  <RadioItem name="repetitiveQuestions" value="Yes" label="Yes" />
                  <RadioItem name="repetitiveQuestions" value="No" label="No" />
                </div>
              </div>

              <div>
                <InputLabel>Would you like AI to assist or automate customer support?</InputLabel>
                <div className="flex gap-4 mt-3">
                  <RadioItem name="aiSupport" value="Yes" label="Yes" />
                  <RadioItem name="aiSupport" value="No" label="No" />
                  <RadioItem name="aiSupport" value="Maybe" label="Maybe" />
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section className="glass p-8 md:p-12 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
              <SectionTitle num="6" title="Sales & Lead Generation" />
              
              <div className="mb-8">
                <InputLabel>How do you currently generate leads?</InputLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 mt-3">
                  <CheckboxItem name="leadGen" value="Website" label="Website" />
                  <CheckboxItem name="leadGen" value="Google Ads" label="Google Ads" />
                  <CheckboxItem name="leadGen" value="Facebook Ads" label="Facebook Ads" />
                  <CheckboxItem name="leadGen" value="SEO" label="SEO" />
                  <CheckboxItem name="leadGen" value="Referrals" label="Referrals" />
                  <CheckboxItem name="leadGen" value="Social Media" label="Social Media" />
                  <CheckboxItem name="leadGen" value="Cold Outreach" label="Cold Outreach" />
                </div>
                <input type="text" name="leadGenOther" placeholder="Other lead sources..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-sm" />
              </div>

              <div className="mb-8">
                <InputLabel>Do you currently follow up with leads automatically?</InputLabel>
                <div className="flex gap-4 mt-3">
                  <RadioItem name="autoFollowUp" value="Yes" label="Yes" />
                  <RadioItem name="autoFollowUp" value="No" label="No" />
                </div>
              </div>

              <div>
                <InputLabel>Would you like AI to automate lead qualification and follow-up?</InputLabel>
                <div className="flex gap-4 mt-3">
                  <RadioItem name="aiLeadQual" value="Yes" label="Yes" />
                  <RadioItem name="aiLeadQual" value="No" label="No" />
                  <RadioItem name="aiLeadQual" value="Maybe" label="Maybe" />
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section className="glass p-8 md:p-12 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-accent-indigo" />
              <SectionTitle num="7" title="Internal Operations" />
              <p className="text-slate-400 mb-6 text-sm">Which areas would you like to automate?</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <CheckboxItem name="operations" value="Scheduling" label="Scheduling" />
                <CheckboxItem name="operations" value="Customer support" label="Customer support" />
                <CheckboxItem name="operations" value="Lead follow-up" label="Lead follow-up" />
                <CheckboxItem name="operations" value="Reporting" label="Reporting" />
                <CheckboxItem name="operations" value="Internal communication" label="Internal communication" />
                <CheckboxItem name="operations" value="Data entry" label="Data entry" />
                <CheckboxItem name="operations" value="Employee onboarding" label="Employee onboarding" />
                <CheckboxItem name="operations" value="Document search" label="Document search" />
                <CheckboxItem name="operations" value="Inventory inquiries" label="Inventory inquiries" />
                <CheckboxItem name="operations" value="Workflow approvals" label="Workflow approvals" />
              </div>
              <input type="text" name="operationsOther" placeholder="Other operations to automate..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-indigo transition-colors text-sm" />
            </section>

            {/* Section 8 */}
            <section className="glass p-8 md:p-12 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-fuchsia-500" />
              <SectionTitle num="8" title="AI Knowledge Systems" />
              
              <div className="mb-8">
                <InputLabel>Does your business have documents/manuals/SOPs that employees frequently search for?</InputLabel>
                <div className="flex gap-4 mt-3">
                  <RadioItem name="hasDocs" value="Yes" label="Yes" />
                  <RadioItem name="hasDocs" value="No" label="No" />
                </div>
              </div>

              <div>
                <InputLabel>Would you like an internal AI assistant trained on your company knowledge?</InputLabel>
                <div className="flex gap-4 mt-3">
                  <RadioItem name="wantAiAssistant" value="Yes" label="Yes" />
                  <RadioItem name="wantAiAssistant" value="No" label="No" />
                  <RadioItem name="wantAiAssistant" value="Maybe" label="Maybe" />
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section className="glass p-8 md:p-12 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
              <SectionTitle num="9" title="Website & SEO" />
              
              <div className="mb-8">
                <InputLabel>Are you satisfied with your current online presence?</InputLabel>
                <div className="flex gap-4 mt-3">
                  <RadioItem name="satisfiedOnline" value="Yes" label="Yes" />
                  <RadioItem name="satisfiedOnline" value="No" label="No" />
                </div>
              </div>

              <div>
                <InputLabel>Would you like help with:</InputLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <CheckboxItem name="seoHelp" value="AI-powered SEO" label="AI-powered SEO" />
                  <CheckboxItem name="seoHelp" value="Website redesign" label="Website redesign" />
                  <CheckboxItem name="seoHelp" value="AI chatbot integration" label="AI chatbot integration" />
                  <CheckboxItem name="seoHelp" value="Local SEO" label="Local SEO" />
                  <CheckboxItem name="seoHelp" value="Content generation" label="Content generation" />
                  <CheckboxItem name="seoHelp" value="Website automation" label="Website automation" />
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section className="glass p-8 md:p-12 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-accent-cyan" />
              <SectionTitle num="10" title="Budget & Timeline" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <InputLabel>Estimated Budget Range</InputLabel>
                  <div className="flex flex-col gap-3 mt-3">
                    <RadioItem name="budget" value="$1,000 – $3,000" label="$1,000 – $3,000" />
                    <RadioItem name="budget" value="$3,000 – $10,000" label="$3,000 – $10,000" />
                    <RadioItem name="budget" value="$10,000 – $25,000" label="$10,000 – $25,000" />
                    <RadioItem name="budget" value="$25,000+" label="$25,000+" />
                  </div>
                </div>
                <div>
                  <InputLabel>Desired Timeline</InputLabel>
                  <div className="flex flex-col gap-3 mt-3">
                    <RadioItem name="timeline" value="ASAP" label="ASAP" />
                    <RadioItem name="timeline" value="Within 30 Days" label="Within 30 Days" />
                    <RadioItem name="timeline" value="Within 90 Days" label="Within 90 Days" />
                    <RadioItem name="timeline" value="Exploring Options" label="Exploring Options" />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 11 */}
            <section className="glass p-8 md:p-12 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-accent-indigo" />
              <SectionTitle num="11" title="Final Question" />
              
              <div>
                <InputLabel>If you could solve ONE major problem in your business using AI, what would it be? *</InputLabel>
                <textarea 
                  name="finalProblem" 
                  required
                  rows={5}
                  placeholder="Tell us about the bottleneck you want to eliminate..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 mt-3 focus:outline-none focus:border-accent-indigo transition-colors"
                />
              </div>
            </section>

            {/* Cloudflare Turnstile */}
            <div className="flex justify-center py-4">
              {siteKey === null ? (
                <p className="text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">Loading Security Shield...</p>
              ) : siteKey ? (
                <div ref={turnstileRef} />
              ) : null}
            </div>
            <Script 
              src="https://challenges.cloudflare.com/turnstile/v0/api.js" 
              strategy="afterInteractive" 
            />

            {/* Submit Button */}
            <div className="text-center pt-8 border-t border-white/10">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full md:w-auto px-16 py-6 bg-gradient-to-r from-accent-cyan to-accent-indigo text-black text-lg font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 shadow-[0_0_40px_rgba(6,182,212,0.3)]"
              >
                {status === 'loading' ? 'Analyzing Data...' : 'Submit Discovery Profile'}
              </button>
              {status === 'error' && (
                <p className="text-red-400 mt-4 font-bold">Please complete the captcha and try again.</p>
              )}
              <p className="text-slate-500 text-xs mt-6 uppercase tracking-widest">
                All information is securely encrypted and kept strictly confidential.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
