# Plugin Authoring for Warper-Grid: Virtualization Patterns
## Performance Considerations

- **Large Dataset Handling:** The grid has a `maxClientSideRows` prop (default: 10000) that limits client-side filtering/sorting to prevent browser crashes. For datasets larger than this threshold, client-side processing is disabled. Plugins should be designed to work with this limitation.
- **Automatic Pagination:** For large datasets without pagination, a warning is logged. Consider enabling pagination for better performance.
- **Paginated Processing:** When pagination is enabled, filtering and sorting are applied only to the current page, allowing large datasets to be handled efficiently.
\n## Key Principles
\n- **Strict Windowed Operation:** Plugins must only operate on the visible window (`range.indices`) provided by the grid, never the full dataset.
- **Lifecycle Hooks:** Use `onAttach(gridApi, config)` and `onDetach()` for plugin lifecycle. Clean up listeners and state on detach.
- **No Full-Array Operations:** Never map, filter, or mutate the entire dataset in the main thread. For heavy computation, use WASM or a WebWorker.
- **UI Rendering:** Only render React nodes for the visible window. Never keep DOM nodes for all rows/cells.
- **Memory Boundaries:** Do not cache or memoize large arrays in plugin state. Memoize only the visible slice if needed.
- **Overscan Respect:** Always respect grid overscan settings. Do not force excess nodes.
- **Profiling:** Use the developer overlay to monitor per-plugin render cost, DOM node count, and memory usage. Warn or abort if a plugin mounts >500 nodes.

\n## Example Plugin Structure
\n```typescript
export const filterPlugin: GridPlugin<RowData> = {
  name: 'filtering',
  onAttach(api, config) {
    api.onRender(({ range }) => {
      // Only operate on range.indices
      const visibleFiltered = range.indices.filter(i =>
        matchesFilter(api.data[i], config.filter)
      );
      api.setVisibleRows(visibleFiltered);
    });
  },
  onDetach() {
    // Clean up listeners, state, etc.
  },
};
```

\n## Heavy Computation
\n- Offload sorting, grouping, filtering, analytics to WASM or worker.
- For SQL/analytics, operate only on a bounded slice (max 500k rows). Warn or fallback to server-side for larger datasets.

\n## Debugging & Profiling
\n- Use the overlay to track plugin render cost, memory, and FPS.
- Warn/error if plugin violates virtualization (e.g., mounts >500 nodes).

\n## Summary
\n- **Never operate on the full dataset.**
- **Always use the visible window.**
- **Profile and optimize for massive datasets.**
- **Follow lifecycle and cleanup best practices.**

For more, see the main README and core grid documentation.
