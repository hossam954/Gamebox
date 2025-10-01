import AdminPanel from '../AdminPanel';

export default function AdminPanelExample() {
  const mockUsers = [
    {
      id: '1',
      username: 'abodiab',
      email: 'abojafar1327@gmail.com',
      balance: 50000,
      totalWins: 45,
      totalLosses: 23,
      status: 'active' as const,
    },
    {
      id: '2',
      username: 'player123',
      email: 'player123@example.com',
      balance: 10500,
      totalWins: 12,
      totalLosses: 8,
      status: 'active' as const,
    },
    {
      id: '3',
      username: 'lucky_gamer',
      email: 'lucky@example.com',
      balance: 25000,
      totalWins: 78,
      totalLosses: 34,
      status: 'active' as const,
    },
    {
      id: '4',
      username: 'suspended_user',
      email: 'suspended@example.com',
      balance: 0,
      totalWins: 5,
      totalLosses: 45,
      status: 'suspended' as const,
    },
  ];

  return (
    <AdminPanel
      users={mockUsers}
      onEditBalance={(userId, newBalance) => console.log('Edit balance:', userId, newBalance)}
      onSuspendUser={(userId) => console.log('Suspend user:', userId)}
      onDeleteUser={(userId) => console.log('Delete user:', userId)}
    />
  );
}
