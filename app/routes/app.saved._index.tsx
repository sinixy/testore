import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Form, useSubmit } from "react-router";
import { authenticate } from "../shopify.server";
import type { SavedProduct } from "@prisma/client";
import db from "../db.server";


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  
  const titleFilter = url.searchParams.get("title") || "";
  const minQty = url.searchParams.get("minQty") || "0";
  const sort = url.searchParams.get("sort") || "desc";

  const savedProducts = await db.savedProduct.findMany({
    where: { 
      shop: session.shop,
      title: {
        contains: titleFilter,
      },
      availableQuantity: {
        gte: parseInt(minQty),
      }
    },
    orderBy: {
      createdTime: sort as "asc" | "desc",
    }
  });

  return { products: savedProducts, filters: { titleFilter, minQty, sort } };
};

function ProductRow({ product }: { product: SavedProduct }) {

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
            <s-image src={product.image ?? undefined} inlineSize="fill" />
          </s-box>

          <s-stack direction="block" gap="small-100" justifyContent="space-between">

            <s-box>
              <s-heading>
                <s-link href={`/app/products/${product.handle}`}>{product.title}</s-link>
              </s-heading>
            </s-box>

          </s-stack>

        </s-stack>

        <s-stack direction="block" gap="small-100" alignItems="end">
          <s-badge tone={product.isAvailable ? "success" : "critical"}>
             {product.isAvailable ? "Available" : "Unavailable"}
          </s-badge>
          <s-chip>{product.availableQuantity} in stock</s-chip>
        </s-stack>
      </s-stack>
    </s-box>
  );
}

export default function SavedProductsPage() {
  const { products, filters } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  // Helper to auto-submit when sort changes
  const handleChange = (event: React.FormEvent<HTMLFormElement>) => {
    submit(event.currentTarget);
  };

  return (
    <s-page heading="Saved Products">
      <s-section>
        <s-box>
          <Form method="get" onChange={handleChange}>
            <s-stack direction="inline" gap="base" alignItems="end">
              <s-box inlineSize="300px">
                <s-text>Search Title</s-text>
                <input 
                  type="text" 
                  name="title" 
                  defaultValue={filters.titleFilter} 
                  placeholder="Filter by title..." 
                  style={{ width: '100%', padding: '8px' }}
                />
              </s-box>

              <s-box inlineSize="150px">
                <s-text>Min Quantity</s-text>
                <input 
                  type="number" 
                  name="minQty" 
                  defaultValue={filters.minQty} 
                  style={{ width: '100%', padding: '8px' }}
                />
              </s-box>

              <s-box inlineSize="200px">
                <s-text>Sort by Date</s-text>
                <select 
                  name="sort" 
                  defaultValue={filters.sort} 
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </s-box>

              <s-button type="submit">Filter</s-button>
              <s-link href="/app/saved">Clear</s-link>
            </s-stack>
          </Form>
        </s-box>

        <s-stack gap="small-300">
          {products.length === 0 ? (
            <s-text tone="info">No products match your filters.</s-text>
          ) : (
            products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))
          )}
        </s-stack>
      </s-section>
    </s-page>
  );
}