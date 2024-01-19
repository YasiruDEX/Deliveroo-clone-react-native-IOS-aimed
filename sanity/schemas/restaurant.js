export default {
    name: 'restaurant',
    type: 'document',
    title: 'Restaurant',
    fields: [
      {
        name: 'name',
        type: 'string',
        title: 'Restaurant Name',
        validation: (Rule) => Rule.required(),
      },
      {
        name: 'shortDescription',
        type: 'string',
        title: 'Short Description',
        validation: (Rule) => Rule.max(200),
      },
      {
        name: 'image',
        type: 'image',
        title: 'Image of Restaurant',
      },
      {
        name: 'lat',
        type: 'number',
        title: 'Latitude of Restaurant',
      },
      {
        name: 'long',
        type: 'number',
        title: 'Longitude of Restaurant',
      },
      {
        name: 'address',
        type: 'string',
        title: 'Address of Restaurant',
        validation: (Rule) => Rule.required(),
      },
      {
        name: 'rating',
        type: 'number',
        title: 'Enter a rating between 1 and 5',
        validation: (Rule) => 
            Rule.required()
            .min(1)
            .max(5)
            .error('Rating must be between 1 and 5'),
      },
      {
        name: 'type',
        title: 'Category',
        validation: (Rule) => Rule.required(),
        type: 'reference',
        to : [{type: 'category'}]
      },
      {
        name: 'dishes',
        type: 'array',
        title: 'Dishes',
        of: [
          {
            type: 'reference',
            to: [{ type: 'dish' }],
          },
        ],
      }

    ]
  }