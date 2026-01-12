import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import { GET_PRODUCTS_QUERY } from "../graphql/products";
import type { ProductItem, PageInfo, ShopifyProductNode } from "../graphql/products";
import db from "../db.server";


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const direction = url.searchParams.get("direction");

  const adminQuery = admin.graphql(
    GET_PRODUCTS_QUERY,
    {
      variables: {
        first: direction === "prev" ? null : 10,
        last: direction === "prev" ? 10 : null,
        startCursor: direction === "prev" ? null : cursor,
        endCursor: direction === "prev" ? cursor : null,
      },
    }
  );

  const savedProductsQuery = db.savedProduct.findMany({
    where: { shop: session.shop },
    select: {
      productId: true
    }
  });

  const [response, savedProducts] = await Promise.all([
    adminQuery,
    savedProductsQuery,
  ]);
  const responseJson = await response.json();

  const products = responseJson.data.products.edges.map((edge: { node: ShopifyProductNode }) => {
    const node = edge.node;
    const firstVariant = node.variants.edges[0]?.node;
    const totalInventory = node.variants.edges.reduce(
      (total, edge) => total + edge.node.inventoryQuantity,
      0
    );
    const media = node.featuredMedia;
    return {
      id: node.id,
      title: node.title,
      handle: node.handle,
      price: firstVariant?.contextualPricing.price.amount ?? "0",
      currencyCode: firstVariant?.contextualPricing.price.currencyCode ?? "USD",
      imageUrl: media?.image.url,
      imageAlt: media?.alt,
      isAvailable: totalInventory > 0,
      availableQuantity: totalInventory,
      createdAt: node.createdAt,
    }
  });

  return {
    products: products,
    pageInfo: responseJson.data.products.pageInfo,
    savedProducts: savedProducts,
  } as { products: ProductItem[], pageInfo: PageInfo, savedProducts: { productId: string }[] };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();

  const productId = formData.get("productId") as string;
  const title = formData.get("title") as string;
  const handle = formData.get("handle") as string;
  const image = formData.get("image") as string;
  const isAvailable = formData.get("isAvailable") as string;
  const availableQuantity = formData.get("availableQuantity") as string;
  const createdAt = formData.get("createdAt") as string;

  await db.savedProduct.create({
    data: {
      shop: session.shop,
      productId: productId,
      title: title,
      handle: handle,
      image: image,
      isAvailable: isAvailable === "true",
      availableQuantity: Number(availableQuantity),
      createdTime: new Date(createdAt),
    }
  });

  await admin.graphql(
    `#graphql
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        metafields: [
          {
            ownerId: productId,
            namespace: "my_app",
            key: "is_saved",
            value: "true",
            type: "boolean"
          }
        ]
      }
    }
  );

  return { success: true };
};

function ProductRow({ product, isSaved }: { product: ProductItem, isSaved: boolean }) {
  const fetcher = useFetcher();

  const isSaving = fetcher.state !== "idle";
  const alreadySaved = isSaved || fetcher.data?.success;

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

          <s-stack direction="block" gap="small-100" justifyContent="space-between">

            <s-box>
              <s-heading>
                <s-link href={`/app/products/${product.handle}`}>{product.title}</s-link>
              </s-heading>
              <s-text tone="info">
                {`${product.price} ${product.currencyCode}`}
              </s-text>
            </s-box>

            <s-box>
            <fetcher.Form method="post">
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="title" value={product.title} />
              <input type="hidden" name="handle" value={product.handle} />
              <input type="hidden" name="image" value={product.imageUrl} />
              <input type="hidden" name="isAvailable" value={String(product.isAvailable)} />
              <input type="hidden" name="availableQuantity" value={String(product.availableQuantity)} />
              <input type="hidden" name="createdAt" value={product.createdAt} />
              <s-button type="submit" variant="primary" icon="edit" disabled={isSaving || alreadySaved}>
                {isSaving ? (
                  <><s-spinner accessibilityLabel="loading" />Saving...</>
                ) : alreadySaved ? "Saved" : "Save"}
              </s-button>
            </fetcher.Form>
            </s-box>

          </s-stack>

        </s-stack>

        <s-stack direction="inline" gap="base">
          <s-badge tone={product.isAvailable ? "success" : "critical"}>
             {product.isAvailable ? "Available" : "Unavailable"}
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
  const { products, pageInfo, savedProducts } = useLoaderData<typeof loader>();
  const savedIds = new Set(savedProducts.map((p) => p.productId));

  return (
    <s-page heading="Products">
      <s-section>
        <s-stack gap="small-300">
          {products.map((product: ProductItem) => (
             <ProductRow 
               key={product.id} 
               product={product} 
               isSaved={savedIds.has(product.id)}
             />
          ))}
          <ProductsPagination pageInfo={pageInfo} />
        </s-stack>
      </s-section>
    </s-page>
  );
}