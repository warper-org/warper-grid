import { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Sparkles, 
  Check, 
  ArrowRight, 
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
  Code2,
  Key,
  CreditCard,
  ExternalLink,
  Mail,
  MessageCircle,
  BookOpen,
  FileText,
  Palette,
  Puzzle,
  Settings,
  Rocket
} from 'lucide-react';
import { CodeBlock } from '../components/CodeBlock';
import { getAppUrl } from '../lib/url';

// Dodo Payments Configuration
const DODO_ENVIRONMENT = import.meta.env.VITE_DODO_ENVIRONMENT || 'test_mode';
const IS_LIVE_MODE = DODO_ENVIRONMENT === 'live_mode';
const DODO_PRODUCT_ID = IS_LIVE_MODE
  ? import.meta.env.VITE_DODO_PRODUCT_ID_LIVE
  : import.meta.env.VITE_DODO_PRODUCT_ID_TEST;
const DODO_CHECKOUT_BASE = IS_LIVE_MODE 
  ? 'https://checkout.dodopayments.com' 
  : 'https://test.checkout.dodopayments.com';

// Build checkout URL with redirect
function getCheckoutUrl() {
  const baseUrl = `${DODO_CHECKOUT_BASE}/buy/${DODO_PRODUCT_ID}`;
  const successUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/#payment-success`
    : '';
  return successUrl ? `${baseUrl}?redirect_url=${encodeURIComponent(successUrl)}` : baseUrl;
}

