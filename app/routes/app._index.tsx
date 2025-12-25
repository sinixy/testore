import type {
  HeadersFunction,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";


export default function Index() {

  return (
    <s-page heading="Shopify Test App by Hlib Sin">

      <s-section heading="Test store created 🎉">
        <s-paragraph>
          Navigate to the Products section to see the products created in your store.
        </s-paragraph>
        <s-link href="/app/products">Go to Products</s-link>
      </s-section>

    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
