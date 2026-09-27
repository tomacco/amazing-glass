# Examples

- `html/`: one file, loads from the CDN. Open it in a browser.
- `react/` and `vue/`: small apps that use the wrappers. From the repo root:

```bash
bun build examples/react/main.tsx --outdir examples/react --entry-naming main.js --define 'process.env.NODE_ENV="production"'
bun run dev   # then open http://localhost:5180/examples/react/
```
