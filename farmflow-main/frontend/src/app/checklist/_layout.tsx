import { Stack } from 'expo-router';

export default function ChecklistLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="birds" />
      <Stack.Screen name="fish" />
      <Stack.Screen name="health" />
    </Stack>
  );
}
