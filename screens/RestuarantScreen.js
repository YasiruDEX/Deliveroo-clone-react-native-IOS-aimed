import { ScrollView, View, Text, Image, TouchableOpacity} from 'react-native'
import React, { useEffect, useLayoutEffect } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native';
import { urlFor } from '../sanity';
import { ArrowLeftIcon, StarIcon } from 'react-native-heroicons/solid';
import { MapPinIcon } from 'react-native-heroicons/solid';
import { ChevronRightIcon, QuestionMarkCircleIcon } from 'react-native-heroicons/outline';
import DishRow from '../components/DishRow';
import BasketIcon from '../components/BasketIcon';
import { useDispatch } from 'react-redux';
import { setRestaurant } from '../features/restaurantSlice';

const RestuarantScreen = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const {
        params: {
            id,
            imgUrl,
            title,
            rating,
            genre,
            address,
            shortDescription,
            dishes,
            long,
            lat,
        },
    } = useRoute();   

    // console.log(shortDescription);

    useEffect(() => {
      dispatch(
        setRestaurant({
          id,
          imgUrl,
          title,
          rating,
          genre,
          address,
          shortDescription,
          dishes,
          long,
          lat,
        })
      );
    }, [dispatch]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, []);
  return (
    <>
    <BasketIcon /> 
      <ScrollView>
        <View className="relative ">
          <Image
              source={{
                  url: urlFor(imgUrl).url(),
              }}
              className="w-full h-56 bg-gray-300 p-4"
          />
          <TouchableOpacity 
              onPress={navigation.goBack}
              className="absolute top-14 left-5 rounded-full 
              bg-gray-100 p-2"> 
              <ArrowLeftIcon size={20} color="#00CCBB"  />
          </TouchableOpacity>
        </View>
        <View className="bg-white">  
            <View className="px-4 pt-4 "> 
              <Text className="text-2xl font-bold p-4">{title}</Text>
              <View className="flex flex-row space-x-2 my-1">
                <View className="flex-row items-center space-x-1">  
                  <StarIcon color="green" opacity={0.5}  size={22}/>
                  <Text className="text-sm text-gray-500">
                    <Text className="text-green-800">{rating}</Text> . {genre}
                  </Text>
                </View>

                <View className="flex-row items-center space-x-1">  
                  <MapPinIcon color="gray" opacity={0.4}  size={22}/>
                  <Text className="text-sm text-gray-500">
                    Nearby . {address}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-500 mt-2 pb-4">{shortDescription}</Text>
            </View>

            <TouchableOpacity className="flex-row items-center space-x-2 border-y p-4 border-gray-300">
              <QuestionMarkCircleIcon color="gray" opacity={0.6} size={20}/>
              <Text className="pl-2 flex-1 text-md font-bold">
                Have a food allergy?
              </Text>
              <ChevronRightIcon color="#00CCBB" />
            </TouchableOpacity>
        </View> 

        <View className="pb-36">
          <Text className="px-4 pt-6 mb-3 font-bold text-xl">Menu</Text>

          {/* Dishes */}
          {dishes?.map((dish) => (
            // console.log(dish.image),
            <DishRow
            key={dish._id}
            id={dish._id}
            image={dish.image}
            name={dish.name}
            description={dish.short_description}
            price={dish.price}
            />
          ))}
        </View>
      </ScrollView>
    </>
  )
}

export default RestuarantScreen