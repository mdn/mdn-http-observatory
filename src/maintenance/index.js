import {
  createPool,
  refreshMaterializedViews,
} from "../database/repository.js";
import { refreshCache } from "../cache.js";

console.log("Starting MV refresh.");
const pool = createPool();
await refreshMaterializedViews(pool);
console.log("Successfully refreshed materialized views.");

console.log("Starting cache refresh.");
await refreshCache();
console.log("Successfully refreshed cache.");
