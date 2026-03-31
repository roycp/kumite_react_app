import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FormScreen from '../FormScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Form">
      <Stack.Screen name="Form" component={FormScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
