import prisma from './src/config/databaseConfig';
async function main() {
  try {
    const p = await prisma.product.findFirst();
    console.log(p);
  } catch (e) {
    console.error(e);
  }
}
main();
