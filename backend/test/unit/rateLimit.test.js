import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hitLimit } from "../../src/rateLimit.js";

describe("Unit Tests: rateLimit", () => {
  it("should allow initial hits and decrement remaining quota", () => {
    const key = `test-ip-${Date.now()}-1`;
    const first = hitLimit(key);
    assert.equal(first.limited, false);
    assert.equal(first.remaining, 7);
    assert.equal(first.retryAfter, 0);

    const second = hitLimit(key);
    assert.equal(second.limited, false);
    assert.equal(second.remaining, 6);
  });

  it("should block requests when MAX_HITS (8) is exceeded", () => {
    const key = `test-ip-${Date.now()}-2`;
    // Consume remaining 7 hits (total 8)
    for (let i = 0; i < 8; i++) {
      const res = hitLimit(key);
      assert.equal(res.limited, false, `Hit ${i + 1} should be allowed`);
    }

    // 9th hit should be limited
    const blocked = hitLimit(key);
    assert.equal(blocked.limited, true);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfter > 0, "retryAfter should be greater than 0 seconds");
  });

  it("should track rate limits independently per IP/client key", () => {
    const keyA = `ip-a-${Date.now()}`;
    const keyB = `ip-b-${Date.now()}`;

    const resA = hitLimit(keyA);
    const resB = hitLimit(keyB);

    assert.equal(resA.remaining, 7);
    assert.equal(resB.remaining, 7);
  });
});
