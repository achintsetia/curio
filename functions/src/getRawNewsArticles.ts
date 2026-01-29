import {onCall, HttpsError} from "firebase-functions/v2/https";
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
    title: string;
    timestamp: string; // Returning as string to be JSON safe
}

/**
 * Callable function to fetch unprocessed raw news articles.
 * Intended for AI bot consumption.
 * Returns up to 50 articles at a time.
 */
export const getRawNewsArticles = onCall(async (_request) => {
  try {
    const limit = 50;

    // Query for unprocessed articles, sorted by timestamp (oldest first)
    // This requires a composite index in firestore.indexes.json
    const snapshot = await db.collection("rawnews")
      .where("isProcessed", "==", false)
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
        title: data.title || "",
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
      };
    });

    return {
      articles,
      count: articles.length,
    };
  } catch (error) {
    console.error("Error fetching raw news articles:", error);
    throw new HttpsError("internal", "Failed to fetch raw news articles");
  }
});
