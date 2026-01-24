import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Accordion({ children }: { children: React.ReactNode }) {
  return <div className="accordion w-full">{children}</div>;
}

export function AccordionItem({
  open,
  onOpenChange,
  title,
  children,
}: {
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('accordion-item w-full')}>
      <div
        role="button"
        aria-expanded={!!open}
        className="accordion-trigger flex items-center gap-2 w-full cursor-pointer"
        onClick={() => onOpenChange && onOpenChange(!open)}
      >
        <ChevronDown className={cn('accordion-icon transition-transform', open && 'rotate-180')} />
        <div className="flex-1">{title}</div>
      </div>
      <div className={cn('accordion-content mt-1', !open && 'hidden')}>
        {children}
      </div>
    </div>
  );
}

export default Accordion;