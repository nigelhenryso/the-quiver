import type { Meta, StoryObj } from '@storybook/react';

import type { ComponentProps } from 'react';

import { HeroSection } from '../ui/LandingPage/HeroSection'

type StoryProps = ComponentProps<typeof HeroSection>

const meta: Meta<StoryProps> = {
    component: HeroSection,
}

export default meta;

type Story = StoryObj<StoryProps>;

export const Hero: Story = {};