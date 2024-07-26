import { assert } from "chai";
import {
  getGradeForScore,
  getRecommendation,
  getScoreDescription,
  getScoreModifier,
  getTopicLink,
} from "../src/grader/grader.js";
import { Expectation } from "../src/types.js";

describe("Grader", () => {
  it("gets the score description", function () {
    const res = getScoreDescription(Expectation.CspNotImplemented);
    assert.include(res, "Content Security Policy (CSP) header not implemented");
  });

  it("gets the score modifier", function () {
    const res = getScoreModifier(Expectation.CspNotImplemented);
    assert.equal(res, -25);
  });

  it("gets the recommendation", function () {
    const res = getRecommendation(Expectation.CspNotImplemented);
    assert.include(res, "Implement one, see ");
  });

  it("gets the topic link for a test name", function () {
    const res = getTopicLink("cookies");
    assert.include(
      res,
      "/en-US/docs/Web/Security/Practical_implementation_guides/Cookies"
    );
  });

  it("gets the grade", function () {
    let res = getGradeForScore(100);
    assert.deepEqual(res, {
      score: 100,
      grade: "A+",
    });

    res = getGradeForScore(0);
    assert.deepEqual(res, {
      score: 0,
      grade: "F",
    });

    res = getGradeForScore(120);
    assert.deepEqual(res, {
      score: 120,
      grade: "A+",
    });

    res = getGradeForScore(-10);
    assert.deepEqual(res, {
      score: 0,
      grade: "F",
    });
  });
});
