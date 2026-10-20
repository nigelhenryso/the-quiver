import type { Meta, StoryObj } from '@storybook/react';
import { OrgSlider } from '../ui/LandingPage/OrgSlider';

import type { ComponentProps } from 'react';

type StoryProps = ComponentProps<typeof OrgSlider>

const meta: Meta<StoryProps> = {
    title: 'UI/LandingPage/OrgSlider',
    component: OrgSlider,
}

export default meta;

type Story = StoryObj<StoryProps>;

export const Hero: Story = {};