import mongoose from "mongoose";
import app from "../server.js";
import { User } from "../models/User.js";
import { Url } from "../models/Url.js";
import { Click } from "../models/Click.js";
import { validateUrl } from "../utils/validateUrl.js";
import { validateAlias } from "../utils/validateAlias.js";

async function runTests() {
  console.log("==================================================");
  console.log("Starting Enhanced V2 Automated Test Suite");
  console.log("==================================================");

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
    // Reset test collections
    await User.deleteMany({});
    await Url.deleteMany({});
    await Click.deleteMany({});

    // 0. Health check
    const healthRes = await fetch(`${BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === "ok", "Test 0: GET /health returns 200");

    // 1. Register valid user A
    const regResA = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "User Alpha",
        email: "user.alpha@test.com",
        password: "Password123",
      }),
    });
    const regDataA = await regResA.json();
    assert(regResA.status === 201 && regDataA.data?.token, "Test 1: Register User A returns 201 with JWT token");
    const tokenA = regDataA.data?.token;

    // 2. Register duplicate email
    const regDupRes = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate User",
        email: "user.alpha@test.com",
        password: "Password123",
      }),
    });
    assert(regDupRes.status === 409, "Test 2: Register duplicate email returns 409 Conflict");

    // 3. Weak password checks
    const weak1 = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Weak", email: "weak1@test.com", password: "abc" }),
    });
    const weak2 = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Weak", email: "weak2@test.com", password: "onlyletters" }),
    });
    const weak3 = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Weak", email: "weak3@test.com", password: "12345678" }),
    });
    assert(weak1.status === 400 && weak2.status === 400 && weak3.status === 400, "Test 3: Weak/invalid passwords return 400");

    // 4. Login: Correct and wrong password
    const loginOk = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user.alpha@test.com", password: "Password123" }),
    });
    const loginOkData = await loginOk.json();
    assert(loginOk.status === 200 && loginOkData.data?.token, "Test 4a: Correct login returns 200 with token");

    const loginFail = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user.alpha@test.com", password: "WrongPassword99" }),
    });
    const loginFailData = await loginFail.json();
    assert(
      loginFail.status === 401 && loginFailData.error?.message === "Invalid email or password",
      "Test 4b: Wrong login returns 401 with generic message"
    );

    // 5. Protected route without token
    const noTokenRes = await fetch(`${BASE}/api/urls`);
    assert(noTokenRes.status === 401, "Test 5: GET /api/urls without token returns 401");

    // 6. Guest create URL (no token) -> userId is null
    const guestCreate = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl: "https://example.com/test-v2-guest" }),
    });
    const guestData = await guestCreate.json();
    assert(
      guestCreate.status === 201 && guestData.data?.userId === null,
      `Test 6: Guest creates URL successfully with userId null (code: ${guestData.data?.shortCode})`
    );

    // 7. Register User B and verify ownership isolation
    const regResB = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "User Beta", email: "user.beta@test.com", password: "Password123" }),
    });
    const regDataB = await regResB.json();
    const tokenB = regDataB.data?.token;

    // User A creates a URL
    const userACreate = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ originalUrl: "https://example.com/test-v2-usera" }),
    });
    const userAUrl = (await userACreate.json()).data;

    // User B tries to fetch User A's URL -> must return 404
    const userBAccess = await fetch(`${BASE}/api/urls/${userAUrl._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(userBAccess.status === 404, "Test 7: Cross-user access returns 404 (not 403)");

    // 8. Guest advanced options blocked
    const guestAlias = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl: "https://example.com/test", customAlias: "guest-alias" }),
    });
    const guestExpiry = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl: "https://example.com/test", expiresAt: new Date(Date.now() + 86400000).toISOString() }),
    });
    assert(guestAlias.status === 401 && guestExpiry.status === 401, "Test 8: Guest sending customAlias or expiresAt receives 401");

    // 9. Custom alias creation by logged-in user
    const customAliasRes = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        originalUrl: "https://example.com/test-v2-launch",
        customAlias: "my-launch",
      }),
    });
    const customAliasData = await customAliasRes.json();
    assert(
      customAliasRes.status === 201 &&
      customAliasData.data?.shortCode === "my-launch" &&
      customAliasData.data?.isCustom === true,
      "Test 9: Logged-in user creates custom alias 'my-launch' (isCustom: true)"
    );

    // 10. Alias validation rules (too short, spaces, reserved words, too long)
    const rule1 = validateAlias("ab");
    const rule2 = validateAlias("has space");
    const rule3 = validateAlias("api");
    const rule4 = validateAlias("Dashboard");
    const rule5 = validateAlias("abcdefghijklmnopqrstu"); // 21 chars
    assert(
      !rule1.valid && !rule2.valid && !rule3.valid && !rule4.valid && !rule5.valid,
      "Test 10: validateAlias rejects short, spaces, reserved (api/dashboard), and >20 chars"
    );

    // 11. Alias taken -> 409 Conflict
    const dupAliasRes = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        originalUrl: "https://example.com/test-v2-dup",
        customAlias: "my-launch",
      }),
    });
    assert(dupAliasRes.status === 409, "Test 11: Attempting to create duplicate alias returns 409 Conflict");

    // 12. Valid expiry date
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const expiryRes = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        originalUrl: "https://example.com/test-v2-future",
        expiresAt: futureDate,
      }),
    });
    const expiryData = await expiryRes.json();
    assert(
      expiryRes.status === 201 &&
      expiryData.data?.expiresAt &&
      expiryData.data?.status === "active",
      "Test 12: Future expiry date stored and status is 'active'"
    );

    // 13. Invalid expiry dates
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    const overOneYear = new Date(Date.now() + 400 * 86400000).toISOString();
    const badExpiry1 = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ originalUrl: "https://example.com/t", expiresAt: pastDate }),
    });
    const badExpiry2 = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ originalUrl: "https://example.com/t", expiresAt: overOneYear }),
    });
    const badExpiry3 = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ originalUrl: "https://example.com/t", expiresAt: "invalid-date" }),
    });
    assert(
      badExpiry1.status === 400 && badExpiry2.status === 400 && badExpiry3.status === 400,
      "Test 13: Past date, >365 days, and malformed expiry dates return 400"
    );

    // 14. Expired redirect returns 410 Gone and does not count clicks
    const expiredDoc = await Url.create({
      originalUrl: "https://example.com/test-v2-expired",
      shortCode: "exp123",
      userId: userAUrl.userId,
      expiresAt: new Date(Date.now() - 60000), // 1 min ago
    });
    const expiredRedirect = await fetch(`${BASE}/exp123`, {
      redirect: "manual",
      headers: { Accept: "application/json" },
    });
    assert(expiredRedirect.status === 410, "Test 14: Redirecting to expired link returns 410 Gone");

    const checkExpiredClicks = await Url.findById(expiredDoc._id);
    assert(checkExpiredClicks.clicks === 0, "Test 14b: Expired link clicks remain 0 and no click is logged");

    // 15. Status filter on GET /api/urls
    const activeList = await fetch(`${BASE}/api/urls?status=active`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const activeData = await activeList.json();
    const expiredList = await fetch(`${BASE}/api/urls?status=expired`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const expiredData = await expiredList.json();
    assert(
      activeData.data.every((u) => u.status === "active") &&
      expiredData.data.every((u) => u.status === "expired"),
      "Test 15: Status filter correctly partitions active and expired links"
    );

    // 16. Search filter (case-insensitive substring)
    const searchRes = await fetch(`${BASE}/api/urls?search=LAUNCH`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const searchData = await searchRes.json();
    assert(
      searchData.data.some((u) => u.shortCode === "my-launch"),
      "Test 16: Search 'LAUNCH' matches 'my-launch' case-insensitively"
    );

    // 17. Search regex safety (special characters do not crash)
    const searchSpecial = await fetch(`${BASE}/api/urls?search=.*(`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(searchSpecial.status === 200, "Test 17: Search with regex special characters '.*(' handles safely without crashing");

    // 18. Sort filter
    const sortClicks = await fetch(`${BASE}/api/urls?sort=clicks`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(sortClicks.status === 200, "Test 18: Sort by clicks returns 200");

    // 19. Pagination
    const pageRes = await fetch(`${BASE}/api/urls?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const pageData = await pageRes.json();
    assert(
      pageData.meta?.page === 1 && pageData.meta?.limit === 2 && pageData.data.length <= 2,
      `Test 19: Pagination returns meta (page: ${pageData.meta?.page}, limit: ${pageData.meta?.limit}, totalPages: ${pageData.meta?.totalPages})`
    );

    // 20. Delete link & 404 cascade
    const toDeleteRes = await fetch(`${BASE}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ originalUrl: "https://example.com/test-v2-del", customAlias: "del-me" }),
    });
    const toDeleteUrl = (await toDeleteRes.json()).data;
    const deleteAction = await fetch(`${BASE}/api/urls/${toDeleteUrl._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(deleteAction.status === 200, "Test 20: DELETE /api/urls/:id returns 200");

    const afterDeleteRedirect = await fetch(`${BASE}/del-me`, {
      redirect: "manual",
      headers: { Accept: "application/json" },
    });
    assert(afterDeleteRedirect.status === 404, "Test 20b: Deleted custom short code returns 404");

    // 21. Summary endpoint (user-scoped)
    const summaryRes = await fetch(`${BASE}/api/analytics/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const summaryData = await summaryRes.json();
    assert(
      summaryRes.status === 200 &&
      typeof summaryData.data?.totalLinks === "number" &&
      typeof summaryData.data?.activeLinks === "number" &&
      typeof summaryData.data?.expiredLinks === "number" &&
      Array.isArray(summaryData.data?.clicksByDay) &&
      summaryData.data?.clicksByDay.length === 7,
      `Test 21: Summary returns active/expired link counts and 7-day zero-filled series`
    );

    // 22. Per-link analytics (30 days zero-filled)
    const linkAnalyticsRes = await fetch(`${BASE}/api/urls/${customAliasData.data._id}/analytics`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const linkAnalyticsData = await linkAnalyticsRes.json();
    assert(
      linkAnalyticsRes.status === 200 &&
      Array.isArray(linkAnalyticsData.data?.clicksByDay) &&
      linkAnalyticsData.data?.clicksByDay.length === 30 &&
      Array.isArray(linkAnalyticsData.data?.topReferrers),
      "Test 22: Per-link analytics returns 30-day series and top referrers"
    );

    // 23. CSV export for all links (verify headers and BOM in raw bytes)
    const csvAllRes = await fetch(`${BASE}/api/analytics/export.csv`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const csvAllBuf = Buffer.from(await csvAllRes.arrayBuffer());
    const hasBOMAll = csvAllBuf[0] === 0xEF && csvAllBuf[1] === 0xBB && csvAllBuf[2] === 0xBF;
    const csvAllText = csvAllBuf.toString("utf8");
    const csvAllDisp = csvAllRes.headers.get("content-disposition");
    assert(
      csvAllRes.status === 200 &&
      csvAllRes.headers.get("content-type")?.includes("text/csv") &&
      csvAllDisp?.includes("attachment") &&
      hasBOMAll &&
      csvAllText.includes("shortCode"),
      "Test 23: GET /api/analytics/export.csv returns valid CSV with UTF-8 BOM and headers"
    );

    // 24. CSV export for single link
    const csvLinkRes = await fetch(`${BASE}/api/urls/${customAliasData.data._id}/analytics/export.csv`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const csvLinkBuf = Buffer.from(await csvLinkRes.arrayBuffer());
    const hasBOMLink = csvLinkBuf[0] === 0xEF && csvLinkBuf[1] === 0xBB && csvLinkBuf[2] === 0xBF;
    const csvLinkText = csvLinkBuf.toString("utf8");
    assert(
      csvLinkRes.status === 200 &&
      hasBOMLink &&
      csvLinkText.includes("date") &&
      csvLinkText.includes("clicks"),
      "Test 24: GET /api/urls/:id/analytics/export.csv returns 30-day click CSV with BOM"
    );

    // 25. CSV Formula Injection protection
    await Url.create({
      originalUrl: "=SUM(A1:A10)",
      shortCode: "inj123",
      userId: userAUrl.userId,
    });
    const csvInjectRes = await fetch(`${BASE}/api/analytics/export.csv`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const csvInjectText = await csvInjectRes.text();
    assert(
      csvInjectText.includes("\"'=SUM(A1:A10)\""),
      "Test 25: CSV cell starting with '=' is sanitized by prepending single quote (\"'=...\")"
    );

    // 31. Regression: Guest redirection and click counting still works
    const guestShortCode = guestData.data.shortCode;
    const redirGuest = await fetch(`${BASE}/${guestShortCode}`, { redirect: "manual" });
    assert(
      redirGuest.status === 302 && redirGuest.headers.get("location") === "https://example.com/test-v2-guest",
      `Test 31: Guest short link /${guestShortCode} successfully redirects via 302`
    );

    console.log("==================================================");
    console.log(`V2 Backend Tests Finished: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error("Test execution encountered error:", err);
    process.exit(1);
  }
}

setTimeout(runTests, 1500);
