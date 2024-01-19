import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { ArrowRightIcon } from 'react-native-heroicons/outline'
import RestaurentCard from './RestaurentCard'

const FeatureRow = ({id, title, description}) => {
  return (
    <View>
        <View className="flex-row mt-4 items-center justify-between px-4">
        <Text className='font-bold text-lg'>{title}</Text>
        <ArrowRightIcon color="#00CCBB" />
        </View>

        <Text className='text-xs text-gray-500 px-4'>{description}</Text>

        <ScrollView
        horizontal
        contentContainerStyle={{
            paddingHorizontal: 15,
        }}
        showsHorizontalScrollIndicator={false}
        className="pt-4"
        >    
            {/* RestaurentCards */}
            <RestaurentCard 
            id={123}
            imgUrl="https://links.papareact.com/gn7"
            title="Yo! Shushi"
            rating={4.5}
            genre="Japanese"
            address="123, Main Street"
            shortDescription="Sushi, Japanese, Asian, Healthy, Seafood"
            dishes={[]}
            long={20}
            lat={0}
            />
            <RestaurentCard 
            id={123}
            imgUrl="https://links.papareact.com/gn7"
            title="Yo! Shushi"
            rating={4.5}
            genre="Japanese"
            address="123, Main Street"
            shortDescription="Sushi, Japanese, Asian, Healthy, Seafood"
            dishes={[]}
            long={20}
            lat={0}
            />
            <RestaurentCard 
            id={123}
            imgUrl="https://links.papareact.com/gn7"
            title="Yo! Shushi"
            rating={4.5}
            genre="Japanese"
            address="123, Main Street"
            shortDescription="Sushi, Japanese, Asian, Healthy, Seafood"
            dishes={[]}
            long={20}
            lat={0}
            />
            <RestaurentCard 
            id={123}
            imgUrl="https://links.papareact.com/gn7"
            title="Yo! Shushi"
            rating={4.5}
            genre="Japanese"
            address="123, Main Street"
            shortDescription="Sushi, Japanese, Asian, Healthy, Seafood"
            dishes={[]}
            long={20}
            lat={0}
            />
        </ScrollView>
    </View>
  )
}

export default FeatureRow