import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst();
  console.log("Using product:", product.id);

  const res = await fetch("http://127.0.0.1:3000/api/v1/data/orders/place", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": "test-key-" + Date.now()
    },
    body: JSON.stringify({
      lines: [
        {
          productId: product.id,
          quantity: 1
        }
      ],
      customerName: "Test User",
      customerPhone: "9876543210",
      paymentMethod: "Cash"
    })
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}
main().catch(console.error).finally(() => prisma.$disconnect());
