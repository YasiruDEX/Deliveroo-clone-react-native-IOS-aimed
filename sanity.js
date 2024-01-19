 import sanityClient from '@sanity/client';
 import imageUrlBuilder from '@sanity/image-url';

 const client = sanityClient({
    projectId: 'lexro0m0',
    dataset: 'production',
    useCdn: true,
    apiVersion : '2022-03-07'
    });

const builder = imageUrlBuilder(client);

export const urlFor = (source) => {Builder.image(source)};

export default client;