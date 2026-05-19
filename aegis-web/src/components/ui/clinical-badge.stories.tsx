import type { Meta, StoryObj } from '@storybook/react';
import { ClinicalBadge } from './clinical-badge';

const meta: Meta<typeof ClinicalBadge> = {
  title: 'UI/ClinicalBadge',
  component: ClinicalBadge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ClinicalBadge>;

export const Critical: Story = {
  args: {
    severity: 'critical',
    children: 'Critical Risk',
  },
};

export const Warning: Story = {
  args: {
    severity: 'warning',
    children: 'Moderate Risk',
  },
};

export const Stable: Story = {
  args: {
    severity: 'stable',
    children: 'Stable',
  },
};

export const Info: Story = {
  args: {
    severity: 'info',
    children: 'Information',
  },
};
