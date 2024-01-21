import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';
import {TailwindProvider} from 'tailwindcss-react-native';
import {NavigationContainer} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen.js';
import RestuarantScreen from './screens/RestuarantScreen.js';
import { Provider } from 'react-redux';
import { store } from './store.js';
import BasketScreen from './screens/BasketScreen.js';
import PreparingOrderScreen from './screens/PreparingOrderScreen.js';
import DeliveryScreen from './screens/DeliveryScreen.js';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer> 
      <Provider store={store}>
        <TailwindProvider>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Restaurant" component={RestuarantScreen} />
            <Stack.Screen name="Basket" component={BasketScreen } 
              options={{ presentation: 'modal',
              headerShown: false, 
            }}
            />
            <Stack.Screen name="PreparingOrderScreen" component={PreparingOrderScreen} 
              options={{ presentation: 'fullScreenModal',
              headerShown: false,
            }}
            />
            <Stack.Screen name="DeliveryScreen" component={DeliveryScreen} 
              options={{ presentation: 'fullScreenModal',
              headerShown: false,
            }}
            />
          </Stack.Navigator>
        </TailwindProvider>
      </Provider>
    </NavigationContainer>
  );
}
