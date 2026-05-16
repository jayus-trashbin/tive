# GEMINI.md - Project Tive
> Este arquivo define as regras e workflows específicos para este projeto.
---

---

---

---

---

---

---

---

---

---

---

---

---

---

## 🔄 PROJECT WORKFLOWS REGISTRY
> Última sincronização: 2026-05-13 09:55

| Workflow | Slash Command | Triggers | Descrição |
|----------|---------------|----------|-----------|
| actualize | `/actualize` | /actualize, /fpf-state, /reconcile-project, /sync-repository | Reconcile the project's FPF state with recent repository changes |
| add-task | `/add-task` | /add-task, /create-task, /draft-task, /specs-task | creates draft task file in .specs/tasks/draft/ with original user intent |
| agent-evaluation | `/agent-evaluation` | /agent-evaluation, /evaluate-agent, /improve-agent, /test-command, /claude-eval | Evaluate and improve Claude Code commands, skills, and agents. Use when testi... |
| analyse | `/analyse` | /analyse, /kaizen-analysis, /gemba-walk, /value-stream, /muda-analysis | Auto-selects best Kaizen method (Gemba Walk, Value Stream, or Muda) for target |
| analyse-problem | `/analyse-problem` | /a3-problem, /analyse-problem, /root-cause-report, /one-page-analysis | Comprehensive A3 one-page problem analysis with root cause and action plan |
| analyze-issue | `/analyze-issue` | /analyze-issue, /github-issue, /technical-spec, /issue-breakdown | Analyze a GitHub issue and create a detailed technical specification |
| apply-anthropic-skill-best-practices | `/apply-anthropic-skill-best-practices` | /apply-anthropic-skill-best-practices, /anthropic-best-practices, /skill-authoring, /skill-spec, /write-skill-anthropic | Comprehensive guide for skill development based on Anthropic's official best ... |
| attach-review-to-pr | `/attach-review-to-pr` | /attach-review-to-pr, /attach-review, /pr-review-comments, /line-review, /github-review-api | Add line-specific review comments to pull requests using GitHub CLI API |
| auto-config-skills | `/auto-config-skills` | /auto-config-skills, /sincronizar-skills, /mapear-skills, /atualizar-registry, /skill-registry, /configurar-gemini | Workflow de sincronização do registry de skills no gemini.md. Ativado pelo co... |
| brainstorm | `/brainstorm` | /brainstorm, /brainstorm-feature, /design-idea, /ideate, /explore-approach | Use when creating or developing, before writing code or implementation plans ... |
| brainstorming | `/brainstorming` | /brainstorming, /brainstorm, /creative-work, /ideation, /feature-planning, /design-thinking | You MUST use this before any creative work - creating features, building comp... |
| build-mcp | `/build-mcp` | /build-mcp, /create-mcp-server, /mcp-tool, /model-context-protocol | Guide for creating high-quality MCP (Model Context Protocol) servers that ena... |
| cause-and-effect | `/cause-and-effect` | /cause-and-effect, /cause-effect, /fishbone-diagram, /ishikawa, /root-cause-categories | Systematic Fishbone analysis exploring problem causes across six categories |
| chrome-devtools | `/chrome-devtools` | /chrome-devtools, /devtools, /browser-debugging, /performance-profiling, /network-analysis, /screenshot | Expert-level browser automation, debugging, and performance analysis using Ch... |
| commit | `/commit` | /commit, /git-commit, /conventional-commit, /commit-message, /format-commit | Create well-formatted commits with conventional commit messages and emoji |
| context-engineering | `/context-engineering` | /context-engineering, /context-window, /agent-context, /llm-context | Understand the components, mechanics, and constraints of context in agent sys... |
| create-agent | `/create-agent` | /create-agent, /new-agent, /build-agent, /agent-structure | Comprehensive guide for creating Claude Code agents with proper structure, tr... |
| create-command | `/create-command` | /create-command, /new-command, /claude-command, /slash-command | Interactive assistant for creating new Claude commands with proper structure,... |
| create-hook | `/create-hook` | /create-hook, /git-hook, /pre-commit-hook, /configure-hook | Create and configure git hooks with intelligent project analysis, suggestions... |
| create-ideas | `/create-ideas` | /create-ideas, /generate-ideas, /creative-ideas, /one-shot-ideas, /brainstorm-list | Generate ideas in one shot using creative sampling |
| create-pr | `/create-pr` | /create-pr, /pull-request, /github-pr, /open-pr | Create pull requests using GitHub CLI with proper templates and formatting |
| create-rule | `/create-rule` | /create-rule, /add-rule, /gemini-rule, /found-gap-rule | Use when found gap or repetative issue, that produced by you or implemenataio... |
| create-skill | `/create-skill` | /create-skill, /new-skill, /build-skill, /write-skill | Guide for creating effective skills. This command should be used when users w... |
| create-workflow-command | `/create-workflow-command` | /create-workflow-command, /create-workflow, /workflow-command, /multi-step-workflow, /orchestrate-command | Create a workflow command that orchestrates multi-step execution through sub-... |
| critique | `/critique` | /critique, /critique-output, /multi-perspective-review, /judge-debate, /critique-code | Comprehensive multi-perspective review using specialized judges with debate a... |
| decay | `/decay` | /decay, /evidence-decay, /stale-decisions, /freshness-governance, /fpf-decay | Manage evidence freshness by identifying stale decisions and providing govern... |
| design-taste-frontend | `/design-taste-frontend` | /design-taste-frontend, /design-taste, /ui-bias, /frontend-aesthetic, /design-engineer | Senior UI/UX Engineer. Architect digital interfaces overriding default LLM bi... |
| develop-userscripts | `/develop-userscripts` | /develop-userscripts, /userscript, /tampermonkey, /scriptcat, /GM-API, /browser-extension | Use when building, debugging, packaging, or publishing browser userscripts fo... |
| dispatching-parallel-agents | `/dispatching-parallel-agents` | /dispatching-parallel-agents, /parallel-agents, /independent-tasks, /concurrent-dispatch, /multiple-failures | Use when facing 2+ independent tasks that can be worked on without shared sta... |
| do-and-judge | `/do-and-judge` | /do-and-judge, /llm-judge, /sub-agent-verify, /implement-and-verify | Execute a task with sub-agent implementation and LLM-as-a-judge verification ... |
| do-competitively | `/do-competitively` | /do-competitively, /competitive-agents, /multi-agent-competition, /parallel-generation, /best-output | Execute tasks through competitive multi-agent generation, meta-judge evaluati... |
| do-in-parallel | `/do-in-parallel` | /do-in-parallel, /parallel-agents, /concurrent-tasks, /batch-execution | Launch multiple sub-agents in parallel to execute tasks across files or targe... |
| do-in-steps | `/do-in-steps` | /do-in-steps, /sequential-agents, /step-by-step-execution, /multi-step-task | Execute complex tasks through sequential sub-agent orchestration with intelli... |
| executing-plans | `/executing-plans` | /executing-plans, /implementation-plan, /execute-plan, /plan-execution, /session-checkpoints | Use when you have a written implementation plan to execute in a separate sess... |
| finishing-a-development-branch | `/finishing-a-development-branch` | /finishing-a-development-branch, /finish-branch, /merge-PR, /integration-complete, /development-done | Use when implementation is complete, all tests pass, and you need to decide h... |
| fix-tests | `/fix-tests` | /fix-tests, /failing-tests, /repair-tests, /test-failures-after-refactor | Systematically fix all failing tests after business logic changes or refactoring |
| frontend-design | `/frontend-design` | /frontend-design, /web-design, /UI-component, /landing-page, /dashboard, /CSS-layout, /frontend-interface | Create distinctive, production-grade frontend interfaces with high design qua... |
| git-notes | `/git-notes` | /git-notes, /commit-metadata, /annotate-commit, /git-note-add | Use when adding metadata to commits without changing history, tracking review... |
| git-worktrees | `/git-worktrees` | /git-worktrees, /git-worktree, /multiple-branches, /isolated-workspace, /worktree | Use when working on multiple branches simultaneously, context switching witho... |
| graphify | `/graphify` | /graphify, /knowledge-graph | Convert any input to a knowledge graph. Use for codebase analysis and graphif... |
| impeccable | `/impeccable` | /impeccable, /UI-polish, /design-critique, /visual-hierarchy, /UX-audit, /interface-improvement | Use when the user wants to design, redesign, shape, critique, audit, polish, ... |
| implement-task | `/implement-task` | /implement-task, /llm-judge-task, /automated-implementation, /task-with-verify | Implement a task with automated LLM-as-Judge verification for critical steps |
| judge | `/judge` | /judge, /judge-output, /meta-judge, /evaluate-result, /llm-as-judge | Launch a meta-judge then a judge sub-agent to evaluate results produced in th... |
| judge-with-debate | `/judge-with-debate` | /judge-with-debate, /multi-judge-debate, /evaluate-debate, /consensus-judge | Evaluate solutions through multi-round debate between independent judges unti... |
| kaizen | `/kaizen` | /kaizen, /continuous-improvement, /iterative-improvement, /refactor-incrementally | Use when Code implementation and refactoring, architecturing or designing sys... |
| karpathy-guidelines | `/karpathy-guidelines` | /karpathy-guidelines, /karpathy, /llm-coding-mistakes, /behavioral-guidelines, /coding-anti-patterns | Behavioral guidelines to reduce common LLM coding mistakes. Use when writing,... |
| launch-sub-agent | `/launch-sub-agent` | /launch-sub-agent, /spawn-agent, /sub-agent-execution, /delegate-task-agent | Launch an intelligent sub-agent with automatic model selection based on task ... |
| load-issues | `/load-issues` | /load-issues, /github-issues, /list-open-issues, /fetch-issues | Load all open issues from GitHub and save them as markdown files |
| memorize | `/memorize` | /memorize, /memorize-insight, /save-insight, /agentic-context-distillation, /claude-md-insight | Curates insights from reflections and critiques into CLAUDE.md using Agentic ... |
| multi-agent-patterns | `/multi-agent-patterns` | /multi-agent-patterns, /multi-agent-pattern, /agent-architecture, /design-agent-system, /orchestration-pattern | Design multi-agent architectures for complex tasks. Use when single-agent con... |
| pbi-report-builder | `/pbi-report-builder` | /pbi-report-builder, /create-visuals, /build-a-report | Power BI PBIR Report Builder. Generates report pages, visuals, and IBCS chart... |
| pbi-requirements-gathering | `/pbi-requirements-gathering` | /pbi-requirements-gathering, /requirements, /kickoff, /scoping | Structured requirements gathering for Power BI projects to capture business c... |
| pbip-dependency-analyzer | `/pbip-dependency-analyzer` | /pbip-dependency-analyzer, /analyze-dependencies, /dependency-check, /impact-analysis | Power BI PBIP Dependency Analyzer. Maps dependencies between objects in .pbip... |
| plan-do-check-act | `/plan-do-check-act` | /pdca, /plan-do-check-act, /pdca-cycle, /iterative-experiment | Iterative PDCA cycle for systematic experimentation and continuous improvement |
| plan-task | `/plan-task` | /plan-task, /refine-task, /parallelize-task, /task-spec | Refine, parallelize, and verify a draft task specification into a fully plann... |
| playwright-scraper | `/playwright-scraper` | /playwright-scraper, /playwright, /web-scraping, /dynamic-content, /browser-automation, /data-extraction | Playwright web scraping: dynamic content, auth flows, pagination, data extrac... |
| power-bi-model-design-review | `/power-bi-model-design-review` | /power-bi-model-design-review, /power-bi-review, /model-design-review, /data-model-evaluation, /model-architecture | Comprehensive Power BI data model design review prompt for evaluating model a... |
| powerbi-modeling | `/powerbi-modeling` | /powerbi-modeling, /power-bi-model, /DAX, /semantic-model, /star-schema, /measures, /relationships | Power BI semantic modeling assistant for building optimized data models. Use ... |
| prd | `/prd` | /prd, /product-requirements, /requirements-document, /feature-spec-doc | Generate high-quality Product Requirements Documents (PRDs) for software syst... |
| prompt-engineering | `/prompt-engineering` | /prompt-engineering, /write-prompt, /llm-prompt, /improve-prompt | Use this skill when you writing commands, hooks, skills for Agent, or prompts... |
| propose-hypotheses | `/propose-hypotheses` | /propose-hypotheses, /fpf-cycle, /hypothesis-generation, /decision-hypothesis | Execute complete FPF cycle from hypothesis generation to decision |
| pwa-development | `/pwa-development` | /pwa-development, /pwa, /progressive-web-app, /service-worker, /offline-app | Progressive Web Apps - service workers, caching strategies, offline, Workbox |
| query | `/query` | /query, /query-fpf, /fpf-knowledge-base, /search-hypothesis, /fpf-query | Search the FPF knowledge base and display hypothesis details with assurance i... |
| receiving-code-review | `/receiving-code-review` | /receiving-code-review, /code-review-feedback, /review-comments, /PR-feedback, /implement-suggestions | Use when receiving code review feedback, before implementing suggestions, esp... |
| reflect | `/reflect` | /reflect, /self-refine, /improve-response, /iterative-review-output | Reflect on previus response and output, based on Self-refinement framework fo... |
| requesting-code-review | `/requesting-code-review` | /requesting-code-review, /request-review, /code-review, /PR-review, /merge-verification | Use when completing tasks, implementing major features, or before merging to ... |
| reset | `/reset` | /reset, /reset-fpf, /fpf-reset, /clear-session, /start-fresh-cycle | Reset the FPF reasoning cycle to start fresh |
| review-local-changes | `/review-local-changes` | /review-local-changes, /review-uncommitted, /pre-commit-review, /local-diff-review | Comprehensive review of local uncommitted changes using specialized agents wi... |
| review-pr | `/review-pr` | /review-pr, /pull-request-review, /code-review-pr, /review-pull-request | Comprehensive pull request review using specialized agents |
| root-cause-tracing | `/root-cause-tracing` | /root-cause-tracing, /trace-error, /deep-error, /execution-error-trace | Use when errors occur deep in execution and you need to trace back to find th... |
| setup-arxiv-mcp | `/setup-arxiv-mcp` | /setup-arxiv-mcp, /arxiv-mcp, /setup-arxiv, /paper-search-mcp, /arxiv-docker-mcp | Guide for setup arXiv paper search MCP server using Docker MCP |
| setup-codemap-cli | `/setup-codemap-cli` | /setup-codemap-cli, /codemap-cli, /setup-codemap, /codebase-visualization-cli, /codemap-install | Guide for setup Codemap CLI for intelligent codebase visualization and naviga... |
| setup-context7-mcp | `/setup-context7-mcp` | /setup-context7-mcp, /context7-mcp, /setup-context7, /context7-server, /docs-mcp-server | Guide for setup Context7 MCP server to load documentation for specific techno... |
| setup-serena-mcp | `/setup-serena-mcp` | /setup-serena-mcp, /serena-mcp, /setup-serena, /semantic-code-mcp, /serena-server | Guide for setup Serena MCP server for semantic code retrieval and editing cap... |
| skill-creator | `/skill-creator` | /skill-creator, /create-skill, /new-skill, /edit-skill, /skill-performance, /optimize-skill | Create new skills, modify and improve existing skills, and measure skill perf... |
| status | `/status` | /status, /fpf-status, /display-fpf-state, /show-reasoning-state, /current-fpf | Display the current state of the FPF knowledge base |
| subagent-driven-development | `/subagent-driven-development` | /subagent-driven-development, /subagent, /parallel-tasks, /dispatch-agents, /implementation-plan-execution | Use when executing implementation plans with independent tasks in the current... |
| systematic-debugging | `/systematic-debugging` | /systematic-debugging, /debug, /bug-fix, /test-failure, /unexpected-behavior, /root-cause | Use when encountering any bug, test failure, or unexpected behavior, before p... |
| test-driven-development | `/test-driven-development` | /test-driven-development, /TDD, /test-first, /write-tests, /test-driven, /unit-test | Use when implementing any feature or bugfix, before writing implementation code |
| test-prompt | `/test-prompt` | /test-prompt, /eval-prompt, /validate-prompt, /prompt-testing | Use when creating or editing any prompt (commands, hooks, skills, subagent in... |
| test-skill | `/test-skill` | /test-skill, /verify-skill, /skill-eval, /validate-skill-deployment | Use when creating or editing skills, before deployment, to verify they work u... |
| thought-based-reasoning | `/thought-based-reasoning` | /thought-based-reasoning, /chain-of-thought, /step-reasoning, /complex-reasoning, /thought-prompting | Use when tackling complex reasoning tasks requiring step-by-step logic, multi... |
| tree-of-thoughts | `/tree-of-thoughts` | /tree-of-thoughts, /tot-reasoning, /exploration-pruning, /thought-tree | Execute tasks through systematic exploration, pruning, and expansion using Tr... |
| ui-ux-pro-max | `/ui-ux-pro-max` | /ui-ux-pro-max, /UI-design, /UX-patterns, /color-palette, /font-pairing, /component-styling | UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color ... |
| update-docs | `/update-docs` | /update-docs, /maintain-documentation, /update-project-docs, /local-changes-docs | Update and maintain project documentation for local code changes using multi-... |
| use-my-browser | `/use-my-browser` | /use-my-browser, /live-browser, /browser-session, /DOM-inspection, /localhost, /logged-in-page | Use when work depends on the user's live browser session or visible rendered ... |
| using-git-worktrees | `/using-git-worktrees` | /using-git-worktrees, /git-worktree, /isolated-workspace, /feature-branch-isolation, /worktree-setup | Use when starting feature work that needs isolation from current workspace or... |
| using-superpowers | `/using-superpowers` | /using-superpowers, /session-start, /skill-discovery, /find-skills, /conversation-init | Use when starting any conversation - establishes how to find and use skills, ... |
| verification-before-completion | `/verification-before-completion` | /verification-before-completion, /verify-completion, /run-tests, /confirm-passing, /pre-commit-check | Use when about to claim work is complete, fixed, or passing, before committin... |
| why | `/why` | /why, /five-whys, /root-cause-why, /why-analysis, /iterative-why | Iterative Five Whys root cause analysis drilling from symptoms to fundamentals |
| write-concisely | `/write-concisely` | /write-concisely, /concise-writing, /clear-documentation, /strunk-elements-style | Apply writing rules to any documentation that humans will read. Makes your wr... |
| write-tests | `/write-tests` | /write-tests, /add-test-coverage, /test-local-changes, /systematically-test | Systematically add test coverage for all local code changes using specialized... |
| writing-plans | `/writing-plans` | /writing-plans, /write-plan, /implementation-plan, /task-breakdown, /spec-to-plan | Use when you have a spec or requirements for a multi-step task, before touchi... |
| writing-skills | `/writing-skills` | /writing-skills, /write-skill, /create-skill-file, /skill-deployment, /edit-SKILL.md | Use when creating new skills, editing existing skills, or verifying skills wo... |

---

## 🗺️ WORKFLOW DOMAIN ROUTING

| Domínio | Ativos |
|---------|--------|
| ai | agent-evaluation, analyse, apply-anthropic-skill-best-practices, auto-config-skills, context-engineering, create-agent, create-rule, create-skill, create-workflow-command, do-and-judge, do-in-parallel, do-in-steps, executing-plans, implement-task, judge, launch-sub-agent, memorize, power-bi-model-design-review, prompt-engineering, subagent-driven-development, test-prompt, test-skill, update-docs |
| backend | commit, create-pr, query, receiving-code-review, skill-creator |
| devops | actualize, analyze-issue, attach-review-to-pr, decay, dispatching-parallel-agents, finishing-a-development-branch, git-notes, git-worktrees, load-issues, pbip-dependency-analyzer, propose-hypotheses, review-local-changes, using-git-worktrees, writing-skills |
| frontend | analyse-problem, brainstorm, brainstorming, build-mcp, chrome-devtools, critique, design-taste-frontend, develop-userscripts, frontend-design, impeccable, kaizen, karpathy-guidelines, multi-agent-patterns, pbi-report-builder, pbi-requirements-gathering, playwright-scraper, powerbi-modeling, prd, pwa-development, requesting-code-review, setup-arxiv-mcp, setup-codemap-cli, setup-context7-mcp, setup-serena-mcp, thought-based-reasoning, ui-ux-pro-max, use-my-browser, using-superpowers, verification-before-completion, writing-plans |
| general | cause-and-effect, create-command, create-ideas, graphify, judge-with-debate, plan-do-check-act, reflect, reset, root-cause-tracing, status, test-driven-development, why, write-concisely |
| testing | add-task, create-hook, do-competitively, fix-tests, plan-task, review-pr, systematic-debugging, tree-of-thoughts, write-tests |

---

## 📚 SKILLS REGISTRY
> Última sincronização: 2026-05-13 09:55

| Skill | Domain | Triggers | Descrição | Status |
|-------|--------|----------|-----------|--------|
| agent-evaluation | ai | evaluate agent, improve agent, test command, claude eval | Evaluate and improve Claude Code commands, skills, and agents. Use when testing ... | ✅ Válida |
| analyse | ai | kaizen analysis, gemba walk, value stream, muda analysis | Auto-selects best Kaizen method (Gemba Walk, Value Stream, or Muda) for target | ✅ Válida |
| apply-anthropic-skill-best-practices | ai | anthropic best practices, skill authoring, skill spec, write skill anthropic | Comprehensive guide for skill development based on Anthropic's official best pra... | ✅ Válida |
| context-engineering | ai | context engineering, context window, agent context, llm context | Understand the components, mechanics, and constraints of context in agent system... | ✅ Válida |
| create-agent | ai | create agent, new agent, build agent, agent structure | Comprehensive guide for creating Claude Code agents with proper structure, trigg... | ✅ Válida |
| create-rule | ai | create rule, add rule, gemini rule, found gap rule | Use when found gap or repetative issue, that produced by you or implemenataion a... | ✅ Válida |
| create-skill | ai | create skill, new skill, build skill, write skill | Guide for creating effective skills. This command should be used when users want... | ✅ Válida |
| create-workflow-command | ai | create workflow, workflow command, multi-step workflow, orchestrate command | Create a workflow command that orchestrates multi-step execution through sub-age... | ✅ Válida |
| do-and-judge | ai | do and judge, llm judge, sub-agent verify, implement and verify | Execute a task with sub-agent implementation and LLM-as-a-judge verification wit... | ✅ Válida |
| do-in-parallel | ai | do in parallel, parallel agents, concurrent tasks, batch execution | Launch multiple sub-agents in parallel to execute tasks across files or targets ... | ✅ Válida |
| do-in-steps | ai | do in steps, sequential agents, step by step execution, multi-step task | Execute complex tasks through sequential sub-agent orchestration with intelligen... | ✅ Válida |
| executing-plans | ai | implementation plan, execute plan, plan execution, session checkpoints | Use when you have a written implementation plan to execute in a separate session... | ✅ Válida |
| implement-task | ai | implement task, llm judge task, automated implementation, task with verify | Implement a task with automated LLM-as-Judge verification for critical steps | ✅ Válida |
| judge | ai | judge output, meta-judge, evaluate result, llm as judge | Launch a meta-judge then a judge sub-agent to evaluate results produced in the c... | ✅ Válida |
| launch-sub-agent | ai | launch sub-agent, spawn agent, sub-agent execution, delegate task agent | Launch an intelligent sub-agent with automatic model selection based on task com... | ✅ Válida |
| memorize | ai | memorize insight, save insight, agentic context distillation, claude md insight | Curates insights from reflections and critiques into CLAUDE.md using Agentic Con... | ✅ Válida |
| pbip-dependency-analyzer | ai | analyze dependencies, dependency check, impact analysis | Power BI PBIP Dependency Analyzer. Maps dependencies between objects in .pbip fi... | ✅ Válida |
| power-bi-model-design-review | ai | power bi review, model design review, data model evaluation, model architecture | Comprehensive Power BI data model design review prompt for evaluating model arch... | ✅ Válida |
| prompt-engineering | ai | prompt engineering, write prompt, llm prompt, improve prompt | Use this skill when you writing commands, hooks, skills for Agent, or prompts fo... | ✅ Válida |
| subagent-driven-development | ai | subagent driven, independent tasks, executing implementation plan, parallel implementation | Use when executing implementation plans with independent tasks in the current se... | ✅ Válida |
| test-prompt | ai | test prompt, eval prompt, validate prompt, prompt testing | Use when creating or editing any prompt (commands, hooks, skills, subagent instr... | ✅ Válida |
| test-skill | ai | test skill, verify skill, skill eval, validate skill deployment | Use when creating or editing skills, before deployment, to verify they work unde... | ✅ Válida |
| update-docs | ai | update docs, maintain documentation, update project docs, local changes docs | Update and maintain project documentation for local code changes using multi-age... | ✅ Válida |
| writing-plans | ai | write plan, implementation plan, task breakdown, spec to plan | Use when you have a spec or requirements for a multi-step task, before touching ... | ✅ Válida |
| commit | backend | git commit, conventional commit, commit message, format commit | Create well-formatted commits with conventional commit messages and emoji | ✅ Válida |
| create-pr | backend | create pr, pull request, github pr, open pr | Create pull requests using GitHub CLI with proper templates and formatting | ✅ Válida |
| query | backend | query fpf, fpf knowledge base, search hypothesis, fpf query | Search the FPF knowledge base and display hypothesis details with assurance info... | ✅ Válida |
| receiving-code-review | backend | code review feedback, review comments, PR feedback, implement suggestions | Use when receiving code review feedback, before implementing suggestions, especi... | ✅ Válida |
| actualize | devops | actualize, fpf state, reconcile project, sync repository | Reconcile the project's FPF state with recent repository changes | ✅ Válida |
| analyze-issue | devops | analyze issue, github issue, technical spec, issue breakdown | Analyze a GitHub issue and create a detailed technical specification | ✅ Válida |
| attach-review-to-pr | devops | attach review, pr review comments, line review, github review api | Add line-specific review comments to pull requests using GitHub CLI API | ✅ Válida |
| auto-config-skills | devops | /auto-config-skills, sincronizar skills, mapear skills, atualizar registry | Workflow de sincronização do registry de skills no gemini.md. Ativado pelo coman... | ✅ Válida |
| decay | devops | evidence decay, stale decisions, freshness governance, fpf decay | Manage evidence freshness by identifying stale decisions and providing governanc... | ✅ Válida |
| dispatching-parallel-agents | devops | parallel agents, independent tasks, concurrent dispatch, multiple failures | Use when facing 2+ independent tasks that can be worked on without shared state ... | ✅ Válida |
| finishing-a-development-branch | devops | finish branch, merge PR, integration complete, development done | Use when implementation is complete, all tests pass, and you need to decide how ... | ✅ Válida |
| git-notes | devops | git notes, commit metadata, annotate commit, git note add | Use when adding metadata to commits without changing history, tracking review st... | ✅ Válida |
| git-worktrees | devops | git worktree, multiple branches, isolated workspace, worktree | Use when working on multiple branches simultaneously, context switching without ... | ✅ Válida |
| load-issues | devops | load issues, github issues, list open issues, fetch issues | Load all open issues from GitHub and save them as markdown files | ✅ Válida |
| propose-hypotheses | devops | propose hypotheses, fpf cycle, hypothesis generation, decision hypothesis | Execute complete FPF cycle from hypothesis generation to decision | ✅ Válida |
| review-local-changes | devops | review local changes, review uncommitted, pre-commit review, local diff review | Comprehensive review of local uncommitted changes using specialized agents with ... | ✅ Válida |
| setup-arxiv-mcp | devops | arxiv mcp, setup arxiv, paper search mcp, arxiv docker mcp | Guide for setup arXiv paper search MCP server using Docker MCP | ✅ Válida |
| setup-codemap-cli | devops | codemap cli, setup codemap, codebase visualization cli, codemap install | Guide for setup Codemap CLI for intelligent codebase visualization and navigatio... | ✅ Válida |
| setup-context7-mcp | devops | context7 mcp, setup context7, context7 server, docs mcp server | Guide for setup Context7 MCP server to load documentation for specific technolog... | ✅ Válida |
| setup-serena-mcp | devops | serena mcp, setup serena, semantic code mcp, serena server | Guide for setup Serena MCP server for semantic code retrieval and editing capabi... | ✅ Válida |
| skill-creator | devops | create skill, new skill, edit skill, skill performance | Create new skills, modify and improve existing skills, and measure skill perform... | ✅ Válida |
| using-git-worktrees | devops | git worktree, isolated workspace, feature branch isolation, worktree setup | Use when starting feature work that needs isolation from current workspace or be... | ✅ Válida |
| writing-skills | devops | write skill, create skill file, skill deployment, edit SKILL.md | Use when creating new skills, editing existing skills, or verifying skills work ... | ✅ Válida |
| analyse-problem | frontend | a3 problem, analyse problem, root cause report, one page analysis | Comprehensive A3 one-page problem analysis with root cause and action plan | ✅ Válida |
| brainstorm | frontend | brainstorm feature, design idea, ideate, explore approach | Use when creating or developing, before writing code or implementation plans - r... | ✅ Válida |
| brainstorming | frontend | brainstorm, creative work, ideation, feature planning | You MUST use this before any creative work - creating features, building compone... | ✅ Válida |
| build-mcp | frontend | build mcp, create mcp server, mcp tool, model context protocol | Guide for creating high-quality MCP (Model Context Protocol) servers that enable... | ✅ Válida |
| chrome-devtools | frontend | devtools, browser debugging, performance profiling, network analysis | Expert-level browser automation, debugging, and performance analysis using Chrom... | ✅ Válida |
| critique | frontend | critique output, multi perspective review, judge debate, critique code | Comprehensive multi-perspective review using specialized judges with debate and ... | ✅ Válida |
| design-taste-frontend | frontend | design taste, ui bias, frontend aesthetic, design engineer | Senior UI/UX Engineer. Architect digital interfaces overriding default LLM biase... | ✅ Válida |
| develop-userscripts | frontend | userscript, tampermonkey, scriptcat, GM API | Use when building, debugging, packaging, or publishing browser userscripts for T... | ✅ Válida |
| frontend-design | frontend | web design, UI component, landing page, dashboard | Create distinctive, production-grade frontend interfaces with high design qualit... | ✅ Válida |
| impeccable | frontend | UI polish, design critique, visual hierarchy, UX audit | Use when the user wants to design, redesign, shape, critique, audit, polish, cla... | ✅ Válida |
| kaizen | frontend | kaizen, continuous improvement, iterative improvement, refactor incrementally | Use when Code implementation and refactoring, architecturing or designing system... | ✅ Válida |
| karpathy-guidelines | frontend | karpathy, llm coding mistakes, behavioral guidelines, coding anti-patterns | Behavioral guidelines to reduce common LLM coding mistakes. Use when writing, re... | ✅ Válida |
| multi-agent-patterns | frontend | multi-agent pattern, agent architecture, design agent system, orchestration pattern | Design multi-agent architectures for complex tasks. Use when single-agent contex... | ✅ Válida |
| pbi-report-builder | frontend | create visuals, build a report | Power BI PBIR Report Builder. Generates report pages, visuals, and IBCS charts b... | ✅ Válida |
| playwright-scraper | frontend | playwright, web scraping, dynamic content, browser automation | Playwright web scraping: dynamic content, auth flows, pagination, data extractio... | ✅ Válida |
| powerbi-modeling | frontend | power bi model, DAX, semantic model, star schema | Power BI semantic modeling assistant for building optimized data models. Use whe... | ✅ Válida |
| prd | frontend | prd, product requirements, requirements document, feature spec doc | Generate high-quality Product Requirements Documents (PRDs) for software systems... | ✅ Válida |
| pwa-development | frontend | pwa, progressive web app, service worker, offline app | Progressive Web Apps - service workers, caching strategies, offline, Workbox | ✅ Válida |
| requesting-code-review | frontend | request review, code review, PR review, merge verification | Use when completing tasks, implementing major features, or before merging to ver... | ✅ Válida |
| responsive-design | frontend | responsive layout, mobile-first, container queries, fluid typography | Implement modern responsive layouts using container queries, fluid typography, C... | ✅ Válida |
| ui-ux-pro-max | frontend | UI design, UX patterns, color palette, font pairing | UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color pal... | ✅ Válida |
| use-my-browser | frontend | live browser, browser session, DOM inspection, localhost | Use when work depends on the user's live browser session or visible rendered sta... | ✅ Válida |
| cause-and-effect | general | cause effect, fishbone diagram, ishikawa, root cause categories | Systematic Fishbone analysis exploring problem causes across six categories | ✅ Válida |
| create-command | general | create command, new command, claude command, slash command | Interactive assistant for creating new Claude commands with proper structure, pa... | ✅ Válida |
| create-ideas | general | generate ideas, creative ideas, one shot ideas, brainstorm list | Generate ideas in one shot using creative sampling | ✅ Válida |
| judge-with-debate | general | judge with debate, multi-judge debate, evaluate debate, consensus judge | Evaluate solutions through multi-round debate between independent judges until c... | ✅ Válida |
| pbi-requirements-gathering | general | requirements, kickoff, scoping | Structured requirements gathering for Power BI projects to capture business cont... | ✅ Válida |
| plan-do-check-act | general | pdca, plan do check act, pdca cycle, iterative experiment | Iterative PDCA cycle for systematic experimentation and continuous improvement | ✅ Válida |
| reflect | general | reflect, self-refine, improve response, iterative review output | Reflect on previus response and output, based on Self-refinement framework for i... | ✅ Válida |
| reset | general | reset fpf, fpf reset, clear session, start fresh cycle | Reset the FPF reasoning cycle to start fresh | ✅ Válida |
| root-cause-tracing | general | root cause tracing, trace error, deep error, execution error trace | Use when errors occur deep in execution and you need to trace back to find the o... | ✅ Válida |
| status | general | fpf status, display fpf state, show reasoning state, current fpf | Display the current state of the FPF knowledge base | ✅ Válida |
| thought-based-reasoning | general | chain of thought, step reasoning, complex reasoning, thought prompting | Use when tackling complex reasoning tasks requiring step-by-step logic, multi-st... | ✅ Válida |
| using-superpowers | general | session start, skill discovery, find skills, conversation init | Use when starting any conversation - establishes how to find and use skills, req... | ✅ Válida |
| why | general | five whys, root cause why, why analysis, iterative why | Iterative Five Whys root cause analysis drilling from symptoms to fundamentals | ✅ Válida |
| write-concisely | general | write concisely, concise writing, clear documentation, strunk elements style | Apply writing rules to any documentation that humans will read. Makes your writi... | ✅ Válida |
| add-task | testing | add task, create task, draft task, specs task | creates draft task file in .specs/tasks/draft/ with original user intent | ✅ Válida |
| create-hook | testing | create hook, git hook, pre-commit hook, configure hook | Create and configure git hooks with intelligent project analysis, suggestions, a... | ✅ Válida |
| do-competitively | testing | competitive agents, multi-agent competition, parallel generation, best output | Execute tasks through competitive multi-agent generation, meta-judge evaluation ... | ✅ Válida |
| fix-tests | testing | fix tests, failing tests, repair tests, test failures after refactor | Systematically fix all failing tests after business logic changes or refactoring | ✅ Válida |
| graphify | testing | /graphify, knowledge graph | Convert any input to a knowledge graph. Use for codebase analysis and graphify q... | ✅ Válida |
| plan-task | testing | plan task, refine task, parallelize task, task spec | Refine, parallelize, and verify a draft task specification into a fully planned ... | ✅ Válida |
| review-pr | testing | review pr, pull request review, code review pr, review pull request | Comprehensive pull request review using specialized agents | ✅ Válida |
| systematic-debugging | testing | debug, bug fix, test failure, unexpected behavior | Use when encountering any bug, test failure, or unexpected behavior, before prop... | ✅ Válida |
| test-driven-development | testing | tdd, test driven development, write test first, red green refactor | Use when implementing any feature or bugfix, before writing implementation code ... | ✅ Válida |
| tree-of-thoughts | testing | tree of thoughts, tot reasoning, exploration pruning, thought tree | Execute tasks through systematic exploration, pruning, and expansion using Tree ... | ✅ Válida |
| verification-before-completion | testing | verify completion, run tests, confirm passing, pre-commit check | Use when about to claim work is complete, fixed, or passing, before committing o... | ✅ Válida |
| write-tests | testing | write tests, add test coverage, test local changes, systematically test | Systematically add test coverage for all local code changes using specialized re... | ✅ Válida |

---

## 🗺️ SKILL DOMAIN ROUTING

| Domínio | Ativos |
|---------|--------|
| ai | agent-evaluation, analyse, apply-anthropic-skill-best-practices, context-engineering, create-agent, create-rule, create-skill, create-workflow-command, do-and-judge, do-in-parallel, do-in-steps, executing-plans, implement-task, judge, launch-sub-agent, memorize, pbip-dependency-analyzer, power-bi-model-design-review, prompt-engineering, subagent-driven-development, test-prompt, test-skill, update-docs, writing-plans |
| backend | commit, create-pr, query, receiving-code-review |
| devops | actualize, analyze-issue, attach-review-to-pr, auto-config-skills, decay, dispatching-parallel-agents, finishing-a-development-branch, git-notes, git-worktrees, load-issues, propose-hypotheses, review-local-changes, setup-arxiv-mcp, setup-codemap-cli, setup-context7-mcp, setup-serena-mcp, skill-creator, using-git-worktrees, writing-skills |
| frontend | analyse-problem, brainstorm, brainstorming, build-mcp, chrome-devtools, critique, design-taste-frontend, develop-userscripts, frontend-design, impeccable, kaizen, karpathy-guidelines, multi-agent-patterns, pbi-report-builder, playwright-scraper, powerbi-modeling, prd, pwa-development, requesting-code-review, responsive-design, ui-ux-pro-max, use-my-browser |
| general | cause-and-effect, create-command, create-ideas, judge-with-debate, pbi-requirements-gathering, plan-do-check-act, reflect, reset, root-cause-tracing, status, thought-based-reasoning, using-superpowers, why, write-concisely |
| testing | add-task, create-hook, do-competitively, fix-tests, graphify, plan-task, review-pr, systematic-debugging, test-driven-development, tree-of-thoughts, verification-before-completion, write-tests |