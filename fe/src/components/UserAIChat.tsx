import AIChatPanel from './AIChatPanel';

/**
 * UserAIChat - Wrapper around the unified AIChatPanel
 * Displays the AI Assistant as a floating bubble at the bottom right.
 */
export default function UserAIChat() {
  return <AIChatPanel isInline={false} defaultTab="user" />;
}
