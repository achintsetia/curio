import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface RawNewsArticle {
  id: string;
  link: string;
  source: string;
  summary: string;
  content: string;
  title: string;
  timestamp: string; // Returning as string to be JSON safe
}

/**
 * HTTP function to fetch unprocessed raw news articles.
 * Intended for AI bot consumption.
 * Returns up to 50 articles at a time.
 */
export const getRawNewsArticles = onRequest({ cors: true }, async (_req, res) => {
  try {
    const limit = 50;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Query for unprocessed articles, sorted by timestamp (oldest first)
    // This requires a composite index in firestore.indexes.json
    const snapshot = await db.collection("rawnews")
      .where("isProcessed", "==", false)
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .orderBy("timestamp", "asc")
      .limit(limit)
      .get();

    const articles: RawNewsArticle[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        link: data.link || "",
        source: data.source || "",
        summary: data.summary || "",
        content: data.content || "",
        title: data.title || "",
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
      };
    });

    res.json({
      articles,
      count: articles.length,
    });
  } catch (error) {
    console.error("Error fetching raw news articles:", error);
    res.status(500).json({ error: "Failed to fetch raw news articles" });
  }
});
