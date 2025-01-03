import { Policy } from "../../types.js";

const scan = {
  type: "object",
  properties: {
    id: {
      type: "number",
    },
    algorithm_version: {
      type: "number",
    },
    scanned_at: {
      type: "string",
    },
    error: {
      type: ["string", "null"],
    },
    grade: {
      type: ["string", "null"],
    },
    response_headers: {
      type: ["object", "null"],
      additionalProperties: {
        type: "string",
      },
    },
    score: {
      type: ["number", "null"],
    },
    status_code: {
      type: ["number", "null"],
    },
    tests_failed: {
      type: "number",
    },
    tests_passed: {
      type: "number",
    },
    tests_quantity: {
      type: "number",
    },
  },
};

const tests = {
  type: "object",
  additionalProperties: {},
};

const history = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: {
        type: "number",
      },
      scanned_at: {
        type: "string",
      },
      grade: {
        type: ["string", "null"],
      },
      score: {
        type: ["number", "null"],
      },
    },
    required: ["scanned_at", "grade", "id", "score"],
  },
};

const analyzeReqQuery = {
  title: "AnalyzeReqQuery",
  type: "object",
  required: ["host"],
  properties: {
    host: { type: "string" },
  },
};

const analyzeResponse = {
  title: "AnalyzeResponse",
  type: "object",
  properties: {
    history: history,
    scan: scan,
    tests: tests,
  },
};

const gradeDistributionResponse = {
  type: "array",
  items: {
    type: "object",
    properties: {
      grade: { type: "string" },
      count: { type: "number" },
    },
    required: ["grade", "count"],
  },
};

const versionResponse = {
  type: "object",
  properties: {
    commit: { type: "string" },
    version: { type: "string" },
    source: { type: "string" },
    build: { type: "string" },
  },
  required: ["commit", "version", "source", "build"],
};

const recommendationMatrixResponse = {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      title: { type: "string" },
      mdnLink: { type: "string" },
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            scoreModifier: { type: "integer" },
            description: { type: "string" },
            recommendation: { type: "string" },
          },
          required: ["name", "scoreModifier", "description", "recommendation"],
        },
      },
    },
    required: ["name", "title", "mdnLink", "results"],
  },
};

const scanQuery = analyzeReqQuery;

const scanResponse = {
  type: "object",
  properties: {
    id: {
      type: "number",
    },
    details_url: {
      type: "string",
    },
    algorithm_version: {
      type: "number",
    },
    scanned_at: {
      type: "string",
    },
    error: {
      type: ["string", "null"],
    },
    grade: {
      type: ["string", "null"],
    },
    score: {
      type: ["number", "null"],
    },
    status_code: {
      type: ["number", "null"],
    },
    tests_failed: {
      type: "number",
    },
    tests_passed: {
      type: "number",
    },
    tests_quantity: {
      type: "number",
    },
  },
};

export const SCHEMAS = {
  analyzeGet: {
    querystring: analyzeReqQuery,
    response: {
      200: analyzeResponse,
    },
  },

  analyzePost: {
    querystring: analyzeReqQuery,
    response: {
      200: analyzeResponse,
    },
  },

  scan: {
    querystring: scanQuery,
    response: {
      200: scanResponse,
    },
  },

  gradeDistribution: {
    response: {
      200: gradeDistributionResponse,
    },
  },

  recommendationMatrix: {
    response: {
      200: recommendationMatrixResponse,
    },
  },

  version: {
    response: {
      200: versionResponse,
    },
  },
};

/**
 * @typedef {object} AnalyzeReqQuery
 * @property {string} host
 */

/**
 * @typedef {object} RecentScansQuery
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [num]
 */

/**
 * @typedef {object} StatsQuery
 * @property {boolean} [verbose]
 * @property {boolean} [pretty]
 */

/**
 * @typedef {object} ScanQuery
 * @property {string} host
 */

/**
 *  @typedef {{pass: boolean | null, description: string, info: string}} PolicyItem
 */

