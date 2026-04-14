# WORKSPACE_BOUNDARIES

## Boundary Goals
Protect clarity and prevent uncontrolled structural drift during iterative development.

## Repo-Level Boundaries
- Keep one canonical structure for shell, navigation, and page archetypes.
- Do not introduce parallel folder patterns that represent the same concept.
- Do not introduce random framework drift (multiple competing UI stacks without decision).

## Product-Level Boundaries
- **Shared shell**: global frame, nav, role context, common status expression style.
- **Workspace-specific content**: business context and page composition inside each workspace.
- **Role home**: personal operational entry by role.
- **Domain pages**: task/list/form/review/detail pages under workspace context.

## Safe Change Boundaries for Future Codex Work
One task should modify only one clear slice when possible:
- shell slice
- navigation slice
- one workspace slice
- one page archetype slice
- one docs-governance slice

## Change Isolation Rule
- If a task impacts multiple slices, split into sequenced tasks.
- Avoid mixing structural change + style overhaul + logic expansion in one commit.

## Explicitly Forbidden
- Duplicating shell implementations for different roles/workspaces
- Creating separate, inconsistent navigation systems
- Parallel structures with overlapping semantics
- Framework additions without documented architectural reason
