import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export const cleanupData = onSchedule({
  schedule: "0 0 * * *",
  timeoutSeconds: 540,
}, async (_event) => {
  try {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago

    console.log(`Starting cleanup of data older than ${cutoffDate.toISOString()}`);

    const snapshot = await db.collection("rawnews")
      .where("timestamp", "<", cutoffDate)
      .get();

    if (snapshot.empty) {
      console.log("No old news to delete.");
      // In future, other cleanup logic can go here or be called here
      return;
    }

    const batchSize = 500;
    let batch = db.batch();
    let count = 0;
    let totalDeleted = 0;

    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      count++;

      if (count >= batchSize) {
        await batch.commit();
        totalDeleted += count;
        console.log(`Deleted batch of ${count} documents`);
        batch = db.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
      totalDeleted += count;
      console.log(`Deleted final batch of ${count} documents`);
    }

    console.log(`Cleanup complete. Total deleted: ${totalDeleted}`);
  } catch (error) {
    console.error("Error in cleanupData function:", error);
  }
});
