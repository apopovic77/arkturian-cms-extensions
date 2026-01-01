# Arkturian CMS Extensions

CDN extensions for arkturian-cms to add e-commerce functionality.

## Features

- 🛒 **Stripe Checkout Integration** - Easy shop functionality for your CMS
- 📦 **CDN Ready** - Deploy to `cdn.arkturian.com`
- 🎨 **Customizable** - Style buttons and checkout flow
- 🔒 **Secure** - PCI compliant via Stripe

## Installation

### Via CDN

```html
<!-- Include the Stripe Checkout extension -->
<script src="https://cdn.arkturian.com/stripe-checkout.umd.js"></script>
```

### Via NPM (if using bundler)

```bash
npm install @arkturian/cms-extensions
```

## Usage

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Shop</title>
</head>
<body>
  <!-- Your product -->
  <div id="product">
    <h2>Premium Course</h2>
    <p>$99.00</p>
    <div id="buy-button-container"></div>
  </div>

  <!-- Include extension from CDN -->
  <script src="https://cdn.arkturian.com/stripe-checkout.umd.js"></script>
  
  <script>
    // Initialize Stripe Checkout
    const checkout = window.ArkturianCMS.StripeCheckout.init({
      publishableKey: 'pk_test_YOUR_PUBLISHABLE_KEY',
      apiEndpoint: 'https://your-api.com/create-checkout-session',
      successUrl: 'https://yoursite.com/success',
      cancelUrl: 'https://yoursite.com/cancel'
    });

    // Create buy button
    const container = document.getElementById('buy-button-container');
    checkout.createBuyButton(container, {
      id: 'course-1',
      name: 'Premium Course',
      price: 9900, // $99.00 in cents
      quantity: 1
    }, {
      buttonText: 'Buy Now - $99',
      buttonClass: 'btn btn--primary'
    });
  </script>
</body>
</html>
```

### Advanced Usage

```javascript
// Manual checkout with multiple items
const checkout = window.ArkturianCMS.StripeCheckout.get();

await checkout.checkout([
  {
    id: 'course-1',
    name: 'Premium Course',
    price: 9900,
    quantity: 1,
    image: 'https://yoursite.com/course.jpg',
    description: 'Learn advanced techniques'
  },
  {
    id: 'ebook-1',
    name: 'Companion Ebook',
    price: 1900,
    quantity: 1
  }
]);
```

## Backend Setup

You need a backend endpoint that creates Stripe Checkout Sessions.

### Example (Node.js/Express)

```javascript
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY');
const express = require('express');
const app = express();

app.post('/create-checkout-session', async (req, res) => {
  const { items, success_url, cancel_url } = req.body;

  // Convert items to Stripe line items
  const line_items = items.map(item => ({
    price_data: {
      currency: 'eur',
      product_data: {
        name: item.name,
        description: item.description,
        images: item.image ? [item.image] : []
      },
      unit_amount: item.price
    },
    quantity: item.quantity
  }));

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url,
    cancel_url,
  });

  res.json({ sessionId: session.id });
});

app.listen(3000);
```

### Example (Python/FastAPI)

```python
import stripe
from fastapi import FastAPI
from pydantic import BaseModel

stripe.api_key = "sk_test_YOUR_SECRET_KEY"
app = FastAPI()

class CheckoutRequest(BaseModel):
    items: list
    success_url: str
    cancel_url: str

@app.post("/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    line_items = [
        {
            "price_data": {
                "currency": "eur",
                "product_data": {
                    "name": item["name"],
                    "description": item.get("description", ""),
                    "images": [item["image"]] if item.get("image") else []
                },
                "unit_amount": item["price"]
            },
            "quantity": item["quantity"]
        }
        for item in request.items
    ]

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=line_items,
        mode="payment",
        success_url=request.success_url,
        cancel_url=request.cancel_url,
    )

    return {"sessionId": session.id}
```

## API Reference

### `ArkturianCMS.StripeCheckout.init(config)`

Initialize Stripe Checkout.

**Parameters:**
- `publishableKey` (string) - Your Stripe publishable key
- `apiEndpoint` (string) - Your backend endpoint that creates checkout sessions
- `successUrl` (string, optional) - Redirect URL after successful payment
- `cancelUrl` (string, optional) - Redirect URL if payment is cancelled

**Returns:** `StripeCheckoutExtension` instance

### `checkout.createBuyButton(element, item, options)`

Create a buy button for a single item.

**Parameters:**
- `element` (HTMLElement) - Container element for the button
- `item` (CheckoutItem) - Product to sell
- `options` (object, optional)
  - `buttonText` (string) - Button text (default: "Buy Now")
  - `buttonClass` (string) - CSS class for button

### `checkout.checkout(items)`

Start checkout with multiple items.

**Parameters:**
- `items` (CheckoutItem[]) - Array of items to purchase

**Returns:** Promise<void>

## Styling

Add custom CSS for the buy button:

```css
.arkturian-buy-button {
  background: #5469d4;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.arkturian-buy-button:hover {
  background: #3c52b2;
}

.arkturian-buy-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Deployment

Deployed via GitHub Actions to `cdn.arkturian.com`.

Push to `main` branch triggers automatic deployment.

## License

MIT © Alex Popovic
