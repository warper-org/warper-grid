import { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Github, 
  Cpu,
  Database,
  Filter,
  Download,
  Edit3,
  Columns,
  BarChart3,
  Layers,
  Terminal,
  Menu,
  X,
  Shield,
  Play,
  ChevronDown,
  MousePointer2,
  Gauge,
  Code2
} from 'lucide-react';
import { CodeBlock } from '../components/CodeBlock';

// ============================================================================
// Animated Components
// ============================================================================

function AnimatedCounter({ value, suffix = '', duration = 2000 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const step = value / (duration / 16);
          const animate = () => {
            start += step;
            if (start < value) {
              setCount(Math.floor(start));
              requestAnimationFrame(animate);
            } else {
              setCount(value);
            }
          };
          animate();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function FloatingGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(255 255 255 / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(255 255 255 / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
      
      {/* Floating gradient orbs - smaller on mobile */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>
  );
}

// ============================================================================
// Data
// ============================================================================

const features = [
  {
    icon: Zap,
    title: "WASM Virtualization",
    description: "Rust-powered engine renders 10M+ rows at 120 FPS with O(1) lookups.",
    metric: "120 FPS"
  },
  {
    icon: Database,
    title: "SQL Query Engine",
    description: "Run SELECT, WHERE, ORDER BY, GROUP BY directly on grid data.",
    metric: "sql.js"
  },
  {
    icon: Edit3,
    title: "Excel-like Editing",
    description: "Cell editing, undo/redo, formulas, range selection, copy/paste.",
    metric: "Native"
  },
  {
    icon: Columns,
    title: "Column Operations",
    description: "Pin, drag, resize, group. Header spanning and column menus.",
    metric: "Flexible"
  },
  {
    icon: BarChart3,
    title: "Rich Renderers",
    description: "Custom React components. Progress bars, badges, sparklines.",
    metric: "Custom"
  },
  {
    icon: Download,
    title: "Universal Export",
    description: "CSV, Excel with styles, JSON, PDF. Full clipboard support.",
    metric: "4 Formats"
  },
  {
    icon: Layers,
    title: "Plugin System",
    description: "Modular attach()/detach() API. Tree-shakeable. ~6KB core.",
    metric: "Modular"
  },
  {
    icon: Filter,
    title: "Aggregation",
    description: "Row grouping, pivot tables, sum/avg/count aggregations.",
    metric: "Built-in"
  },
  {
    icon: Shield,
    title: "Enterprise Ready",
    description: "Master-detail, tree data, infinite scroll. Full ARIA support.",
    metric: "A11y"
  }
];

const pricingTiers = [
  {
    name: "Community",
    price: "0",
    period: "forever",
    description: "For open-source and learning",
    features: ["Core grid", "Sorting & filtering", "Column resizing", "Row selection", "CSV export"],
    cta: "Coming 2027",
    ctaLink: "#",
    disabled: true
  },
  {
    name: "Enterprise",
    price: "499",
    period: "per dev / year",
    description: "Full power for production",
    features: ["All grid features", "WASM virtualization", "SQL query engine", "Excel-like editing", "Master-detail views", "Excel/PDF export", "Priority support", "7-day free trial"],
    highlighted: true,
    cta: "Start Free Trial",
    ctaLink: "#trial"
  },
  {
    name: "Enterprise+",
    price: "999",
    period: "per dev / year",
    description: "Dedicated support & SLA",
    features: ["Everything in Enterprise", "Dedicated Slack", "Priority bug fixes", "Architecture review", "Custom plugins"],
    cta: "Coming 2027",
    ctaLink: "#",
    disabled: true
  }
];

const codeExample = `import { WarperGrid } from '@warper/grid';

const columns = [
  { field: 'id', width: 80 },
  { field: 'name', flex: 1 },
  { field: 'status', cellRenderer: StatusBadge }
];

// Enable only what you need
grid.attach(['sorting', 'filtering', 'pagination']);

export default function App() {
  return (
    <WarperGrid
      data={data}
      columns={columns}
      height={600}
    />
  );
}`;

// ============================================================================
// Components
// ============================================================================

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-xl group-hover:bg-emerald-500/30 transition-all duration-500" />
              <div className="relative p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl group-hover:border-emerald-500/50 transition-all duration-300">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">
                Warper<span className="text-emerald-400">Grid</span>
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {['Features', 'Pricing', 'Docs', 'Demo'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all duration-300"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a 
              href="https://github.com/warper-org/warper-grid"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all duration-300"
            >
              <Github className="w-5 h-5" />
            </a>
            
            <a 
              href="#demo"
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              <Play className="w-4 h-4" />
              Demo
            </a>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all duration-300"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className={`md:hidden overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-64 pb-4' : 'max-h-0'}`}>
          <div className="pt-2 space-y-1">
            {['Features', 'Pricing', 'Docs', 'Demo'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all duration-300"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 sm:pt-16 overflow-hidden">
      <FloatingGrid />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-sm animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-zinc-400">v1.0 — Rust/WASM Engine</span>
            </div>

            {/* Headline */}
            <div 
              className="space-y-4 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                The React Grid
                <br />
                <span className="text-emerald-400">
                  at Warp Speed
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-lg leading-relaxed">
                Handle <span className="text-white font-semibold">10 million rows</span> at 120 FPS. 
                SQL queries. Excel editing. Powered by Rust/WASM.
              </p>
            </div>

            {/* CTA */}
            <div 
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              <a 
                href="#trial"
                className="group flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5 text-sm sm:text-base"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
              <a 
                href="#demo"
                className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-semibold rounded-xl transition-all duration-300 text-sm sm:text-base"
              >
                <Terminal className="w-4 h-4" />
                View Demo
              </a>
            </div>

            {/* Stats Row */}
            <div 
              className="flex flex-wrap justify-center sm:justify-start gap-6 sm:gap-8 pt-4 animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              {[
                { value: 10, suffix: 'M+', label: 'Rows' },
                { value: 120, suffix: '', label: 'FPS' },
                { value: 6, suffix: 'KB', label: 'Core' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs sm:text-sm text-zinc-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Code Block */}
          <div 
            className="animate-fade-in lg:animate-slide-in-right order-first lg:order-last"
            style={{ animationDelay: '0.5s' }}
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl" />
              
              <CodeBlock 
                code={codeExample}
                lang="tsx"
                filename="App.tsx"
              />
            </div>
          </div>
        </div>

        {/* Scroll Indicator - hidden on mobile */}
        <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-zinc-600" />
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="py-16 sm:py-24 lg:py-32 relative">
      <FloatingGrid />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-2xl mb-12 sm:mb-16 lg:mb-20">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-4">
            <Gauge className="w-4 h-4" />
            FEATURES
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 sm:mb-6">
            Enterprise power.
            <br />
            <span className="text-zinc-500">Developer velocity.</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400">
            Every feature you need, built for performance. Modular plugins, 
            type-safe APIs, and a Rust/WASM core.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((feature, idx) => (
            <div 
              key={feature.title}
              className="group relative p-4 sm:p-5 lg:p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl sm:rounded-2xl hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-500 cursor-default"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* Icon */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-2.5 bg-zinc-800/50 rounded-lg sm:rounded-xl text-zinc-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-300">
                  <feature.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors duration-300">
                  {feature.metric}
                </span>
              </div>
              
              {/* Content */}
              <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl" />
              </div>
            </div>
          ))}
        </div>

        {/* React Note */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-cyan-500/10 rounded-lg sm:rounded-xl shrink-0">
            <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </div>
          <div className="text-sm sm:text-base">
            <span className="text-white font-medium">React-First Design</span>
            <span className="text-zinc-400 sm:ml-2 block sm:inline mt-1 sm:mt-0">
              Built exclusively for React. Vue, Angular, Svelte coming soon.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CodeShowcase() {
  const installCode = `# Install with your package manager
bun add @warper/grid

# or npm / yarn / pnpm
npm install @warper/grid`;

  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-zinc-900/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          {/* Left - Text */}
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <Terminal className="w-4 h-4" />
              DEVELOPER EXPERIENCE
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Simple API.
              <br />
              <span className="text-zinc-500">Zero friction.</span>
            </h2>
            
            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
              Get started in under a minute. Use <code className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-zinc-800 rounded text-emerald-400 text-xs sm:text-sm font-mono">attach()</code> to 
              enable features. Every plugin is tree-shakeable — ship only what you use.
            </p>
            
            <div className="space-y-3 sm:space-y-4">
              {[
                'Full TypeScript with intelligent autocomplete',
                'shadcn/ui components for beautiful defaults',
                'React 18+ with concurrent rendering',
                'Modular plugins — ~6KB core'
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 sm:gap-3 group">
                  <div className="p-1 bg-zinc-800 rounded-lg group-hover:bg-emerald-500/20 transition-colors duration-300 shrink-0">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  </div>
                  <span className="text-zinc-300 text-sm sm:text-base">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Code */}
          <div className="space-y-3 sm:space-y-4">
            <CodeBlock 
              code={installCode}
              lang="bash"
              filename="Terminal"
            />
            <CodeBlock 
              code={codeExample}
              lang="tsx"
              filename="App.tsx"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-16 sm:py-24 lg:py-32 relative">
      <FloatingGrid />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            PRICING
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 sm:mb-6">
            Simple pricing.
            <br />
            <span className="text-zinc-500">No surprises.</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400">
            Start free, upgrade when ready. No per-seat gotchas.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {pricingTiers.map((tier) => (
            <div 
              key={tier.name}
              className={`relative p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border transition-all duration-500 ${
                tier.highlighted 
                  ? 'bg-zinc-900 border-emerald-500/50 shadow-xl shadow-emerald-500/10 sm:scale-[1.02] order-first sm:order-none' 
                  : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-zinc-900 text-xs font-bold rounded-full">
                  Popular
                </div>
              )}

              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold">${tier.price}</span>
                  <span className="text-zinc-500 text-xs sm:text-sm">/{tier.period}</span>
                </div>
                <p className="text-zinc-500 text-xs sm:text-sm mt-2">{tier.description}</p>
              </div>

              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.disabled ? (
                <div className="block w-full py-2.5 sm:py-3 text-center font-semibold rounded-lg sm:rounded-xl text-sm sm:text-base bg-zinc-800/50 text-zinc-500 cursor-not-allowed">
                  {tier.cta}
                </div>
              ) : (
                <a 
                  href={tier.ctaLink}
                  className={`block w-full py-2.5 sm:py-3 text-center font-semibold rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base ${
                    tier.highlighted
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-900'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {tier.cta}
                </a>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />
      <div className="absolute inset-0 bg-zinc-950/50" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="p-6 sm:p-8 lg:p-12 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl">
          <div className="inline-flex p-2.5 sm:p-3 bg-emerald-500/10 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
            <MousePointer2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
          </div>
          
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
            Ready for <span className="text-emerald-400">10M+ rows</span>?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 mb-6 sm:mb-8 lg:mb-10">
            Start your 7-day free trial. No credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <a 
              href="#trial"
              className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/25 text-sm sm:text-base"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </a>
            <a 
              href="https://github.com/warper-org/warper-grid"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all duration-300 text-sm sm:text-base"
            >
              <Github className="w-4 h-4 sm:w-5 sm:h-5" />
              Star on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10 sm:py-12 lg:py-16 border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Logo */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 bg-zinc-900 border border-zinc-800 rounded-lg sm:rounded-xl">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
              <span className="text-base sm:text-lg font-bold">WarperGrid</span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm max-w-xs">
              The high-performance React data grid powered by Rust/WASM.
            </p>
          </div>

          {/* Links */}
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Demo'] },
            { title: 'Resources', links: ['Documentation', 'API Reference'] },
            { title: 'Legal', links: [{ name: 'Terms of Service', href: '#terms' }, { name: 'License Agreement', href: '#license' }] },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">{group.title}</h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {group.links.map((link) => {
                  const linkName = typeof link === 'string' ? link : link.name;
                  const linkHref = typeof link === 'string' ? `#${link.toLowerCase()}` : link.href;
                  return (
                    <li key={linkName}>
                      <a href={linkHref} className="text-xs sm:text-sm text-zinc-500 hover:text-emerald-400 transition-colors duration-300">
                        {linkName}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 sm:pt-8 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <p className="text-zinc-500 text-xs sm:text-sm">
            © 2026 WarperGrid. All rights reserved.
          </p>
          <p className="text-zinc-600 text-[10px] sm:text-xs">
            Enterprise license includes 1 year of updates and support.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slide-in-right {
    from { opacity: 0; transform: translateX(40px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.8s ease-out forwards;
    opacity: 0;
  }
  
  .lg\\:animate-slide-in-right {
    animation: slide-in-right 0.8s ease-out forwards;
    opacity: 0;
  }
`;

// ============================================================================
// Main Component
// ============================================================================

export default function HomePage() {
  useEffect(() => {
    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
    return () => styleEl.remove();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30">
      <Navbar />
      <Hero />
      <Features />
      <CodeShowcase />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
