# CODING_CONSTITUTION

## Purpose
Hard collaboration rules for future Codex-driven iteration in this repository.

## Core Rules
1. **Inspect docs first, then code.**
2. **Provide an implementation plan before coding.**
3. **No unrelated refactor in task scope.**
4. **No whole-repo drift from a local requirement.**
5. **Prioritize skeleton, clarity, and consistency over feature volume.**
6. **Avoid over-building and premature abstraction.**
7. **Any new page must reuse shared shell and UI style rules.**
8. **Any structural/product change must update docs in the same change set.**

## Page Isolation Rule (Hard)
- 每个具体业务子页面必须有独立页面文件（one page, one module）。
- 页面专属文案、页面专属交互逻辑必须留在该页面模块内。
- 不允许把所有页面内容塞进单一巨型路由/配置文件。
- 允许共享的仅限：壳层、通用布局、通用 UI 原子组件、数据访问层、路由注册。

## Scope Discipline
- Keep one task focused on one clear slice where possible.
- If scope grows, split work into follow-up tasks.
- Do not introduce new frameworks or architectural direction without explicit documentation update.

## Quality Baseline
- Pages must remain lightweight and operational.
- Interactions must avoid anti-human complexity.
- Naming and navigation must remain stable and comprehensible.
