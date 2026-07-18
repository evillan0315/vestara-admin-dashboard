# AI Platform

> AI providers, chat system, RAG context injection, and data connectors.

---

## Table of Contents

- [Overview](#overview)
- [AI Provider Architecture](#ai-provider-architecture)
- [Chat System](#chat-system)
- [RAG (Retrieval-Augmented Generation)](#rag-retrieval-augmented-generation)
- [Data Connectors](#data-connectors)
- [Floating Chat Widget](#floating-chat-widget)
- [Models](#models)

---

## Overview

The Vestara AI Platform provides an intelligent assistant layer across the entire Command Center. It is designed around a **pluggable provider architecture** that supports multiple AI backends, from free-tier models to enterprise APIs.

**Key capabilities:**
- Multi-provider AI chat (OpenCode, OpenAI, Anthropic)
- Real-time RAG context injection from org data
- External REST API integration with AI-assisted visualization
- Floating chat widget accessible from every page
- Conversation history with model selection

---

## AI Provider Architecture

### Provider Interface

```typescript
// services/ai/provider.interface.ts
interface AIProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  chat(params: ChatParams): Promise<ChatResponse>;
  stream?(params: ChatParams): AsyncGenerator<ChatChunk>;
}
```

### Provider Chain

Providers are tried in priority order:

```
1. OpenCode (free-tier, default)
   ├── mimo-v2.5-free (reasoning model)
   ├── deepseek-v4-flash-free
   ├── nemotron-3-ultra-free (default)
   └── north-mini-code-free

2. OpenAI (if OPENAI_API_KEY set)
   ├── gpt-4o
   ├── gpt-4o-mini
   └── gpt-3.5-turbo

3. Anthropic (if ANTHROPIC_API_KEY set)
   ├── claude-3-5-sonnet
   └── claude-3-haiku

4. Mock (fallback — always available, returns canned responses)
```

### OpenCode Provider

The primary provider uses the OpenCode API (OpenAI-compatible):

- **Base URL:** `https://api.opencode.ai/zen/v1`
- **Auth:** API key in `Authorization: Bearer` header
- **Free models:** No billing required
- **Reasoning support:** Extracts reasoning from `reasoning`, `reasoning_content`, `reasoning_details` fields when `content` is null

---

## Chat System

### Database Models

```
ChatConversation (1)
  ├── id, title, userId, organizationId
  ├── model (AI model identifier)
  ├── systemPrompt (optional custom prompt)
  ├── isArchived
  └── (N) ChatMessage
        ├── id, role (user|assistant|system)
        ├── content, model, tokenCount
        └── metadata (tool calls, sources, etc.)
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat/conversations` | Create new conversation |
| GET | `/chat/conversations` | List user's conversations |
| GET | `/chat/conversations/:id` | Get conversation with messages |
| POST | `/chat/send` | Send message and get AI response |
| POST | `/chat/stream` | Send message with streaming response |
| PUT | `/chat/conversations/:id` | Update conversation (title, model) |
| DELETE | `/chat/conversations/:id` | Delete conversation |
| PATCH | `/chat/conversations/:id/archive` | Archive conversation |
| GET | `/chat/models` | List available AI models |

### Message Flow

```
1. User sends message via POST /chat/send
2. ChatService receives request
3. ContextBuilder fetches live org data (RAG)
4. System prompt updated with org context
5. Conversation history retrieved
6. AIProvider.chat() called with full context
7. Response stored as ChatMessage
8. Audit log created
9. Response returned to client
```

---

## RAG (Retrieval-Augmented Generation)

The RAG system injects real-time organization data into the AI's system prompt, enabling it to answer questions about actual business data.

### Context Builder

```typescript
// services/context-builder.ts
class ContextBuilder {
  // Fetches live org data in parallel
  // Caches for 60 seconds
  // Manages token budget
  // Formats as structured text context
}
```

### Data Sources for RAG

| Source | Endpoint | Data |
|--------|----------|------|
| Users | `GET /users` | Count, roles, recent registrations |
| Audit Logs | `GET /audit-logs` | Recent activity, action types |
| Settings | `GET /settings` | System configuration |
| Files | `GET /files` | Storage stats, recent uploads |
| Organization | `GET /organizations/:id` | Org name, metadata |
| Dashboard KPIs | Computed | User counts, activity metrics |
| User Activity | Computed | Current user's recent actions |
| Chat Stats | Computed | Conversation/message counts |

### Context Format

```
## Organization: Acme Corp

### Users
- Total users: 15
- Active users: 12
- Roles: 2 admins, 3 moderators, 10 support

### Recent Activity (last 24 hours)
- 5 login events
- 2 user creations
- 1 settings update

### System Settings
- App name: Vestara
- Storage provider: S3
- Theme: dark
```

### Token Budget

The context builder manages a token budget to prevent exceeding model limits:
- Max context tokens: 4000 (configurable)
- Oldest data truncated first
- Summary mode for large datasets

---

## Data Connectors

External REST API integration with AI-assisted visualization.

### Architecture

```
User configures API → DataSource model stored
         ↓
POST /integrations/:id/fetch
         ↓
HTTP Client (timeout-guarded fetch)
         ↓
Analyzer (JSON normalization + field-type inference)
         ↓
Heuristic Viz Spec (works without AI)
         ↓
AI Enhancement (when OPENCODE_API_KEY set)
         ↓
Data Explorer renders charts
```

### DataSource Model

```prisma
model DataSource {
  id, name, description
  method (GET | POST)
  baseUrl, path
  headers, body
  authType (none | bearer | basic | apiKey)
  authConfig (secrets stored server-side, never returned in DTOs)
  lastResult (cached)
  refreshInterval
  organizationId
}
```

### Supported Auth Types

| Type | Config |
|------|--------|
| `none` | — |
| `bearer` | `{ token: "..." }` |
| `basic` | `{ username: "...", password: "..." }` |
| `apiKey` | `{ key: "...", value: "...", addTo: "header" | "query" }` |

### Analyzer

The analyzer performs:
1. **JSON normalization** — flattens nested structures
2. **Field-type inference** — detects string, number, boolean, date, enum
3. **Heuristic visualization** — suggests chart types based on data shape
4. **AI enhancement** — refines suggestions when AI key is available

### Visualization Heuristics

| Data Shape | Suggested Chart |
|-----------|----------------|
| Single number | Stat card |
| Time series | Line chart |
| Categories + values | Bar chart |
| Parts of whole | Pie/donut chart |
| Key-value pairs | Table |
| Geographic data | Map (future) |

---

## Floating Chat Widget

A floating action button (FAB) in the bottom-right corner providing AI access from every page.

**Features:**
- Keyboard shortcut: `Cmd+Shift+K` / `Ctrl+Shift+K`
- Page-aware context suggestions (3 primary + 3 secondary chips per route)
- Minimized bar mode (3-way state: FAB → minimized → full panel)
- Open-in-full-page button (navigates to `/chat`)
- Auto-resumes most recent active conversation
- Markdown rendering with copy button
- Typing indicator
- Full-screen on mobile, 400px panel on desktop

---

## Models

### Available Models (OpenCode Free-Tier)

| Model ID | Type | Capabilities |
|----------|------|-------------|
| `mimo-v2.5-free` | Reasoning | Complex reasoning, analysis |
| `deepseek-v4-flash-free` | General | Fast responses, general tasks |
| `nemotron-3-ultra-free` | General | Default model, balanced |
| `north-mini-code-free` | Code | Code generation and analysis |

### Model Selection

Users can select the AI model per conversation. The default is `nemotron-3-ultra-free`. Model selection is stored on the `ChatConversation` model and passed to the provider on each request.
