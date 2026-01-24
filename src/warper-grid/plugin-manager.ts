import type { 
  RowData, 
  GridPlugin, 
  PluginName, 
  PluginConfig,
  GridApi,
} from './types';

// Import built-in plugins
import { sortingPlugin } from './plugins/sorting';
import { filteringPlugin } from './plugins/filtering';
import { paginationPlugin } from './plugins/pagination';
import { selectionPlugin } from './plugins/selection';
import { columnResizingPlugin } from './plugins/column-resizing';
import { exportPlugin } from './plugins/export';
import createColumnDraggingPlugin from './plugins/column-dragging';
import { createCellEditingPlugin } from './plugins/cell-editing';
import createColumnMenuPlugin from './plugins/column-menu';
import createClipboardPlugin from './plugins/clipboard';
import createContextMenuPlugin from './plugins/context-menu';
import createStatusBarPlugin from './plugins/status-bar';
import createRowGroupingPlugin from './plugins/row-grouping';

// ============================================================================
// Plugin Registry
// ============================================================================

const builtInPlugins: Map<PluginName, () => GridPlugin<RowData>> = new Map([
  ['sorting', () => sortingPlugin],
  ['filtering', () => filteringPlugin],
  ['pagination', () => paginationPlugin],
  ['selection', () => selectionPlugin],
  ['columnResizing', () => columnResizingPlugin],
  ['columnMoving', () => createColumnDraggingPlugin()],
  ['export', () => exportPlugin],
  ['contextMenu', () => createContextMenuPlugin()],
  ['clipboard', () => createClipboardPlugin()],
  ['columnMenu', () => createColumnMenuPlugin()],
  ['cellEditing', () => createCellEditingPlugin()],
  ['rowGrouping', () => createRowGroupingPlugin()],
  ['masterDetail', () => createPlaceholderPlugin('masterDetail')],
  ['statusBar', () => createStatusBarPlugin()],
]);

// Custom plugin registry for user-defined plugins
const customPlugins: Map<string, () => GridPlugin<RowData>> = new Map();

// Helper to create placeholder plugins for features with utilities but no runtime plugin
function createPlaceholderPlugin(name: PluginName): GridPlugin<RowData> {
  return {
    name,
    init: () => {
      console.log(`Plugin "${name}" initialized (utilities available via imports)`);
    },
    destroy: () => {},
  };
}

// ============================================================================
// Plugin Manager
// ============================================================================

export class PluginManager<TData extends RowData = RowData> {
  private loadedPlugins: Map<string, GridPlugin<TData>> = new Map();
  private api: GridApi<TData> | null = null;
  private config: PluginConfig = {};

  /**
   * Initialize the plugin manager with grid API
   */
  init(api: GridApi<TData>, config?: PluginConfig) {
    this.api = api;
    this.config = config || {};
  }

  /**
   * Attach plugins to the grid
   */
  attach(plugins: PluginName[], config?: PluginConfig): void {
    if (!this.api) {
      console.warn('PluginManager: API not initialized. Call init() first.');
      return;
    }

    // Merge configs
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Handle '*' to load all built-in plugins
    const pluginsToLoad = plugins.includes('*') 
      ? Array.from(builtInPlugins.keys()).filter(name => name !== '*')
      : plugins;

    for (const pluginName of pluginsToLoad) {
      if (this.loadedPlugins.has(pluginName)) {
        continue; // Already loaded
      }

      const pluginFactory = builtInPlugins.get(pluginName) || customPlugins.get(pluginName);
      
      if (!pluginFactory) {
        console.warn(`PluginManager: Plugin "${pluginName}" not found.`);
        continue;
      }

      const plugin = pluginFactory() as GridPlugin<TData>;
      
      // Initialize the plugin (with error handling and logging)
      const pluginConfig = this.config[pluginName];
      try {
        plugin.init?.(this.api, pluginConfig);
        console.info(`PluginManager: Initialized plugin "${pluginName}"`);
        this.loadedPlugins.set(pluginName, plugin);
      } catch (err) {
        console.error(`PluginManager: Failed to initialize plugin "${pluginName}":`, err);
      }
    }
  }

  /**
   * Detach plugins from the grid
   */
  detach(plugins: PluginName[]): void {
    for (const pluginName of plugins) {
      const plugin = this.loadedPlugins.get(pluginName);
      if (plugin) {
        plugin.destroy?.();
        this.loadedPlugins.delete(pluginName);
      }
    }
  }

  /**
   * Detach all plugins
   */
  detachAll(): void {
    for (const [, plugin] of this.loadedPlugins) {
      plugin.destroy?.();
    }
    this.loadedPlugins.clear();
  }

  /**
   * Get a loaded plugin
   */
  getPlugin(name: PluginName): GridPlugin<TData> | undefined {
    return this.loadedPlugins.get(name);
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): GridPlugin<TData>[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Check if a plugin is loaded
   */
  isLoaded(name: PluginName): boolean {
    return this.loadedPlugins.has(name);
  }

  /**
   * Notify all plugins of state change
   */
  notifyStateChange(state: import('./types').GridState<TData>): void {
    for (const [, plugin] of this.loadedPlugins) {
      plugin.onStateChange?.(state);
    }
  }
}

// ============================================================================
// Plugin Registration
// ============================================================================

/**
 * Register a custom plugin
 */
export function registerPlugin<TData extends RowData>(
  name: string,
  pluginFactory: () => GridPlugin<TData>
): void {
  customPlugins.set(name, pluginFactory as () => GridPlugin<RowData>);
}

/**
 * Unregister a custom plugin
 */
export function unregisterPlugin(name: string): void {
  customPlugins.delete(name);
}

/**
 * Get all registered plugin names
 */
export function getRegisteredPlugins(): string[] {
  return [
    ...Array.from(builtInPlugins.keys()),
    ...Array.from(customPlugins.keys()),
  ];
}

// ============================================================================
// Create Plugin Manager Instance
// ============================================================================

export function createPluginManager<TData extends RowData = RowData>(): PluginManager<TData> {
  return new PluginManager<TData>();
}
