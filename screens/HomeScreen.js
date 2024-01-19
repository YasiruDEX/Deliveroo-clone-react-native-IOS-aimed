import { View, Text, SafeAreaView, Image, TextInput, ScrollView} from 'react-native'
import React, { useLayoutEffect } from 'react'
import { useNavigation } from '@react-navigation/native';
import { 
  UserIcon, 
  ChevronDownIcon, 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon } from "react-native-heroicons/outline";
import Categories from '../components/Categories';
import FeatureRow from '../components/FeatureRow';
  

const HomeScreen = () => {

  const navigation = useNavigation();

  useLayoutEffect(() => {
      navigation.setOptions({
          headerShown: false,
      });
  }, []);

  return (
      <SafeAreaView className="bg-white pt-5">
          {/* Header */}
          <View className="flex-row pb-3 items-center mx-4 space-x-2">
              <Image
                  source={{ uri: 'https://links.papareact.com/wru', }}
                  className="h-7 w-7 bg-gray-300 p-4 rounded-full"
              />

              <View className="flex-1">
                  <Text className="font-bold text-gray-400 text-xs">Delivert Now!</Text>
                  <Text className="font-bold text-xl">Current Location
                      <ChevronDownIcon size={20} color="#00CCBB" />
                  </Text>
              </View>

              <UserIcon size={35} color="#00CCBB" />
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center space-x-2 pb-2 mx-4">
            <View className="flex-row flex-1 space-x-2 bg-gray-200 p-3">
              <MagnifyingGlassIcon color="gray" size={20}/>
              <TextInput placeholder="Restaurents and cuisines"
              keyboardType='default'/>
            </View>
            <AdjustmentsHorizontalIcon color="#00CCBB" />
          </View>

          {/* Body */}
          <ScrollView className="bg-gray-100"
          contentContainerStyle={{
            paddingBottom: 100,
          }}>
            {/* Categories */}
            <Categories />

            {/* FeatureRow */}
            <FeatureRow
              title="Featured"
              description="Paid placements from our partners"
              id="123"
            />

            {/* TastyDiscounts */}
            <FeatureRow
              title="Tasty Discounts"
              description="Everyone's favorite restaurants delivered for less"
              id="123"
            />

            {/* OffersNearYou  */}
            <FeatureRow
              title="Featured"
              description="why now support your local restaurants tonight!"
              id="123"
            />
          </ScrollView>
          
      </SafeAreaView>
  )
}

export default HomeScreen;