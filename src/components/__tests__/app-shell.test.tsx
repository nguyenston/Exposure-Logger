import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppShell } from '@/components/app-shell';

jest.mock('@/db/bootstrap', () => ({
  initializeDatabase: jest.fn(),
}));

describe('AppShell', () => {
  it('renders its children', () => {
    render(
      <AppShell>
        <Text>Phase 0 shell ready</Text>
      </AppShell>,
    );

    expect(screen.getByText('Phase 0 shell ready')).toBeTruthy();
  });
});
