# Reviewing guide

All reviewers must abide by the [code of conduct](CODE_OF_CONDUCT.md); they are also protected by the code of conduct.
A reviewer should not tolerate poor behavior and is encouraged to [report any behavior](CODE_OF_CONDUCT.md#Reporting_violations) that violates the code of conduct.

## Review process

The MDN Web Docs team has a well-defined review process that must be followed by reviewers in all repositories under the GitHub MDN organization.
This process is described in detail on the [Pull request guidelines](https://developer.mozilla.org/en-US/docs/MDN/Community/Pull_requests) page.

<!--

  TODO: If there are any guidelines on review processes not covered by the contribution pages at https://developer.mozilla.org/en-US/docs/MDN/Community/Pull_requests, either:
  * Check if they should be added to the contribution pages if they should apply to all repositories, or
  * Add them to this section below if they are unique to this repository only.

-->

## Algorithm version

`ALGORITHM_VERSION` in `src/constants.js` identifies the scoring rubric, not the implementation.
It is stored with every scan and returned by the API, so that scores produced under different rubrics can be told apart.

Bump it when a site with an unchanged configuration is expected to get a different score or grade because of a deliberate decision:

- A test is added to or removed from `ALL_TESTS`.
- A score modifier in `src/grader/charts.js` changes.
- A result is added, removed, or reclassified (pass/fail), so that affected sites score differently.
- The score-to-grade mapping or the aggregation rules change (grade thresholds, bonus eligibility, score floor or cap).
- The stance on a header or directive changes (for example, un-deprecating `X-Frame-Options`).

Do not bump it when:

- A bug fix makes the implementation match the documented rubric, even if some sites score differently as a result (for example, handling of malformed or duplicate headers).
- Only copy changes (descriptions, recommendations, links).
- The retriever, API, database, CLI, or dependencies change, or code is refactored, without altering the rubric.
- Bundled data is refreshed (HSTS preload list, TLD list).
- Output fields are added that do not affect the score.

When bumping:

- Increment by exactly 1, in the same pull request as the scoring change, and at most once per pull request.
- Never decrease or reuse a number, and do not rewrite the version of existing scans.
- Use a `feat` pull request title and describe the rubric change, so that it appears in the changelog.
- Update the example responses in `README.md`.
