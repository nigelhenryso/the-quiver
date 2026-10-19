import type { Meta, StoryObj } from '@storybook/react';

import type { ComponentProps } from 'react';

import { InputField } from '../ui/InputField'

type StoryProps = ComponentProps<typeof InputField>

const meta: Meta<StoryProps> = {
    component: InputField,
}

export default meta;

type Story = StoryObj<StoryProps>;

export const Hero: Story = {};