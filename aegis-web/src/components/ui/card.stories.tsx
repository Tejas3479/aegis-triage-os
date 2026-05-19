import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args: React.ComponentProps<typeof Card>) => (
    <Card {...args} className="w-[350px]">
      <CardHeader>
        <CardTitle>Standard Card</CardTitle>
        <CardDescription>A reliable, static container for clinical indicators.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">Standard vitals and baseline measurements are logged successfully.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Dismiss</Button>
        <Button>Confirm</Button>
      </CardFooter>
    </Card>
  ),
};

export const Hover: Story = {
  render: (args: React.ComponentProps<typeof Card>) => (
    <Card {...args} className="w-[350px] clinical-card cursor-pointer">
      <CardHeader>
        <CardTitle>Interactive Hover Card</CardTitle>
        <CardDescription>Transforms and lifts up on interaction.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">Hover over this card to view subtle micro-animations and shadow transformations.</p>
      </CardContent>
      <CardFooter>
        <span className="text-xs text-primary font-bold">CLICK TO DELIBERATE →</span>
      </CardFooter>
    </Card>
  ),
};

export const Destructive: Story = {
  render: (args: React.ComponentProps<typeof Card>) => (
    <Card {...args} className="w-[350px] border-critical bg-critical/5 text-critical-foreground">
      <CardHeader>
        <CardTitle className="text-critical">Critical Alert</CardTitle>
        <CardDescription className="text-critical/80">Severe biomarker variance detected.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Patient shows signs of severe oxygen saturation drop (SpO₂ &lt; 90%). Direct clinical escalation required.</p>
      </CardContent>
      <CardFooter>
        <Button className="bg-critical hover:bg-critical/90 text-white w-full">Deploy Team 108</Button>
      </CardFooter>
    </Card>
  ),
};
