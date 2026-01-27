---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified: [.gitignore]
autonomous: true
---

<objective>
Update .gitignore to exclude build artifacts and node_modules, then push the repository to a new GitHub remote named "Project StreamAnalyzer" for continuation on another PC.

Purpose: Enable vibecoding continuity across machines by syncing to GitHub
Output: Repository pushed to GitHub with clean .gitignore
</objective>

<execution_context>
@C:\Users\Maxwell\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Maxwell\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create .gitignore with standard Node/Vite excludes</name>
  <files>.gitignore</files>
  <action>
Create .gitignore at project root with:
- node_modules/
- dist/
- *.tsbuildinfo
- vite.config.js (generated from .ts)
- vite.config.d.ts (generated declaration)
- .env and .env.* files
- OS files (.DS_Store, Thumbs.db)
- IDE folders (.idea, .vscode)
- Coverage and test output
- The accidental `C` file in root (add to gitignore AND delete it)

Stage ONLY .gitignore (do NOT stage deletions or other changes yet - let user decide what to commit).
  </action>
  <verify>cat .gitignore shows expected patterns; git status shows .gitignore as new file</verify>
  <done>.gitignore exists with Node/Vite/build patterns</done>
</task>

<task type="auto">
  <name>Task 2: Create GitHub remote and push</name>
  <files>None (git operations only)</files>
  <action>
1. Create new GitHub repository using gh CLI:
   gh repo create Project-StreamAnalyzer --public --source=. --push

   This will:
   - Create "Project-StreamAnalyzer" repo on GitHub
   - Set it as origin remote
   - Push current branch

2. If gh not authenticated, use checkpoint:human-action for user to authenticate.

Note: The repository name uses hyphen (Project-StreamAnalyzer) since GitHub repos cannot have spaces.
  </action>
  <verify>git remote -v shows GitHub origin; gh repo view shows repo exists</verify>
  <done>Repository exists on GitHub at user's account with all commits pushed</done>
</task>

</tasks>

<verification>
- .gitignore exists and has correct patterns
- git remote -v shows origin pointing to GitHub
- gh repo view --web opens the repo (or gh repo view shows details)
</verification>

<success_criteria>
- Repository pushed to GitHub as "Project-StreamAnalyzer"
- .gitignore excludes node_modules, dist, build artifacts
- User can clone on another PC and run npm install to continue
</success_criteria>

<output>
After completion, create `.planning/quick/002-update-gitignore-and-push-to-remote-as-p/002-SUMMARY.md`
</output>
