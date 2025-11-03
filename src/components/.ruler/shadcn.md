# shadcn/ui Component Rules

## Always use shadcn CLI

When adding new shadcn/ui components, **always** use the official CLI command:

```bash
npx shadcn add <component-name>
```

**Do NOT manually create shadcn/ui components.** This ensures:
- Components match the project's shadcn configuration
- Consistent styling and behavior
- Automatic updates when shadcn/ui is updated
- Proper integration with the component registry

## Examples

```bash
npx shadcn add alert
npx shadcn add input
npx shadcn add label
npx shadcn add textarea
```

## Exception

Only create custom components (not part of shadcn/ui) manually in `src/components/` (not in `src/components/ui/`).

