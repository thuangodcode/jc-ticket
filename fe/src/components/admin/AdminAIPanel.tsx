import AIChatPanel from '../AIChatPanel';

/**
 * AdminAIPanel - Wrapper around the unified AIChatPanel
 * Displays the AI Assistant inline on the Admin Dashboard, defaulting to the Admin Analysis tab.
 */
export default function AdminAIPanel() {
  return <AIChatPanel isInline={true} defaultTab="admin" />;
}
