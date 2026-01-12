export const GET_PRODUCTS_QUERY = `#graphql
  query getProducts($first: Int, $last: Int, $startCursor: String, $endCursor: String) {
    products(first: $first, last: $last, after: $startCursor, before: $endCursor) {
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          createdAt
          featuredMedia {
            id
            alt
            ... on MediaImage {
              image {
                url
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                contextualPricing(context: {country: US}) {
                  price {
                    amount
                    currencyCode
                  }
                }
                availableForSale
                inventoryQuantity
              }
            }
          }
        }
      }
    }
  }
`;

export interface ProductItem {
  id: string;
  title: string;
  handle: string;
  price: string;
  currencyCode: string;
  imageUrl?: string;
  imageAlt?: string;
  isAvailable: boolean;
  availableQuantity: number;
  createdAt: string;
}

export interface PageInfo {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string;
  endCursor: string;
}

export interface ShopifyProductNode {
  id: string;
  title: string;
  handle: string;
  createdAt: string;
  featuredMedia: {
    id: string,
    alt: string,
    image: {
      url: string
    }
  };
  variants: {
    edges: {
      node: {
        contextualPricing: {
          price: {
            amount: string,
            currencyCode: string
          }
        };
        availableForSale: boolean;
        inventoryQuantity: number;
      };
    }[];
  };
}