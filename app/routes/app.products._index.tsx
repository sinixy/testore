import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "app/shopify.server";


interface ProductItem {
  id: string;
  title: string;
  handle: string;
  price: string;
  currencyCode: string;
  imageUrl?: string;
  imageAlt?: string;
  availableForSale: boolean;
}

interface PageInfo {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string;
  endCursor: string;
}

interface ShopifyProductNode {
  id: string;
  title: string;
  handle: string;
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
      };
    }[];
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const direction = url.searchParams.get("direction");

  let paginationArgs = "first: 10"; 
  if (cursor && direction === "next") {
    paginationArgs = `first: 10, after: "${cursor}"`;
  }
  else if (cursor && direction === "prev") {
    paginationArgs = `last: 10, before: "${cursor}"`;
  }

  const response = await admin.graphql(
    `#graphql
    query getProducts {
      products(${paginationArgs}) {
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
                }
              }
            }
          }
        }
      }
    }`
  );
  
  const responseJson = await response.json();

  return {
    products: responseJson.data.products.edges.map((edge: { node: ShopifyProductNode }) => {
      const node = edge.node;
      const variant = node.variants.edges[0]?.node;
      const media = node.featuredMedia;
      return {
        id: node.id,
        title: node.title,
        handle: node.handle,
        price: variant?.contextualPricing.price.amount ?? "0",
        currencyCode: variant?.contextualPricing.price.currencyCode ?? "USD",
        imageUrl: media?.image.url,
        imageAlt: media?.alt,
        availableForSale: variant?.availableForSale ?? false
      }
    }),
    pageInfo: responseJson.data.products.pageInfo
  };
};

function ProductRow({ product }: { product: ProductItem }) {
  return (
    <s-box 
      padding="base" 
      border-width="base" 
      border-radius="base" 
      border-color="border"
    >
      <s-stack direction="inline" justifyContent="space-between">
        <s-stack direction="inline" gap="small-100">
          <s-box blockSize="200px" inlineSize="200px">
            <s-image src={product.imageUrl} alt={product.imageAlt} inlineSize="fill" />
          </s-box>

          <s-box>
            <s-heading>
              <s-link href={`/app/products/${product.handle}`}>{product.title}</s-link>
            </s-heading>
            <s-text tone="info">
              {`${product.price} ${product.currencyCode}`}
            </s-text>
          </s-box>
        </s-stack>

        <s-stack direction="inline" gap="base">
          <s-badge tone={product.availableForSale ? "success" : "critical"}>
             {product.availableForSale ? "Available" : "Unavailable"}
          </s-badge>
        </s-stack>
      </s-stack>
    </s-box>
  );
}

function ProductsPagination({ pageInfo }: { pageInfo: PageInfo }) {
  const getPaginationLink = (cursor: string, direction: "next" | "prev") => {
    return `?cursor=${cursor}&direction=${direction}`;
  };

  return (
    <s-stack direction="inline" justifyContent="center" gap="small-300">
      <s-link 
        href={pageInfo.hasPreviousPage ? getPaginationLink(pageInfo.startCursor, "prev") : undefined}
      >
        <s-button disabled={!pageInfo.hasPreviousPage}>
            &lt; Previous
        </s-button>
      </s-link>
      <s-link 
        href={pageInfo.hasNextPage ? getPaginationLink(pageInfo.endCursor, "next") : undefined}
      >
        <s-button disabled={!pageInfo.hasNextPage}>
            Next &gt;
        </s-button>
      </s-link>
      
    </s-stack>
  )
}

export default function ProductsPage() {
  const { products, pageInfo }: {
    products: ProductItem[],
    pageInfo: PageInfo
  } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Products">
      <s-section>
        <s-stack gap="small-300">
          {products.map((product: ProductItem) => (
             <ProductRow key={product.id} product={product} />
          ))}
          <ProductsPagination pageInfo={pageInfo} />
        </s-stack>
      </s-section>
    </s-page>
  );
}