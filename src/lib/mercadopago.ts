import MercadoPago from "mercadopago";

export const mp = new MercadoPago({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});
