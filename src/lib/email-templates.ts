/**
 * Email template functions for transactional emails.
 * Returns HTML strings ready to send via any email service.
 *
 * Templates:
 * 1. Order confirmation
 * 2. Shipping notification
 * 3. Delivery + review request
 * 4. 30-day check-in
 */

import { escapeHtml } from '@/lib/sanitize';

interface OrderItem {
  title: string;
  size: string;
  color?: string;
  quantity: number;
  price: number;
}

interface OrderEmailData {
  orderId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  donation: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

const baseStyle = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000; color: #fff; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
  .header { text-align: center; padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .logo { font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #fff; text-decoration: none; }
  .content { padding: 32px 0; }
  .item-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .total-row { display: flex; justify-content: space-between; padding: 16px 0; font-weight: bold; font-size: 18px; border-top: 1px solid rgba(255,255,255,0.1); }
  .impact { background: rgba(255,255,255,0.03); border-left: 2px solid rgba(255,255,255,0.2); padding: 16px; margin: 24px 0; }
  .btn { display: inline-block; padding: 14px 32px; background: #fff; color: #000; text-decoration: none; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; font-size: 12px; }
  .footer { text-align: center; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); font-size: 12px; }
  h1 { font-size: 24px; letter-spacing: 2px; }
  p { color: rgba(255,255,255,0.6); line-height: 1.6; }
`;

export function orderConfirmationEmail(data: OrderEmailData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff;">
        ${escapeHtml(item.title)} — ${escapeHtml(item.size)}${item.color ? ` / ${escapeHtml(item.color)}` : ''} × ${item.quantity}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; color: rgba(255,255,255,0.6);">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${baseStyle}</style></head>
<body>
<div class="container">
  <div class="header">
    <a href="https://dymnds.ca" class="logo">DYMNDS</a>
  </div>
  <div class="content">
    <h1>Order Confirmed</h1>
    <p>Hey ${escapeHtml(data.customerName)}, thank you for your order. Here's your summary:</p>

    <p style="color: rgba(255,255,255,0.4); font-size: 12px; letter-spacing: 2px;">ORDER #${escapeHtml(data.orderId.toUpperCase().slice(0, 8))}</p>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemsHtml}
      <tr>
        <td style="padding: 8px 0; color: rgba(255,255,255,0.5);">Subtotal</td>
        <td style="padding: 8px 0; text-align: right; color: rgba(255,255,255,0.5);">$${data.subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: rgba(255,255,255,0.5);">Shipping</td>
        <td style="padding: 8px 0; text-align: right; color: rgba(255,255,255,0.5);">${data.shipping === 0 ? 'Free' : `$${data.shipping.toFixed(2)}`}</td>
      </tr>
      <tr>
        <td style="padding: 16px 0; font-weight: bold; font-size: 18px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff;">Total</td>
        <td style="padding: 16px 0; font-weight: bold; font-size: 18px; border-top: 1px solid rgba(255,255,255,0.1); text-align: right; color: #fff;">$${data.total.toFixed(2)}</td>
      </tr>
    </table>

    <div class="impact">
      <p style="margin: 0; color: rgba(255,255,255,0.8);">
        ◆ Your order contributes <strong style="color: #fff;">$${data.donation.toFixed(2)}</strong> to survivor healing programs.
      </p>
    </div>

    <p><strong style="color: #fff;">Shipping to:</strong><br/>
    ${escapeHtml(data.shippingAddress.line1)}<br/>
    ${data.shippingAddress.line2 ? escapeHtml(data.shippingAddress.line2) + '<br/>' : ''}
    ${escapeHtml(data.shippingAddress.city)}, ${escapeHtml(data.shippingAddress.state)} ${escapeHtml(data.shippingAddress.postalCode)}<br/>
    ${escapeHtml(data.shippingAddress.country)}</p>

    <p>We'll email you when your order ships. Usually 1-2 business days.</p>
  </div>
  <div class="footer">
    <p>DYMNDS — Pressure Creates DYMNDS</p>
    <p><a href="https://dymnds.ca" style="color: rgba(255,255,255,0.4);">dymnds.ca</a></p>
  </div>
</div>
</body>
</html>`;
}

export function shippingNotificationEmail(customerName: string, orderId: string, trackingNumber: string, carrier: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${baseStyle}</style></head>
<body>
<div class="container">
  <div class="header">
    <a href="https://dymnds.ca" class="logo">DYMNDS</a>
  </div>
  <div class="content">
    <h1>Your Order Has Shipped</h1>
    <p>Hey ${escapeHtml(customerName)}, your DYMNDS order is on its way.</p>

    <p style="color: rgba(255,255,255,0.4); font-size: 12px; letter-spacing: 2px;">ORDER #${escapeHtml(orderId.toUpperCase().slice(0, 8))}</p>

    <div style="background: rgba(255,255,255,0.03); padding: 20px; border: 1px solid rgba(255,255,255,0.1); margin: 24px 0;">
      <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.4); font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Tracking Number</p>
      <p style="margin: 0; color: #fff; font-size: 18px; font-family: monospace;">${escapeHtml(trackingNumber)}</p>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.4); font-size: 12px;">Carrier: ${escapeHtml(carrier)}</p>
    </div>

    <p>Estimated delivery: 3-5 business days</p>
  </div>
  <div class="footer">
    <p>DYMNDS — Pressure Creates DYMNDS</p>
  </div>
</div>
</body>
</html>`;
}

export function reviewRequestEmail(customerName: string, productName: string, productSlug: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${baseStyle}</style></head>
<body>
<div class="container">
  <div class="header">
    <a href="https://dymnds.ca" class="logo">DYMNDS</a>
  </div>
  <div class="content">
    <h1>How's Your ${escapeHtml(productName)}?</h1>
    <p>Hey ${escapeHtml(customerName)}, you've had your DYMNDS gear for a bit now. We'd love to hear how it's performing.</p>

    <p>Your honest review helps other athletes make the right choice — and helps us keep improving.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://dymnds.ca/products/${encodeURIComponent(productSlug)}#reviews" class="btn">Leave a Review</a>
    </div>

    <div class="impact">
      <p style="margin: 0; color: rgba(255,255,255,0.6);">
        Remember: your purchase funded survivor therapy sessions. Thank you for being part of the mission.
      </p>
    </div>
  </div>
  <div class="footer">
    <p>DYMNDS — Pressure Creates DYMNDS</p>
  </div>
</div>
</body>
</html>`;
}

export function thirtyDayCheckinEmail(customerName: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${baseStyle}</style></head>
<body>
<div class="container">
  <div class="header">
    <a href="https://dymnds.ca" class="logo">DYMNDS</a>
  </div>
  <div class="content">
    <h1>30 Days In</h1>
    <p>Hey ${escapeHtml(customerName)}, it's been a month since your DYMNDS order. Just checking in.</p>

    <p>How's the gear holding up? We build our products to perform through your toughest sessions — if anything isn't meeting that standard, we want to know.</p>

    <p>And if you're loving it, we'd be grateful for a review. It means more than you know.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://dymnds.ca/collections/all" class="btn">Shop New Arrivals</a>
    </div>
  </div>
  <div class="footer">
    <p>DYMNDS — Pressure Creates DYMNDS</p>
    <p style="margin-top: 12px;"><a href="https://dymnds.ca" style="color: rgba(255,255,255,0.4);">dymnds.ca</a> | <a href="mailto:support@dymnds.ca" style="color: rgba(255,255,255,0.4);">support@dymnds.ca</a></p>
  </div>
</div>
</body>
</html>`;
}
