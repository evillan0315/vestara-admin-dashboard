import type { AIProvider, AICompletionRequest, AICompletionResponse } from './types.js';

/**
 * Smart Mock AI Provider
 *
 * Provides realistic demo responses without requiring any API keys.
 * Useful for development, testing, and demo environments.
 *
 * Features:
 * - Context-aware responses based on keywords
 * - Formatted markdown output
 * - Realistic token counting
 * - Configurable response delay
 */
export class MockAIProvider implements AIProvider {
  readonly name = 'mock';
  readonly models = ['mock'];

  private readonly responses = new Map<string, string[]>();

  constructor() {
    this.initResponses();
  }

  private initResponses(): void {
    this.responses.set('greeting', [
      "Hello! I'm your AI assistant. I can help you with:\n\n- **Dashboard Analytics** — interpreting KPIs and trends\n- **User Management** — answering questions about roles and permissions\n- **System Settings** — explaining configuration options\n- **Data Export** — helping with CSV/Excel/PDF exports\n- **Security** — best practices and audit log analysis\n\nWhat would you like to know?",
      "Hi there! Welcome to the Vestara Admin AI Assistant. I'm here to help you navigate the dashboard and make the most of your admin tools. How can I assist you today?",
    ]);

    this.responses.set('dashboard', [
      '## Dashboard Overview\n\nYour dashboard provides real-time insights into your admin operations:\n\n### Key Metrics\n- **Active Users** — Track user engagement and growth\n- **System Health** — Monitor API response times and uptime\n- **Recent Activity** — Review audit logs for security\n\n### Tips\n1. Use the **date range picker** to filter data by period\n2. Click **Refresh** to get the latest metrics\n3. Check the **Activity Feed** for recent admin actions\n\nWould you like me to explain any specific metric?',
      'Great question! The dashboard shows:\n\n| Metric | Description |\n|--------|-------------|\n| Users | Total active users in your organization |\n| Activity | Recent admin actions and system events |\n| Charts | Visual trends for audit activity |\n\nYou can customize the view using the settings in the top-right corner.',
    ]);

    this.responses.set('user', [
      '## User Management\n\nYou can manage users through the **Users & Roles** page:\n\n### Features\n- **Create User** — Add new team members with role assignment\n- **Bulk Actions** — Activate, deactivate, or delete multiple users\n- **Role-Based Access** — Assign `super_admin`, `admin`, `moderator`, or `support` roles\n- **CSV Export** — Download user data for external analysis\n\n### Security Notes\n- Users must have unique emails\n- Role changes are audit-logged\n- Self-deletion is prevented\n\nNeed help with a specific user management task?',
    ]);

    this.responses.set('settings', [
      '## Application Settings\n\nAccess settings via **System > Settings**:\n\n### What You Can Configure\n- **Key-Value Store** — Store arbitrary JSON configuration\n- **Import/Export** — Backup and restore settings as JSON\n- **Audit History** — Track all setting changes with timestamps\n\n### Best Practices\n1. Use descriptive key names (e.g., `email_smtp_host`)\n2. Export settings before major changes\n3. Review audit history for compliance\n\nWould you like help with a specific setting?',
    ]);

    this.responses.set('security', [
      '## Security Best Practices\n\n### Authentication\n- JWT tokens with short expiry + refresh rotation\n- OAuth support (Google, GitHub)\n- Password hashing with bcrypt\n\n### Authorization\n- Role-based access control (RBAC)\n- Organization-scoped resources\n- Self-delete prevention\n\n### Audit Trail\n- All admin actions are logged\n- IP address and user agent tracking\n- Error logging for API failures\n\n### Recommendations\n1. Enable MFA when available\n2. Review audit logs regularly\n3. Use least-privilege role assignments\n4. Rotate API keys periodically',
    ]);

    this.responses.set('export', [
      '## Data Export Options\n\nThe admin dashboard supports multiple export formats:\n\n### CSV Export\n- Available on most data tables\n- Respects current filters and search\n- Downloads directly from the browser\n\n### Settings Export\n- JSON format with versioning\n- Includes timestamps and metadata\n- Importable via Settings > Import\n\n### Reports (Coming Soon)\n- PDF generation with charts\n- Excel (.xlsx) with multiple sheets\n- Scheduled report generation\n\nWhich export type are you interested in?',
    ]);

    this.responses.set('help', [
      'I\'m here to help! Here are some things I can assist with:\n\n### Navigation\n- "How do I access user management?"\n- "Where are the system settings?"\n\n### Features\n- "How do I export data?"\n- "Can I customize the dashboard?"\n\n### Security\n- "What are the user roles?"\n- "How does authentication work?"\n\n### General\n- "What is Vestara?"\n- "Show me the admin panel overview"\n\nJust ask in natural language!',
    ]);

    this.responses.set('default', [
      "That's an interesting question! While I'm running in demo mode, I can help you understand the admin dashboard features.\n\nTry asking about:\n- Dashboard analytics\n- User management\n- Application settings\n- Security features\n- Data export options\n\nOr type **help** for a full list of topics.",
      "I appreciate your question! In this demo mode, I'm providing simulated responses. In production, I would connect to a real AI model to give you accurate answers.\n\nFor now, I can explain how the admin dashboard works. What feature would you like to learn about?",
      'Great question! Let me share what I know about the Vestara Admin Dashboard.\n\nThe dashboard is designed for managing a security/companion service platform with features like:\n- User and role management\n- Real-time monitoring\n- Settings configuration\n- File management\n\nWhat specific area would you like to explore?',
    ]);
  }

  private classifyMessage(message: string): string {
    const lower = message.toLowerCase();

    if (/\b(hi|hello|hey|greetings|good morning|good afternoon)\b/.test(lower)) {
      return 'greeting';
    }
    if (/\b(dashboard|kpi|metric|statistic|chart|analytics|overview)\b/.test(lower)) {
      return 'dashboard';
    }
    if (/\b(user|role|permission|admin|account|member)\b/.test(lower)) {
      return 'user';
    }
    if (/\b(setting|config|configuration|option|preference)\b/.test(lower)) {
      return 'settings';
    }
    if (/\b(security|auth|jwt|token|password|encrypt|audit)\b/.test(lower)) {
      return 'security';
    }
    if (/\b(export|csv|excel|pdf|download|backup)\b/.test(lower)) {
      return 'export';
    }
    if (/\b(help|assist|support|what can you|how do)\b/.test(lower)) {
      return 'help';
    }
    return 'default';
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    // Simulate network delay (200-800ms)
    const delay = 200 + Math.random() * 600;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const lastMessage = request.messages[request.messages.length - 1];
    const category = this.classifyMessage(lastMessage?.content ?? '');
    const responses = this.responses.get(category) ?? this.responses.get('default')!;
    const content = responses[Math.floor(Math.random() * responses.length)];

    // Simulate token counting
    const promptTokens = request.messages.reduce(
      (sum, m) => sum + Math.ceil(m.content.length / 4),
      0,
    );
    const completionTokens = Math.ceil(content.length / 4);

    return {
      content,
      model: request.model ?? 'mock',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }

  isAvailable(): boolean {
    return true; // Always available
  }
}
