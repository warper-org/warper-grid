import { CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Success Animation */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">Payment Successful!</h1>
        
        <p className="text-zinc-400 text-lg mb-8">
          Thank you for purchasing WarperGrid. Your license key has been sent to your email.
        </p>

        {/* Info Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 text-left">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span className="text-white font-medium">What's Next?</span>
          </div>
          <ul className="space-y-3 text-zinc-400 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">1.</span>
              <span>Check your email for your WarperGrid license key</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">2.</span>
              <span>Install WarperGrid via npm or bun</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">3.</span>
              <span>Activate your license in your app to unlock all features</span>
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
          <a
            href="#demo"
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Try the Demo
          </a>
        </div>
      </div>
    </div>
  );
}
