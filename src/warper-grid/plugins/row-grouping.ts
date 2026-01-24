// Row grouping is now handled by SQL (GROUP BY), not in-memory JS.
// This stub export prevents import errors while the plugin is disabled.

import type { GridPlugin, RowData } from '../types';

/**
 * Stub row grouping plugin - grouping is now handled via SQL GROUP BY
 * This plugin does nothing but satisfies the import requirement.
 */
export function createRowGroupingPlugin<TData extends RowData>(): GridPlugin<TData> {
    return {
        name: 'rowGrouping',
        init: () => {
            console.log('[rowGrouping] Row grouping is now handled via SQL GROUP BY. This plugin is a no-op.');
        },
        destroy: () => { },
    };
}

export default createRowGroupingPlugin;
