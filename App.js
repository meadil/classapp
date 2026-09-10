import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider, useUser } from './contexts/UserContext';
import RootNavigator from './navigation/RootNavigator';
import AuthScreen from './screens/AuthScreen';
import { colors } from './theme/theme';

function Gate() {
  const { session, loading } = useUser();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return session ? <RootNavigator /> : <AuthScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <StatusBar style="dark" />
        <Gate />
      </UserProvider>
    </SafeAreaProvider>
  );
}