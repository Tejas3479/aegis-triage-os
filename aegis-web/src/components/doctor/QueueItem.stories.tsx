import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { QueueItem } from './QueueItem';

const meta: Meta<typeof QueueItem> = {
  title: 'Doctor/QueueItem',
  component: QueueItem,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof QueueItem>;

export const ActiveData: Story = {
  args: {
    item: {
      id: 'sess-abc123xyz',
      risk_score: 0.85,
      status: 'AWAITING_PHYSICIAN_APPROVAL',
      care_level: 'EMERGENCY_ROOM',
      updated_at: new Date().toISOString(),
      has_critical_risks: true,
      biomarker_variance: 'SpO2 88% / Heart Rate 112bpm',
    },
  },
};

export const StandardData: Story = {
  args: {
    item: {
      id: 'sess-789stable',
      risk_score: 0.25,
      status: 'STABLE_MONITORING',
      care_level: 'HOME_CARE',
      updated_at: new Date().toISOString(),
      has_critical_risks: false,
      biomarker_variance: 'Stable baseline telemetry',
    },
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const ErrorState: Story = {
  args: {
    error: 'Failed to retrieve telemetry stream from PII Vault.',
  },
};
