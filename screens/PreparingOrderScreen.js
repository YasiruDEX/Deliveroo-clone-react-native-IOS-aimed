import { SafeAreaView, Text } from 'react-native'
import React, { useEffect } from 'react'
import * as Animatable from 'react-native-animatable';
import * as  Progress from 'react-native-progress';
import { useNavigation } from '@react-navigation/native';

const PreparingOrderScreen = () => {
    const navigation = useNavigation();

    useEffect(() => {
        const timeout = setTimeout(() => {
            navigation.navigate("DeliveryScreen");
        }, 4000);

        return () => clearTimeout(timeout);
    }
    , []); 

  return (
    <SafeAreaView className="bg-[#00CCBB] flex-1 justify-center items-center">
      <Animatable.Image
        source={require("../assets/orderLoading.gif")}
        animation={"slideInUp"}
        iterationCount={1}
        className="h-96 w-96"
        />
    <Animatable.Text
        animation={"slideInUp"}
        iterationCount={1}
        className="text-white text-lg font-bold text-center my-10">
        Waiting for the restaurant to confirm your order
    </Animatable.Text>
    <Progress.Circle
        size={60}
        indeterminate={true}
        color={"white"}
        />
    </SafeAreaView>
  )
}

export default PreparingOrderScreen