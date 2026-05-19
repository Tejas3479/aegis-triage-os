import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SyncStatus } from './SyncStatus';

const meta: Meta<typeof SyncStatus> = {
  title: 'Layout/SyncStatus',
  component: SyncStatus,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType) => (
      <div className="min-h-[200px] w-full relative bg-slate-950 p-10 flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SyncStatus>;

export const OfflineWithPending: Story = {
  args: {
    initialPendingCount: 4,
    initialIsOffline: true,
    initialIsSyncing: false,
  },
};

export const ActiveSyncing: Story = {
  args: {
    initialPendingCount: 2,
    initialIsOffline: false,
    initialIsSyncing: true,
  },
};

export const InstallPrompt: Story = {
  args: {
    initialDeferredPrompt: {
      prompt: () => console.log('Install prompt shown'),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    },
  },
};
