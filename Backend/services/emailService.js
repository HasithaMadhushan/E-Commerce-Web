import nodemailer from 'nodemailer'

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: `"${process.env.COMPANY_NAME || 'E-Commerce Store'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', result.messageId)
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('Email sending failed:', error)
      return { success: false, error: error.message }
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '')
  }

  // Welcome email template
  getWelcomeEmailTemplate(userName, userEmail) {
    return {
      subject: 'Welcome to Our Store!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Our Store</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .highlight { background: #e7f3ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #007bff;">Welcome to Our Store!</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Thank you for joining our community. We're excited to have you on board!</p>
              
              <div class="highlight">
                <h3>What's Next?</h3>
                <ul>
                  <li>Browse our latest products and collections</li>
                  <li>Set up your profile and preferences</li>
                  <li>Subscribe to our newsletter for exclusive deals</li>
                  <li>Follow us on social media for updates</li>
                </ul>
              </div>
              
              <p>If you have any questions, feel free to reach out to our customer support team.</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="btn">Start Shopping</a>
            </div>
            <div class="footer">
              <p>© 2024 E-Commerce Store. All rights reserved.</p>
              <p>You received this email because you signed up for an account.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }

  // Order confirmation email template
  getOrderConfirmationTemplate(order, customerName) {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.name}</strong><br>
          Size: ${item.size} | Quantity: ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('')

    return {
      subject: `Order Confirmation - #${order.orderNumber || order._id.slice(-6)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .order-summary { background: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .total-row { font-weight: bold; background: #e9ecef; }
            .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Order Confirmed!</h1>
              <p style="margin: 10px 0 0 0;">Thank you for your purchase</p>
            </div>
            <div class="content">
              <h2>Hello ${customerName}!</h2>
              <p>Your order has been confirmed and is being processed. Here are the details:</p>
              
              <div class="order-summary">
                <h3>Order #${order.orderNumber || order._id.slice(-6)}</h3>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt || order.date).toLocaleDateString()}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                <p><strong>Status:</strong> ${order.status}</p>
              </div>
              
              <h3>Items Ordered:</h3>
              <table class="items-table">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; text-align: left;">Item</th>
                    <th style="padding: 10px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr class="total-row">
                    <td style="padding: 15px;">Total Amount</td>
                    <td style="padding: 15px; text-align: right;">$${(order.total || order.amount).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              <h3>Shipping Address:</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 4px;">
                ${order.address.firstName} ${order.address.lastName}<br>
                ${order.address.street}<br>
                ${order.address.city}, ${order.address.state} ${order.address.zipcode}<br>
                ${order.address.country}<br>
                Phone: ${order.address.phone}
              </div>
              
              <p>We'll send you another email when your order ships with tracking information.</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" class="btn">Track Your Order</a>
            </div>
            <div class="footer">
              <p>© 2024 E-Commerce Store. All rights reserved.</p>
              <p>Questions? Contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }

  // Order status update email template
  getOrderStatusUpdateTemplate(order, customerName, newStatus, note = '') {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is currently being processed.',
      shipped: 'Great news! Your order has been shipped.',
      delivered: 'Your order has been delivered successfully.',
      cancelled: 'Your order has been cancelled.'
    }

    return {
      subject: `Order Update - #${order.orderNumber || order._id.slice(-6)} - ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Status Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .status-update { background: #e7f3ff; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #007bff; }
            .tracking-info { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Order Status Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${customerName}!</h2>
              
              <div class="status-update">
                <h3>Order #${order.orderNumber || order._id.slice(-6)}</h3>
                <p><strong>New Status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
                <p>${statusMessages[newStatus] || 'Your order status has been updated.'}</p>
                ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
              </div>
              
              ${order.shipping?.trackingNumber ? `
                <div class="tracking-info">
                  <h3>Tracking Information</h3>
                  <p><strong>Tracking Number:</strong> ${order.shipping.trackingNumber}</p>
                  ${order.shipping.carrier ? `<p><strong>Carrier:</strong> ${order.shipping.carrier}</p>` : ''}
                  ${order.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>` : ''}
                </div>
              ` : ''}
              
              <p>You can track your order status anytime by visiting your account.</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" class="btn">View Order Details</a>
            </div>
            <div class="footer">
              <p>© 2024 E-Commerce Store. All rights reserved.</p>
              <p>Questions? Contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }

  // Password reset email template
  getPasswordResetTemplate(userName, resetToken) {
    return {
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .btn { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
              
              <div class="warning">
                <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
              </div>
              
              <p>To reset your password, click the button below:</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}" class="btn">Reset Password</a>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
                ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}
              </p>
            </div>
            <div class="footer">
              <p>© 2024 E-Commerce Store. All rights reserved.</p>
              <p>If you didn't request this, please contact our support team immediately.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }

  // Send welcome email
  async sendWelcomeEmail(userEmail, userName) {
    const template = this.getWelcomeEmailTemplate(userName, userEmail)
    return await this.sendEmail(userEmail, template.subject, template.html)
  }

  // Send order confirmation email
  async sendOrderConfirmationEmail(order, customerEmail, customerName) {
    const template = this.getOrderConfirmationTemplate(order, customerName)
    return await this.sendEmail(customerEmail, template.subject, template.html)
  }

  // Send order status update email
  async sendOrderStatusUpdateEmail(order, customerEmail, customerName, newStatus, note = '') {
    const template = this.getOrderStatusUpdateTemplate(order, customerName, newStatus, note)
    return await this.sendEmail(customerEmail, template.subject, template.html)
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    const template = this.getPasswordResetTemplate(userName, resetToken)
    return await this.sendEmail(userEmail, template.subject, template.html)
  }
}

export default new EmailService()