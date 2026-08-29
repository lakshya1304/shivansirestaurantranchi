import { FastifyInstance } from "fastify";
import * as reviewController from "./review.controller";

export default async function reviewRoutes(app: FastifyInstance) {
  app.get("/", reviewController.getReviews);
  app.get("/google", reviewController.getGoogleRatings);
  app.patch("/:id/publish", reviewController.updateReviewPublished);
  app.post("/upload-image", reviewController.uploadProductImage);
  app.delete("/upload-image", reviewController.deleteProductImage);
}
