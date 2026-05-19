import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { EmergencyBanner } from './EmergencyBanner';

const meta: Meta<typeof EmergencyBanner> = {
  title: 'Layout/EmergencyBanner',
  component: EmergencyBanner,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmergencyBanner>;

export const Default: Story = {
  args: {
    showSoundToggle: false,
  },
};

export const WithSoundToggleAlertOn: Story = {
  args: {
    showSoundToggle: true,
    soundEnabled: true,
  },
};

export const WithSoundToggleAlertMuted: Story = {
  args: {
    showSoundToggle: true,
    soundEnabled: false,
  },
};
