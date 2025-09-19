import {
  createPool,
  refreshMaterializedViews,
} from "../database/repository.js";

console.log("Starting MV refresh.");
const pool = createPool();
const res = await refreshMaterializedViews(pool);
console.log("Successfully refreshed materialized views.");

// get the public suffix list from https://publicsuffix.org/list/public_suffix_list.dat
import { retrieveAndStorePublicSuffixList } from "../retrieve-public-suffix-list.js";
await retrieveAndStorePublicSuffixList();
console.log("Successfully updated public suffix list.");

// update HSTS database
import { retrieveAndStoreHsts } from "../retrieve-hsts.js";
await retrieveAndStoreHsts();
console.log("Successfully updated HSTS data.");
