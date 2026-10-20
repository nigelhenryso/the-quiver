import type { Meta, StoryObj } from '@storybook/react';
import { OrgCard } from '../ui/LandingPage/OrgCard';

import type { ComponentProps } from 'react';

type StoryProps = ComponentProps<typeof OrgCard>

const meta: Meta<StoryProps> = {
    title: 'UI/LandingPage/OrgCard',
    component: OrgCard,
}

export default meta;

type Story = StoryObj<StoryProps>;

export const Hero: Story = {};