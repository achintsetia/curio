import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import Parser from "rss-parser";

import * as crypto from "crypto";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const parser = new Parser();

export const fetchRssFeeds = onSchedule({
  schedule: "every 1 hours",
  timeoutSeconds: 1800,
}, async (_event) => {
  try {
    const feedsSnapshot = await db.collection("feeds").get();

    const promises = feedsSnapshot.docs.map(async (doc) => {
      const feedData = doc.data();
      const feedName = feedData.name;
      const feedUrl = feedData.feed;

      if (!feedUrl) {
        console.warn(`Feed URL missing for ${feedName || doc.id}`);
        return;
      }

      try {
        const feed = await parser.parseURL(feedUrl);

        let newArticlesCount = 0;

        const articlePromises = feed.items.map(async (item) => {
          // data preparation
          const newsItem = {
            source: feedName || "Unknown",
            title: item.title || "No Title",
            timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
            link: item.link || "",
            summary: item.contentSnippet || item.summary || "",
            isProcessed: false,
          };

          if (!newsItem.link) {
            return;
          }

          // Generate a deterministic ID based on the link
          // MD5 is fast and sufficient for this purpose
          const docId = crypto.createHash("md5").update(newsItem.link).digest("hex");

          try {
            // Use .create() to ensure we only add NEW articles.
            // If it exists, it throws ALREADY_EXISTS error, which we catch.
            await db.collection("rawnews").doc(docId).create(newsItem);
            newArticlesCount++;
          } catch (error: any) {
            if (error.code === 6 || error.code === "ALREADY_EXISTS") {
              // Document already exists, ignore
            } else {
              console.error(`Error adding article ${newsItem.title}:`, error);
            }
          }
        });

        await Promise.all(articlePromises);
        console.log(`Fetched ${feed.items.length} items from ${feedName}. Added ${newArticlesCount} new articles.`);
      } catch (err) {
        console.error(`Error parsing feed ${feedName} (${feedUrl}):`, err);
      }
    });

    await Promise.all(promises);
    console.log("Finished fetching RSS feeds");
  } catch (error) {
    console.error("Error in fetchRssFeeds function:", error);
  }
});
