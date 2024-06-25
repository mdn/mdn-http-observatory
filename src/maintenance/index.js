import {
  createPool,
  refreshMaterializedViews,
} from "../database/repository.js";

console.log("Starting MV refresh.");
const pool = createPool();
const res = await refreshMaterializedViews(pool);
console.log("Successfully refreshed materialized views.");
