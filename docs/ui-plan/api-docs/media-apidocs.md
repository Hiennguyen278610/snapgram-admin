# Snapgram — Media Service API

Service quản lý upload, xử lý và lưu trữ media (ảnh, video) trên MinIO.

## Xác thực
- Khi đi qua API Gateway: Bearer JWT trong header `Authorization` → Gateway validate và inject `X-User-Id`
- Khi gọi trực tiếp (dev): truyền header `X-User-Id: <user-uuid>`

## Flow Presigned Upload (Khuyên dùng cho video / file lớn):
1. `POST /api/media/presigned` → Nhận `uploadUrl` (MinIO PUT) + `mediaId`
2. Client upload file trực tiếp: `PUT {uploadUrl}` với file binary
3. `POST /api/media/{id}/confirm` → Media Service verify file trên MinIO, extract metadata (width, height, duration)
4. Sử dụng `mediaUrl` nhận được để lưu vào bài đăng / story bên Content Service

## Flow Direct Upload (Tiện lợi cho avatar / ảnh đơn giản):
1. `POST /api/media/upload` (multipart/form-data) → Media Service lưu trực tiếp vào MinIO và trả về `mediaUrl`

## Endpoints

### Media API

| Method | Path | Mô tả | Auth | Request Body | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/media/me` | Danh sách media của tôi | `X-User-Id` | - | [`PageMediaResponse`](#schema-pagemediaresponse) |
| `POST` | `/api/media/presigned` | Tạo Presigned URL | `X-User-Id` | [`PresignedUrlRequest`](#schema-presignedurlrequest) | [`PresignedUrlResponse`](#schema-presignedurlresponse) |
| `POST` | `/api/media/upload` | Direct Upload (Multipart) | `X-User-Id` | `object` | [`MediaResponse`](#schema-mediaresponse) |
| `GET` | `/api/media/{id}` | Lấy chi tiết media | `X-User-Id` | - | [`MediaResponse`](#schema-mediaresponse) |
| `DELETE` | `/api/media/{id}` | Xóa media | `X-User-Id` | - | OK |
| `POST` | `/api/media/{id}/confirm` | Xác nhận Presigned Upload | `X-User-Id` | - | [`MediaResponse`](#schema-mediaresponse) |

#### Chi tiết Endpoint trong Media API

##### `GET` /api/media/me

- **Tóm tắt**: Danh sách media của tôi
- **Operation ID**: `getMyMedia`
- **Xác thực (Auth)**: `X-User-Id`
- **Mô tả chi tiết**: Lấy danh sách các media do user hiện tại tải lên

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `page` | `query` | `integer (int32)` | Không | - | `0` |
| `size` | `query` | `integer (int32)` | Không | - | `20` |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PageMediaResponse`](#schema-pagemediaresponse) |

---

##### `POST` /api/media/presigned

- **Tóm tắt**: Tạo Presigned URL
- **Operation ID**: `createPresignedUpload`
- **Xác thực (Auth)**: `X-User-Id`
- **Mô tả chi tiết**: Tạo URL PUT để client upload trực tiếp file lớn lên MinIO mà không nghẽn server

**Request Body:**

- Bắt buộc: **Bắt buộc**
- Content-Type: `application/json`
- Model Schema: [`PresignedUrlRequest`](#schema-presignedurlrequest)

  | Field | Kiểu | Bắt buộc | Mô tả & Ràng buộc |
  | :--- | :--- | :---: | :--- |
  | `fileName` | `string` | ✓ | Ràng buộc: [minLen: 1] |
  | `mimeType` | `string` | ✓ | Ràng buộc: [minLen: 1] |
  | `sizeBytes` | `integer (int64)` | ✓ | Ràng buộc: [min: 0] |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`PresignedUrlResponse`](#schema-presignedurlresponse) |

---

##### `POST` /api/media/upload

- **Tóm tắt**: Direct Upload (Multipart)
- **Operation ID**: `upload`
- **Xác thực (Auth)**: `X-User-Id`
- **Mô tả chi tiết**: Upload file trực tiếp lên server, tự động lưu MinIO và sinh thumbnail nếu là ảnh

**Request Body:**

- Bắt buộc: Tùy chọn
- Content-Type: `multipart/form-data`
- Model Schema: `object`

  | Field | Kiểu | Bắt buộc | Mô tả & Ràng buộc |
  | :--- | :--- | :---: | :--- |
  | `file` | `string (binary)` | ✓ | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`MediaResponse`](#schema-mediaresponse) |

---

##### `GET` /api/media/{id}

- **Tóm tắt**: Lấy chi tiết media
- **Operation ID**: `getMedia`
- **Xác thực (Auth)**: `X-User-Id`
- **Mô tả chi tiết**: Xem thông tin URL, thumbnail, kích thước của media

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`MediaResponse`](#schema-mediaresponse) |

---

##### `DELETE` /api/media/{id}

- **Tóm tắt**: Xóa media
- **Operation ID**: `deleteMedia`
- **Xác thực (Auth)**: `X-User-Id`
- **Mô tả chi tiết**: Xóa file khỏi MinIO và cập nhật trạng thái DELETED

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | - | Không có body |

---

##### `POST` /api/media/{id}/confirm

- **Tóm tắt**: Xác nhận Presigned Upload
- **Operation ID**: `confirmPresignedUpload`
- **Xác thực (Auth)**: `X-User-Id`
- **Mô tả chi tiết**: Client gọi sau khi đã PUT file thành công lên MinIO bằng presigned URL

**Parameters:**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả | Mặc định |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `path` | `string (uuid)` | **Có** | - | - |

**Responses:**

| Status Code | Mô tả | Content-Type | Schema |
| :---: | :--- | :--- | :--- |
| `200` | OK | `*/*` | [`MediaResponse`](#schema-mediaresponse) |

---

## Schemas (Chi tiết Models)

> Danh sách toàn bộ các Schema / Data Transfer Object (DTO) được sử dụng trong request/response của service.

### <a id="schema-mediaresponse"></a> `MediaResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `id` | `string` | - | - |
| `ownerId` | `string` | - | - |
| `url` | `string` | - | - |
| `thumbnailUrl` | `string` | - | - |
| `mimeType` | `string` | - | - |
| `sizeBytes` | `integer (int64)` | - | - |
| `status` | `string` | - | - |
| `width` | `integer (int32)` | - | - |
| `height` | `integer (int32)` | - | - |
| `durationSec` | `integer (int32)` | - | - |
| `createdAt` | `string (date-time)` | - | - |

---

### <a id="schema-pagemediaresponse"></a> `PageMediaResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `totalPages` | `integer (int32)` | - | - |
| `totalElements` | `integer (int64)` | - | - |
| `size` | `integer (int32)` | - | - |
| `content` | Array<[`MediaResponse`](#schema-mediaresponse)> | - | - |
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
| `paged` | `boolean` | - | - |
| `pageSize` | `integer (int32)` | - | - |
| `pageNumber` | `integer (int32)` | - | - |
| `offset` | `integer (int64)` | - | - |
| `sort` | [`SortObject`](#schema-sortobject) | - | - |

---

### <a id="schema-presignedurlrequest"></a> `PresignedUrlRequest`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `fileName` | `string` | ✓ | Ràng buộc: [minLen: 1] |
| `mimeType` | `string` | ✓ | Ràng buộc: [minLen: 1] |
| `sizeBytes` | `integer (int64)` | ✓ | Ràng buộc: [min: 0] |

---

### <a id="schema-presignedurlresponse"></a> `PresignedUrlResponse`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `mediaId` | `string` | - | - |
| `uploadUrl` | `string` | - | - |
| `fileUrl` | `string` | - | - |
| `expiresInSeconds` | `integer (int64)` | - | - |

---

### <a id="schema-sortobject"></a> `SortObject`

- **Kiểu**: `object`

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `unsorted` | `boolean` | - | - |
| `sorted` | `boolean` | - | - |
| `empty` | `boolean` | - | - |

---
