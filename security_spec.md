# PRODE Mundial 2026 - Security Specification & TDD

## 1. Data Invariants

1. **Identity Integrity**: Users can only create or update their own user profile document (`/users/{userId}` where `{userId} == request.auth.uid`), their own matches predictions (`/predictions/{uid_matchId}` which must have `userId` matched to auth ID), and their own specials (`/specialPredictions/{userId}`).
2. **Read-Isolations**:
   - Before `groupStageDeadline` (June 10th 2026 23:59 UTC), predictions are strictly confidential. A user can only read their OWN predictions. Other people's predictions are blocked completely on single `get` and query `list` requests.
   - After the deadline, predictions are fully readable by any member (with a confirmed payment status) for collective transparency.
3. **Write-Isolations**:
   - Predictive modifications on groups matches can only be made until the `groupStageDeadline` timestamp passes.
   - Knockout matches can only be predicted until the `knockoutDeadline` timestamp passes (June 27th 2026 23:59 UTC).
   - Once past deadlines, states are completely locked for edits.
4. **Role Integrity & Admin Escalation**:
   - Normal users are strictly forbidden from writing to `/matches/{matchId}`, `/players/{playerId}`, `/config/settings`, or changing their own `isAdmin` flag or payment statuses (`paymentStatus`).
   - Only administrative accounts verified against the `/admins/{userId}` document can modify match fixtures, inputs, and confirm payment flags.

---

## 2. The "Dirty Dozen" Payloads (Athenticated / Malicious Actions)

1. **Payload 1: Identity Impersonation (Write User profile)**
   - Target path: `/users/hacker_uid` as `request.auth.uid = "user_123"`
   - Expected Result: `PERMISSION_DENIED`
2. **Payload 2: Self-Appointed Administrative Role**
   - Target path: `/users/user_123` with payload `{ "uid": "user_123", "isAdmin": true, "paymentStatus": "confirmed" }`
   - Expected Result: `PERMISSION_DENIED` (cannot modify keys without Admin privilege)
3. **Payload 3: Score Injection outside bounds**
   - Target path: `/predictions/user_123_match-5` with payload `{ "homeScore": 99, "awayScore": -1 }`
   - Expected Result: `PERMISSION_DENIED` (must be min=0, max=20)
4. **Payload 4: Post-Deadline Lock Bypass (Fase de Grupos)**
   - Time: `2026-06-12T00:00:00Z` (Post group stage deadline)
   - Target path: `/predictions/user_123_match-2` with payload `{ "homeScore": 2, "awayScore": 1 }`
   - Expected Result: `PERMISSION_DENIED`
5. **Payload 5: Malicious Ghost Key Pollution**
   - Target path: `/predictions/user_123_match-1` with payload `{ "homeScore": 1, "awayScore": 2, "extraMaliciousKey": "hacked" }`
   - Expected Result: `PERMISSION_DENIED` (hasOnly check failed)
6. **Payload 6: Unauthorized Match Score tampering**
   - Target path: `/matches/match-1` with payload `{ "homeScore": 5, "awayScore": 0, "isFinished": true }` by non-admin `{isAdmin: false}`
   - Expected Result: `PERMISSION_DENIED`
7. **Payload 7: Query Scraping (Sneaking someone else's prediction before deadline)**
   - Time: `2026-06-01T12:00:00Z`
   - Action: Read list `/predictions` where `userId == "someone_else"`
   - Expected Result: `PERMISSION_DENIED`
8. **Payload 8: Self-Validating Payments**
   - Action: Set own `/users/user_123` -> `paymentStatus = "confirmed"`
   - Expected Result: `PERMISSION_DENIED`

...and remaining malicious vectors designed to violate the invariants.

---

## 3. Test Runner Schema (Firebase Sandbox Test suite outline)

This is an illustration of our security tests. In production, firestore.rules enforces these patterns natively:
```typescript
describe("PRODE Rules", () => {
  it("should prevent normal users from listing other users' PII", async () => {
    // ... test code checking get operations ...
  });
});
```
