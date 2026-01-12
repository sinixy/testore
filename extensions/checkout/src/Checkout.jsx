import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useEffect } from 'preact/hooks';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const lines = shopify.lines.value;

  const widgetItemCount = lines.reduce((total, line) => {
    const isFromWidget = line.attributes.find(
      (attr) => attr.key === '_added_via_widget' && attr.value === 'true'
    );
    return isFromWidget ? total + line.quantity : total;
  }, 0);

  const handleAddManual = async () => {
    await shopify.applyCartLinesChange({
      type: 'addCartLine',
      merchandiseId: 'gid://shopify/ProductVariant/53556602372406',
      quantity: 1,
      attributes: [{ key: '_added_via_widget', value: 'true' }]
    });
  };

  return (
    <s-stack>
      <s-banner heading="Special Promo">
        {widgetItemCount < 2 
          ? `Add ${2 - widgetItemCount} more widget items to get a free gift!` 
          : "You've earned a free gift!"}
      </s-banner>
      
      {widgetItemCount < 2 && (
        <s-button onClick={handleAddManual}>
          Add Recommended Product
        </s-button>
      )}
    </s-stack>
  );
}