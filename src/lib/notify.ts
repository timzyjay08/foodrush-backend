import { db } from "@/db";
import { notifications } from "@/db/schema";

/** Create an in-app notification for a user. */
export async function createNotification(
  userId: number,
  title: string,
  body: string,
  type = "info",
): Promise<void> {
  try {
    await db.insert(notifications).values({ userId, title, body, type });
  } catch (err) {
    console.error("[notify] failed to create notification", err);
  }
}