export class PolicyResponse {
  /** @typedef {PolicyItem} */
  antiClickjacking = {
    pass: false,
    description: `<p>Clickjacking protection, using <code>frame-ancestors</code></p>`,
    info: `<p>The use of CSP's <code>frame-ancestors</code> directive offers fine-grained control over who can frame your site.</p>`,
  };
  /** @typedef {PolicyItem} */
  defaultNone = {
    pass: false,
    description: `<p>Deny by default, using <code>default-src 'none'</code></p>`,
    info: `<p>Denying by default using <code>default-src 'none'</code>can ensure that your Content Security Policy doesn't allow the loading of resources you didn't intend to allow.</p>`,
  };
  /** @typedef {PolicyItem} */
  insecureBaseUri = {
    pass: false,
    description: `<p>Restricts use of the <code>&lt;base&gt;</code> tag by using <code>base-uri 'none'</code>, <code>base-uri 'self'</code>, or specific origins.</p>`,
    info: `<p>The <code>&lt;base&gt;</code> tag can be used to trick your site into loading scripts from untrusted origins.</p>`,
  };
  /** @typedef {PolicyItem} */
  insecureFormAction = {
    pass: false,
    description: `<p>Restricts where <code>&lt;form&gt;</code> contents may be submitted by using <code>form-action 'none'</code>, <code>form-action 'self'</code>, or specific URIs</p>`,
    info: `<p>Malicious JavaScript or content injection could modify where sensitive form data is submitted to or create additional forms for data exfiltration.</p>`,
  };
  /** @typedef {PolicyItem} */
  insecureSchemeActive = {
    pass: false,
    description: `<p>Blocks loading of active content over HTTP or FTP</p>`,
    info: `<p>Loading JavaScript or plugins can allow a man-in-the-middle to execute arbitrary code or your website. Restricting your policy and changing links to HTTPS can help prevent this.</p>`,
  };
  /** @typedef {PolicyItem} */
  insecureSchemePassive = {
    pass: false,
    description: `<p>Blocks loading of passive content over HTTP or FTP</p>`,
    info: `<p>This site's Content Security Policy allows the loading of passive content such as images or videos over insecure protocols such as HTTP or FTP. Consider changing them to load them over HTTPS.</p>`,
  };
  /** @typedef {PolicyItem} */
  strictDynamic = {
    /** @type {boolean | null} */
    pass: false,
    description: `<p>Uses CSP3's <code>'strict-dynamic'</code> directive to allow dynamic script loading (optional)</p>`,
    info: `<p><code>'strict-dynamic'</code> lets you use a JavaScript shim loader to load all your site's JavaScript dynamically, without having to track <code>script-src</code> origins.</p>`,
  };
  /** @typedef {PolicyItem} */
  unsafeEval = {
    pass: false,
    description: `<p>Blocks execution of JavaScript's <code>eval()</code> function by not allowing <code>'unsafe-eval'</code> inside <code>script-src</code></p>`,
    info: `<p>Blocking the use of JavaScript's <code>eval()</code> function can help prevent the execution of untrusted code.</p>`,
  };
  /** @typedef {PolicyItem} */
  unsafeInline = {
    pass: false,
    description: `<p>Blocks execution of inline JavaScript by not allowing <code>'unsafe-inline'</code> inside <code>script-src</code></p>`,
    info: `<p>Blocking the execution of inline JavaScript provides CSP's strongest protection against cross-site scripting attacks. Moving JavaScript to external files can also help make your site more maintainable.</p>`,
  };
  /** @typedef {PolicyItem} */
  unsafeInlineStyle = {
    pass: false,
    description: `<p>Blocks inline styles by not allowing <code>'unsafe-inline'</code> inside <code>style-src</code></p>`,
    info: `<p>Blocking inline styles can help prevent attackers from modifying the contents or appearance of your page. Moving styles to external stylesheets can also help make your site more maintainable.</p>`,
  };
  /** @typedef {PolicyItem} */
  unsafeObjects = {
    pass: false,
    description: `<p>Blocks execution of plug-ins, using <code>object-src</code> restrictions</p>`,
    info: `<p>Blocking the execution of plug-ins via <code>object-src 'none'</code> or as inherited from <code>default-src</code> can prevent attackers from loading Flash or Java in the context of your page.</p>`,
  };

  /**
   * Create the Response type from the raw policy flags
   * @param {Policy} policy
   */
  constructor(policy) {
    this.antiClickjacking.pass = policy.antiClickjacking;
    this.defaultNone.pass = policy.defaultNone;
    this.insecureBaseUri.pass = policy.insecureBaseUri;
    this.insecureFormAction.pass = policy.insecureFormAction;
    this.insecureSchemeActive.pass = policy.insecureSchemeActive;
    this.insecureSchemePassive.pass = policy.insecureSchemePassive;
    this.strictDynamic.pass = policy.strictDynamic;
    this.unsafeEval.pass = policy.unsafeEval;
    this.unsafeInline.pass = policy.unsafeInline;
    this.unsafeInlineStyle.pass = policy.unsafeInlineStyle;
    this.unsafeObjects.pass = policy.unsafeObjects;
  }
}

// import jsdoc from "json-schema-to-jsdoc";
// console.log(jsdoc(SCHEMAS.version.response["200"]));
