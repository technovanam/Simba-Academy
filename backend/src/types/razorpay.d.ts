declare module "razorpay" {
  namespace Razorpay {
    interface RazorpayOptions {
      key_id: string;
      key_secret: string;
    }

    interface OrderCreateParams {
      amount: number;
      currency?: string;
      receipt?: string;
      notes?: Record<string, string>;
    }

    interface Order {
      id: string;
      entity: string;
      amount: number;
      amount_paid: number;
      amount_due: number;
      currency: string;
      receipt: string;
      status: string;
      attempts: number;
      notes: Record<string, string>;
      created_at: number;
    }

    interface Payment {
      id: string;
      entity: string;
      amount: number;
      currency: string;
      status: string;
      order_id: string;
      invoice_id: string | null;
      international: boolean;
      method: string;
      amount_refunded: number;
      refund_status: string | null;
      captured: boolean;
      description: string;
      card_id: string | null;
      bank: string | null;
      wallet: string | null;
      vpa: string | null;
      email: string;
      contact: string;
      notes: Record<string, string>;
      fee: number | null;
      tax: number | null;
      error_code: string | null;
      error_description: string | null;
      created_at: number;
    }
  }

  class Razorpay {
    constructor(options: Razorpay.RazorpayOptions);
    orders: {
      create(params: Razorpay.OrderCreateParams): Promise<Razorpay.Order>;
      fetch(orderId: string): Promise<Razorpay.Order>;
    };
    payments: {
      fetch(paymentId: string): Promise<Razorpay.Payment>;
    };
  }

  export = Razorpay;
}
