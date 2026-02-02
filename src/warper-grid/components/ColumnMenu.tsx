import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Columns,
  RotateCcw,
  Check,
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  FileDown,
} from 'lucide-react';
import type {
  RowData,
  GridApi,
  ColumnDef,
} from '../types';
import type { ColumnMenuItem, ColumnMenuParams, ColumnMenuState } from '../plugins/column-menu';
import { getDefaultColumnMenuItems, getColumnVisibilityItems } from '../plugins/column-menu';

// ============================================================================
// Column Menu Props
// ============================================================================

interface ColumnMenuProps<TData extends RowData = RowData> {
  state: ColumnMenuState;
  api: GridApi<TData>;
  column: ColumnDef<TData> | null;
  onClose: () => void;
  items?: ColumnMenuItem<TData>[] | ((params: ColumnMenuParams<TData>) => ColumnMenuItem<TData>[]);
  extraItems?: ColumnMenuItem<TData>[];
  suppressDefaultItems?: boolean;
}

// ============================================================================
// Menu Item Component
// ============================================================================

interface MenuItemProps<TData extends RowData = RowData> {
  item: ColumnMenuItem<TData>;
  params: ColumnMenuParams<TData>;
  onClose: () => void;
}

function MenuItem<TData extends RowData = RowData>({
  item,
  params,
  onClose,
}: MenuItemProps<TData>) {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const isDisabled = typeof item.disabled === 'function' 
    ? item.disabled(params) 
    : item.disabled;

  const isHidden = typeof item.hidden === 'function'
    ? item.hidden(params)
    : item.hidden;

  const isChecked = typeof item.checked === 'function'
    ? item.checked(params)
    : item.checked;

  if (isHidden) return null;

  if (item.separator) {
    return <div className="warper-column-menu-separator" />;
  }

  const handleClick = () => {
    if (isDisabled) return;
    if (item.subMenu && item.subMenu.length > 0) {
      setShowSubMenu(!showSubMenu);
    } else if (item.action) {
      item.action(params);
    }
  };

  const getIcon = () => {
    if (item.icon) return item.icon;
    
    switch (item.id) {
      case 'sortAsc':
        return <ArrowUpNarrowWide className="h-4 w-4" />;
      case 'sortDesc':
        return <ArrowDownNarrowWide className="h-4 w-4" />;
      case 'pinLeft':
      case 'pinRight':
      case 'pinning':
        return <Pin className="h-4 w-4" />;
      case 'unpin':
        return <PinOff className="h-4 w-4" />;
      case 'hideColumn':
        return <EyeOff className="h-4 w-4" />;
      case 'showColumns':
        return <Eye className="h-4 w-4" />;
      case 'autoSize':
      case 'autoSizeAll':
        return <Columns className="h-4 w-4" />;
      case 'resetColumns':
        return <RotateCcw className="h-4 w-4" />;
      case 'export':
        return <Download className="h-4 w-4" />;
      case 'exportCsv':
        return <FileText className="h-4 w-4" />;
      case 'exportExcel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'exportJson':
        return <FileJson className="h-4 w-4" />;
      case 'exportPdf':
        return <FileDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={itemRef}
      className={cn(
        'warper-column-menu-item',
        isDisabled && 'warper-column-menu-item--disabled'
      )}
      onClick={handleClick}
      onMouseEnter={() => item.subMenu && setShowSubMenu(true)}
      onMouseLeave={() => setShowSubMenu(false)}
    >
      {isChecked !== undefined && (
        <span className="warper-column-menu-item-check">
          {isChecked && <Check className="h-3 w-3" />}
        </span>
      )}
      <span className="warper-column-menu-item-icon">{getIcon()}</span>
      <span className="warper-column-menu-item-name">{item.name}</span>
      {item.subMenu && item.subMenu.length > 0 && (
        <ChevronRight className="h-4 w-4 ml-auto" />
      )}
      
      {showSubMenu && item.subMenu && item.subMenu.length > 0 && (
        <div className="warper-column-menu warper-column-menu--submenu">
          {item.subMenu.map((subItem) => (
            <MenuItem
              key={subItem.id}
              item={subItem}
              params={params}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Column Menu Tabs
// ============================================================================

type TabType = 'general' | 'filter' | 'columns';

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      className={cn(
        'warper-column-menu-tab',
        active && 'warper-column-menu-tab--active'
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ============================================================================
// Column Menu Component
// ============================================================================

export function ColumnMenu<TData extends RowData = RowData>({
  state,
  api,
  column,
  onClose,
  items,
  extraItems,
  suppressDefaultItems,
}: ColumnMenuProps<TData>) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('general');

  if (!column || !state.isOpen) return null;

  const params: ColumnMenuParams<TData> = {
    column,
    colId: state.colId || column.id,
    api,
    closeMenu: onClose,
  };

  const getMenuItems = useCallback((): ColumnMenuItem<TData>[] => {
    if (typeof items === 'function') {
      return items(params);
    }
    
    if (items) {
      return items;
    }

    const defaultItems = suppressDefaultItems ? [] : getDefaultColumnMenuItems<TData>();
    
    if (extraItems && extraItems.length > 0) {
      return [...defaultItems, { id: 'extraSep', name: '', separator: true }, ...extraItems];
    }

    return defaultItems;
  }, [items, extraItems, suppressDefaultItems, params]);

  const menuItems = getMenuItems();
  const columnVisibilityItems = getColumnVisibilityItems(api);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position - auto-positioning
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = state.x;
      let adjustedY = state.y;

      // Adjust horizontal position
      if (rect.right > viewportWidth) {
        adjustedX = Math.max(8, viewportWidth - rect.width - 8);
      }
      if (adjustedX < 0) {
        adjustedX = 8;
      }

      // Adjust vertical position
      if (rect.bottom > viewportHeight) {
        adjustedY = Math.max(8, viewportHeight - rect.height - 8);
      }
      if (adjustedY < 0) {
        adjustedY = 8;
      }

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }, [state.x, state.y]);

  return createPortal(
    <div
      ref={menuRef}
      className="warper-column-menu"
      style={{
        position: 'fixed',
        left: state.x,
        top: state.y,
        zIndex: 9999,
      }}
    >
      {/* Tabs */}
      <div className="warper-column-menu-tabs">
        <TabButton
          label="General"
          active={activeTab === 'general'}
          onClick={() => setActiveTab('general')}
        />
        <TabButton
          label="Columns"
          active={activeTab === 'columns'}
          onClick={() => setActiveTab('columns')}
        />
      </div>

      {/* Tab Content */}
      <div className="warper-column-menu-content">
        {activeTab === 'general' && (
          <>
            {menuItems.map((item) => (
              <MenuItem
                key={item.id}
                item={item}
                params={params}
                onClose={onClose}
              />
            ))}
          </>
        )}

        {activeTab === 'columns' && (
          <div className="warper-column-menu-columns">
            {columnVisibilityItems.map((item) => (
              <MenuItem
                key={item.id}
                item={item}
                params={params}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default ColumnMenu;
