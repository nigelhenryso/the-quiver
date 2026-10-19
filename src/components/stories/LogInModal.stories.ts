
import type { Meta, StoryObj } from '@storybook/react';
import LoginModal from '../ui/authModals/LogInModal';

const meta = {
  title: 'UI/Auth Modals/LogInModal',
  component: LoginModal,
  args: {
    isOpen: true,
    onClose: () => {},
    onContinue: () => console.log('Continue clicked'),
  },
} satisfies Meta<typeof LoginModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hero: Story = {};
