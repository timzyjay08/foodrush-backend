import { api } from "./client";

export type PaymentIntent = { reference: string; status: string; authorizationUrl?: string };

export async function initializePayment(orderId: string, method: string) {
  const { data } = await api.post<PaymentIntent>("/payments/initialize", { orderId, method });
  return data;
}

export async function verifyPayment(reference: string) {
  const { data } = await api.get<PaymentIntent>(`/payments/verify/${reference}`);
  return data;
}

export async function getPaymentMethods() {
  const { data } = await api.get<{ id: string; label: string }[]>("/payments/methods");
  return data;
}
