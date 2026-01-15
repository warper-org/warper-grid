import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  Copy,
  ClipboardPaste,
  Download,
  CheckSquare,
  Square,
  Scissors,
  FileSpreadsheet,
} from 'lucide-react';
import type {
  RowData,
  GridApi,
} from '../types';
import type { ContextMenuItem, ContextMenuParams, ContextMenuState } from '../plugins/context-menu';
import { getDefaultContextMenuItems } from '../plugins/context-menu';

// ============================================================================
// Context Menu Component Props
// ============================================================================

interface ContextMenuProps<TData extends RowData = RowData> {
  state: ContextMenuState;
  api: GridApi<TData>;
  data: TData | null;
  onClose: () => void;
  items?: ContextMenuItem<TData>[] | ((params: ContextMenuParams<TData>) => ContextMenuItem<TData>[]);
  extraItems?: ContextMenuItem<TData>[];
  suppressDefaultItems?: boolean;
}

// ============================================================================
// Menu Item Component
// ============================================================================

interface MenuItemComponentProps<TData extends RowData = RowData> {
  item: ContextMenuItem<TData>;
  params: ContextMenuParams<TData>;
  onClose: () => void;
}

function MenuItemComponent<TData extends RowData = RowData>({
  item,
  params,
  onClose,
}: MenuItemComponentProps<TData>) {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);

  const isDisabled = typeof item.disabled === 'function' 
    ? item.disabled(params) 
    : item.disabled;

  const isHidden = typeof item.hidden === 'function'
    ? item.hidden(params)
    : item.hidden;

  if (isHidden) return null;

  if (item.separator) {
    return <div className="warper-context-menu-separator" />;
  }

  const handleClick = () => {
    if (isDisabled) return;
    if (item.subMenu && item.subMenu.length > 0) {
      setShowSubMenu(!showSubMenu);
    } else if (item.action) {
      item.action(params);
      onClose();
    }
  };

  const handleMouseEnter = () => {
    if (item.subMenu && item.subMenu.length > 0) {
      setShowSubMenu(true);
    }
  };

  const handleMouseLeave = () => {
    setShowSubMenu(false);
  };

  const getIcon = () => {
    if (item.icon) return item.icon;
    
    // Default icons for common items
    switch (item.id) {
      case 'copy':
      case 'copyRow':
      case 'copyWithHeaders':
        return <Copy className="h-4 w-4" />;
      case 'paste':
        return <ClipboardPaste className="h-4 w-4" />;
      case 'cut':
        return <Scissors className="h-4 w-4" />;
      case 'export':
      case 'exportCsv':
        return <Download className="h-4 w-4" />;
      case 'exportSelectedCsv':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'selectAll':
        return <CheckSquare className="h-4 w-4" />;
      case 'deselectAll':
        return <Square className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={itemRef}
      className={cn(
        'warper-context-menu-item',
        isDisabled && 'warper-context-menu-item--disabled',
        item.cssClass
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="warper-context-menu-item-icon">{getIcon()}</span>
      <span className="warper-context-menu-item-name">{item.name}</span>
      {item.shortcut && (
        <span className="warper-context-menu-item-shortcut">{item.shortcut}</span>
      )}
      {item.subMenu && item.subMenu.length > 0 && (
        <ChevronRight className="h-4 w-4 ml-auto" />
      )}
      
      {/* Sub Menu */}
      {showSubMenu && item.subMenu && item.subMenu.length > 0 && (
        <div
          ref={subMenuRef}
          className="warper-context-menu warper-context-menu--submenu"
        >
          {item.subMenu.map((subItem) => (
            <MenuItemComponent
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
// Context Menu Component
// ============================================================================

export function ContextMenu<TData extends RowData = RowData>({
  state,
  api,
  data,
  onClose,
  items,
  extraItems,
  suppressDefaultItems,
}: ContextMenuProps<TData>) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Build menu params
  const params: ContextMenuParams<TData> = {
    rowIndex: state.rowIndex,
    colId: state.colId,
    value: state.value,
    data,
    api,
    event: {} as React.MouseEvent, // Will be set by parent
    selectedRows: api.getSelectedRows(),
    closeMenu: onClose,
  };

  // Get menu items
  const getMenuItems = useCallback((): ContextMenuItem<TData>[] => {
    if (typeof items === 'function') {
      return items(params);
    }
    
    if (items) {
      return items;
    }

    const defaultItems = suppressDefaultItems ? [] : getDefaultContextMenuItems<TData>();
    
    if (extraItems && extraItems.length > 0) {
      return [
        ...defaultItems,
        { id: 'extraSeparator', name: '', separator: true },
        ...extraItems,
      ];
    }

    return defaultItems;
  }, [items, extraItems, suppressDefaultItems, params]);

  const menuItems = getMenuItems();

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

  // Adjust position to stay in viewport
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = state.x;
      let adjustedY = state.y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8;
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8;
      }

      if (adjustedX !== state.x || adjustedY !== state.y) {
        menu.style.left = `${adjustedX}px`;
        menu.style.top = `${adjustedY}px`;
      }
    }
  }, [state.x, state.y]);

  if (!state.isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="warper-context-menu"
      style={{
        position: 'fixed',
        left: state.x,
        top: state.y,
        zIndex: 9999,
      }}
    >
      {menuItems.map((item) => (
        <MenuItemComponent
          key={item.id}
          item={item}
          params={params}
          onClose={onClose}
        />
      ))}
    </div>,
    document.body
  );
}

export default ContextMenu;
