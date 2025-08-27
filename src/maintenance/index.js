import {
  createPool,
  refreshMaterializedViews,
} from "../database/repository.js";
import { retrieveAndStoreHsts } from "../retrieve-hsts.js";

console.log("Starting MV refresh.");
const pool = createPool();
await refreshMaterializedViews(pool);
console.log("Successfully refreshed materialized views.");
await retrieveAndStoreHsts();
console.log("Successfully refreshed HSTS data.");
