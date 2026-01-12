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
        <s-unordered-list>
          <s-list-item>
            <s-link href="/app/products">Go to Products</s-link>
          </s-list-item>
          <s-list-item>
          <s-link href="/app/saved">Go to Saved Products</s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section>

    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
