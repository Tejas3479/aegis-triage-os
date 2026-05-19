import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { VitalSigns } from './VitalSigns';

const meta: Meta<typeof VitalSigns> = {
  title: 'Patient/VitalSigns',
  component: VitalSigns,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VitalSigns>;

export const StableBaseline: Story = {
  args: {
    vitals: {
      heartRate: {
        value: 72,
        trend: 'stable',
        status: 'normal',
      },
      spo2: {
        value: 98,
        trend: 'stable',
        status: 'normal',
      },
      temperature: {
        value: 36.6,
        trend: 'stable',
        status: 'normal',
      },
    },
  },
};

export const CriticalExertion: Story = {
  args: {
    vitals: {
      heartRate: {
        value: 124,
        trend: 'up',
        status: 'critical',
      },
      spo2: {
        value: 89,
        trend: 'down',
        status: 'critical',
      },
      temperature: {
        value: 39.1,
        trend: 'up',
        status: 'critical',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
