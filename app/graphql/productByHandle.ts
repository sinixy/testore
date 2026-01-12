export const GET_PRODUCT_BY_HANDLE_QUERY = `#graphql
    query getProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        description
        featuredMedia {
          id
          alt
          ... on MediaImage {
            image {
              url
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              contextualPricing(context: {country: US}) {
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }`;


export interface VariantItem {
  id: string
  title: string
  price: string
  currencyCode: string
}

export interface ProductItem {
  id: string
  title: string
  description: string
  imageUrl?: string
  imageAlt?: string
  variants: VariantItem[]
}

export interface ShopifyVariantNode {
  id: string;
  title: string;
  contextualPricing: {
    price: {
      amount: string,
      currencyCode: string
    }
  };
}