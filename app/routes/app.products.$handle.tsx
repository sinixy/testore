import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { GET_PRODUCT_BY_HANDLE_QUERY } from "../graphql";
import type { ProductItem, VariantItem, ShopifyVariantNode } from "../graphql";


export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { handle } = params;

  const response = await admin.graphql(
    GET_PRODUCT_BY_HANDLE_QUERY,
    {
      variables: { handle },
    }
  );

  const responseJson = await response.json();
  const product = responseJson.data.productByHandle;

  if (!product) {
    throw new Response("Product Not Found", { status: 404 });
  }

  return {
    product: {
      id: product.id,
      title: product.title,
      description: product.description,
      imageUrl: product.featuredMedia?.image.url,
      imageAlt: product.featuredMedia?.alt,
      variants: product.variants.edges.map((edge: { node: ShopifyVariantNode }) => {
        const variant = edge.node;
        return {
          id: variant.id,
          title: variant.title,
          price: variant.contextualPricing.price.amount,
          currencyCode: variant.contextualPricing.price.currencyCode,
        };
      }),
    },
  };
};

function ProductVariant({ variant }: {variant: VariantItem }) {
  return (
    <s-box key={variant.id}>
      <s-stack direction="inline" justifyContent="space-between">
        
        <s-heading>
          {variant.title}
        </s-heading>

        <s-text tone="info">
          {variant.price} {variant.currencyCode}
        </s-text>

      </s-stack>
    </s-box>
  )
}

export default function ProductDetailsPage() {
  const { product }: { product: ProductItem } = useLoaderData<typeof loader>();

  return (
    <s-page heading={product.title} back-action="/app/products">
      <s-grid gridTemplateColumns="1fr 1fr" gap="large" alignItems="start">

        <s-box inlineSize="100%" blockSize="100%">
          <s-image 
            src={product.imageUrl} 
            alt={product.imageAlt} 
            inlineSize="fill" 
          />
        </s-box>

        <s-stack gap="base">
          <s-section heading="Description">
            <s-box>
              {product.description ? product.description : "(No description)"}
            </s-box>
          </s-section>

          <s-section heading="Variants">
            <s-stack>
              {product.variants.map((variant: VariantItem, index: number) => (
                <ProductVariant key={index} variant={variant} />
              ))}
            </s-stack>
          </s-section>
        </s-stack>

      </s-grid>
    </s-page>
  );
}