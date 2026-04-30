# KXApp Mini Program Registration And Login Flow

**Purpose:** Define the first-pass registration and login experience for the WeChat mini program version of `kxapp`.

**Goal:** Let first-time users complete account creation with the least friction, while still collecting the minimum information needed for device binding, project ownership, and customer support.

---

## 1. Product Positioning

This is not a classic username/password product.

Recommended approach:

1. WeChat login as the primary identity entry
2. First login determines whether the user already exists
3. New users complete a short registration form
4. Returning users enter the app directly

This keeps the flow aligned with mini program conventions and avoids unnecessary credential management.

## 2. Registration Flow

### 2.1 Returning User Flow

```text
Open mini program
  ->
Tap "WeChat quick login"
  ->
Backend verifies openId/unionId
  ->
Existing account found
  ->
Return token + user profile
  ->
Enter app
```

### 2.2 First-Time User Flow

```text
Open mini program
  ->
Tap "WeChat quick login"
  ->
Backend verifies openId/unionId
  ->
No account found
  ->
Enter registration completion page
  ->
Submit required profile fields
  ->
Create account
  ->
Return token + user profile
  ->
Enter app
```

### 2.3 Incomplete Profile Flow

```text
Open mini program
  ->
Tap "WeChat quick login"
  ->
Account exists but profile incomplete
  ->
Redirect to complete-profile page
  ->
Submit missing required fields
  ->
Update profile
  ->
Enter app
```

## 3. Page-Level Flow

### Page A: Login Entry

Purpose:

- explain nothing more than needed
- provide the main login CTA
- provide access to terms/privacy consent

Primary actions:

- `WeChat quick login`
- `View terms`
- `View privacy policy`

### Page B: Registration Completion

Purpose:

- convert a first-time WeChat identity into a usable app account

When shown:

- `POST /auth/wechat-login` returns `isNewUser = true`
- or returns `nextAction = complete_profile`

### Page C: Complete Profile

Purpose:

- collect any missing required fields after a partial account already exists

When shown:

- login succeeded but `profileStatus != completed`

## 4. Field Design

### 4.1 Required Fields For P0

These should be enough for account creation:

| Field | Required | Why |
|---|---|---|
| WeChat identity | yes | primary login identity |
| nickname | yes | account display name |
| mobile | yes | support, account recovery, business follow-up |
| agreeTerms | yes | legal consent |

### 4.2 Recommended P1 Fields

| Field | Required | Why |
|---|---|---|
| companyName | no | useful for B2B/device ownership scenarios |
| region | no | support and sales routing |
| roleType | no | operator/admin segmentation later |

### 4.3 Fields Not Recommended For P0

Avoid collecting these in the first version:

- username
- password
- repeated password
- detailed address
- ID card / legal identity data
- multiple contact persons

They slow registration without helping the core workflow.

## 5. Validation Rules

### Nickname

- length: 1 to 32 characters
- trim leading/trailing spaces
- allow fallback from WeChat profile nickname

### Mobile

- mainland China mobile format validation
- required before entering the main app

### Terms Consent

- checkbox or explicit confirmation
- cannot proceed when unchecked

## 6. API Behavior

### `POST /auth/wechat-login`

Possible results:

#### Case 1: Existing user

```json
{
  "isNewUser": false,
  "token": "token_xxx",
  "user": {
    "id": "usr_123",
    "profileStatus": "completed"
  },
  "nextAction": "enter_app"
}
```

#### Case 2: New user

```json
{
  "isNewUser": true,
  "tempAuthToken": "temp_xxx",
  "nextAction": "register"
}
```

#### Case 3: Existing but incomplete

```json
{
  "isNewUser": false,
  "token": "token_xxx",
  "user": {
    "id": "usr_123",
    "profileStatus": "incomplete"
  },
  "nextAction": "complete_profile"
}
```

### `POST /auth/register`

Uses `tempAuthToken` or equivalent secure session to complete account creation.

Request:

```json
{
  "nickname": "Alice",
  "mobile": "13800000000",
  "agreeTerms": true
}
```

Response:

```json
{
  "token": "token_xxx",
  "user": {
    "id": "usr_123",
    "profileStatus": "completed"
  },
  "nextAction": "enter_app"
}
```

### `POST /auth/complete-profile`

Request:

```json
{
  "nickname": "Alice",
  "mobile": "13800000000",
  "companyName": "Demo Studio"
}
```

Response:

```json
{
  "user": {
    "id": "usr_123",
    "profileStatus": "completed"
  }
}
```

## 7. User Model Additions

Recommended fields:

```json
{
  "id": "usr_123",
  "wechatOpenId": "openid_xxx",
  "wechatUnionId": "unionid_xxx",
  "nickname": "Alice",
  "avatarUrl": "https://...",
  "mobile": "13800000000",
  "companyName": "Demo Studio",
  "registerSource": "wechat",
  "profileStatus": "completed",
  "termsAcceptedAt": "2026-05-01T10:00:00Z",
  "status": "active"
}
```

## 8. Recommended UI Copy Structure

### Login Entry

- Title: `欢迎使用`
- Primary CTA: `微信快捷登录`
- Secondary text: concise consent hint

### Registration Completion

- Title: `完成注册`
- Supporting text: one short sentence, not a long explanation
- Fields:
  - nickname
  - mobile
  - agreeTerms
- Primary CTA: `完成并进入`

### Complete Profile

- Title: `补充信息`
- Only show missing fields
- Primary CTA: `保存并进入`

## 9. Error Cases

### Login errors

- WeChat auth failed
- backend login exchange failed
- account disabled

### Registration errors

- mobile format invalid
- terms not accepted
- duplicate mobile conflict
- expired temp auth token

### Complete profile errors

- invalid field format
- profile update conflict

## 10. P0 Recommendation

For the first version, lock the registration flow to:

1. WeChat quick login
2. If new user, collect:
   - nickname
   - mobile
   - agreeTerms
3. Create account
4. Enter app

That is the smallest stable version.

## 11. Later Upgrade Options

After P0 is stable, consider:

- SMS verification for mobile
- invite code for dealer/customer channels
- company-based account ownership
- role separation (`owner`, `operator`, `viewer`)
- backend admin approval for certain device-binding scenarios

## 12. Final Recommendation

Do not build a traditional username/password registration flow unless a later distribution channel requires it.

For this project, the right default is:

`WeChat login + short registration completion form`
