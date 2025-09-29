# Changelog

## [1.4.5](https://github.com/mdn/mdn-http-observatory/compare/v1.4.4...v1.4.5) (2025-09-29)


### Miscellaneous

* use native libpq for postgres access ([#304](https://github.com/mdn/mdn-http-observatory/issues/304)) ([68c0f8e](https://github.com/mdn/mdn-http-observatory/commit/68c0f8e42738146d0fa24fcc38baf94647267940))

## [1.4.4](https://github.com/mdn/mdn-http-observatory/compare/v1.4.3...v1.4.4) (2025-09-24)


### Bug Fixes

* **api:** extended hostname rejection ([#297](https://github.com/mdn/mdn-http-observatory/issues/297)) ([7bbb7a4](https://github.com/mdn/mdn-http-observatory/commit/7bbb7a441958810add22325df74c100380a10535))

## [1.4.3](https://github.com/mdn/mdn-http-observatory/compare/v1.4.2...v1.4.3) (2025-09-23)


### Miscellaneous

* **dependabot:** specify commit message format ([#295](https://github.com/mdn/mdn-http-observatory/issues/295)) ([2d5b0ce](https://github.com/mdn/mdn-http-observatory/commit/2d5b0cedfc885fee49c50bef75e2b452e45fc4b7))
* **deps-dev:** bump esbuild from 0.25.9 to 0.25.10 in /mdn-observatory-webext ([#300](https://github.com/mdn/mdn-http-observatory/issues/300)) ([983b2d7](https://github.com/mdn/mdn-http-observatory/commit/983b2d75e3b6372e056e951843d114521d28a2e0))
* **deps:** bump tldts from 7.0.12 to 7.0.15 ([#301](https://github.com/mdn/mdn-http-observatory/issues/301)) ([a2aac99](https://github.com/mdn/mdn-http-observatory/commit/a2aac99f27dcd3a9cef78f12540746e7ad5938e7))
* filter out common non-fatal errors from sentry ([#298](https://github.com/mdn/mdn-http-observatory/issues/298)) ([8790079](https://github.com/mdn/mdn-http-observatory/commit/87900793b180c45f76d76a933eadac4d03f9e07d))
* pgpool settings adjustments ([#299](https://github.com/mdn/mdn-http-observatory/issues/299)) ([88d06b7](https://github.com/mdn/mdn-http-observatory/commit/88d06b7e736f7931564dec58940da98d7ba5a11b))

## [1.4.2](https://github.com/mdn/mdn-http-observatory/compare/v1.4.1...v1.4.2) (2025-09-11)


### Miscellaneous

* **workflows:** remove advanced CodeQL setup ([#280](https://github.com/mdn/mdn-http-observatory/issues/280)) ([816df5b](https://github.com/mdn/mdn-http-observatory/commit/816df5bd41f450ea33157310d455dd7e50b6396e))

## [1.4.1](https://github.com/mdn/mdn-http-observatory/compare/v1.4.0...v1.4.1) (2025-06-27)


### Bug Fixes

* **docker:** ignore GCP token file ([#215](https://github.com/mdn/mdn-http-observatory/issues/215)) ([16a7a86](https://github.com/mdn/mdn-http-observatory/commit/16a7a862dffda554074ec91c031231fc69bcb2a1))


### Miscellaneous

* dependency updates ([#243](https://github.com/mdn/mdn-http-observatory/issues/243)) ([03f2725](https://github.com/mdn/mdn-http-observatory/commit/03f27256674c118a3feb041eebcaac858fc7e8d5))
* update extra ca certs ([#242](https://github.com/mdn/mdn-http-observatory/issues/242)) ([c70a56b](https://github.com/mdn/mdn-http-observatory/commit/c70a56be5e31edc16b07b9872fc916b6e090d285))
* update MDN links ([#239](https://github.com/mdn/mdn-http-observatory/issues/239)) ([a2c8502](https://github.com/mdn/mdn-http-observatory/commit/a2c85024de651f8ef7302192ebe02faff0c8cf82))

## [1.4.0](https://github.com/mdn/mdn-http-observatory/compare/v1.3.9...v1.4.0) (2025-03-17)


### Features

* **api:** add version endpoint (`/api/v2/version`) ([4bf980c](https://github.com/mdn/mdn-http-observatory/commit/4bf980c1a85feb0dc5764b6e19b83ed072a2be85))


### Bug Fixes

* **grader:** update HTTP Redirection link ([#181](https://github.com/mdn/mdn-http-observatory/issues/181)) ([93d3c44](https://github.com/mdn/mdn-http-observatory/commit/93d3c44cae4cee6152b384cd79ffd25b637a1252))

## [1.3.9](https://github.com/mdn/mdn-http-observatory/compare/v1.3.8...v1.3.9) (2025-01-03)


### Bug Fixes

* **csp:** allow duplicate report-* directives ([#151](https://github.com/mdn/mdn-http-observatory/issues/151)) ([c172ce8](https://github.com/mdn/mdn-http-observatory/commit/c172ce8dbe40408459e218f153458937c08e6c4a))

## [1.3.8](https://github.com/mdn/mdn-http-observatory/compare/v1.3.7...v1.3.8) (2024-12-20)


### Bug Fixes

* package.json ([#145](https://github.com/mdn/mdn-http-observatory/issues/145)) ([b70469a](https://github.com/mdn/mdn-http-observatory/commit/b70469aedb8c6eed1e38b95bfec301dde609d3ad))


### Miscellaneous

* rewrite wrapper script in js ([#139](https://github.com/mdn/mdn-http-observatory/issues/139)) ([7b863e1](https://github.com/mdn/mdn-http-observatory/commit/7b863e14f56a06ca82ef81bdb2c756154f1310f1))

## [1.3.7](https://github.com/mdn/mdn-http-observatory/compare/v1.3.6...v1.3.7) (2024-12-16)


### Miscellaneous

* release 1.3.7 ([525dfe3](https://github.com/mdn/mdn-http-observatory/commit/525dfe3a028a2b21221836974d8661ddd0edb662))

## [1.3.6](https://github.com/mdn/mdn-http-observatory/compare/v1.3.5...v1.3.6) (2024-12-04)


### Bug Fixes

* **redirection:** provide additional intermediate ca certs ([#123](https://github.com/mdn/mdn-http-observatory/issues/123)) ([0200be8](https://github.com/mdn/mdn-http-observatory/commit/0200be8d7358e955cad6fe013a80089cd5f30831))

## [1.3.5](https://github.com/mdn/mdn-http-observatory/compare/v1.3.4...v1.3.5) (2024-10-15)


### Miscellaneous

* **api:** added a migration paragraph to the README ([#113](https://github.com/mdn/mdn-http-observatory/issues/113)) ([7ba23ac](https://github.com/mdn/mdn-http-observatory/commit/7ba23acdbd22b53f1dbed6c7c268b66beb4c5316))

## [1.3.4](https://github.com/mdn/mdn-http-observatory/compare/v1.3.3...v1.3.4) (2024-09-23)


### Bug Fixes

* **api:** fixed link to HSTS docs ([#99](https://github.com/mdn/mdn-http-observatory/issues/99)) ([bb6cc34](https://github.com/mdn/mdn-http-observatory/commit/bb6cc341dde52e87f81debd35a55c2edf0142278))

## [1.3.3](https://github.com/mdn/mdn-http-observatory/compare/v1.3.2...v1.3.3) (2024-09-17)


### Bug Fixes

* **cli:** published package on NPM ([#96](https://github.com/mdn/mdn-http-observatory/issues/96)) ([276f84c](https://github.com/mdn/mdn-http-observatory/commit/276f84cb7ed0a78f2117ed42473344362d4d2ea6))

## [1.3.2](https://github.com/mdn/mdn-http-observatory/compare/v1.3.1...v1.3.2) (2024-09-16)


### Bug Fixes

* **cli:** make the scan command npx compatible ([#92](https://github.com/mdn/mdn-http-observatory/issues/92)) ([6d66d0e](https://github.com/mdn/mdn-http-observatory/commit/6d66d0e532ef32b835ea9d9fc1773861723a7d4e))

## [1.3.1](https://github.com/mdn/mdn-http-observatory/compare/v1.3.0...v1.3.1) (2024-09-16)


### Bug Fixes

* **ci:** check dependabot PR user instead of actor ([#84](https://github.com/mdn/mdn-http-observatory/issues/84)) ([723f3a6](https://github.com/mdn/mdn-http-observatory/commit/723f3a634f3c4a5084df612637c1b661c768905b))

## [1.3.0](https://github.com/mdn/mdn-http-observatory/compare/v1.2.1...v1.3.0) (2024-08-26)


### Bug Fixes

* **scanner:** allow 401 and 403 responses, set proper accept header on requests ([#64](https://github.com/mdn/mdn-http-observatory/issues/64)) ([b90b1ff](https://github.com/mdn/mdn-http-observatory/commit/b90b1ff85b127415a8024de7be596a199b100714))

## [1.2.1](https://github.com/mdn/mdn-http-observatory/compare/v1.2.0...v1.2.1) (2024-08-05)


### Bug Fixes

* **api:** error messages ([#58](https://github.com/mdn/mdn-http-observatory/issues/58)) ([efe3ea3](https://github.com/mdn/mdn-http-observatory/commit/efe3ea332a728ac306381cead45920d50f74a3d6))


### Miscellaneous

* **types:** solidify type annotations, add tsc checks ([#56](https://github.com/mdn/mdn-http-observatory/issues/56)) ([fa09305](https://github.com/mdn/mdn-http-observatory/commit/fa093059da5f23a6d1f99a829136e75793d4f843))

## [1.2.0](https://github.com/mdn/mdn-http-observatory/compare/v1.1.0...v1.2.0) (2024-07-26)


### Features

* **db:** cleanup ([ee1942e](https://github.com/mdn/mdn-http-observatory/commit/ee1942e99938ccfc8e0e1f9545d43ae7a2d80940))
* **db:** remove auto-migrate from server startup ([#52](https://github.com/mdn/mdn-http-observatory/issues/52)) ([d43d626](https://github.com/mdn/mdn-http-observatory/commit/d43d6262c93217f9a87fa23f7eea18090e47ea9d))


### Bug Fixes

* **hsts:** resolve path for hsts-preload.json file ([0ea5178](https://github.com/mdn/mdn-http-observatory/commit/0ea51787d06094eeab5ba4a49f12fe4f6830cff9))
* **hsts:** rework file path resolution ([#50](https://github.com/mdn/mdn-http-observatory/issues/50)) ([1b2e9ed](https://github.com/mdn/mdn-http-observatory/commit/1b2e9edfa107192327d632e41c638d4bff3c2354))

## [1.1.0](https://github.com/mdn/mdn-http-observatory/compare/v1.0.0...v1.1.0) (2024-07-22)


### Features

* **api:** add Sentry ([#24](https://github.com/mdn/mdn-http-observatory/issues/24)) ([f20f546](https://github.com/mdn/mdn-http-observatory/commit/f20f546c2485e848bf3839b3d64d32c542c050cc))
* **workflows:** setup release-please ([#35](https://github.com/mdn/mdn-http-observatory/issues/35)) ([9c945ca](https://github.com/mdn/mdn-http-observatory/commit/9c945ca7e39fd8dcda1fed27a2d855bec81ae4df))


### Bug Fixes

* **api:** properly refuse hostnames in special TLDs (MP-1287) ([ea315ba](https://github.com/mdn/mdn-http-observatory/commit/ea315baf7415004417d5d9ffae91aa7bea4cd9e0))
* **api:** typos in policy copy ([e1d710d](https://github.com/mdn/mdn-http-observatory/commit/e1d710d63e4a227cb972f5646e68fc61504d987c))
* **auto-merge:** approve before comment ([#22](https://github.com/mdn/mdn-http-observatory/issues/22)) ([c2519a1](https://github.com/mdn/mdn-http-observatory/commit/c2519a1321b686dc8d512f7974fdc869939afd24))
* **auto-merge:** remove accidental quote ([#23](https://github.com/mdn/mdn-http-observatory/issues/23)) ([561b2dd](https://github.com/mdn/mdn-http-observatory/commit/561b2dd4c8692094dbcf406df57b5d38b56292d2))
* **csp:** make sure a single `frame-ancestors` in meta equiv tags gets ignored correctly ([5080718](https://github.com/mdn/mdn-http-observatory/commit/5080718fcbb89837e71085da8e11c338a98bc203))
* **xframeoptions:** added a test that ensures meta equiv tags with `x-frame-options` are ignored ([39cf38c](https://github.com/mdn/mdn-http-observatory/commit/39cf38cf1c2e6d382d4bac5714fb2b9573e87848))


### Miscellaneous

* **auto-merge:** replace workflow ([#11](https://github.com/mdn/mdn-http-observatory/issues/11)) ([3ad31e3](https://github.com/mdn/mdn-http-observatory/commit/3ad31e3572c0c2cb22e43b7175960b91c1fbddf6))
* **github:** add CODEOWNERS ([#10](https://github.com/mdn/mdn-http-observatory/issues/10)) ([8f64852](https://github.com/mdn/mdn-http-observatory/commit/8f64852023a3e2d7a8b7e8892aef659291eaedae))
* **github:** add Dependabot config ([#12](https://github.com/mdn/mdn-http-observatory/issues/12)) ([5b9384a](https://github.com/mdn/mdn-http-observatory/commit/5b9384a704e1ff56016ddf63a196eddbc3d4f3de))
* **node:** use Node.js v20 via .nvmrc file ([#9](https://github.com/mdn/mdn-http-observatory/issues/9)) ([a9992a8](https://github.com/mdn/mdn-http-observatory/commit/a9992a82368068fca635859885816589738e8fb6))
