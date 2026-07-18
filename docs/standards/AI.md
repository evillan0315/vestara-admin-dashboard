# AI Standards

> Guidelines for AI integration, provider usage, and responsible AI in the Vestara ecosystem.

---

## Principles

### 1. AI as augmentation, not replacement

AI enhances human workflows. Every AI feature should:
- Make existing tasks faster or easier
- Provide insights humans couldn't easily find
- Never replace human judgment for critical decisions

### 2. Transparency

Users should always know:
- When they're interacting with AI
- What data the AI has access to
- That AI outputs may be inaccurate

### 3. Data boundaries

AI should only access data the user is authorized to see. RAG context is org-scoped and filtered by the user's permissions.

### 4. Fallback always works

Every AI feature must have a non-AI fallback:
- Heuristic visualization (data connectors)
- Mock responses (chat when provider is unavailable)
- Manual workflows (report generation)

---

## Provider Architecture

### Interface

All AI providers implement the `AIProvider` interface:

```typescript
interface AIProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  chat(params: ChatParams): Promise<ChatResponse>;
}
```

### Provider Priority

1. **OpenCode** (free-tier, default) — no billing required
2. **OpenAI** — requires API key
3. **Anthropic** — requires API key
4. **Mock** — always available, returns canned responses

### Adding a New Provider

1. Implement `AIProvider` interface
2. Add to `ProviderFactory`
3. Add environment variables for credentials
4. Add model selection UI
5. Test with existing chat flows

---

## RAG (Retrieval-Augmented Generation)

### Context Injection Rules

1. **Always org-scoped** — only data from the user's organization
2. **Time-bounded** — cache for 60 seconds, never stale data
3. **Token-budgeted** — max 4000 tokens, truncate oldest data first
4. **Structured** — formatted as labeled sections for parseability
5. **Non-sensitive** — never include passwords, secrets, or PII beyond what's needed

### Context Sources

| Source | Data | Freshness |
|--------|------|-----------|
| Users | Count, roles, recent registrations | 60s cache |
| Audit Logs | Recent activity, action types | 60s cache |
| Settings | System configuration | 60s cache |
| Files | Storage stats, recent uploads | 60s cache |
| KPIs | Dashboard metrics | 60s cache |

### System Prompt Template

```
You are the Vestara AI Assistant, an enterprise AI operating within the
Vestara Command Center.

## Organization Context
{ORG_CONTEXT}

## Instructions
- Answer questions about the organization's data using the context above
- Be concise and actionable
- If you don't have enough data, say so
- Never fabricate data — use only what's provided in context
- For complex analysis, break it down into steps
```

---

## Chat System

### Model Selection

- Default model: `nemotron-3-ultra-free` (OpenCode)
- Users can select models per conversation
- Model choice stored on `ChatConversation` model
- Provider auto-selected based on model availability

### Conversation Management

- Conversations are org-scoped
- Messages include `role`, `content`, `model`, `tokenCount`
- Metadata field for tool calls, sources, and other extensions
- Archive conversations (soft delete)

### Streaming

- Support for streaming responses via `POST /chat/stream`
- Server-Sent Events (SSE) for token-by-token delivery
- Client renders partial responses in real-time

---

## Data Connectors

### Visualization Heuristics

The analyzer suggests chart types based on data shape:

| Data Shape | Chart Type | Reasoning |
|-----------|-----------|-----------|
| Single numeric value | Stat card | Summary metric |
| Time series (date + number) | Line chart | Trend over time |
| Categories + values (< 10) | Bar chart | Comparison |
| Categories + values (> 10) | Horizontal bar | Readability |
| Parts of whole | Pie/donut chart | Proportion |
| Key-value pairs | Table | Structured data |
| Nested objects | JSON tree | Exploration |

### AI Enhancement

When `OPENCODE_API_KEY` is set, the analyzer:
1. Sends the data schema to the AI
2. Requests chart type recommendations
3. Requests field mappings (x-axis, y-axis, grouping)
4. Merges AI suggestions with heuristic results
5. Returns the enhanced visualization spec

---

## Error Handling

### Provider Failures

```
Provider unavailable → Try next provider → Mock fallback
```

Never show raw provider errors to users. Always:
1. Log the error server-side
2. Return a user-friendly message
3. Suggest alternatives (try again, different model, contact support)

### Rate Limiting

AI providers may rate-limit. Handle with:
- Exponential backoff (client-side)
- Queue management for concurrent requests
- User notification when rate-limited

---

## Security

### Data Exposure

- AI providers receive only the conversation messages + RAG context
- Never send: passwords, secrets, JWT tokens, internal system details
- RAG context is filtered to org-scoped, non-sensitive data
- Provider API keys stored in environment variables, never in code

### Prompt Injection

- Sanitize user inputs before sending to AI
- System prompt is prepended, not user-controllable
- Validate AI responses for unexpected content
- Log suspicious inputs for security review

---

## Monitoring

### Metrics to Track

| Metric | Purpose |
|--------|---------|
| AI response time | Latency monitoring |
| Token usage | Cost tracking (paid providers) |
| Error rate | Provider reliability |
| Model popularity | Feature adoption |
| RAG cache hit rate | Performance optimization |

### Logging

- Log provider, model, token count per request
- Log errors with full context (not user data)
- Audit log entries for AI interactions
