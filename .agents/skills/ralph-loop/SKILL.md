---
name: ralph-loop
description: >-
  Autonomous iterative development loop (Ralph Loop / Ralph Wiggum technique)
  for long-running tasks. Breaks tasks down into atomic items in tasks.md,
  executes one item per iteration, tests/verifies, updates progress.txt,
  and continues until all tasks are complete.
argument-hint: "[start|status|stop]"
license: MIT
---

# Ralph Loop (Autonomous Agent Iteration)

You are operating in a Ralph Loop. Work autonomously step-by-step driven by external state files (`tasks.md` and `progress.txt`).

## The Ralph Loop Rules:

1. **State Persistence**: 
   - Check or create `tasks.md` with checkable items `- [ ] Task name`.
   - Log all completed steps in `progress.txt`.

2. **One Task per Cycle**:
   - Pick the next uncompleted task from `tasks.md`.
   - Implement the smallest complete change for that task.
   - Run build/tests to verify empirical working state.

3. **Log & Commit**:
   - Mark task completed `- [x]` in `tasks.md`.
   - Write a summary line in `progress.txt`.

4. **Loop Termination**:
   - If uncompleted tasks remain in `tasks.md`, continue immediately to the next task.
   - Stop only when all tasks in `tasks.md` are marked complete `[x]`.

Use `/goal` in Antigravity when you want this loop to run autonomously until completion.
