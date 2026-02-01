import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

interface CodeBlockProps {
  code: string;
  lang?: string;
  filename?: string;
}

export function CodeBlock({ code, lang = 'tsx', filename }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    codeToHtml(code, {
      lang,
      theme: 'github-dark-default',
    }).then((result) => {
      setHtml(result);
      setIsLoaded(true);
    });
  }, [code, lang]);

  return (
    <div className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#0d1117] border border-zinc-800 transition-all duration-500 hover:border-zinc-700 hover:shadow-2xl hover:shadow-emerald-500/5">
      {/* Header */}
      {filename && (
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex gap-1 sm:gap-1.5">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-zinc-700 group-hover:bg-red-500 transition-colors duration-300" />
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-zinc-700 group-hover:bg-yellow-500 transition-colors duration-300" />
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-zinc-700 group-hover:bg-green-500 transition-colors duration-300" />
          </div>
          <span className="text-[10px] sm:text-xs text-zinc-500 font-mono">{filename}</span>
        </div>
      )}
      
      {/* Code */}
      <div 
        className={`p-3 sm:p-4 text-xs sm:text-sm overflow-x-auto transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
