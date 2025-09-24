import {
  createPool,
  refreshMaterializedViews,
} from "../database/repository.js";

console.log("Starting MV refresh.");
const pool = createPool();
await refreshMaterializedViews(pool);
console.log("Successfully refreshed materialized views.");

import { retrieveAndStoreTldList } from "../retrieve-tld-list.js";
await retrieveAndStoreTldList();
console.log("Successfully updated TLD list.");

import { retrieveAndStoreHsts } from "../retrieve-hsts.js";
await retrieveAndStoreHsts();
console.log("Successfully updated HSTS data.");
