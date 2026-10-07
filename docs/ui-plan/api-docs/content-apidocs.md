# Content Service API

Quản lý bài đăng, bình luận, story, follow và tương tác trong Snapgram.

## Xác thực & Headers
- Khi gọi qua **API Gateway** (`http://localhost:8080`), Gateway chịu trách nhiệm xác thực Bearer JWT token từ client và inject header `X-User-Id: <user-uuid>` chuyển tiếp xuống Content Service (`http://localhost:8084`).
- Khi test trực tiếp tại Content Service Swagger UI, sử dụng cấu hình bảo mật `X-User-Id` để giả lập user đang đăng nhập.

## Endpoints

### Comments API

| Method | Path | Mô tả | Auth | Request Body | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/posts/{postId}/comments` | Lấy danh sách bình luận gốc | `X-User-Id` | - | [`PageCommentResponse`](#schema-pagecommentresponse) |
| `POST` | `/api/posts/{postId}/comments` | Tạo bình luận / reply | `X-User-Id` | [`CreateCommentRequest`](#schema-createcommentrequest) | [`CommentResponse`](#schema-commentresponse) |
| `DELETE` | `/api/posts/{postId}/comments/{commentId}` | Xóa bình luận | `X-User-Id` | - | OK |
| `POST` | `/api/posts/{postId}/comments/{commentId}/like` | Like bình luận | `X-User-Id` | - | OK |
| `DELETE` | `/api/posts/{postId}/comments/{commentId}/like` | Unlike bình luận | `X-User-Id` | - | OK |
| `GET` | `/api/posts/{postId}/comments/{commentId}/replies` | Lấy replies của bình luận | `X-User-Id` | - | [`PageCommentResponse`](#schema-pagecommentresponse) |

#### Chi tiết Endpoint trong Comments API

##### `GET` /api/posts/{postId}/comments

- **Tóm tắt**: Lấy danh sách bình luận gốc
- **Operation ID**: `getRootComments`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `postId` | `path` | `string (uuid)` | **Có** | - | - |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PageCommentResponse`](#schema-pagecommentresponse) |

---

##### `POST` /api/posts/{postId}/comments

- **Tóm tắt**: Tạo bình luận / reply
- **Operation ID**: `createComment`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `postId` | `path` | `string (uuid)` | **Có** | - | - |

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`CreateCommentRequest`](#schema-createcommentrequest)

  | Field | Kiểu | Bắt buộc | Mô tả & Ràng buộc |
  | :--- | :--- | :---: | :--- |
  | `content` | `string` | ✓ | Ràng buộc: [minLen: 0, maxLen: 2000] |
  | `parentCommentId` | `string (uuid)` | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`CommentResponse`](#schema-commentresponse) |

---

##### `DELETE` /api/posts/{postId}/comments/{commentId}

- **Tóm tắt**: Xóa bình luận
- **Operation ID**: `deleteComment`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `postId` | `path` | `string (uuid)` | **Có** | - | - |
| `commentId` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

##### `POST` /api/posts/{postId}/comments/{commentId}/like

- **Tóm tắt**: Like bình luận
- **Operation ID**: `likeComment`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `postId` | `path` | `string (uuid)` | **Có** | - | - |
| `commentId` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

##### `DELETE` /api/posts/{postId}/comments/{commentId}/like

- **Tóm tắt**: Unlike bình luận
- **Operation ID**: `unlikeComment`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `postId` | `path` | `string (uuid)` | **Có** | - | - |
| `commentId` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

##### `GET` /api/posts/{postId}/comments/{commentId}/replies

- **Tóm tắt**: Lấy replies của bình luận
- **Operation ID**: `getReplies`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `postId` | `path` | `string (uuid)` | **Có** | - | - |
| `commentId` | `path` | `string (uuid)` | **Có** | - | - |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PageCommentResponse`](#schema-pagecommentresponse) |

---

### Hashtags API

| Method | Path | Mô tả | Auth | Request Body | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/hashtags/search` | Tìm kiếm hashtag | `X-User-Id` | - | Array<[`HashtagResponse`](#schema-hashtagresponse)> |
| `GET` | `/api/hashtags/{tag}/posts` | Bài đăng theo hashtag | `X-User-Id` | - | [`PagePostResponse`](#schema-pagepostresponse) |

#### Chi tiết Endpoint trong Hashtags API

##### `GET` /api/hashtags/search

- **Tóm tắt**: Tìm kiếm hashtag
- **Operation ID**: `searchHashtags`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `q` | `query` | `string` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | Array<[`HashtagResponse`](#schema-hashtagresponse)> |

---

##### `GET` /api/hashtags/{tag}/posts

- **Tóm tắt**: Bài đăng theo hashtag
- **Operation ID**: `getPostsByHashtag`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `tag` | `path` | `string` | **Có** | - | - |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PagePostResponse`](#schema-pagepostresponse) |

---

### Reports API

| Method | Path | Mô tả | Auth | Request Body | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/reports` | Gửi báo cáo vi phạm | `X-User-Id` | [`CreateReportRequest`](#schema-createreportrequest) | [`ReportResponse`](#schema-reportresponse) |

#### Chi tiết Endpoint trong Reports API

##### `POST` /api/reports

- **Tóm tắt**: Gửi báo cáo vi phạm
- **Operation ID**: `createReport`
- **Xác thực (Auth)**: `X-User-Id`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`CreateReportRequest`](#schema-createreportrequest)

  | Field | Kiểu | Bắt buộc | Mô tả & Ràng buộc |
  | :--- | :--- | :---: | :--- |
  | `targetType` | `string` | ✓ | - |
  | `targetId` | `string (uuid)` | ✓ | - |
  | `reason` | `string` | ✓ | Ràng buộc: [minLen: 1] |
  | `description` | `string` | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`ReportResponse`](#schema-reportresponse) |

---

### Stories API

| Method | Path | Mô tả | Auth | Request Body | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/stories` | Tạo story mới | `X-User-Id` | [`CreateStoryRequest`](#schema-createstoryrequest) | [`StoryResponse`](#schema-storyresponse) |
| `GET` | `/api/stories/feed` | Feed story | `X-User-Id` | - | [`PageStoryResponse`](#schema-pagestoryresponse) |
| `GET` | `/api/stories/{id}` | Chi tiết story | `X-User-Id` | - | [`StoryResponse`](#schema-storyresponse) |
| `DELETE` | `/api/stories/{id}` | Xóa story | `X-User-Id` | - | OK |
| `POST` | `/api/stories/{id}/view` | Đánh dấu đã xem story | `X-User-Id` | - | OK |
| `GET` | `/api/stories/{id}/viewers` | Danh sách người xem (chỉ tác giả) | `X-User-Id` | - | [`PageStoryViewerResponse`](#schema-pagestoryviewerresponse) |

#### Chi tiết Endpoint trong Stories API

##### `POST` /api/stories

- **Tóm tắt**: Tạo story mới
- **Operation ID**: `createStory`
- **Xác thực (Auth)**: `X-User-Id`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`CreateStoryRequest`](#schema-createstoryrequest)

  | Field | Kiểu | Bắt buộc | Mô tả & Ràng buộc |
  | :--- | :--- | :---: | :--- |
  | `mediaUrl` | `string` | ✓ | Ràng buộc: [minLen: 1] |
  | `mediaId` | `string (uuid)` | - | - |
  | `mediaType` | `string` | ✓ | - |
  | `caption` | `string` | - | - |
  | `visibility` | `string` | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`StoryResponse`](#schema-storyresponse) |

---

##### `GET` /api/stories/feed

- **Tóm tắt**: Feed story
- **Operation ID**: `getFeed`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PageStoryResponse`](#schema-pagestoryresponse) |

---

##### `GET` /api/stories/{id}

- **Tóm tắt**: Chi tiết story
- **Operation ID**: `getStory`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`StoryResponse`](#schema-storyresponse) |

---

##### `DELETE` /api/stories/{id}

- **Tóm tắt**: Xóa story
- **Operation ID**: `deleteStory`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

##### `POST` /api/stories/{id}/view

- **Tóm tắt**: Đánh dấu đã xem story
- **Operation ID**: `viewStory`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

##### `GET` /api/stories/{id}/viewers

- **Tóm tắt**: Danh sách người xem (chỉ tác giả)
- **Operation ID**: `getViewers`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PageStoryViewerResponse`](#schema-pagestoryviewerresponse) |

---

### Interactions API

| Method | Path | Mô tả | Auth | Request Body | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/posts/{postId}/interact` | Ghi nhận tương tác (LIKE / VIEW / SHARE / SAVE / SKIP) | `X-User-Id` | [`InteractionRequest`](#schema-interactionrequest) | OK |
| `DELETE` | `/api/posts/{postId}/interact/like` | Bỏ like bài đăng | `X-User-Id` | - | OK |

#### Chi tiết Endpoint trong Interactions API

##### `POST` /api/posts/{postId}/interact

- **Tóm tắt**: Ghi nhận tương tác (LIKE / VIEW / SHARE / SAVE / SKIP)
- **Operation ID**: `interact`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `postId` | `path` | `string (uuid)` | **Có** | - | - |

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`InteractionRequest`](#schema-interactionrequest)

  | Field | Kiểu | Bắt buộc | Mô tả & Ràng buộc |
  | :--- | :--- | :---: | :--- |
  | `type` | `string` | ✓ | - |
  | `watchTimeRatio` | `number` | - | Ràng buộc: [min: 0.0, max: 1.0] |
  | `explicitRating` | `number` | - | Ràng buộc: [min: 0.0, max: 10.0] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

##### `DELETE` /api/posts/{postId}/interact/like

- **Tóm tắt**: Bỏ like bài đăng
- **Operation ID**: `unlike`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `postId` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

### Admin Reports API

| Method | Path | Mô tả | Auth | Request Body | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/admin/reports` | Lấy danh sách báo cáo vi phạm (Admin) | `X-User-Id` | - | [`PageReportResponse`](#schema-pagereportresponse) |
| `GET` | `/api/admin/reports/{id}` | Xem chi tiết một báo cáo vi phạm (Admin) | `X-User-Id` | - | [`ReportResponse`](#schema-reportresponse) |
| `PATCH` | `/api/admin/reports/{id}/dismiss` | Bác bỏ báo cáo không vi phạm (Admin) | `X-User-Id` | - | [`ReportResponse`](#schema-reportresponse) |
| `PATCH` | `/api/admin/reports/{id}/resolve` | Duyệt báo cáo và xử lý nội dung vi phạm (Admin) | `X-User-Id` | - | [`ReportResponse`](#schema-reportresponse) |

#### Chi tiết Endpoint trong Admin Reports API

##### `GET` /api/admin/reports

- **Tóm tắt**: Lấy danh sách báo cáo vi phạm (Admin)
- **Operation ID**: `getReports`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `status` | `query` | `string` (enum: `"PENDING"`, `"REVIEWED"`, `"RESOLVED"`, `"DISMISSED"`) | Không | - | - |
| `targetType` | `query` | `string` (enum: `"POST"`, `"COMMENT"`, `"USER"`) | Không | - | - |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PageReportResponse`](#schema-pagereportresponse) |

---

##### `GET` /api/admin/reports/{id}

- **Tóm tắt**: Xem chi tiết một báo cáo vi phạm (Admin)
- **Operation ID**: `getReportById`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`ReportResponse`](#schema-reportresponse) |

---

##### `PATCH` /api/admin/reports/{id}/dismiss

- **Tóm tắt**: Bác bỏ báo cáo không vi phạm (Admin)
- **Operation ID**: `dismissReport`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`ReportResponse`](#schema-reportresponse) |

---

##### `PATCH` /api/admin/reports/{id}/resolve

- **Tóm tắt**: Duyệt báo cáo và xử lý nội dung vi phạm (Admin)
- **Operation ID**: `resolveReport`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`ReportResponse`](#schema-reportresponse) |

---

### Follows API

| Method | Path | Mô tả | Auth | Request Body | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/follows/followers` | Danh sách followers | `X-User-Id` | - | [`PageFollowResponse`](#schema-pagefollowresponse) |
| `GET` | `/api/follows/following` | Danh sách following | `X-User-Id` | - | [`PageFollowResponse`](#schema-pagefollowresponse) |
| `GET` | `/api/follows/requests` | Danh sách follow requests đang chờ | `X-User-Id` | - | [`PageFollowResponse`](#schema-pagefollowresponse) |
| `POST` | `/api/follows/requests/{followId}/accept` | Chấp nhận follow request | `X-User-Id` | - | [`FollowResponse`](#schema-followresponse) |
| `POST` | `/api/follows/requests/{followId}/reject` | Từ chối follow request | `X-User-Id` | - | OK |
| `POST` | `/api/follows/{userId}` | Follow user | `X-User-Id` | - | [`FollowResponse`](#schema-followresponse) |
| `DELETE` | `/api/follows/{userId}` | Unfollow user | `X-User-Id` | - | OK |

#### Chi tiết Endpoint trong Follows API

##### `GET` /api/follows/followers

- **Tóm tắt**: Danh sách followers
- **Operation ID**: `getFollowers`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PageFollowResponse`](#schema-pagefollowresponse) |

---

##### `GET` /api/follows/following

- **Tóm tắt**: Danh sách following
- **Operation ID**: `getFollowing`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PageFollowResponse`](#schema-pagefollowresponse) |

---

##### `GET` /api/follows/requests

- **Tóm tắt**: Danh sách follow requests đang chờ
- **Operation ID**: `getPendingRequests`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PageFollowResponse`](#schema-pagefollowresponse) |

---

##### `POST` /api/follows/requests/{followId}/accept

- **Tóm tắt**: Chấp nhận follow request
- **Operation ID**: `acceptRequest`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `followId` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`FollowResponse`](#schema-followresponse) |

---

##### `POST` /api/follows/requests/{followId}/reject

- **Tóm tắt**: Từ chối follow request
- **Operation ID**: `rejectRequest`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `followId` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

##### `POST` /api/follows/{userId}

- **Tóm tắt**: Follow user
- **Operation ID**: `follow`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `userId` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`FollowResponse`](#schema-followresponse) |

---

##### `DELETE` /api/follows/{userId}

- **Tóm tắt**: Unfollow user
- **Operation ID**: `unfollow`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `userId` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

### Posts API

| Method | Path | Mô tả | Auth | Request Body | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/posts` | Tạo bài đăng mới | `X-User-Id` | [`CreatePostRequest`](#schema-createpostrequest) | [`PostResponse`](#schema-postresponse) |
| `GET` | `/api/posts/explore` | Khám phá | `X-User-Id` | - | [`PagePostResponse`](#schema-pagepostresponse) |
| `GET` | `/api/posts/feed` | Feed cá nhân | `X-User-Id` | - | [`PagePostResponse`](#schema-pagepostresponse) |
| `GET` | `/api/posts/me` | Bài đăng của tôi | `X-User-Id` | - | [`PagePostResponse`](#schema-pagepostresponse) |
| `GET` | `/api/posts/user/{userId}` | Bài đăng của user khác | `X-User-Id` | - | [`PagePostResponse`](#schema-pagepostresponse) |
| `GET` | `/api/posts/{id}` | Lấy chi tiết bài đăng | `X-User-Id` | - | [`PostResponse`](#schema-postresponse) |
| `PUT` | `/api/posts/{id}` | Sửa bài đăng | `X-User-Id` | [`UpdatePostRequest`](#schema-updatepostrequest) | [`PostResponse`](#schema-postresponse) |
| `DELETE` | `/api/posts/{id}` | Xóa bài đăng | `X-User-Id` | - | OK |

#### Chi tiết Endpoint trong Posts API

##### `POST` /api/posts

- **Tóm tắt**: Tạo bài đăng mới
- **Operation ID**: `createPost`
- **Xác thực (Auth)**: `X-User-Id`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`CreatePostRequest`](#schema-createpostrequest)

  | Field | Kiểu | Bắt buộc | Mô tả & Ràng buộc |
  | :--- | :--- | :---: | :--- |
  | `contentType` | `string` | - | - |
  | `caption` | `string` | - | Ràng buộc: [minLen: 0, maxLen: 2200] |
  | `mediaId` | `string (uuid)` | - | - |
  | `mediaUrl` | `string` | - | - |
  | `mediaList` | Array<[`PostMediaRequest`](#schema-postmediarequest)> | - | - |
  | `tags` | `string` | - | - |
  | `visibility` | `string` | - | - |
  | `hashtags` | Array<`string`> | - | - |
  | `mentionedUserIds` | Array<`string (uuid)`> | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PostResponse`](#schema-postresponse) |

---

##### `GET` /api/posts/explore

- **Tóm tắt**: Khám phá
- **Operation ID**: `explore`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PagePostResponse`](#schema-pagepostresponse) |

---

##### `GET` /api/posts/feed

- **Tóm tắt**: Feed cá nhân
- **Operation ID**: `getFeed_1`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PagePostResponse`](#schema-pagepostresponse) |

---

##### `GET` /api/posts/me

- **Tóm tắt**: Bài đăng của tôi
- **Operation ID**: `getMyPosts`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PagePostResponse`](#schema-pagepostresponse) |

---

##### `GET` /api/posts/user/{userId}

- **Tóm tắt**: Bài đăng của user khác
- **Operation ID**: `getUserPosts`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `userId` | `path` | `string (uuid)` | **Có** | - | - |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PagePostResponse`](#schema-pagepostresponse) |

---

##### `GET` /api/posts/{id}

- **Tóm tắt**: Lấy chi tiết bài đăng
- **Operation ID**: `getPost`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PostResponse`](#schema-postresponse) |

---

##### `PUT` /api/posts/{id}

- **Tóm tắt**: Sửa bài đăng
- **Operation ID**: `updatePost`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`UpdatePostRequest`](#schema-updatepostrequest)

  | Field | Kiểu | Bắt buộc | Mô tả & Ràng buộc |
  | :--- | :--- | :---: | :--- |
  | `caption` | `string` | - | Ràng buộc: [minLen: 0, maxLen: 2200] |
  | `tags` | `string` | - | - |
  | `visibility` | `string` | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PostResponse`](#schema-postresponse) |

---

##### `DELETE` /api/posts/{id}

- **Tóm tắt**: Xóa bài đăng
- **Operation ID**: `deletePost`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

### Saved Posts API

| Method | Path | Mô tả | Auth | Request Body | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/saved` | Danh sách bài đăng đã lưu | `X-User-Id` | - | [`PagePostResponse`](#schema-pagepostresponse) |
| `GET` | `/api/saved/collections` | Danh sách bộ sưu tập của tôi | `X-User-Id` | - | Array<[`CollectionResponse`](#schema-collectionresponse)> |
| `POST` | `/api/saved/collections` | Tạo bộ sưu tập | `X-User-Id` | [`CreateCollectionRequest`](#schema-createcollectionrequest) | [`CollectionResponse`](#schema-collectionresponse) |
| `DELETE` | `/api/saved/collections/{collectionId}` | Xóa bộ sưu tập | `X-User-Id` | - | OK |
| `POST` | `/api/saved/{postId}` | Lưu bài đăng | `X-User-Id` | [`SavePostRequest`](#schema-savepostrequest) | OK |
| `DELETE` | `/api/saved/{postId}` | Bỏ lưu bài đăng | `X-User-Id` | - | OK |

#### Chi tiết Endpoint trong Saved Posts API

##### `GET` /api/saved

- **Tóm tắt**: Danh sách bài đăng đã lưu
- **Operation ID**: `getSavedPosts`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PagePostResponse`](#schema-pagepostresponse) |

---

##### `GET` /api/saved/collections

- **Tóm tắt**: Danh sách bộ sưu tập của tôi
- **Operation ID**: `getMyCollections`
- **Xác thực (Auth)**: `X-User-Id`

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | Array<[`CollectionResponse`](#schema-collectionresponse)> |

---

##### `POST` /api/saved/collections

- **Tóm tắt**: Tạo bộ sưu tập
- **Operation ID**: `createCollection`
- **Xác thực (Auth)**: `X-User-Id`

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`CreateCollectionRequest`](#schema-createcollectionrequest)

  | Field | Kiểu | Bắt buộc | Mô tả & Ràng buộc |
  | :--- | :--- | :---: | :--- |
  | `name` | `string` | ✓ | Ràng buộc: [minLen: 0, maxLen: 100] |
  | `private` | `boolean` | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`CollectionResponse`](#schema-collectionresponse) |

---

##### `DELETE` /api/saved/collections/{collectionId}

- **Tóm tắt**: Xóa bộ sưu tập
- **Operation ID**: `deleteCollection`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `collectionId` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

##### `POST` /api/saved/{postId}

- **Tóm tắt**: Lưu bài đăng
- **Operation ID**: `savePost`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `postId` | `path` | `string (uuid)` | **Có** | - | - |

**Request Body:**

- Bắt buộc: Tùy chọn
- Content-Type: `application/json`
- Model Schema: [`SavePostRequest`](#schema-savepostrequest)

  | Field | Kiểu | Bắt buộc | Mô tả & Ràng buộc |
  | :--- | :--- | :---: | :--- |
  | `collectionId` | `string (uuid)` | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

##### `DELETE` /api/saved/{postId}

- **Tóm tắt**: Bỏ lưu bài đăng
- **Operation ID**: `unsavePost`
- **Xác thực (Auth)**: `X-User-Id`

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `postId` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

## Schemas (Chi tiết Models)

> Danh sách toàn bộ các Schema / Data Transfer Object (DTO) được sử dụng trong request/response của service.

### <a id="schema-collectionresponse"></a> `CollectionResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `id` | `string` | - | - |
| `userId` | `string` | - | - |
| `name` | `string` | - | - |
| `coverPostId` | `string` | - | - |
| `createdAt` | `string (date-time)` | - | - |
| `private` | `boolean` | - | - |

---

### <a id="schema-commentresponse"></a> `CommentResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `id` | `string` | - | - |
| `postId` | `string` | - | - |
| `authorId` | `string` | - | - |
| `content` | `string` | - | - |
| `parentCommentId` | `string` | - | - |
| `likeCount` | `integer (int64)` | - | - |
| `likedByMe` | `boolean` | - | - |
| `createdAt` | `string (date-time)` | - | - |
| `updatedAt` | `string (date-time)` | - | - |

---

### <a id="schema-createcollectionrequest"></a> `CreateCollectionRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `name` | `string` | ✓ | Ràng buộc: [minLen: 0, maxLen: 100] |
| `private` | `boolean` | - | - |

---

### <a id="schema-createcommentrequest"></a> `CreateCommentRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `content` | `string` | ✓ | Ràng buộc: [minLen: 0, maxLen: 2000] |
| `parentCommentId` | `string (uuid)` | - | - |

---

### <a id="schema-createpostrequest"></a> `CreatePostRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `contentType` | `string` | - | - |
| `caption` | `string` | - | Ràng buộc: [minLen: 0, maxLen: 2200] |
| `mediaId` | `string (uuid)` | - | - |
| `mediaUrl` | `string` | - | - |
| `mediaList` | Array<[`PostMediaRequest`](#schema-postmediarequest)> | - | - |
| `tags` | `string` | - | - |
| `visibility` | `string` | - | - |
| `hashtags` | Array<`string`> | - | - |
| `mentionedUserIds` | Array<`string (uuid)`> | - | - |

---

### <a id="schema-createreportrequest"></a> `CreateReportRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `targetType` | `string` | ✓ | - |
| `targetId` | `string (uuid)` | ✓ | - |
| `reason` | `string` | ✓ | Ràng buộc: [minLen: 1] |
| `description` | `string` | - | - |

---

### <a id="schema-createstoryrequest"></a> `CreateStoryRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `mediaUrl` | `string` | ✓ | Ràng buộc: [minLen: 1] |
| `mediaId` | `string (uuid)` | - | - |
| `mediaType` | `string` | ✓ | - |
| `caption` | `string` | - | - |
| `visibility` | `string` | - | - |

---

### <a id="schema-followresponse"></a> `FollowResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `id` | `string` | - | - |
| `followerId` | `string` | - | - |
| `followingId` | `string` | - | - |
| `status` | `string` | - | - |
| `createdAt` | `string (date-time)` | - | - |

---

### <a id="schema-hashtagresponse"></a> `HashtagResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `id` | `string` | - | - |
| `tag` | `string` | - | - |
| `postCount` | `integer (int64)` | - | - |
| `lastUsedAt` | `string (date-time)` | - | - |

---

### <a id="schema-interactionrequest"></a> `InteractionRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `type` | `string` | ✓ | - |
| `watchTimeRatio` | `number` | - | Ràng buộc: [min: 0.0, max: 1.0] |
| `explicitRating` | `number` | - | Ràng buộc: [min: 0.0, max: 10.0] |

---

### <a id="schema-pagecommentresponse"></a> `PageCommentResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `totalPages` | `integer (int32)` | - | - |
| `totalElements` | `integer (int64)` | - | - |
| `size` | `integer (int32)` | - | - |
| `content` | Array<[`CommentResponse`](#schema-commentresponse)> | - | - |
| `number` | `integer (int32)` | - | - |
| `sort` | [`SortObject`](#schema-sortobject) | - | - |
| `pageable` | [`PageableObject`](#schema-pageableobject) | - | - |
| `numberOfElements` | `integer (int32)` | - | - |
| `first` | `boolean` | - | - |
| `last` | `boolean` | - | - |
| `empty` | `boolean` | - | - |

---

### <a id="schema-pagefollowresponse"></a> `PageFollowResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `totalPages` | `integer (int32)` | - | - |
| `totalElements` | `integer (int64)` | - | - |
| `size` | `integer (int32)` | - | - |
| `content` | Array<[`FollowResponse`](#schema-followresponse)> | - | - |
| `number` | `integer (int32)` | - | - |
| `sort` | [`SortObject`](#schema-sortobject) | - | - |
| `pageable` | [`PageableObject`](#schema-pageableobject) | - | - |
| `numberOfElements` | `integer (int32)` | - | - |
| `first` | `boolean` | - | - |
| `last` | `boolean` | - | - |
| `empty` | `boolean` | - | - |

---

### <a id="schema-pagepostresponse"></a> `PagePostResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `totalPages` | `integer (int32)` | - | - |
| `totalElements` | `integer (int64)` | - | - |
| `size` | `integer (int32)` | - | - |
| `content` | Array<[`PostResponse`](#schema-postresponse)> | - | - |
| `number` | `integer (int32)` | - | - |
| `sort` | [`SortObject`](#schema-sortobject) | - | - |
| `pageable` | [`PageableObject`](#schema-pageableobject) | - | - |
| `numberOfElements` | `integer (int32)` | - | - |
| `first` | `boolean` | - | - |
| `last` | `boolean` | - | - |
| `empty` | `boolean` | - | - |

---

### <a id="schema-pagereportresponse"></a> `PageReportResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `totalPages` | `integer (int32)` | - | - |
| `totalElements` | `integer (int64)` | - | - |
| `size` | `integer (int32)` | - | - |
| `content` | Array<[`ReportResponse`](#schema-reportresponse)> | - | - |
| `number` | `integer (int32)` | - | - |
| `sort` | [`SortObject`](#schema-sortobject) | - | - |
| `pageable` | [`PageableObject`](#schema-pageableobject) | - | - |
| `numberOfElements` | `integer (int32)` | - | - |
| `first` | `boolean` | - | - |
| `last` | `boolean` | - | - |
| `empty` | `boolean` | - | - |

---

### <a id="schema-pagestoryresponse"></a> `PageStoryResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `totalPages` | `integer (int32)` | - | - |
| `totalElements` | `integer (int64)` | - | - |
| `size` | `integer (int32)` | - | - |
| `content` | Array<[`StoryResponse`](#schema-storyresponse)> | - | - |
| `number` | `integer (int32)` | - | - |
| `sort` | [`SortObject`](#schema-sortobject) | - | - |
| `pageable` | [`PageableObject`](#schema-pageableobject) | - | - |
| `numberOfElements` | `integer (int32)` | - | - |
| `first` | `boolean` | - | - |
| `last` | `boolean` | - | - |
| `empty` | `boolean` | - | - |

---

### <a id="schema-pagestoryviewerresponse"></a> `PageStoryViewerResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `totalPages` | `integer (int32)` | - | - |
| `totalElements` | `integer (int64)` | - | - |
| `size` | `integer (int32)` | - | - |
| `content` | Array<[`StoryViewerResponse`](#schema-storyviewerresponse)> | - | - |
| `number` | `integer (int32)` | - | - |
| `sort` | [`SortObject`](#schema-sortobject) | - | - |
| `pageable` | [`PageableObject`](#schema-pageableobject) | - | - |
| `numberOfElements` | `integer (int32)` | - | - |
| `first` | `boolean` | - | - |
| `last` | `boolean` | - | - |
| `empty` | `boolean` | - | - |

---

### <a id="schema-pageableobject"></a> `PageableObject`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `unpaged` | `boolean` | - | - |
| `pageNumber` | `integer (int32)` | - | - |
| `paged` | `boolean` | - | - |
| `pageSize` | `integer (int32)` | - | - |
| `offset` | `integer (int64)` | - | - |
| `sort` | [`SortObject`](#schema-sortobject) | - | - |

---

### <a id="schema-postmediarequest"></a> `PostMediaRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `mediaId` | `string (uuid)` | - | - |
| `mediaUrl` | `string` | ✓ | Ràng buộc: [minLen: 1] |
| `thumbnailUrl` | `string` | - | - |
| `mediaType` | `string` | - | - |
| `sortOrder` | `integer (int32)` | - | - |
| `width` | `integer (int32)` | - | - |
| `height` | `integer (int32)` | - | - |
| `durationSec` | `integer (int32)` | - | - |

---

### <a id="schema-postmediaresponse"></a> `PostMediaResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `id` | `string` | - | - |
| `mediaId` | `string` | - | - |
| `mediaUrl` | `string` | - | - |
| `thumbnailUrl` | `string` | - | - |
| `mediaType` | `string` | - | - |
| `sortOrder` | `integer (int32)` | - | - |
| `width` | `integer (int32)` | - | - |
| `height` | `integer (int32)` | - | - |
| `durationSec` | `integer (int32)` | - | - |
| `createdAt` | `string (date-time)` | - | - |

---

### <a id="schema-postresponse"></a> `PostResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `id` | `string` | - | - |
| `authorId` | `string` | - | - |
| `contentType` | `string` | - | - |
| `caption` | `string` | - | - |
| `mediaId` | `string` | - | - |
| `mediaUrl` | `string` | - | - |
| `mediaItems` | Array<[`PostMediaResponse`](#schema-postmediaresponse)> | - | - |
| `tags` | `string` | - | - |
| `likeCount` | `integer (int64)` | - | - |
| `commentCount` | `integer (int64)` | - | - |
| `viewCount` | `integer (int64)` | - | - |
| `status` | `string` | - | - |
| `visibility` | `string` | - | - |
| `editCount` | `integer (int32)` | - | - |
| `editedAt` | `string (date-time)` | - | - |
| `createdAt` | `string (date-time)` | - | - |
| `updatedAt` | `string (date-time)` | - | - |
| `hashtags` | Array<`string`> | - | - |
| `mentionedUserIds` | Array<`string`> | - | - |
| `likedByMe` | `boolean` | - | - |

---

### <a id="schema-reportresponse"></a> `ReportResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `id` | `string` | - | - |
| `reporterId` | `string` | - | - |
| `targetType` | `string` | - | - |
| `targetId` | `string` | - | - |
| `reason` | `string` | - | - |
| `description` | `string` | - | - |
| `status` | `string` | - | - |
| `createdAt` | `string (date-time)` | - | - |

---

### <a id="schema-savepostrequest"></a> `SavePostRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `collectionId` | `string (uuid)` | - | - |

---

### <a id="schema-sortobject"></a> `SortObject`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `unsorted` | `boolean` | - | - |
| `sorted` | `boolean` | - | - |
| `empty` | `boolean` | - | - |

---

### <a id="schema-storyresponse"></a> `StoryResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `id` | `string` | - | - |
| `authorId` | `string` | - | - |
| `mediaId` | `string` | - | - |
| `mediaUrl` | `string` | - | - |
| `mediaType` | `string` | - | - |
| `caption` | `string` | - | - |
| `visibility` | `string` | - | - |
| `viewedByMe` | `boolean` | - | - |
| `createdAt` | `string (date-time)` | - | - |
| `expiresAt` | `string (date-time)` | - | - |

---

### <a id="schema-storyviewerresponse"></a> `StoryViewerResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `viewerId` | `string` | - | - |
| `viewedAt` | `string (date-time)` | - | - |

---

### <a id="schema-updatepostrequest"></a> `UpdatePostRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `caption` | `string` | - | Ràng buộc: [minLen: 0, maxLen: 2200] |
| `tags` | `string` | - | - |
| `visibility` | `string` | - | - |

---
