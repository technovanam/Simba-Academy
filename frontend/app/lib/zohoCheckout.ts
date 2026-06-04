export interface ZohoCheckoutConfig {
  accountId: string;
  apiKey: string;
  domain: string;
  isTestMode?: boolean;
  isPlaceholder?: boolean;
}

export interface ZohoPaymentSession {
  paymentSessionId: string;
  orderId: string;
  amount: number;
  amountInr: number;
  amountString: string;
  currency: string;
  accountId: string;
  apiKey: string;
  domain: string;
  isTestMode?: boolean;
  isPlaceholder?: boolean;
}

export interface ZohoWidgetPaymentResult {
  payment_id: string;
  payments_session_id: string;
  signature: string;
}

const ZOHO_SCRIPT = "https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js";

let scriptPromise: Promise<boolean> | null = null;
let widgetInstance: { requestPaymentMethod: (o: Record<string, unknown>) => Promise<ZohoWidgetPaymentResult>; close: () => Promise<void> } | null = null;

export function loadZohoPaymentsScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as unknown as { ZPayments?: unknown }).ZPayments) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${ZOHO_SCRIPT}"]`);
    if (existing) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = ZOHO_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return scriptPromise;
}

async function getWidgetInstance(config: ZohoCheckoutConfig) {
  const loaded = await loadZohoPaymentsScript();
  if (!loaded) {
    throw new Error("Zoho Payments script failed to load. Check your internet connection.");
  }

  const ZPayments = (window as unknown as { ZPayments: new (c: Record<string, unknown>) => typeof widgetInstance }).ZPayments;
  if (!ZPayments) {
    throw new Error("Zoho Payments is not available on this page.");
  }

  if (!widgetInstance) {
    widgetInstance = new ZPayments({
      account_id: config.accountId,
      domain: config.domain || "IN",
      otherOptions: {
        api_key: config.apiKey,
        ...(config.isTestMode ? { is_test_mode: true } : {}),
      },
    });
  }

  return widgetInstance;
}

export interface OpenZohoCheckoutOptions {
  session: ZohoPaymentSession;
  business?: string;
  description: string;
  invoiceNumber?: string;
  referenceNumber?: string;
  customer?: { name?: string; email?: string; phone?: string };
}

export async function openZohoCheckout(options: OpenZohoCheckoutOptions): Promise<ZohoWidgetPaymentResult> {
  const { session, description, business = "Simba Academy", customer } = options;
  const config: ZohoCheckoutConfig = {
    accountId: session.accountId,
    apiKey: session.apiKey,
    domain: session.domain,
    isTestMode: session.isTestMode,
    isPlaceholder: session.isPlaceholder,
  };

  if (config.isPlaceholder) {
    return {
      payment_id: `pay_mock_${Date.now()}`,
      payments_session_id: session.paymentSessionId,
      signature: `sig_mock_${Date.now()}`,
    };
  }

  const instance = await getWidgetInstance(config);
  if (!instance) {
    throw new Error("Could not initialise Zoho Payments.");
  }

  try {
    const data = await instance.requestPaymentMethod({
      amount: session.amountString,
      currency_code: session.currency,
      payments_session_id: session.paymentSessionId,
      currency_symbol: "₹",
      business,
      description,
      invoice_number: options.invoiceNumber,
      reference_number: options.referenceNumber,
      address: {
        name: customer?.name,
        email: customer?.email,
        phone: customer?.phone,
      },
    });
    return data as ZohoWidgetPaymentResult;
  } finally {
    await instance.close();
  }
}
