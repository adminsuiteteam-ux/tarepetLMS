import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  role: text("role").notNull(), // 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
  type: text("type").notNull().default("info"), // 'info' | 'success' | 'warning' | 'exam' | 'fee' | 'attendance'
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  time: timestamp("time").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true });
export const selectNotificationSchema = createSelectSchema(notificationsTable);

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type NotificationItem = typeof notificationsTable.$inferSelect;
