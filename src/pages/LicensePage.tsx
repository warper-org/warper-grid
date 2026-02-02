import { ArrowLeft, Sparkles, Shield, AlertTriangle, Check } from 'lucide-react';

export default function LicensePage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold">License Agreement</h1>
          <p className="text-zinc-400 mt-2">Commercial Software License — Version 1.0</p>
        </div>
      </header>

      {/* License Type Banner */}
      <div className="bg-zinc-900/50 border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-amber-400">Closed-Source Commercial License</h2>
              <p className="text-zinc-400 text-sm mt-1">
                WarperGrid is proprietary software. This license grants usage rights only — not ownership or source code access.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-invert prose-zinc max-w-none">
          
          {/* License Overview */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-white">License Overview</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <h3 className="font-semibold text-emerald-400 mb-2">Enterprise License</h3>
                <p className="text-3xl font-bold">$499</p>
                <p className="text-zinc-500 text-sm">per developer / year</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    7-day free trial included
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    All features unlocked
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    Priority email support
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    1 year of updates
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl opacity-60">
                <h3 className="font-semibold text-zinc-500 mb-2">Additional Plans</h3>
                <p className="text-xl font-bold text-zinc-500">Coming 2027</p>
                <p className="text-zinc-600 text-sm mt-2">
                  Community and Enterprise+ tiers will be available in 2027 with additional options for open-source 
                  projects and enterprise SLA requirements.
                </p>
              </div>
            </div>
          </section>

          {/* Important Notice */}
          <section className="mb-12 p-6 bg-red-500/5 border border-red-500/20 rounded-xl">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-400 mb-2">Important Notice</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  This software is <strong className="text-white">CLOSED-SOURCE</strong> and protected by intellectual 
                  property laws. Unauthorized copying, modification, distribution, or reverse engineering is strictly 
                  prohibited and may result in legal action. By using this software, you acknowledge that you have read, 
                  understood, and agree to be bound by this License Agreement.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">1. Definitions</h2>
            <ul className="space-y-4 text-zinc-400">
              <li><strong className="text-white">"Software"</strong> refers to WarperGrid, including all associated 
              documentation, files, and updates.</li>
              <li><strong className="text-white">"Licensor"</strong> refers to Warper Technologies, the owner and 
              developer of the Software.</li>
              <li><strong className="text-white">"Licensee"</strong> or "You" refers to the individual or entity 
              that has purchased or is evaluating the Software.</li>
              <li><strong className="text-white">"Developer"</strong> refers to any individual who directly uses 
              the Software to develop applications.</li>
              <li><strong className="text-white">"End Product"</strong> refers to any application or project that 
              incorporates the Software.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">2. Grant of License</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Subject to the terms of this Agreement and payment of applicable fees, the Licensor grants you a 
              limited, non-exclusive, non-transferable license to:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4">
              <li>Use the Software for the number of developers specified in your order</li>
              <li>Integrate the Software into unlimited End Products</li>
              <li>Deploy End Products to production environments</li>
              <li>Receive software updates for the duration of your subscription</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">3. Trial License</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              The Software includes a <strong className="text-emerald-400">7-day free trial</strong> of the Enterprise License. 
              During the trial period:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4">
              <li>All Enterprise features are fully accessible</li>
              <li>The trial is limited to development and evaluation purposes only</li>
              <li><strong className="text-white">Production use is strictly prohibited</strong> during the trial</li>
              <li>The trial automatically expires after 7 calendar days</li>
              <li>Only one trial per individual or organization is permitted</li>
              <li>Circumventing trial limitations is a violation of this Agreement</li>
            </ul>
            <p className="text-zinc-400 leading-relaxed mt-4">
              To continue using the Software after the trial period, you must purchase an Enterprise License.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">4. License Restrictions</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">You expressly agree NOT to:</p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4">
              <li>Attempt to obtain, reverse engineer, or reconstruct the source code</li>
              <li>Decompile, disassemble, or otherwise attempt to derive source code</li>
              <li>Modify, adapt, translate, or create derivative works of the Software</li>
              <li>Redistribute, resell, lease, rent, or sublicense the Software</li>
              <li>Share license keys, credentials, or access with unauthorized parties</li>
              <li>Remove, alter, or obscure any proprietary notices or labels</li>
              <li>Use the Software to create a competing or similar product</li>
              <li>Use the Software beyond the licensed number of developers</li>
              <li>Transfer your license to another party without written consent</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">5. Intellectual Property Rights</h2>
            <p className="text-zinc-400 leading-relaxed">
              The Software is proprietary and confidential. All title, copyright, trade secrets, patents, and other 
              intellectual property rights in the Software remain exclusively with the Licensor. This Agreement does 
              not grant you any ownership rights. The Software is protected by copyright laws, international treaty 
              provisions, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">6. Subscription and Renewal</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              The Enterprise License is sold as an annual subscription:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4">
              <li>License fee: $499 per developer per year</li>
              <li>Subscriptions include all updates released during the subscription period</li>
              <li>Priority email support is included with active subscriptions</li>
              <li>Upon expiration, you may continue using the last version received</li>
              <li>New updates and support require an active subscription</li>
              <li>Renewal is available at the then-current pricing</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">7. No Warranty</h2>
            <p className="text-zinc-400 leading-relaxed uppercase text-sm">
              THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. THE LICENSOR DISCLAIMS ALL WARRANTIES, 
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS 
              FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. THE LICENSOR DOES NOT WARRANT THAT THE SOFTWARE 
              WILL MEET YOUR REQUIREMENTS, OPERATE WITHOUT INTERRUPTION, OR BE ERROR-FREE.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">8. Limitation of Liability</h2>
            <p className="text-zinc-400 leading-relaxed uppercase text-sm">
              IN NO EVENT SHALL THE LICENSOR BE LIABLE FOR ANY SPECIAL, INCIDENTAL, INDIRECT, CONSEQUENTIAL, OR 
              PUNITIVE DAMAGES WHATSOEVER, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, BUSINESS 
              INTERRUPTION, LOSS OF INFORMATION, OR ANY OTHER PECUNIARY LOSS ARISING OUT OF THE USE OR INABILITY 
              TO USE THE SOFTWARE. IN NO EVENT SHALL THE LICENSOR'S TOTAL LIABILITY EXCEED THE LICENSE FEES PAID 
              BY YOU IN THE TWELVE (12) MONTHS PRIOR TO THE CLAIM.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">9. Termination</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              This Agreement is effective until terminated:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4">
              <li>You may terminate at any time by destroying all copies of the Software</li>
              <li>The Licensor may terminate immediately upon breach of any term</li>
              <li>Upon termination, you must cease all use and destroy all copies</li>
              <li>No refunds are provided for early termination</li>
              <li>Sections 5, 7, 8, 9, and 10 survive termination</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">10. General Provisions</h2>
            <ul className="space-y-4 text-zinc-400">
              <li><strong className="text-white">Governing Law:</strong> This Agreement is governed by the laws of 
              the State of Delaware, USA, without regard to conflict of law principles.</li>
              <li><strong className="text-white">Entire Agreement:</strong> This Agreement constitutes the entire 
              agreement between the parties and supersedes all prior negotiations and agreements.</li>
              <li><strong className="text-white">Severability:</strong> If any provision is found unenforceable, 
              the remaining provisions shall remain in full force and effect.</li>
              <li><strong className="text-white">Waiver:</strong> Failure to enforce any provision shall not 
              constitute a waiver of future enforcement.</li>
              <li><strong className="text-white">Assignment:</strong> You may not assign this Agreement without 
              prior written consent from the Licensor.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">11. Contact</h2>
            <p className="text-zinc-400 leading-relaxed">
              For licensing inquiries, please contact:
            </p>
            <div className="mt-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <p className="font-semibold text-white">Warper Technologies</p>
              <p className="text-emerald-400">e2vylu0d0@mozmail.com</p>
            </div>
          </section>

          {/* Acceptance */}
          <section className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <p className="text-zinc-400 text-sm leading-relaxed">
              By downloading, installing, or using the Software, you acknowledge that you have read this License 
              Agreement, understand it, and agree to be bound by its terms and conditions. If you do not agree, 
              do not download, install, or use the Software.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-zinc-500 text-sm">© 2026 WarperGrid. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#terms" className="text-zinc-500 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="#license" className="text-zinc-500 hover:text-white text-sm transition-colors">License Agreement</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
