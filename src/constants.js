import { CookiesOutput, cookiesTest } from "./analyzer/tests/cookies.js";
import {
  CorsOutput,
  crossOriginResourceSharingTest,
} from "./analyzer/tests/cors.js";
import {
  CrossOriginResourcePolicyOutput,
  crossOriginResourcePolicyTest,
} from "./analyzer/tests/cross-origin-resource-policy.js";
import { contentSecurityPolicyTest, CspOutput } from "./analyzer/tests/csp.js";
import {
  RedirectionOutput,
  redirectionTest,
} from "./analyzer/tests/redirection.js";
import {
  ReferrerOutput,
  referrerPolicyTest,
} from "./analyzer/tests/referrer-policy.js";
import {
  StrictTransportSecurityOutput,
  strictTransportSecurityTest,
} from "./analyzer/tests/strict-transport-security.js";
import {
  SubresourceIntegrityOutput,
  subresourceIntegrityTest,
} from "./analyzer/tests/subresource-integrity.js";
import {
  XContentTypeOptionsOutput,
  xContentTypeOptionsTest,
} from "./analyzer/tests/x-content-type-options.js";
import {
  XFrameOptionsOutput,
  xFrameOptionsTest,
} from "./analyzer/tests/x-frame-options.js";

export const ALL_TESTS = [
  contentSecurityPolicyTest,
  cookiesTest,
  crossOriginResourceSharingTest,
  redirectionTest,
  referrerPolicyTest,
  strictTransportSecurityTest,
  subresourceIntegrityTest,
  xContentTypeOptionsTest,
  xFrameOptionsTest,
  crossOriginResourcePolicyTest,
];

export const ALL_RESULTS = [
  CspOutput,
  CookiesOutput,
  CorsOutput,
  RedirectionOutput,
  ReferrerOutput,
  StrictTransportSecurityOutput,
  SubresourceIntegrityOutput,
  XContentTypeOptionsOutput,
  XFrameOptionsOutput,
  CrossOriginResourcePolicyOutput,
];

export const NUM_TESTS = ALL_TESTS.length;

export const ALGORITHM_VERSION = 4;
