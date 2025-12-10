/**
 * Email Service for Monthly Statements and Invoice Reminders
 * Server-side JavaScript version using Gmail SMTP
 */

const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP
let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    console.warn('[Email] Gmail credentials not configured. Emails will be logged only.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: gmailUser,
      pass: gmailPassword, // Gmail App Password (not regular password)
    },
  });

  return transporter;
};

/**
 * Generates HTML for monthly statement email
 */
const generateStatementHTML = (data) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header { 
          background: #dc2626; 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0;
          font-size: 24px;
        }
        .header h2 { 
          margin: 10px 0 0 0;
          font-size: 18px;
          font-weight: normal;
        }
        .content { 
          padding: 30px 20px; 
        }
        .total { 
          font-size: 24px; 
          font-weight: bold; 
          color: #dc2626; 
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px; 
        }
        th, td { 
          padding: 12px; 
          text-align: left; 
          border-bottom: 1px solid #e5e7eb; 
        }
        th { 
          background: #f9fafb; 
          font-weight: 600;
          color: #374151;
        }
        .footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #dc2626;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Fleetwood Boxing Gym</h1>
          <h2>Monthly Statement</h2>
        </div>
        <div class="content">
          <p>Dear ${data.contactName || 'Customer'},</p>
          <p>Please find your monthly statement for the period <strong>${formatDate(data.statementPeriodStart)}</strong> to <strong>${formatDate(data.statementPeriodEnd)}</strong>.</p>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Date</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.lineItems.map(item => `
                <tr>
                  <td>${item.description || 'Service'}</td>
                  <td>${item.serviceDate ? formatDate(item.serviceDate) : 'N/A'}</td>
                  <td style="text-align: right;">${data.currency} ${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">Total Due: ${data.currency} ${data.totalAmount.toFixed(2)}</div>
          ${data.stripeInvoiceId ? `<p style="margin-top: 20px;">Invoice ID: ${data.stripeInvoiceId}</p>` : ''}
          <p style="margin-top: 20px;">Thank you for your business!</p>
          <p>If you have any questions about this statement, please contact us.</p>
        </div>
        <div class="footer">
          <p>Fleetwood Boxing Gym<br>
          This is an automated email. Please do not reply directly to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generates HTML for invoice reminder email
 */
const generateReminderHTML = (data) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header { 
          background: #dc2626; 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .content { 
          padding: 30px 20px; 
        }
        .amount-box {
          background: #fef2f2;
          border: 2px solid #dc2626;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #dc2626;
          margin: 10px 0;
        }
        .due-date {
          font-size: 18px;
          color: #991b1b;
          font-weight: 600;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #dc2626;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 20px;
        }
        .footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Fleetwood Boxing Gym</h1>
          <h2>Invoice Reminder</h2>
        </div>
        <div class="content">
          <p>Dear ${data.contactName || 'Customer'},</p>
          <p>This is a friendly reminder that you have an outstanding invoice.</p>
          <div class="amount-box">
            <div style="font-size: 14px; color: #6b7280;">Amount Due</div>
            <div class="amount">${data.currency} ${data.amountDue.toFixed(2)}</div>
            <div class="due-date">Due: ${formatDate(data.dueDate)}</div>
          </div>
          ${data.invoiceId ? `<p>Invoice ID: ${data.invoiceId}</p>` : ''}
          <p>Please ensure payment is made by the due date to avoid any service interruptions.</p>
          <p>If you have already made this payment, please disregard this reminder.</p>
          <p>Thank you for your prompt attention to this matter.</p>
        </div>
        <div class="footer">
          <p>Fleetwood Boxing Gym<br>
          This is an automated email. Please do not reply directly to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Sends a monthly statement email to a customer
 */
const sendMonthlyStatement = async (data) => {
  try {
    const emailTransporter = getTransporter();
    
    if (!emailTransporter) {
      // Fallback: log the email
      console.log('[Email] Monthly Statement (not sent - Gmail not configured):', {
        to: data.contactEmail,
        subject: `Monthly Statement - ${data.statementPeriodStart} to ${data.statementPeriodEnd}`,
        amount: `${data.currency} ${data.totalAmount.toFixed(2)}`,
        items: data.lineItems.length,
      });
      return { success: true, note: 'Email logged (Gmail not configured)' };
    }

    const mailOptions = {
      from: `"Fleetwood Boxing Gym" <${process.env.GMAIL_USER}>`,
      to: data.contactEmail,
      subject: `Monthly Statement - ${data.statementPeriodStart} to ${data.statementPeriodEnd}`,
      html: generateStatementHTML(data),
      text: `Monthly Statement\n\nPeriod: ${data.statementPeriodStart} to ${data.statementPeriodEnd}\nTotal: ${data.currency} ${data.totalAmount.toFixed(2)}\n\nThank you for your business!`,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('[Email] Monthly statement sent:', {
      to: data.contactEmail,
      messageId: info.messageId,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send monthly statement:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

/**
 * Sends an invoice reminder email to a customer
 */
const sendInvoiceReminder = async (data) => {
  try {
    const emailTransporter = getTransporter();
    
    if (!emailTransporter) {
      // Fallback: log the email
      console.log('[Email] Invoice Reminder (not sent - Gmail not configured):', {
        to: data.contactEmail,
        subject: `Invoice Reminder - Payment Due ${data.dueDate}`,
        amount: `${data.currency} ${data.amountDue.toFixed(2)}`,
      });
      return { success: true, note: 'Email logged (Gmail not configured)' };
    }

    const mailOptions = {
      from: `"Fleetwood Boxing Gym" <${process.env.GMAIL_USER}>`,
      to: data.contactEmail,
      subject: `Invoice Reminder - Payment Due ${data.dueDate}`,
      html: generateReminderHTML(data),
      text: `Invoice Reminder\n\nAmount Due: ${data.currency} ${data.amountDue.toFixed(2)}\nDue Date: ${data.dueDate}\n\nPlease ensure payment is made by the due date.`,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('[Email] Invoice reminder sent:', {
      to: data.contactEmail,
      messageId: info.messageId,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send invoice reminder:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

module.exports = {
  sendMonthlyStatement,
  sendInvoiceReminder,
};
