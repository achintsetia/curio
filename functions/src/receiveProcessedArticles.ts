import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface ProcessedArticleRequest {
    id: string; // This corresponds to the rawnews document ID
    title: string;
    link: string;
    source: string;
    timestamp: string;
    original_summary: string;
    categories: string[]; // List of category or sub-category IDs
    generated_summary: string;
    summary_embedding: number[]; // 384 float array
}

/**
 * HTTP function to receive processed articles from an external AI pipeline.
 * Marks the raw news articles as processed and stores the results in a hierarchical structure.
 * Supports receiving a single article object or an array of articles.
 */
export const receiveProcessedArticles = onRequest({cors: true}, async (req, res) => {
  // Ensure we only handle POST requests
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const body = req.body;
    const articles = Array.isArray(body) ? body : [body];

    if (articles.length === 0) {
      res.status(400).json({error: "Empty articles list"});
      return;
    }

    // Reduced batch size to 100 to avoid "Transaction too big" error
    // Each article has embeddings and summaries which can be large in bytes
    const batches: admin.firestore.WriteBatch[] = [db.batch()];
    let currentBatchIndex = 0;
    let operationCount = 0;

    const commitBatchIfFull = async () => {
      operationCount++;
      if (operationCount >= 100) {
        batches.push(db.batch());
        currentBatchIndex++;
        operationCount = 0;
      }
    };

    let processedCount = 0;
    let locationCount = 0;

    for (const data of articles) {
      const {id, categories} = data as ProcessedArticleRequest;

      if (!id || !categories || !Array.isArray(categories)) {
        console.warn("Skipping invalid article data:", data);
        continue;
      }

      // 1. Mark the raw article as processed in the 'rawnews' collection
      const rawNewsRef = db.collection("rawnews").doc(id);
      batches[currentBatchIndex].update(rawNewsRef, {isProcessed: true});
      await commitBatchIfFull();

      // 2. Store the processed article under each category/subcategory
      for (const catId of categories) {
        const processedRef = db.collection("processed_articles")
          .doc(catId)
          .collection("articles")
          .doc(id);

        batches[currentBatchIndex].set(processedRef, {
          ...data,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await commitBatchIfFull();
        locationCount++;
      }
      processedCount++;
    }

    // Commit all batches sequentially to avoid overloading
    for (const batch of batches) {
      await batch.commit();
    }

    console.log(`Successfully processed ${processedCount} articles across ${locationCount} category locations.`);
    res.json({
      success: true,
      articlesProcessed: processedCount,
      totalLocationsSaved: locationCount,
    });
  } catch (error) {
    console.error("Error in receiveProcessedArticles:", error);
    res.status(500).json({error: "Internal Server Error"});
  }
});
