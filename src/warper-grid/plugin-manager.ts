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

// ============================================================================
// Plugin Registry
// ============================================================================

const builtInPlugins: Map<PluginName, () => GridPlugin<RowData>> = new Map([
  ['sorting', () => sortingPlugin],
  ['filtering', () => filteringPlugin],
  ['pagination', () => paginationPlugin],
  ['selection', () => selectionPlugin],
  ['columnResizing', () => columnResizingPlugin],
  ['export', () => exportPlugin],
  // Advanced plugins (no implementation yet, registered for future use)
  ['contextMenu', () => createPlaceholderPlugin('contextMenu')],
  ['cellSelection', () => createPlaceholderPlugin('cellSelection')],
  ['clipboard', () => createPlaceholderPlugin('clipboard')],
  ['columnMenu', () => createPlaceholderPlugin('columnMenu')],
  ['cellEditing', () => createPlaceholderPlugin('cellEditing')],
  ['rowGrouping', () => createPlaceholderPlugin('rowGrouping')],
  ['masterDetail', () => createPlaceholderPlugin('masterDetail')],
  ['statusBar', () => createPlaceholderPlugin('statusBar')],
]);

// Custom plugin registry for user-defined plugins
const customPlugins: Map<string, () => GridPlugin<RowData>> = new Map();

// Helper to create placeholder plugins for features with utilities but no runtime plugin
function createPlaceholderPlugin(name: string): GridPlugin<RowData> {
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
      
      // Initialize the plugin
      const pluginConfig = this.config[pluginName];
      plugin.init?.(this.api, pluginConfig);
      
      this.loadedPlugins.set(pluginName, plugin);
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
  notifyStateChange(state: unknown): void {
    for (const [, plugin] of this.loadedPlugins) {
      plugin.onStateChange?.(state as TData[]);
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
