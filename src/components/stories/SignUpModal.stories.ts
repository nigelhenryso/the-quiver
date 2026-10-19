
import type { Meta, StoryObj } from '@storybook/react';
import SignUpModal from '../ui/authModals/SignUpModal';

const meta = {
  title: 'UI/Auth Modals/SignUpModal',
  component: SignUpModal,
  args: {
    isOpen: true,
    onClose: () => {},
    onContinue: () => console.log('Continue clicked'),
  },
} satisfies Meta<typeof SignUpModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hero: Story = {};
