import type { Meta, StoryObj } from '@storybook/react';
import { ProductCardSlider } from '../ui/LandingPage/ProductCardSlider';

import type { ComponentProps } from 'react';

type StoryProps = ComponentProps<typeof ProductCardSlider>

const meta: Meta<StoryProps> = {
    title: 'UI/LandingPage/ProductCardSlider',
    component: ProductCardSlider,
}

export default meta;

type Story = StoryObj<StoryProps>;

export const Hero: Story = {};