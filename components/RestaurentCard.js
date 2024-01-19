import {TouchableOpacity, Text, Image, View} from 'react-native'
import React from 'react'
import { StarIcon } from 'react-native-heroicons/solid'
import { MapPinIcon } from 'react-native-heroicons/outline'

const RestaurentCard = ({
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
}) => {
  return (
    <TouchableOpacity className="bg-white shadow mr-3">
      <Image
        source={{ uri: imgUrl }}
        className="h-64 w-64 rounded-sm"
        />
        <View className="px-3 pb-4">   
            <Text className="font-bold text-lg pt-2">{title}</Text>
            <View className="flex-row items-center space-x-1">  
                <StarIcon color="green" opacity={0.5} size={22} />
                <Text className="text-xs text-gray-500">
                    <Text className="text-green-500">{rating}</Text>.{genre}
                    </Text>
            </View>

            <View className="flex-row space-x-2 items-center">
                <MapPinIcon color="gray" opacity={0.5} size={22} />
                <Text className="text-xs text-gray-500">Nearby . {address}</Text>
            </View>
        </View>
    </TouchableOpacity>
  )
}

export default RestaurentCard