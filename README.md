# ⚡ RyzenAI – Deterministic AI UI Generator  
**Demo Link**

AI Agent → Structured Plan → Deterministic React UI → Live Preview  

Built for the Ryze AI Full-Stack Assignment

---

# 🚀 Overview

RyzenAI is a deterministic AI-powered React UI generator that converts natural language UI intent into structured, reproducible React components using a fixed component system.

Unlike typical “AI code generators,” RyzenAI is designed around:

- 🧠 Explicit multi-step agent orchestration  
- 🧱 Strict deterministic component enforcement  
- 🌳 Canonical UI tree state management  
- 🛡️ Defense-in-depth validation and sandboxing  
- 🔁 Structured iteration and rollback  

The goal is not just to generate UI —  
but to generate UI safely, predictably, and transparently.

---

# 🌟 Key Features

- 💬 Chat-Driven UI Generation: Describe your UI in plain English  
- 🧠 Multi-Step Agent: Planner → Generator → Explainer  
- 🌳 Canonical UITree: Structured internal UI representation  
- 🔁 Incremental Edits: Merge new intent into existing layout plan  
- 🧾 Version History: File-scoped rollback with tree restoration  
- 🖥️ Live Preview: Sandboxed iframe rendering with error boundaries  
- 🔒 Deterministic Styling: Controlled props, no arbitrary CSS  
- 📂 Multi-File Support: Independent chat + plan + tree per file  

---

# 🏗 Architecture

## High-Level Flow

User Intent  
→ Planner  
→ Structured JSON Plan  
→ Generator  
→ JSX  
→ UITree Parser  
→ Canonical Serializer  
→ Live Preview  

The **UITree** is the single source of truth for UI state.

---

## 🧠 Agent Architecture

RyzenAI uses explicit agent separation.  
A single LLM call is never used.

---

### 1️⃣ Planner

**Purpose:** Interpret user intent into a structured layout strategy.

**Responsibilities:**

- Understand UI requirements  
- Choose layout structure  
- Select only allowed components  
- Merge incremental changes into existing plan  
- Output strictly valid JSON (validated via Zod)  

Example Output Structure:

```json
{
  "intent": "...",
  "layoutStrategy": "...",
  "components": [...],
  "hierarchy": [...]
}
```
Planner never outputs JSX.
It produces only structured plans.

### 2️⃣ Generator
Purpose: Convert structured plan → deterministic React JSX.

Constraints enforced:

Only whitelisted components

No inline styles

No arbitrary Tailwind classes

No external libraries

Only allowed imports

Controlled props only

After generation:

JSX is parsed into a UITree

Canonical JSX is regenerated from the tree

The UITree becomes the single source of truth

This guarantees structural consistency across iterations.

### 3️⃣ Explainer
Produces plain-English reasoning for:

Layout decisions

Component selection

Iterative modifications

Structural changes

Ensures AI decisions are transparent and understandable.

## 🌳 UITree – Canonical UI State
The UITree is the core architectural innovation.

It includes:

Explicit node type definitions

Stack-based JSX → Tree parser

Lossless Tree → JSX serializer

Deterministic ordering rules

The tree:

Is stored alongside code in version history

Is restored during rollbacks

Ensures canonical formatting

Prevents formatting drift across edits

The UI state is never just a string —
it is a structured tree model.

## 🧱 Component System Design
RyzenAI enforces strict deterministic rendering.

Fixed Component Library
Examples:

Button

Card

Input

Modal

Table

Sidebar

Navbar

Chart

The AI may:

Select components

Compose layouts

Set controlled props

Provide content

The AI may NOT:

Create new components

Modify component implementations

Inject CSS

Use inline styles

Use external UI libraries

## 🎨 Deterministic Styling
Styling is enforced via:

Controlled props (variant, size, etc.)

className ignored in preview

Component shims inside sandbox

Strict import whitelist

Visual consistency is mandatory and guaranteed.

## 🛡 Security & Validation
RyzenAI uses a defense-in-depth model.

### 1️⃣ Prompt Sanitization
All user input passes through sanitizePrompt to remove:

“Ignore previous instructions”

System override attempts

Prompt injection patterns

### 2️⃣ Plan Validation
Planner output validated using Zod to ensure:

Structural integrity

No JSX injection in text fields

Schema compliance

### 3️⃣ Code Validation
Regex-based validation enforces:

Import whitelist (react, lucide-react, internal only)

Component whitelist

No inline styles

No forbidden patterns

Invalid outputs are rejected before rendering.

### 4️⃣ Preview Isolation
Sandboxed iframe

Controlled execution environment

Runtime error boundary

No access to external libraries

💻 Technology Stack
## 🎨 Frontend
React 18 + TypeScript

Vite

Tailwind CSS

Lucide React

Custom useAgent hook

## 🖥️ Backend
Node.js

Express

Groq SDK

## 📦 State & Execution
Local React state

In-memory version store

Canonical UITree model

### 🔁 Iteration Model
Incremental edits follow this pipeline:

Planner merges new intent into existing plan

Generator regenerates JSX from merged plan

JSX parsed into UITree

Canonical JSX serialized from tree

Version stored

Rollback restores:

Exact UITree

Exact JSX

No regeneration required

This ensures structural determinism across edits.

⚠ Known Limitations
Plan-Level Incrementality
Iteration occurs at plan level. Subtree-level AST patching is not implemented.

Regex-Based Code Validation
Lightweight enforcement. Not full AST static analysis.

In-Memory Version Store
No persistence across server restarts.

Single-User Scope
No authentication or multi-user isolation.

Limited Component Library
Designed for deterministic enforcement rather than full UI coverage.

🚀 What I Would Improve With More Time
### 1️⃣ Subtree-Level Editing
Implement AST-based patching to:

Detect minimal subtree changes

Preserve untouched JSX nodes

Improve diff granularity

### 2️⃣ Structural Diff View
Add tree-level diff visualization between versions.

### 3️⃣ Stronger Static Analysis
Replace regex validation with:

AST parsing

Formal schema validation

Prop-level enforcement

### 4️⃣ Persistent Storage
Add lightweight DB (e.g., SQLite) to persist:

UITrees

Version history

File states

### 5️⃣ Replayable Generations
Store full generation chain:

User prompt

Planner output

Generator output

UITree snapshot

Enable reproducible AI runs.

## 🧠 Design Philosophy
RyzenAI is built around one principle:

AI UI generation should be deterministic, explainable, and structurally controlled.

Rather than optimizing for visual polish,
the system prioritizes:

Predictability

Reproducibility

Validation

Structured state

Iterative reasoning

The goal is not just to generate UI —
but to build a trustworthy AI UI system.


