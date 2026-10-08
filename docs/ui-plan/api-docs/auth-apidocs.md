# Snapgram — Auth Service API

> ⚠️ LƯU Ý QUAN TRỌNG: Tài liệu này trích xuất thô từ Swagger UI (mặc định hiển thị Bearer). Admin Portal thực tế dùng COOKIE-BASED cho `/api/auth/admin/login`: BE set `Set-Cookie: admin_access_token` (httpOnly; Secure; SameSite). FE KHÔNG đọc/lưu token. Chi tiết xem `docs/ui-plan/architect/auth-and-security-flow.md`. Phần mô tả Bearer bên dưới giữ nguyên vì phản ánh Swagger raw.

> **Áp dụng cho toàn bộ endpoint `/api/auth/admin/**`:** dùng cookie `admin_access_token` (httpOnly) thay vì Bearer. Bảng "Auth" cột ghi `Bearer` là output raw của Swagger — bỏ qua khi integrate FE. Chi tiết: `architect/auth-and-security-flow.md`.

## Auth flow:

1. `POST /api/auth/register` hoặc `POST /api/auth/login`
2. Nhận `accessToken` + `refreshToken` trong response body
3. Gửi header `Authorization: Bearer <accessToken>` cho các request cần xác thực
4. Khi `accessToken` hết hạn, gọi `POST /api/auth/refresh` với `refreshToken` để lấy token mới

## 2FA flow:

1. `POST /api/auth/login` → nếu user bật 2FA, trả về `requiresTwoFa: true` kèm `tempToken` (hết hạn trong 5 phút)
2. `POST /api/auth/2fa/login` với `tempToken` + `totpCode` (hoặc `backupCode`) → trả về `accessToken` + `refreshToken`
3. Cài đặt 2FA:
   - `POST /api/auth/2fa/setup` → trả về secret + QR code URL
   - `POST /api/auth/2fa/enable` với `totpCode` để xác nhận → trả về danh sách backup codes
   - `POST /api/auth/2fa/disable` với `totpCode` (hoặc `backupCode`) để tắt

## Endpoints

### Admin RBAC API

