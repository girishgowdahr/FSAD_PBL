import mongoose from "mongoose";
import http from "http";
import app from "../server.js";
import { Url } from "../models/Url.js";
import { Click } from "../models/Click.js";
import { generateCode } from "../utils/generateCode.js";
import { validateUrl } from "../utils/validateUrl.js";

async function runTests() {
  console.log("==========================================");
  console.log("Starting Automated Verification Test Suite");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  const BASE = "http://localhost:5000";

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === "ok", "Test 0: GET /health returns 200 and { status: 'ok' }");

    // 2. Unit test: validateUrl utility
    assert(validateUrl("https://example.com").valid === true, "validateUrl: valid https URL accepted");
    assert(validateUrl("http://example.com/test?a=1").valid === true, "validateUrl: valid http URL accepted");
    assert(validateUrl("").valid === false, "validateUrl: empty URL rejected");
    assert(validateUrl("hello world").valid === false, "validateUrl: invalid text rejected");
    assert(validateUrl("javascript:alert(1)").valid === false, "validateUrl: javascript protocol rejected");
    assert(validateUrl("ftp://example.com").valid === false, "validateUrl: ftp protocol rejected");
    assert(validateUrl("http://localhost:5000/abc", "http://localhost:5000").valid === false, "validateUrl: self-referencing BASE_URL rejected");

    // 3. Test 1: POST valid URL
    const createRes = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl: "https://developer.mozilla.org/en-US/" }),
    });
    const createData = await createRes.json();
    assert(
      createRes.status === 201 &&
      createData.data?.shortCode &&
      createData.data?.shortUrl === `${BASE}/${createData.data.shortCode}` &&
      createData.data?.clicks === 0,
      `Test 1: POST valid URL returns 201 with shortCode (${createData.data?.shortCode}) and shortUrl`
    );
    const createdUrl = createData.data;

    // 4. Test 2: Empty input
    const emptyRes = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl: "" }),
    });
    const emptyData = await emptyRes.json();
    assert(emptyRes.status === 400 && emptyData.error?.message, "Test 2: Empty input returns 400 with error message");

    // 5. Test 3: Invalid text
    const invalidTextRes = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl: "hello world" }),
    });
    assert(invalidTextRes.status === 400, "Test 3: 'hello world' returns 400");

    // 6. Test 4: Bad protocols
    const jsProtoRes = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl: "javascript:alert(1)" }),
    });
    const ftpProtoRes = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl: "ftp://example.com" }),
    });
    assert(jsProtoRes.status === 400 && ftpProtoRes.status === 400, "Test 4: javascript: and ftp: return 400");

    // 7. Test 5: Self-loop
    const loopRes = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl: "http://localhost:5000/xyz123" }),
    });
    assert(loopRes.status === 400, "Test 5: Self-referencing link returns 400");

    // 8. Test 6: Redirect (HTTP 302)
    const redirectRes = await fetch(`${BASE}/${createdUrl.shortCode}`, {
      redirect: "manual",
    });
    assert(
      redirectRes.status === 302 && redirectRes.headers.get("location") === "https://developer.mozilla.org/en-US/",
      `Test 6: GET /${createdUrl.shortCode} returns 302 with Location header`
    );

    // 9. Test 7: Click tracking (2 more visits)
    await fetch(`${BASE}/${createdUrl.shortCode}`, {
      redirect: "manual",
      headers: { Referer: "https://twitter.com/post/1" },
    });
    await fetch(`${BASE}/${createdUrl.shortCode}`, {
      redirect: "manual",
      headers: { Referer: "https://linkedin.com/feed" },
    });

    const getAfterClicks = await fetch(`${BASE}/api/urls/${createdUrl._id}`);
    const afterClicksData = await getAfterClicks.json();
    assert(
      afterClicksData.data?.clicks === 3,
      `Test 7: Click count updated to 3 (actual: ${afterClicksData.data?.clicks})`
    );

    const clickDocsCount = await Click.countDocuments({ urlId: createdUrl._id });
    assert(clickDocsCount === 3, `Test 7b: Click collection contains 3 click documents (actual: ${clickDocsCount})`);

    // 10. Test 8: Unknown short code
    const unknownRes = await fetch(`${BASE}/zzzzzz`, {
      headers: { Accept: "application/json" },
    });
    assert(unknownRes.status === 404, "Test 8: Unknown short code returns 404");

    // 11. Test 9: List all URLs
    const listRes = await fetch(`${BASE}/api/urls`);
    const listData = await listRes.json();
    assert(
      listRes.status === 200 && Array.isArray(listData.data) && listData.data.length > 0,
      `Test 9: GET /api/urls returns list of URLs (count: ${listData.data?.length})`
    );

    // 12. Test 10: Invalid ObjectId
    const invalidIdRes = await fetch(`${BASE}/api/urls/123`);
    assert(invalidIdRes.status === 400, "Test 11: GET /api/urls/123 returns 400 for invalid ObjectId");

    // 13. Test 11: Summary
    const summaryRes = await fetch(`${BASE}/api/analytics/summary`);
    const summaryData = await summaryRes.json();
    assert(
      summaryRes.status === 200 &&
      typeof summaryData.data?.totalLinks === "number" &&
      typeof summaryData.data?.totalClicks === "number" &&
      Array.isArray(summaryData.data?.clicksByDay) &&
      summaryData.data?.clicksByDay.length === 7,
      `Test 12: GET /api/analytics/summary returns 7-day clicksByDay (length: ${summaryData.data?.clicksByDay?.length})`
    );

    // 14. Test 12: Per-link analytics
    const analyticsRes = await fetch(`${BASE}/api/urls/${createdUrl._id}/analytics`);
    const analyticsData = await analyticsRes.json();
    assert(
      analyticsRes.status === 200 &&
      Array.isArray(analyticsData.data?.clicksByDay) &&
      analyticsData.data?.clicksByDay.length === 30 &&
      Array.isArray(analyticsData.data?.topReferrers),
      `Test 13: GET /api/urls/:id/analytics returns 30-day clicksByDay (length: ${analyticsData.data?.clicksByDay?.length}) and referrers`
    );

    // 15. Test 13: Delete URL
    const deleteRes = await fetch(`${BASE}/api/urls/${createdUrl._id}`, {
      method: "DELETE",
    });
    assert(deleteRes.status === 200, "Test 10: DELETE /api/urls/:id returns 200");

    // Check that deleted link now returns 404
    const deletedRedirectRes = await fetch(`${BASE}/${createdUrl.shortCode}`, {
      redirect: "manual",
      headers: { Accept: "application/json" },
    });
    assert(deletedRedirectRes.status === 404, "Test 10b: Deleted short link returns 404");

    const clicksRemaining = await Click.countDocuments({ urlId: createdUrl._id });
    assert(clicksRemaining === 0, `Test 10c: Associated clicks cascade-deleted (remaining: ${clicksRemaining})`);

    // 16. Test 14: Collision retry logic test
    const testCode = generateCode(6);
    const firstDoc = await Url.create({ originalUrl: "https://example.com/one", shortCode: testCode });
    // Attempting to create same shortCode directly throws E11000
    let caughtCollision = false;
    try {
      await Url.create({ originalUrl: "https://example.com/two", shortCode: testCode });
    } catch (err) {
      if (err.code === 11000) caughtCollision = true;
    }
    assert(caughtCollision, "Test 14: Unique index triggers E11000 duplicate key error on collision");
    await Url.findByIdAndDelete(firstDoc._id);

    console.log("==========================================");
    console.log(`Test Suite Finished: ${passed} PASSED, ${failed} FAILED`);
    console.log("==========================================");

    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error("Test execution encountered error:", err);
    process.exit(1);
  }
}

// Give server time to bind and connect to MongoDB
setTimeout(runTests, 1500);