const DODO_CHECKOUT_URL = getCheckoutUrl();

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
    icon: Filter,
    title: "Sorting & Filtering",
    description: "Multi-column sorting, text/number/date filters with custom filter UI.",
    metric: "Built-in"
  },
  {
    icon: Edit3,
    title: "Cell Editing",
    description: "Inline cell editing with validation, Tab/Enter navigation, and undo support.",
    metric: "Native"
  },
  {
    icon: Columns,
    title: "Column Operations",
    description: "Drag to reorder, resize columns, column menu with hide/show options.",
    metric: "Flexible"
  },
  {
    icon: Database,
    title: "SQL Query Panel",
    description: "Run SQL queries directly on grid data with sql.js integration.",
    metric: "sql.js"
  },
  {
    icon: Download,
    title: "Export",
    description: "Export to CSV, Excel, JSON, and PDF. Full clipboard copy/paste support.",
    metric: "4 Formats"
  },
  {
    icon: Layers,
    title: "Row Grouping",
    description: "Group rows by columns, expandable groups, aggregation functions.",
    metric: "Grouping"
  },
  {
    icon: BarChart3,
    title: "Master-Detail",
    description: "Expandable detail rows with custom React components.",
    metric: "Nested"
  },
  {
    icon: Shield,
    title: "Selection & Clipboard",
    description: "Row selection, cell range selection, copy/paste with keyboard shortcuts.",
    metric: "Excel-like"
  },
  {
    icon: Zap,
    title: "Plugin System",
    description: "Modular attach()/detach() API. Only load what you need.",
    metric: "Modular"
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
    cta: "Buy License",
    ctaLink: DODO_CHECKOUT_URL,
    isDodo: true
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

const codeExample = `import { WarperGrid, LicenseProvider } from '@itsmeadarsh/warper-grid';

const columns = [
  { field: 'id', width: 80 },
  { field: 'name', flex: 1 },
  { field: 'status', cellRenderer: StatusBadge }
];

// Enable only what you need
grid.attach(['sorting', 'filtering', 'pagination']);

export default function App() {
  return (
    <LicenseProvider>
      <WarperGrid
        data={data}
        columns={columns}
        height={600}
      />
    </LicenseProvider>
  );
}`;

const installCodeExample = `# Install WarperGrid
bun add @itsmeadarsh/warper-grid

# or with npm
npm install @itsmeadarsh/warper-grid`;

const licenseCodeExample = `// Activate your license (one-time setup)
import { validateAndActivateLicense } from '@itsmeadarsh/warper-grid';

const result = await validateAndActivateLicense(
  'WG-XXXX-XXXX-XXXX'  // Your license key from email
);

if (result.success) {
  console.log('License activated!', result.license);
  // All Enterprise features unlocked ✓
}`;

const fullUsageExample = `import { useRef } from 'react';
import { 
  WarperGrid, 
  LicenseProvider,
  type WarperGridRef,
  type ColumnDef
} from '@itsmeadarsh/warper-grid';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const columns: ColumnDef<User>[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
  { id: 'email', field: 'email', headerName: 'Email', width: 200 },
  { 
    id: 'status', 
    field: 'status', 
    headerName: 'Status',
    cellRenderer: ({ value }) => (
      <span className={\`badge \${value}\`}>{value}</span>
    )
  }
];

export default function DataGrid() {
  const gridRef = useRef<WarperGridRef<User>>(null);

  const handleGridReady = () => {
    // Attach plugins after grid is ready
    gridRef.current?.attach([
      'sorting',
      'filtering', 
      'pagination',
      'cell-editing',
      'export',
      'sql-query'
    ]);
  };

  const handleExport = () => {
    gridRef.current?.api.exportToExcel({ 
      fileName: 'users.xlsx' 
    });
  };

  return (
    <LicenseProvider>
      <div className="grid-container">
        <button onClick={handleExport}>
          Export to Excel
        </button>
        <WarperGrid
          ref={gridRef}
          data={users}
          columns={columns}
          height={600}
          onGridReady={handleGridReady}
        />
      </div>
    </LicenseProvider>
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
            {[{ name: 'Features', href: '#features' }, { name: 'Pricing', href: '#pricing' }, { name: 'Docs', href: '#docs/getting-started' }, { name: 'Demo', href: '#demo' }].map((item) => (
              <a 
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all duration-300"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a 
              href="https://discord.gg/WC5npzPx3s"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all duration-300"
              title="Join Discord"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>

            <a 
              href="#demo"
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm rounded-xl transition-all duration-300"
            >
              <Play className="w-4 h-4" />
              Demo
            </a>

            <a 
              href={DODO_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              <CreditCard className="w-4 h-4" />
              Buy
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
            {[{ name: 'Features', href: '#features' }, { name: 'Pricing', href: '#pricing' }, { name: 'Docs', href: '#docs/getting-started' }, { name: 'Demo', href: '#demo' }].map((item) => (
              <a 
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all duration-300"
              >
                {item.name}
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
              <span className="text-zinc-400 text-xs sm:text-sm">v1.0 — Rust/WASM Engine</span>
            </div>

            {/* Headline */}
            <div 
              className="space-y-3 sm:space-y-4 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                The React Grid
                <br />
                <span className="text-emerald-400">
                  at Warp Speed
                </span>
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-zinc-400 max-w-lg leading-relaxed">
                Handle <span className="text-white font-semibold">10 million rows</span> at 120 FPS. 
                SQL queries. Excel editing. Powered by Rust/WASM.
              </p>
            </div>

            {/* CTA */}
            <div 
              className="flex flex-col sm:flex-row gap-2 sm:gap-4 animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              <a 
                href={DODO_CHECKOUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5 text-xs sm:text-base"
              >
                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Buy License
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
              <a 
                href="#demo"
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-300 text-xs sm:text-base"
              >
                <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                View Demo
              </a>
            </div>

            {/* Stats Row */}
            <div 
              className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-8 pt-4 animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              {[
                { value: 10, suffix: 'M+', label: 'Rows' },
                { value: 120, suffix: '', label: 'FPS' },
                { value: 7, suffix: '-Day', label: 'Trial' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl sm:text-3xl font-bold text-white">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-[10px] sm:text-sm text-zinc-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Code Block */}
          <div 
            className="animate-fade-in lg:animate-slide-in-right order-first lg:order-last w-full min-w-0 overflow-hidden"
            style={{ animationDelay: '0.5s' }}
          >
            <div className="relative w-full min-w-0">
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
  const [activeTab, setActiveTab] = useState<'install' | 'license' | 'usage'>('install');

  return (
    <section id="docs" className="py-16 sm:py-24 lg:py-32 bg-zinc-900/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-start">
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
                'Modular plugin system',
                'License key included with purchase',
                'Works offline with secure caching'
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

          {/* Right - Code Tabs */}
          <div className="space-y-3 sm:space-y-4 w-full min-w-0 overflow-hidden">
            {/* Tab Buttons */}
            <div className="flex gap-1 p-0.5 sm:p-1 bg-zinc-900 rounded-lg sm:rounded-xl border border-zinc-800">
              {[
                { id: 'install', label: 'Install', icon: Terminal },
                { id: 'license', label: 'License', icon: Key },
                { id: 'usage', label: 'Usage', icon: Code2 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as 'install' | 'license' | 'usage')}
                  className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-zinc-900'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  {tab.label}
                </button>
              ))}            </div>

            {/* Tab Content */}
            <div className="space-y-4 w-full min-w-0">
              {activeTab === 'install' && (
                <>
                  <CodeBlock 
                    code={installCodeExample}
                    lang="bash"
                    filename="Terminal"
                  />
                  <CodeBlock 
                    code={codeExample}
                    lang="tsx"
                    filename="App.tsx"
                  />
                </>
              )}
              
              {activeTab === 'license' && (
                <>
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                        <Key className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1">License Key Activation</h4>
                        <p className="text-sm text-zinc-400">
                          After purchase, you'll receive a license key via email. 
                          Activate it once to unlock all Enterprise features.
                        </p>
                      </div>
                    </div>
                  </div>
                  <CodeBlock 
                    code={licenseCodeExample}
                    lang="typescript"
                    filename="activate-license.ts"
                  />
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <h4 className="text-sm font-medium text-zinc-300 mb-2">License Features:</h4>
                    <ul className="text-xs text-zinc-500 space-y-1">
                      <li>• One license per developer seat</li>
                      <li>• Works offline after activation</li>
                      <li>• 1 year of updates included</li>
                      <li>• 7-day free trial</li>
                    </ul>
                  </div>
                </>
              )}
              
              {activeTab === 'usage' && (
                <CodeBlock 
                  code={fullUsageExample}
                  lang="tsx"
                  filename="DataGrid.tsx"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Documentation() {
  const docs = [
    {
      icon: Rocket,
      title: 'Getting Started',
      description: 'Installation, setup, and your first grid in under 5 minutes.',
      href: '#docs/getting-started',
      color: 'emerald'
    },
    {
      icon: Columns,
      title: 'Column Definitions',
      description: 'Configure columns with sizing, formatting, renderers, and editors.',
      href: '#docs/columns',
      color: 'blue'
    },
    {
      icon: Puzzle,
      title: 'Plugins',
      description: 'Enable sorting, filtering, export, SQL queries, and 16+ more features.',
      href: '#docs/plugins',
      color: 'purple'
    },
    {
      icon: Settings,
      title: 'Grid API',
      description: 'Complete API reference for data, columns, selection, and state.',
      href: '#docs/api',
      color: 'orange'
    },
    {
      icon: Zap,
      title: 'Events',
      description: 'Handle clicks, edits, selection changes, and grid lifecycle.',
      href: '#docs/events',
      color: 'yellow'
    },
    {
      icon: Palette,
      title: 'Theming',
      description: 'CSS variables, dark mode, custom themes, and styling options.',
      href: '#docs/theming',
      color: 'pink'
    }
  ];

  const colorClasses = {
    emerald: 'group-hover:text-emerald-400 group-hover:bg-emerald-500/10',
    blue: 'group-hover:text-blue-400 group-hover:bg-blue-500/10',
    purple: 'group-hover:text-purple-400 group-hover:bg-purple-500/10',
    orange: 'group-hover:text-orange-400 group-hover:bg-orange-500/10',
    yellow: 'group-hover:text-yellow-400 group-hover:bg-yellow-500/10',
    pink: 'group-hover:text-pink-400 group-hover:bg-pink-500/10'
  };

  const borderClasses = {
    emerald: 'hover:border-emerald-500/30',
    blue: 'hover:border-blue-500/30',
    purple: 'hover:border-purple-500/30',
    orange: 'hover:border-orange-500/30',
    yellow: 'hover:border-yellow-500/30',
    pink: 'hover:border-pink-500/30'
  };

  return (
    <section id="documentation" className="py-16 sm:py-24 lg:py-32 relative">
      <FloatingGrid />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 lg:mb-20">
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4" />
            DOCUMENTATION
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 sm:mb-6">
            Learn WarperGrid.
            <br />
            <span className="text-zinc-500">Build faster.</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400">
            Comprehensive guides and API reference to help you get the most out of WarperGrid.
          </p>
        </div>

        {/* Docs Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {docs.map((doc, idx) => (
            <a 
              key={doc.title}
              href={doc.href}
              className={`group relative p-5 sm:p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl sm:rounded-2xl hover:bg-zinc-900 transition-all duration-500 ${borderClasses[doc.color as keyof typeof borderClasses]}`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Icon */}
              <div className={`p-2 sm:p-2.5 bg-zinc-800/50 rounded-lg sm:rounded-xl text-zinc-400 w-fit mb-4 transition-all duration-300 ${colorClasses[doc.color as keyof typeof colorClasses]}`}>
                <doc.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              
              {/* Content */}
              <h3 className="text-base sm:text-lg font-semibold mb-2 group-hover:text-white transition-colors duration-300">
                {doc.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed mb-4">
                {doc.description}
              </p>
              
              {/* Arrow */}
              <div className="flex items-center gap-1 text-xs sm:text-sm text-zinc-600 group-hover:text-emerald-400 transition-colors duration-300">
                Read docs
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </a>
          ))}
        </div>


      </div>
    </section>
  );
}

function WhyNot() {
  const reasons = [
    {
      title: "You love waiting for your grid to load",
      description: "If watching spinners is your meditation practice, WarperGrid's instant rendering will ruin that peace. Our Rust/WASM engine loads 100K rows before you can say \"loading...\"",
      emoji: "⏳"
    },
    {
      title: "You enjoy writing 500 lines of config",
      description: "Some developers find joy in endless configuration files. Our simple API with sensible defaults might make you feel like you're not working hard enough.",
      emoji: "📝"
    },
    {
      title: "You think Excel-like editing is overrated",
      description: "Who needs cell editing, undo/redo, formulas, and copy/paste? Surely your users prefer typing data into a plain HTML table, right?",
      emoji: "📊"
    },
    {
      title: "You're allergic to TypeScript autocomplete",
      description: "Full type safety and intelligent autocomplete might make coding too easy. Where's the thrill of guessing prop names at 2 AM?",
      emoji: "🎯"
    },
    {
      title: "You prefer your grids to freeze at 10K rows",
      description: "There's something nostalgic about watching your browser tab crash. WarperGrid handling millions of rows smoothly is frankly boring.",
      emoji: "🥶"
    },
    {
      title: "You don't need SQL queries on your data",
      description: "Running SELECT, WHERE, GROUP BY directly on grid data? That's just showing off. Real developers filter data with nested for-loops.",
      emoji: "🔍"
    }
  ];

  return (
    <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
      <FloatingGrid />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 sm:mb-6">
            Why you <span className="text-red-400 line-through">shouldn't</span> choose
            <br />
            <span className="text-emerald-400">WarperGrid</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400">
            In the spirit of radical honesty, here are some totally valid reasons to avoid us. 
          </p>
        </div>

        {/* Reasons Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {reasons.map((reason, idx) => (
            <div 
              key={reason.title}
              className="group relative p-5 sm:p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl sm:rounded-2xl hover:bg-zinc-900 hover:border-red-500/30 transition-all duration-500"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Emoji */}
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                {reason.emoji}
              </div>
              
              {/* Content */}
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white group-hover:text-red-400 transition-colors duration-300">
                {reason.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                {reason.description}
              </p>

              {/* Hover effect */}
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent rounded-xl sm:rounded-2xl" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 sm:mt-16 text-center">
          <p className="text-zinc-400 mb-3 sm:mb-6 text-xs sm:text-base">
            Still here? Maybe you actually <span className="text-emerald-400 font-medium">want</span> a fast, modern grid after all.
          </p>
          <a 
            href="#pricing"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/25 text-xs sm:text-base"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Fine, Show Me Pricing
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
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
            Start free, upgrade when ready. Secure checkout, instant delivery.
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
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-zinc-900 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" />
                  Buy Now
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
              ) : tier.isDodo ? (
                <a 
                  href={tier.ctaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 text-center font-semibold rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base bg-emerald-500 hover:bg-emerald-400 text-zinc-900"
                >
                  <CreditCard className="w-4 h-4" />
                  {tier.cta}
                  <ExternalLink className="w-3 h-3" />
                </a>
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
            Get your license instantly. Secure checkout. Works worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4">
            <a 
              href={DODO_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-2.5 sm:py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/25 text-xs sm:text-base"
            >
              <CreditCard className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              Buy License
              <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>

          {/* Payment Badges */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-1 text-zinc-500 text-xs">
                <Shield className="w-3 h-3" />
                <span>Secure Checkout</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-500 text-xs">
                <CreditCard className="w-3 h-3" />
                <span>Card Payments</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-500 text-xs">
                <Check className="w-3 h-3" />
                <span>7-Day Free Trial</span>
              </div>
            </div>
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
            { title: 'Docs', links: [
              { name: 'Getting Started', href: '#docs/getting-started' },
              { name: 'Columns', href: '#docs/columns' },
              { name: 'Plugins', href: '#docs/plugins' },
              { name: 'API Reference', href: '#docs/api' },
              { name: 'Events', href: '#docs/events' },
              { name: 'Theming', href: '#docs/theming' }
            ] },
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
          <div className="flex items-center gap-4">
            <a 
              href="https://discord.gg/WC5npzPx3s"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-500 hover:text-emerald-400 text-xs sm:text-sm transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              Discord
            </a>
            <a 
              href="mailto:e2vylu0d0@mozmail.com" 
              className="flex items-center gap-1.5 text-zinc-500 hover:text-emerald-400 text-xs sm:text-sm transition-colors"
            >
              <Mail className="w-3 h-3" />
              e2vylu0d0@mozmail.com
            </a>
          </div>
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
  
  /* Mobile overflow fixes */
  pre, code {
    max-width: 100%;
    overflow-x: auto;
    word-wrap: break-word;
  }
  
  .shiki {
    max-width: 100%;
    overflow-x: auto;
  }
  
  .shiki code {
    display: block;
    min-width: max-content;
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
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30 overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <CodeShowcase />
      <Documentation />
      <WhyNot />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
