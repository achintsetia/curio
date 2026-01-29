import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {onDocumentWritten} from "firebase-functions/v2/firestore";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface CategoryData {
    id: string;
    name: string;
    slug?: string;
    subcategories: SubcategoryData[];
}

interface SubcategoryData {
    id: string;
    name: string;
    slug?: string;
}

/**
 * HTTP function to get the full category tree.
 * Checks Firestore cache first.
 * JSON API compatible.
 */
export const getCategoryTree = onRequest({cors: true}, async (_req, res) => {
  try {
    const cacheRef = db.collection("cache").doc("categoryTree");
    const cacheDoc = await cacheRef.get();

    if (cacheDoc.exists) {
      res.json(cacheDoc.data());
      return;
    }

    // Cache miss - build the tree
    const categoriesSnapshot = await db.collection("categories").get();
    const tree: CategoryData[] = [];

    // Use Promise.all for parallel subcategory fetching
    await Promise.all(categoriesSnapshot.docs.map(async (doc) => {
      const catData = doc.data();
      const subSnapshot = await db.collection("categories").doc(doc.id).collection("subcategories").get();

      const subcategories: SubcategoryData[] = subSnapshot.docs.map((sub) => ({
        id: sub.id,
        name: sub.data().name,
        slug: sub.data().slug,
      }));

      tree.push({
        id: doc.id,
        name: catData.name,
        slug: catData.slug,
        subcategories,
      });
    }));

    // Sort alphabetically by name for consistency
    tree.sort((a, b) => a.name.localeCompare(b.name));
    tree.forEach((cat) => cat.subcategories.sort((a, b) => a.name.localeCompare(b.name)));

    const result = {
      categories: tree,
      lastUpdate: admin.firestore.FieldValue.serverTimestamp(), // This will be server timestamp
    };

    // Save to cache (we need to convert serverTimestamp for JSON response or just return Date)
    // Firestore stores it as Timestamp, res.json handles it? NO.
    // serverTimestamp is a sentinel. We should save it, but return a concrete date in response if possible.
    // Or just save it and fetch it back?
    await cacheRef.set(result);
    // Fetch it back to get the resolved timestamp or just return current date
    const finalResult = {
      ...result,
      lastUpdate: new Date().toISOString(),
    };

    // Check if we need to return the saved timestamp or just now.
    // Since we just saved it, 'now' is close enough.

    res.json(finalResult);
  } catch (error) {
    console.error("Error fetching category tree:", error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

/**
 * Trigger to invalidate cache when categories change.
 */
export const onCategoryWrite = onDocumentWritten("categories/{categoryId}", async (_event) => {
  await db.collection("cache").doc("categoryTree").delete();
  console.log("Category cache invalidated due to category change");
});

/**
 * Trigger to invalidate cache when subcategories change.
 */
export const onSubcategoryWrite = onDocumentWritten("categories/{categoryId}/subcategories/{subcategoryId}", async (_event) => {
  await db.collection("cache").doc("categoryTree").delete();
  console.log("Category cache invalidated due to subcategory change");
});
