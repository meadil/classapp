import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from './components/CustomAlert';
import { LanguageProvider } from './contexts/LanguageContext';
import { UserProvider, useUser } from './contexts/UserContext';
import RootNavigator from './navigation/RootNavigator';
import AuthScreen from './screens/AuthScreen';
import { colors } from './theme/theme';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

function Gate() {
  const { session, loading } = useUser();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [session, loading]);

  if (loading) return <LoadingScreen />;

  return (
    <Animated.View style={{ flex: 1, opacity }}>
      {session ? <RootNavigator /> : <AuthScreen />}
    </Animated.View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'HindSiliguri-Regular': require('./assets/fonts/HindSiliguri-Regular.ttf'),
    'HindSiliguri-SemiBold': require('./assets/fonts/HindSiliguri-SemiBold.ttf'),
  });

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AlertProvider>
          <UserProvider>
            <StatusBar style="dark" />
            <Gate />
          </UserProvider>
        </AlertProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}