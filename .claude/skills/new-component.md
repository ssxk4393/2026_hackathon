---
name: new-component
description: Scaffold a new React component for the renderer or caption-window
---

Create a new React component based on the user's description.

Follow these rules:
1. Place in `src/renderer/components/[ComponentName]/` or `src/caption-window/components/`
2. Create `[ComponentName].tsx` and `index.ts` (re-export)
3. Use TypeScript with explicit props interface
4. Use Tailwind CSS for styling
5. No inline styles unless dynamic values required

Template:
```tsx
interface [ComponentName]Props {
  // props here
}

export function [ComponentName]({ }: [ComponentName]Props) {
  return (
    <div>
    </div>
  );
}
```

Ask the user: component name, location (renderer or caption-window), and what it should do.
