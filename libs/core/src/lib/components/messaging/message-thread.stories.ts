import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { MessageThreadComponent } from '@israel-ui/core';
import { MessageThread } from './messaging.types';

const SAMPLE_THREAD: MessageThread = {
  id: 'demo-thread',
  participantId: 'landlord-1',
  participantName: 'Carlos Mendes',
  propertyTitle: 'T2 Bairro Alto, Lisboa',
  unreadCount: 0,
  lastMessageAt: '2026-03-12T00:45:00Z',
  messages: [
    {
      id: 'm1',
      senderId: 'landlord-1',
      senderName: 'Carlos Mendes',
      text: 'Olá! Obrigado pelo interesse no apartamento do Bairro Alto.',
      timestamp: '2026-03-11T09:00:00Z',
      read: true,
    },
    {
      id: 'm2',
      senderId: 'user-current',
      senderName: 'Eu',
      text: 'Boa tarde! Podia enviar mais fotos do quarto principal?',
      timestamp: '2026-03-11T10:30:00Z',
      read: true,
    },
    {
      id: 'm3',
      senderId: 'landlord-1',
      senderName: 'Carlos Mendes',
      text: 'Claro, envio ainda hoje. Que dia funciona melhor para si?',
      timestamp: '2026-03-12T00:45:00Z',
      read: true,
    },
  ],
};

const EMPTY_THREAD: MessageThread = {
  id: 'empty-thread',
  participantId: 'landlord-2',
  participantName: 'Ana Ferreira',
  propertyTitle: 'Estúdio Intendente',
  unreadCount: 0,
  lastMessageAt: new Date().toISOString(),
  messages: [],
};

const meta: Meta<MessageThreadComponent> = {
  title: 'Sprint 018/MessageThread',
  component: MessageThreadComponent,
  tags: ['autodocs'],
  argTypes: {
    showClose: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<MessageThreadComponent>;

/** Default conversation thread with several messages. */
export const Default: Story = {
  args: {
    thread: SAMPLE_THREAD,
    showClose: false,
  },
};

/** Thread with close button visible (modal use-case). */
export const WithCloseButton: Story = {
  args: {
    thread: SAMPLE_THREAD,
    showClose: true,
  },
};

/** Empty thread — no messages yet. */
export const EmptyThread: Story = {
  args: {
    thread: EMPTY_THREAD,
    showClose: false,
  },
};
