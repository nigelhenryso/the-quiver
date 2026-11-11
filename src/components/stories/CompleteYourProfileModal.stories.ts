
import type { Meta, StoryObj } from '@storybook/react';
import CompleteYourProfileModal from '../ui/authModals/CompleteYourProfileModal';

const meta = {
  title: 'UI/Auth Modals/CompleteYourProfileModal',
  component: CompleteYourProfileModal,
  args: {
    isOpen: true,
    onClose: () => {},
    onComplete: () => console.log('Profile completed'),
  },
} satisfies Meta<typeof CompleteYourProfileModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hero: Story = {};
