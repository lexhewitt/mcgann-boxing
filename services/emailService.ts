/**
 * Email Service for Monthly Statements and Invoice Reminders
 * 
 * This service handles sending monthly statements and invoice reminders
 * to customers with monthly billing arrangements.
 */

interface MonthlyStatementData {
  contactEmail: string;
  contactName: string;
  statementPeriodStart: string; // ISO date
  statementPeriodEnd: string; // ISO date
  totalAmount: number;
  currency: string;
  lineItems: Array<{
    description: string;
    amount: number;
    serviceType?: string;
    serviceDate?: string;
  }>;
  stripeInvoiceId?: string;
}

interface InvoiceReminderData {
  contactEmail: string;
  contactName: string;
  amountDue: number;
  currency: string;
  dueDate: string; // ISO date
  invoiceId?: string;
}

/**
 * Sends a monthly statement email to a customer
 */
export const sendMonthlyStatement = async (data: MonthlyStatementData): Promise<{ success: boolean; error?: string }> => {
  try {
    // In browser environment, call server API
    if (typeof window !== 'undefined') {
      const response = await fetch('/server-api/send-monthly-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }
      
      return { success: true };
    }
    
    // Server-side: use email service directly
    // For now, we'll log it. In production, integrate with SendGrid, AWS SES, etc.
    console.log('[Email] Monthly Statement:', {
      to: data.contactEmail,
      subject: `Monthly Statement - ${data.statementPeriodStart} to ${data.statementPeriodEnd}`,
      amount: `${data.currency} ${data.totalAmount.toFixed(2)}`,
      items: data.lineItems.length,
    });
    
    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    // Example:
    // await sendGrid.send({
    //   to: data.contactEmail,
    //   from: 'noreply@fleetwoodboxing.com',
    //   subject: `Monthly Statement - ${formatDate(data.statementPeriodStart)} to ${formatDate(data.statementPeriodEnd)}`,
    //   html: generateStatementHTML(data),
    // });
    
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send monthly statement:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Sends an invoice reminder email to a customer
 */
export const sendInvoiceReminder = async (data: InvoiceReminderData): Promise<{ success: boolean; error?: string }> => {
  try {
    // In browser environment, call server API
    if (typeof window !== 'undefined') {
      const response = await fetch('/server-api/send-invoice-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }
      
      return { success: true };
    }
    
    // Server-side: use email service directly
    console.log('[Email] Invoice Reminder:', {
      to: data.contactEmail,
      subject: `Invoice Reminder - Payment Due ${data.dueDate}`,
      amount: `${data.currency} ${data.amountDue.toFixed(2)}`,
    });
    
    // TODO: Integrate with actual email service
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send invoice reminder:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Generates HTML for monthly statement email
 */
const generateStatementHTML = (data: MonthlyStatementData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; }
        .total { font-size: 24px; font-weight: bold; color: #dc2626; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Fleetwood Boxing Gym</h1>
          <h2>Monthly Statement</h2>
        </div>
        <div class="content">
          <p>Dear ${data.contactName},</p>
          <p>Please find your monthly statement for the period ${data.statementPeriodStart} to ${data.statementPeriodEnd}.</p>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.lineItems.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.serviceDate || 'N/A'}</td>
                  <td>${data.currency} ${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">Total: ${data.currency} ${data.totalAmount.toFixed(2)}</div>
          <p>Thank you for your business!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};



