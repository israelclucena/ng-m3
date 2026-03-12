import type { Meta, StoryObj } from '@storybook/angular';
import { MessageListComponent } from '@israel-ui/core';
import { MessageThread } from './messaging.types';

const THREADS: MessageThread[] = [
  {
    id: 'thread-1',
    participantId: 'landlord-1',
    participantName: 'Carlos Mendes',
    propertyTitle: 'T2 Bairro Alto, Lisboa',
    unreadCount: 2,
    lastMessageAt: '2026-03-12T00:45:00Z',
    messages: [
      {
        id: 'm1', senderId: 'landlord-1', senderName: 'Carlos Mendes',
        text: 'Que dia funciona melhor para si?', timestamp: '2026-03-12T00:45:00Z', read: false,
      },
    ],
  },
  {
    id: 'thread-2',
    participantId: 'landlord-2',
    participantName: 'Ana Ferreira',
    propertyTitle: 'Estúdio Intendente, Lisboa',
    unreadCount: 0,
    lastMessageAt: '2026-03-10T14:20:00Z',
    messages: [
      {
        id: 'm2', senderId: 'landlord-2', senderName: 'Ana Ferreira',
        text: 'Sim, está disponível a partir de 1 de Abril.', timestamp: '2026-03-10T14:20:00Z', read: true,
      },
    ],
  },
];

const meta: Meta<MessageListComponent> = {
  title: 'Sprint 018/MessageList',
  component: MessageListComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<MessageListComponent>;

/** Default list with unread + read threads. */
export const Default: Story = {
  args: { threads: THREADS },
};

/** Single thread, no unread. */
export const SingleRead: Story = {
  args: {
    threads: [THREADS[1]],
  },
};

/** Empty list — no conversations yet. */
export const Empty: Story = {
  args: { threads: [] },
};
