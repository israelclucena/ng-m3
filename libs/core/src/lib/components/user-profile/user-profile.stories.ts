import type { Meta, StoryObj } from '@storybook/angular';
import { UserProfileComponent } from './user-profile.component';
import type { AuthUser } from '../../services/auth.service';

const TENANT: AuthUser = {
  id: 'u1',
  name: 'Israel Lucena',
  email: 'israel@lisboarent.pt',
  role: 'tenant',
};

const LANDLORD: AuthUser = {
  id: 'u2',
  name: 'Luana Silva',
  email: 'luana@lisboarent.pt',
  role: 'landlord',
};

const meta: Meta<UserProfileComponent> = {
  title: 'LisboaRent/UserProfile',
  component: UserProfileComponent,
  tags: ['autodocs'],
  argTypes: {
    editable: { control: 'boolean' },
    compact: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<UserProfileComponent>;

export const Default: Story = {
  args: {
    user: TENANT,
    stats: { bookings: 5, favourites: 12 },
    editable: true,
    compact: false,
  },
};

export const LandlordProfile: Story = {
  args: {
    user: LANDLORD,
    stats: { bookings: 2, favourites: 4, listings: 8 },
    editable: true,
    compact: false,
  },
};

export const CompactReadOnly: Story = {
  args: {
    user: TENANT,
    stats: null,
    editable: false,
    compact: true,
  },
};
