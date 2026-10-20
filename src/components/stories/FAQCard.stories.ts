import type { Meta, StoryObj } from '@storybook/react';
import { FAQCard } from '../ui/LandingPage/FAQCard';

import type { ComponentProps } from 'react';

type StoryProps = ComponentProps<typeof FAQCard>

const meta: Meta<StoryProps> = {
    title: 'UI/LandingPage/FAQCard',
    component: FAQCard,
}

export default meta;

type Story = StoryObj<StoryProps>;

export const Hero: Story = {};