/**
 * @file messaging.types.ts
 * Shared types for the Messaging module (Sprint 018).
 */

/** A single chat message in a thread. */
export interface ChatMessage {
  /** Unique message id. */
  id: string;
  /** Id of the sender. */
  senderId: string;
  /** Display name of the sender. */
  senderName: string;
  /** Optional avatar URL for the sender. */
  senderAvatar?: string;
  /** Message body text. */
  text: string;
  /** ISO timestamp. */
  timestamp: string;
  /** Whether the message has been read by the recipient. */
  read: boolean;
}

/** A conversation thread between two participants. */
export interface MessageThread {
  /** Unique thread id. */
  id: string;
  /** Id of the other participant (not the current user). */
  participantId: string;
  /** Display name of the other participant. */
  participantName: string;
  /** Optional avatar for participant. */
  participantAvatar?: string;
  /** Related property title (optional context). */
  propertyTitle?: string;
  /** All messages in this thread, ordered oldest-first. */
  messages: ChatMessage[];
  /** Count of unread messages for the current user. */
  unreadCount: number;
  /** Timestamp of the last message (for list sorting). */
  lastMessageAt: string;
}

/** Event emitted when the user sends a message. */
export interface MessageSendEvent {
  /** Thread id. */
  threadId: string;
  /** Text the user typed. */
  text: string;
}