| Method     | Path                                           | Mô tả                                                            |    Auth    | Request Body                                                      | Response                                                                |
| :--------- | :--------------------------------------------- | :----------------------------------------------------------------- | :--------: | :---------------------------------------------------------------- | :---------------------------------------------------------------------- |
| `GET`    | `/api/auth/admin/permissions`                | Lấy danh mục tất cả quyền hạn gom theo nhóm                 | `Bearer` | -                                                                 | `object`                                                              |
| `GET`    | `/api/auth/admin/roles`                      | Lấy danh sách tất cả vai trò kèm quyền hạn                 | `Bearer` | -                                                                 | Array<[`RoleDetailResponse`](#schema-roledetailresponse)>              |
| `POST`   | `/api/auth/admin/roles`                      | Tạo vai trò động mới (MODERATOR, SUPPORT, v.v.)               | `Bearer` | [`CreateRoleRequest`](#schema-createrolerequest)                 | [`RoleDetailResponse`](#schema-roledetailresponse)                     |
| `GET`    | `/api/auth/admin/roles/{roleId}`             | Xem chi tiết một vai trò                                        | `Bearer` | -                                                                 | [`RoleDetailResponse`](#schema-roledetailresponse)                     |
| `PUT`    | `/api/auth/admin/roles/{roleId}`             | Cập nhật thông tin vai trò                                     | `Bearer` | [`UpdateRoleRequest`](#schema-updaterolerequest)                 | [`RoleDetailResponse`](#schema-roledetailresponse)                     |
| `DELETE` | `/api/auth/admin/roles/{roleId}`             | Xóa vai trò động (không thể xóa vai trò hệ thống)        | `Bearer` | -                                                                 | OK                                                                      |
| `PUT`    | `/api/auth/admin/roles/{roleId}/permissions` | Cập nhật danh sách quyền hạn cho một vai trò                | `Bearer` | [`SetRolePermissionsRequest`](#schema-setrolepermissionsrequest) | [`RoleDetailResponse`](#schema-roledetailresponse)                     |
| `GET`    | `/api/auth/admin/users/{userId}/roles`       | Lấy danh sách vai trò và quyền hiệu dụng của người dùng | `Bearer` | -                                                                 | [`UserRolesPermissionsResponse`](#schema-userrolespermissionsresponse) |
| `PUT`    | `/api/auth/admin/users/{userId}/roles`       | Đồng bộ danh sách vai trò của người dùng                  | `Bearer` | [`SyncUserRolesRequest`](#schema-syncuserrolesrequest)           | [`AdminUserResponse`](#schema-adminuserresponse)                       |

#### Chi tiết Endpoint trong Admin RBAC API

##### `GET` /api/auth/admin/permissions

- **Tóm tắt**: Lấy danh mục tất cả quyền hạn gom theo nhóm
- **Operation ID**: `getPermissions`
- **Xác thực (Auth)**: `Bearer`

**Responses:**

| Status Code | Mô tả | Content-Type | Schema     |
| :---------: | :------ | :----------- | :--------- |
|   `200`   | OK      | `*/*`      | `object` |

---

##### `GET` /api/auth/admin/roles

- **Tóm tắt**: Lấy danh sách tất cả vai trò kèm quyền hạn
- **Operation ID**: `getRoles`
- **Xác thực (Auth)**: `Bearer`

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                                     |
| :---------: | :------ | :----------- | :--------------------------------------------------------- |
|   `200`   | OK      | `*/*`      | Array<[`RoleDetailResponse`](#schema-roledetailresponse)> |

---

##### `POST` /api/auth/admin/roles

- **Tóm tắt**: Tạo vai trò động mới (MODERATOR, SUPPORT, v.v.)
- **Operation ID**: `createRole`
- **Xác thực (Auth)**: `Bearer`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`CreateRoleRequest`](#schema-createrolerequest)
  | Field             | Kiểu                    | Bắt buộc | Mô tả & Ràng buộc                                          |
  | :---------------- | :----------------------- | :--------: | :------------------------------------------------------------- |
  | `name`          | `string`               |     ✓     | Ràng buộc: [minLen: 2, maxLen: 50, pattern:`^[A-Z0-9_]+$`] |
  | `description`   | `string`               |     -     | Ràng buộc: [minLen: 0, maxLen: 255]                          |
  | `permissionIds` | Array<`string (uuid)`> |     -     | -                                                              |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                              |
| :---------: | :------ | :----------- | :-------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`RoleDetailResponse`](#schema-roledetailresponse) |

---

##### `GET` /api/auth/admin/roles/

- **Tóm tắt**: Xem chi tiết một vai trò
- **Operation ID**: `getRole`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên       | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :--------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `roleId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                              |
| :---------: | :------ | :----------- | :-------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`RoleDetailResponse`](#schema-roledetailresponse) |

---

##### `PUT` /api/auth/admin/roles/

- **Tóm tắt**: Cập nhật thông tin vai trò
- **Operation ID**: `updateRole`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên       | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :--------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `roleId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`UpdateRoleRequest`](#schema-updaterolerequest)
  | Field           | Kiểu      | Bắt buộc | Mô tả & Ràng buộc                                          |
  | :-------------- | :--------- | :--------: | :------------------------------------------------------------- |
  | `name`        | `string` |     -     | Ràng buộc: [minLen: 2, maxLen: 50, pattern:`^[A-Z0-9_]+$`] |
  | `description` | `string` |     -     | Ràng buộc: [minLen: 0, maxLen: 255]                          |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                              |
| :---------: | :------ | :----------- | :-------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`RoleDetailResponse`](#schema-roledetailresponse) |

---

##### `DELETE` /api/auth/admin/roles/

- **Tóm tắt**: Xóa vai trò động (không thể xóa vai trò hệ thống)
- **Operation ID**: `deleteRole`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên       | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :--------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `roleId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

##### `PUT` /api/auth/admin/roles//permissions

- **Tóm tắt**: Cập nhật danh sách quyền hạn cho một vai trò
- **Operation ID**: `setRolePermissions`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên       | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :--------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `roleId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`SetRolePermissionsRequest`](#schema-setrolepermissionsrequest)
  | Field             | Kiểu                    | Bắt buộc | Mô tả & Ràng buộc |
  | :---------------- | :----------------------- | :--------: | :-------------------- |
  | `permissionIds` | Array<`string (uuid)`> |     ✓     | -                     |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                              |
| :---------: | :------ | :----------- | :-------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`RoleDetailResponse`](#schema-roledetailresponse) |

---

##### `GET` /api/auth/admin/users//roles

- **Tóm tắt**: Lấy danh sách vai trò và quyền hiệu dụng của người dùng
- **Operation ID**: `getUserRolesAndPermissions`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên       | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :--------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `userId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                                                  |
| :---------: | :------ | :----------- | :---------------------------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`UserRolesPermissionsResponse`](#schema-userrolespermissionsresponse) |

---

##### `PUT` /api/auth/admin/users//roles

- **Tóm tắt**: Đồng bộ danh sách vai trò của người dùng
- **Operation ID**: `syncUserRoles`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên       | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :--------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `userId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`SyncUserRolesRequest`](#schema-syncuserrolesrequest)
  | Field     | Kiểu             | Bắt buộc | Mô tả & Ràng buộc      |
  | :-------- | :---------------- | :--------: | :------------------------- |
  | `roles` | Array<`string`> |     ✓     | Ràng buộc: [minItems: 1] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                            |
| :---------: | :------ | :----------- | :------------------------------------------------ |
|   `200`   | OK      | `*/*`      | [`AdminUserResponse`](#schema-adminuserresponse) |

---

### Admin Dashboard API

| Method  | Path                                | Mô tả                                                |    Auth    | Request Body | Response                                                    |
| :------ | :---------------------------------- | :----------------------------------------------------- | :--------: | :----------- | :---------------------------------------------------------- |
| `GET` | `/api/auth/admin/dashboard/stats` | Lấy dữ liệu thống kê tổng quan (Dashboard Stats) | `Bearer` | -            | [`AdminDashboardResponse`](#schema-admindashboardresponse) |

#### Chi tiết Endpoint trong Admin Dashboard API

##### `GET` /api/auth/admin/dashboard/stats

- **Tóm tắt**: Lấy dữ liệu thống kê tổng quan (Dashboard Stats)
- **Operation ID**: `getDashboardStats`
- **Xác thực (Auth)**: `Bearer`

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                                      |
| :---------: | :------ | :----------- | :---------------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`AdminDashboardResponse`](#schema-admindashboardresponse) |

---

### user-controller

| Method     | Path                                      | Mô tả               |    Auth    | Request Body                                              | Response                                                      |
| :--------- | :---------------------------------------- | :-------------------- | :--------: | :-------------------------------------------------------- | :------------------------------------------------------------ |
| `GET`    | `/api/users/me`                         | getMyProfile          | `Bearer` | -                                                         | [`UserProfileResponse`](#schema-userprofileresponse)         |
| `PATCH`  | `/api/users/me`                         | updateProfile         | `Bearer` | [`UpdateProfileRequest`](#schema-updateprofilerequest)   | [`UserProfileResponse`](#schema-userprofileresponse)         |
| `DELETE` | `/api/users/me/2fa/disable`             | disable2Fa            | `Bearer` | [`TwoFaDisableRequest`](#schema-twofadisablerequest)     | OK                                                            |
| `POST`   | `/api/users/me/2fa/enable`              | enable2Fa             | `Bearer` | [`TwoFaEnableRequest`](#schema-twofaenablerequest)       | [`TwoFaEnableResponse`](#schema-twofaenableresponse)         |
| `POST`   | `/api/users/me/2fa/setup`               | setup2Fa              | `Bearer` | -                                                         | [`TwoFaSetupResponse`](#schema-twofasetupresponse)           |
| `PUT`    | `/api/users/me/activity-status`         | updateActivityStatus  | `Bearer` | [`ActivityStatusRequest`](#schema-activitystatusrequest) | [`UserProfileResponse`](#schema-userprofileresponse)         |
| `GET`    | `/api/users/me/blocks`                  | getBlockedUsers       | `Bearer` | -                                                         | [`PageBlockedUserResponse`](#schema-pageblockeduserresponse) |
| `POST`   | `/api/users/me/email`                   | requestEmailChange    | `Bearer` | [`ChangeEmailRequest`](#schema-changeemailrequest)       | OK                                                            |
| `POST`   | `/api/users/me/heartbeat`               | heartbeat             | `Bearer` | -                                                         | OK                                                            |
| `POST`   | `/api/users/me/note`                    | upsertNote            | `Bearer` | [`NoteRequest`](#schema-noterequest)                     | [`NoteResponse`](#schema-noteresponse)                       |
| `DELETE` | `/api/users/me/note`                    | deleteNote            | `Bearer` | -                                                         | OK                                                            |
| `PUT`    | `/api/users/me/password`                | changePassword        | `Bearer` | [`ChangePasswordRequest`](#schema-changepasswordrequest) | OK                                                            |
| `PUT`    | `/api/users/me/privacy`                 | updatePrivacy         | `Bearer` | [`PrivacySettingRequest`](#schema-privacysettingrequest) | [`UserProfileResponse`](#schema-userprofileresponse)         |
| `POST`   | `/api/users/me/send-verification-email` | sendVerificationEmail | `Bearer` | -                                                         | OK                                                            |
| `GET`    | `/api/users/search`                     | searchUsers           | `Bearer` | -                                                         | [`PageUserProfileResponse`](#schema-pageuserprofileresponse) |
| `POST`   | `/api/users/{targetId}/block`           | blockUser             | `Bearer` | -                                                         | OK                                                            |
| `DELETE` | `/api/users/{targetId}/block`           | unblockUser           | `Bearer` | -                                                         | OK                                                            |
| `GET`    | `/api/users/{userId}/note`              | getNote               | `Bearer` | -                                                         | [`NoteResponse`](#schema-noteresponse)                       |
| `GET`    | `/api/users/{username}`                 | getPublicProfile      | `Bearer` | -                                                         | [`UserProfileResponse`](#schema-userprofileresponse)         |

#### Chi tiết Endpoint trong user-controller

##### `GET` /api/users/me

- **Operation ID**: `getMyProfile`
- **Xác thực (Auth)**: `Bearer`

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                                |
| :---------: | :------ | :----------- | :---------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`UserProfileResponse`](#schema-userprofileresponse) |

---

##### `PATCH` /api/users/me

- **Operation ID**: `updateProfile`
- **Xác thực (Auth)**: `Bearer`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`UpdateProfileRequest`](#schema-updateprofilerequest)
  | Field           | Kiểu      | Bắt buộc | Mô tả & Ràng buộc                                              |
  | :-------------- | :--------- | :--------: | :----------------------------------------------------------------- |
  | `displayName` | `string` |     -     | Ràng buộc: [minLen: 0, maxLen: 100]                              |
  | `avatarUrl`   | `string` |     -     | Ràng buộc: [minLen: 0, maxLen: 500]                              |
  | `bio`         | `string` |     -     | Ràng buộc: [minLen: 0, maxLen: 500]                              |
  | `website`     | `string` |     -     | Ràng buộc: [minLen: 0, maxLen: 500, pattern:`^$\|^https?://.+`] |
  | `pronouns`    | `string` |     -     | Ràng buộc: [minLen: 0, maxLen: 50]                               |
  | `category`    | `string` |     -     | Ràng buộc: [minLen: 0, maxLen: 100]                              |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                                |
| :---------: | :------ | :----------- | :---------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`UserProfileResponse`](#schema-userprofileresponse) |

---

##### `DELETE` /api/users/me/2fa/disable

- **Operation ID**: `disable2Fa`
- **Xác thực (Auth)**: `Bearer`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`TwoFaDisableRequest`](#schema-twofadisablerequest)
  | Field          | Kiểu      | Bắt buộc | Mô tả & Ràng buộc |
  | :------------- | :--------- | :--------: | :-------------------- |
  | `totpCode`   | `string` |     -     | -                     |
  | `backupCode` | `string` |     -     | -                     |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

##### `POST` /api/users/me/2fa/enable

- **Operation ID**: `enable2Fa`
- **Xác thực (Auth)**: `Bearer`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`TwoFaEnableRequest`](#schema-twofaenablerequest)
  | Field        | Kiểu      | Bắt buộc | Mô tả & Ràng buộc                         |
  | :----------- | :--------- | :--------: | :-------------------------------------------- |
  | `totpCode` | `string` |     ✓     | Ràng buộc: [minLen: 1, pattern:`^\d{6}$`] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                                |
| :---------: | :------ | :----------- | :---------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`TwoFaEnableResponse`](#schema-twofaenableresponse) |

---

##### `POST` /api/users/me/2fa/setup

- **Operation ID**: `setup2Fa`
- **Xác thực (Auth)**: `Bearer`

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                              |
| :---------: | :------ | :----------- | :-------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`TwoFaSetupResponse`](#schema-twofasetupresponse) |

---

##### `PUT` /api/users/me/activity-status

- **Operation ID**: `updateActivityStatus`
- **Xác thực (Auth)**: `Bearer`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`ActivityStatusRequest`](#schema-activitystatusrequest)
  | Field                  | Kiểu       | Bắt buộc | Mô tả & Ràng buộc |
  | :--------------------- | :---------- | :--------: | :-------------------- |
  | `showActivityStatus` | `boolean` |     ✓     | -                     |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                                |
| :---------: | :------ | :----------- | :---------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`UserProfileResponse`](#schema-userprofileresponse) |

---

##### `GET` /api/users/me/blocks

- **Operation ID**: `getBlockedUsers`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên     | Vị trí | Kiểu               | Bắt buộc | Mô tả | Mặc định |
| :------- | :-------: | :------------------ | :--------: | :------ | :---------- |
| `page` | `query` | `integer (int32)` |   Không   | -       | `0`       |
| `size` | `query` | `integer (int32)` |   Không   | -       | `20`      |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                                        |
| :---------: | :------ | :----------- | :------------------------------------------------------------ |
|   `200`   | OK      | `*/*`      | [`PageBlockedUserResponse`](#schema-pageblockeduserresponse) |

---

##### `POST` /api/users/me/email

- **Operation ID**: `requestEmailChange`
- **Xác thực (Auth)**: `Bearer`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`ChangeEmailRequest`](#schema-changeemailrequest)
  | Field               | Kiểu              | Bắt buộc | Mô tả & Ràng buộc    |
  | :------------------ | :----------------- | :--------: | :----------------------- |
  | `newEmail`        | `string (email)` |     ✓     | Ràng buộc: [minLen: 1] |
  | `currentPassword` | `string`         |     ✓     | Ràng buộc: [minLen: 1] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

##### `POST` /api/users/me/heartbeat

- **Operation ID**: `heartbeat`
- **Xác thực (Auth)**: `Bearer`

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

##### `POST` /api/users/me/note

- **Operation ID**: `upsertNote`
- **Xác thực (Auth)**: `Bearer`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`NoteRequest`](#schema-noterequest)
  | Field       | Kiểu      | Bắt buộc | Mô tả & Ràng buộc                |
  | :---------- | :--------- | :--------: | :----------------------------------- |
  | `content` | `string` |     ✓     | Ràng buộc: [minLen: 0, maxLen: 60] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                  |
| :---------: | :------ | :----------- | :-------------------------------------- |
|   `200`   | OK      | `*/*`      | [`NoteResponse`](#schema-noteresponse) |

---

##### `DELETE` /api/users/me/note

- **Operation ID**: `deleteNote`
- **Xác thực (Auth)**: `Bearer`

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

##### `PUT` /api/users/me/password

- **Operation ID**: `changePassword`
- **Xác thực (Auth)**: `Bearer`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`ChangePasswordRequest`](#schema-changepasswordrequest)
  | Field               | Kiểu      | Bắt buộc | Mô tả & Ràng buộc                 |
  | :------------------ | :--------- | :--------: | :------------------------------------ |
  | `currentPassword` | `string` |     ✓     | Ràng buộc: [minLen: 1]              |
  | `newPassword`     | `string` |     ✓     | Ràng buộc: [minLen: 8, maxLen: 128] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

##### `PUT` /api/users/me/privacy

- **Operation ID**: `updatePrivacy`
- **Xác thực (Auth)**: `Bearer`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`PrivacySettingRequest`](#schema-privacysettingrequest)
  | Field              | Kiểu       | Bắt buộc | Mô tả & Ràng buộc |
  | :----------------- | :---------- | :--------: | :-------------------- |
  | `privateAccount` | `boolean` |     ✓     | -                     |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                                |
| :---------: | :------ | :----------- | :---------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`UserProfileResponse`](#schema-userprofileresponse) |

---

##### `POST` /api/users/me/send-verification-email

- **Operation ID**: `sendVerificationEmail`
- **Xác thực (Auth)**: `Bearer`

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

##### `GET` /api/users/search

- **Operation ID**: `searchUsers`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên     | Vị trí | Kiểu               |  Bắt buộc  | Mô tả | Mặc định |
| :------- | :-------: | :------------------ | :-----------: | :------ | :---------- |
| `q`    | `query` | `string`          | **Có** | -       | -           |
| `page` | `query` | `integer (int32)` |    Không    | -       | `0`       |
| `size` | `query` | `integer (int32)` |    Không    | -       | `20`      |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                                        |
| :---------: | :------ | :----------- | :------------------------------------------------------------ |
|   `200`   | OK      | `*/*`      | [`PageUserProfileResponse`](#schema-pageuserprofileresponse) |

---

##### `POST` /api/users//block

- **Operation ID**: `blockUser`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên         | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :----------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `targetId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

##### `DELETE` /api/users//block

- **Operation ID**: `unblockUser`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên         | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :----------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `targetId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

##### `GET` /api/users//note

- **Operation ID**: `getNote`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên       | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :--------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `userId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                  |
| :---------: | :------ | :----------- | :-------------------------------------- |
|   `200`   | OK      | `*/*`      | [`NoteResponse`](#schema-noteresponse) |

---

##### `GET` /api/users/

- **Operation ID**: `getPublicProfile`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên         | Vị trí | Kiểu      |  Bắt buộc  | Mô tả | Mặc định |
| :----------- | :------: | :--------- | :-----------: | :------ | :---------- |
| `username` | `path` | `string` | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                                |
| :---------: | :------ | :----------- | :---------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`UserProfileResponse`](#schema-userprofileresponse) |

---

### admin-controller

| Method     | Path                                            | Mô tả        |    Auth    | Request Body                                              | Response                                                  |
| :--------- | :---------------------------------------------- | :------------- | :--------: | :-------------------------------------------------------- | :-------------------------------------------------------- |
| `POST`   | `/api/auth/admin/bootstrap`                   | bootstrapAdmin | `Bearer` | [`BootstrapAdminRequest`](#schema-bootstrapadminrequest) | [`AdminUserResponse`](#schema-adminuserresponse)         |
| `GET`    | `/api/auth/admin/users`                       | getUsers       | `Bearer` | -                                                         | [`PageAdminUserResponse`](#schema-pageadminuserresponse) |
| `GET`    | `/api/auth/admin/users/{userId}`              | getUser        | `Bearer` | -                                                         | [`AdminUserResponse`](#schema-adminuserresponse)         |
| `POST`   | `/api/auth/admin/users/{userId}/ban`          | banUser        | `Bearer` | [`BanUserRequest`](#schema-banuserrequest)               | [`AdminUserResponse`](#schema-adminuserresponse)         |
| `POST`   | `/api/auth/admin/users/{userId}/roles`        | assignRole     | `Bearer` | [`AssignRoleRequest`](#schema-assignrolerequest)         | [`AdminUserResponse`](#schema-adminuserresponse)         |
| `DELETE` | `/api/auth/admin/users/{userId}/roles/{role}` | removeRole     | `Bearer` | -                                                         | [`AdminUserResponse`](#schema-adminuserresponse)         |
| `POST`   | `/api/auth/admin/users/{userId}/unban`        | unbanUser      | `Bearer` | -                                                         | [`AdminUserResponse`](#schema-adminuserresponse)         |

#### Chi tiết Endpoint trong admin-controller

##### `POST` /api/auth/admin/bootstrap

- **Operation ID**: `bootstrapAdmin`
- **Xác thực (Auth)**: `Bearer`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`BootstrapAdminRequest`](#schema-bootstrapadminrequest)
  | Field               | Kiểu      | Bắt buộc | Mô tả & Ràng buộc    |
  | :------------------ | :--------- | :--------: | :----------------------- |
  | `usernameOrEmail` | `string` |     ✓     | Ràng buộc: [minLen: 1] |
  | `secretKey`       | `string` |     ✓     | Ràng buộc: [minLen: 1] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                            |
| :---------: | :------ | :----------- | :------------------------------------------------ |
|   `200`   | OK      | `*/*`      | [`AdminUserResponse`](#schema-adminuserresponse) |

---

##### `GET` /api/auth/admin/users

- **Operation ID**: `getUsers`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên     | Vị trí | Kiểu               | Bắt buộc | Mô tả | Mặc định |
| :------- | :-------: | :------------------ | :--------: | :------ | :---------- |
| `page` | `query` | `integer (int32)` |   Không   | -       | `0`       |
| `size` | `query` | `integer (int32)` |   Không   | -       | `20`      |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                                    |
| :---------: | :------ | :----------- | :-------------------------------------------------------- |
|   `200`   | OK      | `*/*`      | [`PageAdminUserResponse`](#schema-pageadminuserresponse) |

---

##### `GET` /api/auth/admin/users/

- **Operation ID**: `getUser`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên       | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :--------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `userId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                            |
| :---------: | :------ | :----------- | :------------------------------------------------ |
|   `200`   | OK      | `*/*`      | [`AdminUserResponse`](#schema-adminuserresponse) |

---

##### `POST` /api/auth/admin/users//ban

- **Operation ID**: `banUser`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên       | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :--------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `userId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`BanUserRequest`](#schema-banuserrequest)
  | Field      | Kiểu      | Bắt buộc | Mô tả & Ràng buộc                 |
  | :--------- | :--------- | :--------: | :------------------------------------ |
  | `reason` | `string` |     ✓     | Ràng buộc: [minLen: 0, maxLen: 255] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                            |
| :---------: | :------ | :----------- | :------------------------------------------------ |
|   `200`   | OK      | `*/*`      | [`AdminUserResponse`](#schema-adminuserresponse) |

---

##### `POST` /api/auth/admin/users//roles

- **Operation ID**: `assignRole`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên       | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :--------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `userId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`AssignRoleRequest`](#schema-assignrolerequest)
  | Field    | Kiểu      | Bắt buộc | Mô tả & Ràng buộc    |
  | :------- | :--------- | :--------: | :----------------------- |
  | `role` | `string` |     ✓     | Ràng buộc: [minLen: 1] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                            |
| :---------: | :------ | :----------- | :------------------------------------------------ |
|   `200`   | OK      | `*/*`      | [`AdminUserResponse`](#schema-adminuserresponse) |

---

##### `DELETE` /api/auth/admin/users//roles/

- **Operation ID**: `removeRole`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên       | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :--------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `userId` | `path` | `string (uuid)` | **Có** | -       | -           |
| `role`   | `path` | `string`        | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                            |
| :---------: | :------ | :----------- | :------------------------------------------------ |
|   `200`   | OK      | `*/*`      | [`AdminUserResponse`](#schema-adminuserresponse) |

---

##### `POST` /api/auth/admin/users//unban

- **Operation ID**: `unbanUser`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên       | Vị trí | Kiểu             |  Bắt buộc  | Mô tả | Mặc định |
| :--------- | :------: | :---------------- | :-----------: | :------ | :---------- |
| `userId` | `path` | `string (uuid)` | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                            |
| :---------: | :------ | :----------- | :------------------------------------------------ |
|   `200`   | OK      | `*/*`      | [`AdminUserResponse`](#schema-adminuserresponse) |

---

### auth-controller

| Method   | Path                          | Mô tả        |    Auth    | Request Body                                              | Response                                    |
| :------- | :---------------------------- | :------------- | :--------: | :-------------------------------------------------------- | :------------------------------------------ |
| `POST` | `/api/auth/admin/login`     | adminLogin     | `Bearer` | [`LoginRequest`](#schema-loginrequest)                   | [`AuthResponse`](#schema-authresponse)     |
| `POST` | `/api/auth/forgot-password` | forgotPassword |   `No`   | [`ForgotPasswordRequest`](#schema-forgotpasswordrequest) | OK                                          |
| `POST` | `/api/auth/login`           | login          |   `No`   | [`LoginRequest`](#schema-loginrequest)                   | [`AuthResponse`](#schema-authresponse)     |
| `POST` | `/api/auth/login/2fa`       | loginWith2Fa   | `Bearer` | [`TwoFaLoginRequest`](#schema-twofaloginrequest)         | [`AuthResponse`](#schema-authresponse)     |
| `POST` | `/api/auth/logout`          | logout         | `Bearer` | [`RefreshTokenRequest`](#schema-refreshtokenrequest)     | OK                                          |
| `GET`  | `/api/auth/me`              | getCurrentUser | `Bearer` | -                                                         | [`UserMeResponse`](#schema-usermeresponse) |
| `POST` | `/api/auth/refresh`         | refresh        |   `No`   | [`RefreshTokenRequest`](#schema-refreshtokenrequest)     | [`AuthResponse`](#schema-authresponse)     |
| `POST` | `/api/auth/register`        | register       |   `No`   | [`RegisterRequest`](#schema-registerrequest)             | [`AuthResponse`](#schema-authresponse)     |
| `POST` | `/api/auth/reset-password`  | resetPassword  |   `No`   | [`ResetPasswordRequest`](#schema-resetpasswordrequest)   | OK                                          |
| `GET`  | `/api/auth/user`            | getUserInfo    | `Bearer` | -                                                         | [`UserDto`](#schema-userdto)               |
| `POST` | `/api/auth/verify`          | verify         |   `No`   | -                                                         | `boolean`                                 |
| `GET`  | `/api/auth/verify-email`    | verifyEmail    | `Bearer` | -                                                         | OK                                          |

#### Chi tiết Endpoint trong auth-controller

##### `POST` /api/auth/admin/login

- **Operation ID**: `adminLogin`
- **Xác thực (Auth)**: `Bearer`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`LoginRequest`](#schema-loginrequest)
  | Field        | Kiểu              | Bắt buộc | Mô tả & Ràng buộc    |
  | :----------- | :----------------- | :--------: | :----------------------- |
  | `email`    | `string (email)` |     ✓     | Ràng buộc: [minLen: 1] |
  | `password` | `string`         |     ✓     | Ràng buộc: [minLen: 1] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                  |
| :---------: | :------ | :----------- | :-------------------------------------- |
|   `200`   | OK      | `*/*`      | [`AuthResponse`](#schema-authresponse) |

---

##### `POST` /api/auth/forgot-password

- **Operation ID**: `forgotPassword`
- **Xác thực (Auth)**: `No`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`ForgotPasswordRequest`](#schema-forgotpasswordrequest)
  | Field     | Kiểu              | Bắt buộc | Mô tả & Ràng buộc    |
  | :-------- | :----------------- | :--------: | :----------------------- |
  | `email` | `string (email)` |     ✓     | Ràng buộc: [minLen: 1] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

##### `POST` /api/auth/login

- **Operation ID**: `login`
- **Xác thực (Auth)**: `No`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`LoginRequest`](#schema-loginrequest)
  | Field        | Kiểu              | Bắt buộc | Mô tả & Ràng buộc    |
  | :----------- | :----------------- | :--------: | :----------------------- |
  | `email`    | `string (email)` |     ✓     | Ràng buộc: [minLen: 1] |
  | `password` | `string`         |     ✓     | Ràng buộc: [minLen: 1] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                  |
| :---------: | :------ | :----------- | :-------------------------------------- |
|   `200`   | OK      | `*/*`      | [`AuthResponse`](#schema-authresponse) |

---

##### `POST` /api/auth/login/2fa

- **Operation ID**: `loginWith2Fa`
- **Xác thực (Auth)**: `Bearer`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`TwoFaLoginRequest`](#schema-twofaloginrequest)
  | Field          | Kiểu      | Bắt buộc | Mô tả & Ràng buộc              |
  | :------------- | :--------- | :--------: | :--------------------------------- |
  | `tempToken`  | `string` |     ✓     | Ràng buộc: [minLen: 1]           |
  | `totpCode`   | `string` |     -     | Ràng buộc: [pattern:`^\d{6}$`] |
  | `backupCode` | `string` |     -     | -                                  |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                  |
| :---------: | :------ | :----------- | :-------------------------------------- |
|   `200`   | OK      | `*/*`      | [`AuthResponse`](#schema-authresponse) |

---

##### `POST` /api/auth/logout

- **Operation ID**: `logout`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên              |  Vị trí  | Kiểu      | Bắt buộc | Mô tả | Mặc định |
| :---------------- | :--------: | :--------- | :--------: | :------ | :---------- |
| `Authorization` | `header` | `string` |   Không   | -       | -           |

**Request Body:**

- Bắt buộc: Tùy chọn
- Content-Type: `application/json`
- Model Schema: [`RefreshTokenRequest`](#schema-refreshtokenrequest)
  | Field            | Kiểu      | Bắt buộc | Mô tả & Ràng buộc    |
  | :--------------- | :--------- | :--------: | :----------------------- |
  | `refreshToken` | `string` |     ✓     | Ràng buộc: [minLen: 1] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

##### `GET` /api/auth/me

- **Operation ID**: `getCurrentUser`
- **Xác thực (Auth)**: `Bearer`

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                      |
| :---------: | :------ | :----------- | :------------------------------------------ |
|   `200`   | OK      | `*/*`      | [`UserMeResponse`](#schema-usermeresponse) |

---

##### `POST` /api/auth/refresh

- **Operation ID**: `refresh`
- **Xác thực (Auth)**: `No`

**Request Body:**

- Bắt buộc: Tùy chọn
- Content-Type: `application/json`
- Model Schema: [`RefreshTokenRequest`](#schema-refreshtokenrequest)
  | Field            | Kiểu      | Bắt buộc | Mô tả & Ràng buộc    |
  | :--------------- | :--------- | :--------: | :----------------------- |
  | `refreshToken` | `string` |     ✓     | Ràng buộc: [minLen: 1] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                  |
| :---------: | :------ | :----------- | :-------------------------------------- |
|   `200`   | OK      | `*/*`      | [`AuthResponse`](#schema-authresponse) |

---

##### `POST` /api/auth/register

- **Operation ID**: `register`
- **Xác thực (Auth)**: `No`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`RegisterRequest`](#schema-registerrequest)
  | Field           | Kiểu              | Bắt buộc | Mô tả & Ràng buộc                                              |
  | :-------------- | :----------------- | :--------: | :----------------------------------------------------------------- |
  | `username`    | `string`         |     ✓     | Ràng buộc: [minLen: 3, maxLen: 50, pattern:`^[a-zA-Z0-9._]+$`] |
  | `email`       | `string (email)` |     ✓     | Ràng buộc: [minLen: 0, maxLen: 255]                              |
  | `password`    | `string`         |     ✓     | Ràng buộc: [minLen: 8, maxLen: 128]                              |
  | `displayName` | `string`         |     -     | Ràng buộc: [minLen: 0, maxLen: 100]                              |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                                  |
| :---------: | :------ | :----------- | :-------------------------------------- |
|   `200`   | OK      | `*/*`      | [`AuthResponse`](#schema-authresponse) |

---

##### `POST` /api/auth/reset-password

- **Operation ID**: `resetPassword`
- **Xác thực (Auth)**: `No`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`ResetPasswordRequest`](#schema-resetpasswordrequest)
  | Field           | Kiểu      | Bắt buộc | Mô tả & Ràng buộc                 |
  | :-------------- | :--------- | :--------: | :------------------------------------ |
  | `token`       | `string` |     ✓     | Ràng buộc: [minLen: 1]              |
  | `newPassword` | `string` |     ✓     | Ràng buộc: [minLen: 8, maxLen: 128] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

##### `GET` /api/auth/user

- **Operation ID**: `getUserInfo`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên              |  Vị trí  | Kiểu      |  Bắt buộc  | Mô tả | Mặc định |
| :---------------- | :--------: | :--------- | :-----------: | :------ | :---------- |
| `Authorization` | `header` | `string` | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema                        |
| :---------: | :------ | :----------- | :---------------------------- |
|   `200`   | OK      | `*/*`      | [`UserDto`](#schema-userdto) |

---

##### `POST` /api/auth/verify

- **Operation ID**: `verify`
- **Xác thực (Auth)**: `No`

**Parameters:**

| Tên              |  Vị trí  | Kiểu      |  Bắt buộc  | Mô tả | Mặc định |
| :---------------- | :--------: | :--------- | :-----------: | :------ | :---------- |
| `Authorization` | `header` | `string` | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema      |
| :---------: | :------ | :----------- | :---------- |
|   `200`   | OK      | `*/*`      | `boolean` |

---

##### `GET` /api/auth/verify-email

- **Operation ID**: `verifyEmail`
- **Xác thực (Auth)**: `Bearer`

**Parameters:**

| Tên      | Vị trí | Kiểu      |  Bắt buộc  | Mô tả | Mặc định |
| :-------- | :-------: | :--------- | :-----------: | :------ | :---------- |
| `token` | `query` | `string` | **Có** | -       | -           |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema          |
| :---------: | :------ | :----------- | :-------------- |
|   `200`   | OK      | -            | Không có body |

---

## Schemas (Chi tiết Models)

> Danh sách toàn bộ các Schema / Data Transfer Object (DTO) được sử dụng trong request/response của service.

### <a id="schema-activitystatusrequest"></a> `ActivityStatusRequest`

- **Kiểu**: `object`

| Thuộc tính           | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--------------------- | :-------------- | :--------: | :-------------------- |
| `showActivityStatus` | `boolean`     |     ✓     | -                     |

---

### <a id="schema-admindashboardresponse"></a> `AdminDashboardResponse`

- **Kiểu**: `object`

| Thuộc tính           | Kiểu dữ liệu                                          | Bắt buộc | Mô tả & Ràng buộc |
| :--------------------- | :------------------------------------------------------- | :--------: | :-------------------- |
| `totalUsers`         | `integer (int64)`                                      |     -     | -                     |
| `activeUsers`        | `integer (int64)`                                      |     -     | -                     |
| `bannedUsers`        | `integer (int64)`                                      |     -     | -                     |
| `newUsersToday`      | `integer (int64)`                                      |     -     | -                     |
| `newUsersThisWeek`   | `integer (int64)`                                      |     -     | -                     |
| `emailVerifiedUsers` | `integer (int64)`                                      |     -     | -                     |
| `twoFaEnabledUsers`  | `integer (int64)`                                      |     -     | -                     |
| `recentUsers`        | Array<[`AdminUserResponse`](#schema-adminuserresponse)> |     -     | -                     |

---

### <a id="schema-adminuserresponse"></a> `AdminUserResponse`

- **Kiểu**: `object`

| Thuộc tính       | Kiểu dữ liệu        | Bắt buộc | Mô tả & Ràng buộc |
| :----------------- | :--------------------- | :--------: | :-------------------- |
| `id`             | `string (uuid)`      |     -     | -                     |
| `username`       | `string`             |     -     | -                     |
| `email`          | `string`             |     -     | -                     |
| `displayName`    | `string`             |     -     | -                     |
| `avatarUrl`      | `string`             |     -     | -                     |
| `privateAccount` | `boolean`            |     -     | -                     |
| `emailVerified`  | `boolean`            |     -     | -                     |
| `twoFaEnabled`   | `boolean`            |     -     | -                     |
| `banned`         | `boolean`            |     -     | -                     |
| `bannedAt`       | `string (date-time)` |     -     | -                     |
| `banReason`      | `string`             |     -     | -                     |
| `lastSeenAt`     | `string (date-time)` |     -     | -                     |
| `createdAt`      | `string (date-time)` |     -     | -                     |
| `role`           | `string`             |     -     | -                     |
| `roles`          | Array<`string`>      |     -     | -                     |

---

### <a id="schema-assignrolerequest"></a> `AssignRoleRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc    |
| :----------- | :-------------- | :--------: | :----------------------- |
| `role`     | `string`      |     ✓     | Ràng buộc: [minLen: 1] |

---

### <a id="schema-authresponse"></a> `AuthResponse`

- **Kiểu**: `object`

| Thuộc tính      | Kiểu dữ liệu               | Bắt buộc | Mô tả & Ràng buộc |
| :---------------- | :---------------------------- | :--------: | :-------------------- |
| `accessToken`   | `string`                    |     -     | -                     |
| `refreshToken`  | `string`                    |     -     | -                     |
| `tokenType`     | `string`                    |     -     | -                     |
| `expiresIn`     | `integer (int64)`           |     -     | -                     |
| `user`          | [`UserDto`](#schema-userdto) |     -     | -                     |
| `requiresTwoFa` | `boolean`                   |     -     | -                     |
| `tempToken`     | `string`                    |     -     | -                     |

---

### <a id="schema-banuserrequest"></a> `BanUserRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc                 |
| :----------- | :-------------- | :--------: | :------------------------------------ |
| `reason`   | `string`      |     ✓     | Ràng buộc: [minLen: 0, maxLen: 255] |

---

### <a id="schema-blockeduserresponse"></a> `BlockedUserResponse`

- **Kiểu**: `object`

| Thuộc tính    | Kiểu dữ liệu        | Bắt buộc | Mô tả & Ràng buộc |
| :-------------- | :--------------------- | :--------: | :-------------------- |
| `userId`      | `string`             |     -     | -                     |
| `username`    | `string`             |     -     | -                     |
| `displayName` | `string`             |     -     | -                     |
| `avatarUrl`   | `string`             |     -     | -                     |
| `blockedAt`   | `string (date-time)` |     -     | -                     |

---

### <a id="schema-bootstrapadminrequest"></a> `BootstrapAdminRequest`

- **Kiểu**: `object`

| Thuộc tính        | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc    |
| :------------------ | :-------------- | :--------: | :----------------------- |
| `usernameOrEmail` | `string`      |     ✓     | Ràng buộc: [minLen: 1] |
| `secretKey`       | `string`      |     ✓     | Ràng buộc: [minLen: 1] |

---

### <a id="schema-changeemailrequest"></a> `ChangeEmailRequest`

- **Kiểu**: `object`

| Thuộc tính        | Kiểu dữ liệu    | Bắt buộc | Mô tả & Ràng buộc    |
| :------------------ | :----------------- | :--------: | :----------------------- |
| `newEmail`        | `string (email)` |     ✓     | Ràng buộc: [minLen: 1] |
| `currentPassword` | `string`         |     ✓     | Ràng buộc: [minLen: 1] |

---

### <a id="schema-changepasswordrequest"></a> `ChangePasswordRequest`

- **Kiểu**: `object`

| Thuộc tính        | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc                 |
| :------------------ | :-------------- | :--------: | :------------------------------------ |
| `currentPassword` | `string`      |     ✓     | Ràng buộc: [minLen: 1]              |
| `newPassword`     | `string`      |     ✓     | Ràng buộc: [minLen: 8, maxLen: 128] |

---

### <a id="schema-createrolerequest"></a> `CreateRoleRequest`

- **Kiểu**: `object`

| Thuộc tính      | Kiểu dữ liệu          | Bắt buộc | Mô tả & Ràng buộc                                          |
| :---------------- | :----------------------- | :--------: | :------------------------------------------------------------- |
| `name`          | `string`               |     ✓     | Ràng buộc: [minLen: 2, maxLen: 50, pattern:`^[A-Z0-9_]+$`] |
| `description`   | `string`               |     -     | Ràng buộc: [minLen: 0, maxLen: 255]                          |
| `permissionIds` | Array<`string (uuid)`> |     -     | -                                                              |

---

### <a id="schema-forgotpasswordrequest"></a> `ForgotPasswordRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu    | Bắt buộc | Mô tả & Ràng buộc    |
| :----------- | :----------------- | :--------: | :----------------------- |
| `email`    | `string (email)` |     ✓     | Ràng buộc: [minLen: 1] |

---

### <a id="schema-loginrequest"></a> `LoginRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu    | Bắt buộc | Mô tả & Ràng buộc    |
| :----------- | :----------------- | :--------: | :----------------------- |
| `email`    | `string (email)` |     ✓     | Ràng buộc: [minLen: 1] |
| `password` | `string`         |     ✓     | Ràng buộc: [minLen: 1] |

---

### <a id="schema-noterequest"></a> `NoteRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc                |
| :----------- | :-------------- | :--------: | :----------------------------------- |
| `content`  | `string`      |     ✓     | Ràng buộc: [minLen: 0, maxLen: 60] |

---

### <a id="schema-noteresponse"></a> `NoteResponse`

- **Kiểu**: `object`

| Thuộc tính  | Kiểu dữ liệu        | Bắt buộc | Mô tả & Ràng buộc |
| :------------ | :--------------------- | :--------: | :-------------------- |
| `id`        | `string`             |     -     | -                     |
| `content`   | `string`             |     -     | -                     |
| `createdAt` | `string (date-time)` |     -     | -                     |
| `expiresAt` | `string (date-time)` |     -     | -                     |

---

### <a id="schema-pageadminuserresponse"></a> `PageAdminUserResponse`

- **Kiểu**: `object`

| Thuộc tính         | Kiểu dữ liệu                                          | Bắt buộc | Mô tả & Ràng buộc |
| :------------------- | :------------------------------------------------------- | :--------: | :-------------------- |
| `totalPages`       | `integer (int32)`                                      |     -     | -                     |
| `totalElements`    | `integer (int64)`                                      |     -     | -                     |
| `size`             | `integer (int32)`                                      |     -     | -                     |
| `content`          | Array<[`AdminUserResponse`](#schema-adminuserresponse)> |     -     | -                     |
| `number`           | `integer (int32)`                                      |     -     | -                     |
| `sort`             | [`SortObject`](#schema-sortobject)                      |     -     | -                     |
| `pageable`         | [`PageableObject`](#schema-pageableobject)              |     -     | -                     |
| `numberOfElements` | `integer (int32)`                                      |     -     | -                     |
| `first`            | `boolean`                                              |     -     | -                     |
| `last`             | `boolean`                                              |     -     | -                     |
| `empty`            | `boolean`                                              |     -     | -                     |

---

### <a id="schema-pageblockeduserresponse"></a> `PageBlockedUserResponse`

- **Kiểu**: `object`

| Thuộc tính         | Kiểu dữ liệu                                              | Bắt buộc | Mô tả & Ràng buộc |
| :------------------- | :----------------------------------------------------------- | :--------: | :-------------------- |
| `totalPages`       | `integer (int32)`                                          |     -     | -                     |
| `totalElements`    | `integer (int64)`                                          |     -     | -                     |
| `size`             | `integer (int32)`                                          |     -     | -                     |
| `content`          | Array<[`BlockedUserResponse`](#schema-blockeduserresponse)> |     -     | -                     |
| `number`           | `integer (int32)`                                          |     -     | -                     |
| `sort`             | [`SortObject`](#schema-sortobject)                          |     -     | -                     |
| `pageable`         | [`PageableObject`](#schema-pageableobject)                  |     -     | -                     |
| `numberOfElements` | `integer (int32)`                                          |     -     | -                     |
| `first`            | `boolean`                                                  |     -     | -                     |
| `last`             | `boolean`                                                  |     -     | -                     |
| `empty`            | `boolean`                                                  |     -     | -                     |

---

### <a id="schema-pageuserprofileresponse"></a> `PageUserProfileResponse`

- **Kiểu**: `object`

| Thuộc tính         | Kiểu dữ liệu                                              | Bắt buộc | Mô tả & Ràng buộc |
| :------------------- | :----------------------------------------------------------- | :--------: | :-------------------- |
| `totalPages`       | `integer (int32)`                                          |     -     | -                     |
| `totalElements`    | `integer (int64)`                                          |     -     | -                     |
| `size`             | `integer (int32)`                                          |     -     | -                     |
| `content`          | Array<[`UserProfileResponse`](#schema-userprofileresponse)> |     -     | -                     |
| `number`           | `integer (int32)`                                          |     -     | -                     |
| `sort`             | [`SortObject`](#schema-sortobject)                          |     -     | -                     |
| `pageable`         | [`PageableObject`](#schema-pageableobject)                  |     -     | -                     |
| `numberOfElements` | `integer (int32)`                                          |     -     | -                     |
| `first`            | `boolean`                                                  |     -     | -                     |
| `last`             | `boolean`                                                  |     -     | -                     |
| `empty`            | `boolean`                                                  |     -     | -                     |

---

### <a id="schema-pageableobject"></a> `PageableObject`

- **Kiểu**: `object`

| Thuộc tính   | Kiểu dữ liệu                     | Bắt buộc | Mô tả & Ràng buộc |
| :------------- | :---------------------------------- | :--------: | :-------------------- |
| `pageNumber` | `integer (int32)`                 |     -     | -                     |
| `unpaged`    | `boolean`                         |     -     | -                     |
| `paged`      | `boolean`                         |     -     | -                     |
| `pageSize`   | `integer (int32)`                 |     -     | -                     |
| `offset`     | `integer (int64)`                 |     -     | -                     |
| `sort`       | [`SortObject`](#schema-sortobject) |     -     | -                     |

---

### <a id="schema-permissionresponse"></a> `PermissionResponse`

- **Kiểu**: `object`

| Thuộc tính    | Kiểu dữ liệu   | Bắt buộc | Mô tả & Ràng buộc |
| :-------------- | :---------------- | :--------: | :-------------------- |
| `id`          | `string (uuid)` |     -     | -                     |
| `name`        | `string`        |     -     | -                     |
| `category`    | `string`        |     -     | -                     |
| `description` | `string`        |     -     | -                     |

---

### <a id="schema-privacysettingrequest"></a> `PrivacySettingRequest`

- **Kiểu**: `object`

| Thuộc tính       | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :----------------- | :-------------- | :--------: | :-------------------- |
| `privateAccount` | `boolean`     |     ✓     | -                     |

---

### <a id="schema-refreshtokenrequest"></a> `RefreshTokenRequest`

- **Kiểu**: `object`

| Thuộc tính     | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc    |
| :--------------- | :-------------- | :--------: | :----------------------- |
| `refreshToken` | `string`      |     ✓     | Ràng buộc: [minLen: 1] |

---

### <a id="schema-registerrequest"></a> `RegisterRequest`

- **Kiểu**: `object`

| Thuộc tính    | Kiểu dữ liệu    | Bắt buộc | Mô tả & Ràng buộc                                              |
| :-------------- | :----------------- | :--------: | :----------------------------------------------------------------- |
| `username`    | `string`         |     ✓     | Ràng buộc: [minLen: 3, maxLen: 50, pattern:`^[a-zA-Z0-9._]+$`] |
| `email`       | `string (email)` |     ✓     | Ràng buộc: [minLen: 0, maxLen: 255]                              |
| `password`    | `string`         |     ✓     | Ràng buộc: [minLen: 8, maxLen: 128]                              |
| `displayName` | `string`         |     -     | Ràng buộc: [minLen: 0, maxLen: 100]                              |

---

### <a id="schema-resetpasswordrequest"></a> `ResetPasswordRequest`

- **Kiểu**: `object`

| Thuộc tính    | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc                 |
| :-------------- | :-------------- | :--------: | :------------------------------------ |
| `token`       | `string`      |     ✓     | Ràng buộc: [minLen: 1]              |
| `newPassword` | `string`      |     ✓     | Ràng buộc: [minLen: 8, maxLen: 128] |

---

### <a id="schema-roledetailresponse"></a> `RoleDetailResponse`

- **Kiểu**: `object`

| Thuộc tính    | Kiểu dữ liệu                                            | Bắt buộc | Mô tả & Ràng buộc |
| :-------------- | :--------------------------------------------------------- | :--------: | :-------------------- |
| `id`          | `string (uuid)`                                          |     -     | -                     |
| `name`        | `string`                                                 |     -     | -                     |
| `description` | `string`                                                 |     -     | -                     |
| `permissions` | Array<[`PermissionResponse`](#schema-permissionresponse)> |     -     | -                     |
| `userCount`   | `integer (int64)`                                        |     -     | -                     |
| `createdAt`   | `string (date-time)`                                     |     -     | -                     |
| `updatedAt`   | `string (date-time)`                                     |     -     | -                     |
| `system`      | `boolean`                                                |     -     | -                     |

---

### <a id="schema-setrolepermissionsrequest"></a> `SetRolePermissionsRequest`

- **Kiểu**: `object`

| Thuộc tính      | Kiểu dữ liệu          | Bắt buộc | Mô tả & Ràng buộc |
| :---------------- | :----------------------- | :--------: | :-------------------- |
| `permissionIds` | Array<`string (uuid)`> |     ✓     | -                     |

---

### <a id="schema-sortobject"></a> `SortObject`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :----------- | :-------------- | :--------: | :-------------------- |
| `unsorted` | `boolean`     |     -     | -                     |
| `sorted`   | `boolean`     |     -     | -                     |
| `empty`    | `boolean`     |     -     | -                     |

---

### <a id="schema-syncuserrolesrequest"></a> `SyncUserRolesRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu   | Bắt buộc | Mô tả & Ràng buộc      |
| :----------- | :---------------- | :--------: | :------------------------- |
| `roles`    | Array<`string`> |     ✓     | Ràng buộc: [minItems: 1] |

---

### <a id="schema-twofadisablerequest"></a> `TwoFaDisableRequest`

- **Kiểu**: `object`

| Thuộc tính   | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :------------- | :-------------- | :--------: | :-------------------- |
| `totpCode`   | `string`      |     -     | -                     |
| `backupCode` | `string`      |     -     | -                     |

---

### <a id="schema-twofaenablerequest"></a> `TwoFaEnableRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc                         |
| :----------- | :-------------- | :--------: | :-------------------------------------------- |
| `totpCode` | `string`      |     ✓     | Ràng buộc: [minLen: 1, pattern:`^\d{6}$`] |

---

### <a id="schema-twofaenableresponse"></a> `TwoFaEnableResponse`

- **Kiểu**: `object`

| Thuộc tính    | Kiểu dữ liệu   | Bắt buộc | Mô tả & Ràng buộc |
| :-------------- | :---------------- | :--------: | :-------------------- |
| `backupCodes` | Array<`string`> |     -     | -                     |
| `message`     | `string`        |     -     | -                     |

---

### <a id="schema-twofaloginrequest"></a> `TwoFaLoginRequest`

- **Kiểu**: `object`

| Thuộc tính   | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc              |
| :------------- | :-------------- | :--------: | :--------------------------------- |
| `tempToken`  | `string`      |     ✓     | Ràng buộc: [minLen: 1]           |
| `totpCode`   | `string`      |     -     | Ràng buộc: [pattern:`^\d{6}$`] |
| `backupCode` | `string`      |     -     | -                                  |

---

### <a id="schema-twofasetupresponse"></a> `TwoFaSetupResponse`

- **Kiểu**: `object`

| Thuộc tính     | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--------------- | :-------------- | :--------: | :-------------------- |
| `secret`       | `string`      |     -     | -                     |
| `otpAuthUrl`   | `string`      |     -     | -                     |
| `qrCodeBase64` | `string`      |     -     | -                     |

---

### <a id="schema-updateprofilerequest"></a> `UpdateProfileRequest`

- **Kiểu**: `object`

| Thuộc tính    | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc                                              |
| :-------------- | :-------------- | :--------: | :----------------------------------------------------------------- |
| `displayName` | `string`      |     -     | Ràng buộc: [minLen: 0, maxLen: 100]                              |
| `avatarUrl`   | `string`      |     -     | Ràng buộc: [minLen: 0, maxLen: 500]                              |
| `bio`         | `string`      |     -     | Ràng buộc: [minLen: 0, maxLen: 500]                              |
| `website`     | `string`      |     -     | Ràng buộc: [minLen: 0, maxLen: 500, pattern:`^$\|^https?://.+`] |
| `pronouns`    | `string`      |     -     | Ràng buộc: [minLen: 0, maxLen: 50]                               |
| `category`    | `string`      |     -     | Ràng buộc: [minLen: 0, maxLen: 100]                              |

---

### <a id="schema-updaterolerequest"></a> `UpdateRoleRequest`

- **Kiểu**: `object`

| Thuộc tính    | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc                                          |
| :-------------- | :-------------- | :--------: | :------------------------------------------------------------- |
| `name`        | `string`      |     -     | Ràng buộc: [minLen: 2, maxLen: 50, pattern:`^[A-Z0-9_]+$`] |
| `description` | `string`      |     -     | Ràng buộc: [minLen: 0, maxLen: 255]                          |

---

### <a id="schema-userdto"></a> `UserDto`

- **Kiểu**: `object`

| Thuộc tính    | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :-------------- | :-------------- | :--------: | :-------------------- |
| `id`          | `string`      |     -     | -                     |
| `username`    | `string`      |     -     | -                     |
| `email`       | `string`      |     -     | -                     |
| `displayName` | `string`      |     -     | -                     |
| `role`        | `string`      |     -     | -                     |

---

### <a id="schema-usermeresponse"></a> `UserMeResponse`

- **Kiểu**: `object`

| Thuộc tính      | Kiểu dữ liệu        | Bắt buộc | Mô tả & Ràng buộc |
| :---------------- | :--------------------- | :--------: | :-------------------- |
| `id`            | `string`             |     -     | -                     |
| `username`      | `string`             |     -     | -                     |
| `email`         | `string`             |     -     | -                     |
| `role`          | `string`             |     -     | -                     |
| `displayName`   | `string`             |     -     | -                     |
| `avatarUrl`     | `string`             |     -     | -                     |
| `emailVerified` | `boolean`            |     -     | -                     |
| `createdAt`     | `string (date-time)` |     -     | -                     |

---

### <a id="schema-userprofileresponse"></a> `UserProfileResponse`

- **Kiểu**: `object`

| Thuộc tính           | Kiểu dữ liệu        | Bắt buộc | Mô tả & Ràng buộc |
| :--------------------- | :--------------------- | :--------: | :-------------------- |
| `id`                 | `string`             |     -     | -                     |
| `username`           | `string`             |     -     | -                     |
| `displayName`        | `string`             |     -     | -                     |
| `avatarUrl`          | `string`             |     -     | -                     |
| `privateAccount`     | `boolean`            |     -     | -                     |
| `createdAt`          | `string (date-time)` |     -     | -                     |
| `bio`                | `string`             |     -     | -                     |
| `website`            | `string`             |     -     | -                     |
| `pronouns`           | `string`             |     -     | -                     |
| `category`           | `string`             |     -     | -                     |
| `lastSeenAt`         | `string (date-time)` |     -     | -                     |
| `email`              | `string`             |     -     | -                     |
| `emailVerified`      | `boolean`            |     -     | -                     |
| `twoFaEnabled`       | `boolean`            |     -     | -                     |
| `showActivityStatus` | `boolean`            |     -     | -                     |

---

### <a id="schema-userrolespermissionsresponse"></a> `UserRolesPermissionsResponse`

- **Kiểu**: `object`

| Thuộc tính             | Kiểu dữ liệu   | Bắt buộc | Mô tả & Ràng buộc |
| :----------------------- | :---------------- | :--------: | :-------------------- |
| `userId`               | `string (uuid)` |     -     | -                     |
| `primaryRole`          | `string`        |     -     | -                     |
| `roles`                | Array<`string`> |     -     | -                     |
| `effectivePermissions` | Array<`string`> |     -     | -                     |

---
