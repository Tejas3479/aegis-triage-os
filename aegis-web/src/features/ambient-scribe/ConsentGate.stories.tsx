import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ConsentGate } from './ConsentGate';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

// Use a wrapper to ensure translation strings work seamlessly
const meta: Meta<typeof ConsentGate> = {
  title: 'Features/ConsentGate',
  component: ConsentGate,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType) => (
      <I18nextProvider i18n={i18n}>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <Story />
        </div>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConsentGate>;

export const PreConsent: Story = {
  args: {
    sessionId: 'sess-dpdp-2026-audit-flow-xyz',
    onConsented: () => alert('Consent recorded and stored in local sessionStorage.'),
  },
};

export const RecordingConsent: Story = {
  args: {
    sessionId: 'sess-dpdp-recording-state-example',
    onConsented: () => {},
  },
  // In Storybook, we can showcase the modal in loading/submitting state
  render: (args: React.ComponentProps<typeof ConsentGate>) => {
    // We can simulate state here or show standard pre-consent state since loading is internal
    return <ConsentGate {...args} />;
  },
};
