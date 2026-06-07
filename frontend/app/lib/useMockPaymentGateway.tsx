import { useCallback, useState } from "react";
import { MockPaymentModal } from "../components/MockPaymentModal";
import {
  openZohoCheckout,
  type OpenZohoCheckoutOptions,
  type ZohoWidgetPaymentResult,
} from "./zohoCheckout";

export function isMockPaymentMode(session: { isPlaceholder?: boolean }) {
  return session.isPlaceholder === true;
}

export function createMockPaymentResult(sessionId: string): ZohoWidgetPaymentResult {
  const ts = Date.now();
  return {
    payment_id: `pay_mock_${ts}`,
    payments_session_id: sessionId,
    signature: `sig_mock_${ts}`,
  };
}

function sessionAmountInr(options: OpenZohoCheckoutOptions) {
  const { session } = options;
  return session.amountInr ?? session.amount / 100;
}

type PendingMock = {
  options: OpenZohoCheckoutOptions;
  resolve: (value: ZohoWidgetPaymentResult) => void;
  reject: (reason: Error) => void;
};

export function useMockPaymentGateway() {
  const [pending, setPending] = useState<PendingMock | null>(null);

  const runCheckout = useCallback(async (options: OpenZohoCheckoutOptions): Promise<ZohoWidgetPaymentResult> => {
    if (isMockPaymentMode(options.session)) {
      return new Promise((resolve, reject) => {
        setPending({ options, resolve, reject });
      });
    }
    return openZohoCheckout(options);
  }, []);

  const mockModal = pending ? (
    <MockPaymentModal
      open
      description={pending.options.description}
      paymentSessionId={pending.options.session.paymentSessionId}
      amountInr={sessionAmountInr(pending.options)}
      currency={pending.options.session.currency}
      onSuccess={() => {
        pending.resolve(createMockPaymentResult(pending.options.session.paymentSessionId));
        setPending(null);
      }}
      onCancel={() => {
        pending.reject(Object.assign(new Error("Payment was cancelled."), { code: "widget_closed" }));
        setPending(null);
      }}
    />
  ) : null;

  return { runCheckout, mockModal };
}
