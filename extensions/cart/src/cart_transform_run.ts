import {
  CartTransformRunResult,
  Input,
} from "../generated/api";

const NO_CHANGES: CartTransformRunResult = {
  operations: [],
};

export function cartTransformRun(input: Input): CartTransformRunResult {
  const operations = input.cart.lines.reduce((acc: any[], line) => {
    if (line.attribute?.value === "true") {
      const originalPrice = parseFloat(line.cost.amountPerQuantity.amount);
      const discountedPrice = originalPrice * 0.8;

      acc.push({
        lineUpdate: {
          cartLineId: line.id,
          title: `Widget Snowboard (20% off)`,
          price: {
            adjustment: {
              fixedPricePerUnit: {
                amount: discountedPrice.toFixed(2)
              }
            }
          }
        }
      });
    }
    return acc;
  }, []);

  const widgetLines = input.cart.lines.filter(l => l.attribute?.value === "true");
  const totalWidgetQuantity = widgetLines.reduce((sum, l) => sum + l.quantity, 0);
  if (totalWidgetQuantity >= 2) {
    console.log("Adding free gift");
    const targetLine = widgetLines[0];
    if (targetLine.merchandise.__typename == "ProductVariant") {
      const targetOriginalPrice = parseFloat(targetLine.cost.amountPerQuantity.amount);
      const targetDiscountedPrice = targetOriginalPrice * 0.8;
      operations.push({
        lineExpand: {
          cartLineId: targetLine.id,
          expandedCartItems: [
            {
              merchandiseId: targetLine.merchandise.id,
              quantity: targetLine.quantity,
              price: { adjustment: { fixedPricePerUnit: { amount: targetDiscountedPrice.toFixed(2) } } }
            },
            {
              merchandiseId: "gid://shopify/ProductVariant/53556602437942",
              quantity: 1,
              price: { adjustment: { fixedPricePerUnit: { amount: "0.00" } } }
            }
          ]
        }
      });
    }
  }

  return operations.length > 0 ? { operations } : NO_CHANGES;
};