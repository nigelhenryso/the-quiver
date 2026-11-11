import type { Meta, StoryObj } from '@storybook/react';
import VerifyOTPInput from '../ui/authModals/VerifyOTPInput';

const meta = {
  title: 'UI/Auth Modals/VerifyOTPInput',
  component: VerifyOTPInput,
  args: {
    isOpen: true,
    onClose: () => {},
  },
} satisfies Meta<typeof VerifyOTPInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hero: Story = {};
