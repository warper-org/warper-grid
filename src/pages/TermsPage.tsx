import { ArrowLeft, Sparkles } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <a href="#home" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold">WarperGrid</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
          <p className="text-zinc-400 mt-2">Last updated: February 1, 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">1. Acceptance of Terms</h2>
            <p className="text-zinc-400 leading-relaxed">
              By accessing or using WarperGrid ("the Software"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, you may not use the Software. These terms constitute a legally 
              binding agreement between you and Warper Technologies ("we", "us", or "our").
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">2. Description of Service</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              WarperGrid is a high-performance React data grid component powered by Rust/WebAssembly technology. 
              The Software is provided as a closed-source commercial product with the following licensing options:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4">
              <li><strong className="text-white">Enterprise License ($499/developer/year)</strong> — Full access to all features with a 7-day free trial</li>
              <li><strong className="text-zinc-500">Community License (Coming 2027)</strong> — Limited feature set for open-source projects</li>
              <li><strong className="text-zinc-500">Enterprise+ License (Coming 2027)</strong> — Enhanced support and SLA options</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">3. Free Trial</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              We offer a 7-day free trial of the Enterprise License. During the trial period:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4">
              <li>You have full access to all Enterprise features</li>
              <li>No credit card is required to start the trial</li>
              <li>The trial automatically expires after 7 days</li>
              <li>You may not use trial licenses for production applications</li>
              <li>Each individual or organization is entitled to one trial period</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">4. License Grant</h2>
            <p className="text-zinc-400 leading-relaxed">
              Subject to payment of applicable fees and compliance with these Terms, we grant you a non-exclusive, 
              non-transferable, limited license to use the Software for the number of developers specified in your 
              purchase. This license is per-developer and includes one year of updates and technical support from 
              the date of purchase.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">5. Restrictions</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">You may not:</p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4">
              <li>Reverse engineer, decompile, or disassemble the Software</li>
              <li>Modify, adapt, or create derivative works based on the Software</li>
              <li>Redistribute, sublicense, rent, lease, or lend the Software</li>
              <li>Remove or alter any proprietary notices or labels</li>
              <li>Use the Software to develop a competing product</li>
              <li>Share license keys or credentials with unauthorized parties</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">6. Intellectual Property</h2>
            <p className="text-zinc-400 leading-relaxed">
              The Software is closed-source and proprietary. All intellectual property rights, including but not 
              limited to copyrights, patents, trade secrets, and trademarks, remain the exclusive property of 
              Warper Technologies. Your license does not grant any ownership rights in the Software.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">7. Payment Terms</h2>
            <p className="text-zinc-400 leading-relaxed">
              License fees are billed annually in advance. All fees are non-refundable except as required by 
              applicable law. Prices are subject to change with 30 days notice. Failure to pay may result in 
              suspension or termination of your license.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">8. Support and Updates</h2>
            <p className="text-zinc-400 leading-relaxed">
              Enterprise licenses include one year of priority email support and access to all software updates 
              released during the subscription period. Support response times are typically within 2 business days. 
              After the subscription period ends, you may continue using the last version received but will not 
              receive new updates or support without renewal.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">9. Warranty Disclaimer</h2>
            <p className="text-zinc-400 leading-relaxed">
              THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT 
              NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND 
              NONINFRINGEMENT. WE DO NOT WARRANT THAT THE SOFTWARE WILL BE ERROR-FREE OR UNINTERRUPTED.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">10. Limitation of Liability</h2>
            <p className="text-zinc-400 leading-relaxed">
              IN NO EVENT SHALL WARPER TECHNOLOGIES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
              OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUE, WHETHER INCURRED DIRECTLY OR INDIRECTLY. 
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SOFTWARE IN THE TWELVE MONTHS 
              PRECEDING THE CLAIM.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">11. Termination</h2>
            <p className="text-zinc-400 leading-relaxed">
              We may terminate your license immediately if you breach these Terms. Upon termination, you must 
              cease all use of the Software and destroy all copies. Sections regarding intellectual property, 
              warranty disclaimer, and limitation of liability shall survive termination.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">12. Governing Law</h2>
            <p className="text-zinc-400 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, 
              United States, without regard to its conflict of law provisions. Any disputes shall be resolved in 
              the courts of Delaware.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">13. Contact Information</h2>
            <p className="text-zinc-400 leading-relaxed">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-emerald-400 mt-2">e2vylu0d0@mozmail.com</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-zinc-500 text-sm">© 2026 WarperGrid. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
