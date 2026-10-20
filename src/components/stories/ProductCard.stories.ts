import type { Meta, StoryObj } from '@storybook/react';
import { ProductCard } from '../ui/LandingPage/ProductCard';

import type { ComponentProps } from 'react';

type StoryProps = ComponentProps<typeof ProductCard>

const meta: Meta<StoryProps> = {
    title: 'UI/LandingPage/ProductCard',
    component: ProductCard,
}

export default meta;

type Story = StoryObj<StoryProps>;

export const Hero: Story = {};