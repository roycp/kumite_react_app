import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper';
import '../i18n'; // Initialize i18n (Spanish default)

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <AuthProvider>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="screens/HomeScreen" options={{ headerShown: false }} />
            <Stack.Screen name="screens/MainScreen" options={{ headerShown: false }} />
            <Stack.Screen name="screens/OnboardingScreen" options={{ title: 'Crear Cuenta', headerBackTitle: 'Inicio' }} />
            <Stack.Screen name="screens/TournamentSearch" options={{ headerShown: false }} />
            <Stack.Screen name="screens/TournamentDetail" options={{ title: 'Detalle del Torneo' }} />
            <Stack.Screen name="screens/TournamentManagement" options={{ headerShown: false }} />
            <Stack.Screen name="screens/FormScreen" options={{ title: 'Inscripción' }} />
            <Stack.Screen name="screens/CoachAthletesScreen" options={{ title: 'Mis Atletas' }} />
            <Stack.Screen name="screens/ProfileScreen" options={{ headerShown: false }} />
            <Stack.Screen name="screens/TournamentHistory" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
