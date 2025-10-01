import TopBar from '../TopBar';

export default function TopBarExample() {
  return (
    <TopBar
      balance={10500}
      onWalletClick={() => console.log('Wallet clicked')}
      onSupportClick={() => console.log('Support clicked')}
      onSettingsClick={() => console.log('Settings clicked')}
      onNotificationsClick={() => console.log('Notifications clicked')}
      hasNotifications={true}
    />
  );
}
