import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, admin } = await authenticate.webhook(request);

  if (!admin) return new Response();
  
  const productId = payload.admin_graphql_api_id;
  const totalInventory = payload.variants.reduce((acc: number, v: any) => acc + (v.inventory_quantity || 0), 0);
  const isAvailable = totalInventory > 0;

  const dbProduct = await db.savedProduct.findFirst({
    where: { productId: productId, shop: shop },
    select: { id: true, availableQuantity: true }
  });

  if (!dbProduct) return new Response();
  if (dbProduct.availableQuantity === totalInventory) return new Response();

  const dbUpdateTask = db.savedProduct.updateMany({
    where: { productId: productId, shop: shop },
    data: {
      availableQuantity: totalInventory,
      isAvailable: isAvailable,
    },
  });

  const metafieldUpdateTask = admin.graphql(
    `#graphql
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key value }
      }
    }`,
    {
      variables: {
        metafields: [{
          ownerId: productId,
          namespace: "my_app",
          key: "is_saved_available",
          value: String(isAvailable),
          type: "boolean"
        }]
      }
    }
  );
  
  await Promise.all([dbUpdateTask, metafieldUpdateTask]);

  return new Response();
};