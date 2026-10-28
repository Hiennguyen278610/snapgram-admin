# BI-012: MinIO Root Credential Bị Hardcode Trong `docker-compose.yml` → Media Upload 500 (`SignatureDoesNotMatch`)

- **Priority:** `P0` (Blocker cho dev) — làm hỏng **toàn bộ** chức năng media (upload / delete / presigned)
- **Status:** `In Progress` — fix ở BE PR [#21](https://github.com/hoangdinhreborn/Snapgram-Server/pull/21) (chưa merge); dev stack local đã verify PASS
- **Module ảnh hưởng:** `infra/docker-compose.yml` (service `minio`), kéo theo `media-service` + mọi service dùng MinIO (`content-service`, `auth-service`)
- **Ngày phát hiện:** 2026-10-16
- **Phát hiện tại:** mini-sprint 3.06 (seed media để verify FE)
- **Issue BE:** [#20](https://github.com/hoangdinhreborn/Snapgram-Server/issues/20)

---

## 1. Mô Tả Vấn Đề

`infra/docker-compose.yml` **hardcode** mật khẩu root của MinIO, trong khi **mọi service client** nhận `MINIO_ROOT_PASSWORD` từ `../.env` qua `env_file`:

```yaml
  minio:
    environment:
      MINIO_ROOT_USER: snapgram
      MINIO_ROOT_PASSWORD: snapgram-minio-dev-password   # ← hardcode 27 ký tự
```

`.env` (nguồn của media/content/auth) lại có mật khẩu **13 ký tự**.

⇒ Hai bên ký/verify bằng hai mật khẩu khác nhau ⇒ MinIO trả `SignatureDoesNotMatch` ⇒ **mọi request ghi lên MinIO đều `500`**, không riêng upload. Presigned flow và delete cũng chết theo.

## 2. Bằng Chứng (2026-10-16)

`POST /api/media/upload` → `500` cho cả 5 ảnh seed:

```json
{"error":"Internal Server Error","message":"An unexpected error occurred","status":500}
```

`docker logs snapgram-media-service`:

```
ERROR c.example.media.service.StorageService : Failed to upload object to MinIO:
  key=users/56030fa2-.../2026/10/15/xxxx.png,
  error=The request signature we calculated does not match the signature you provided.

Caused by: ErrorResponse(code = SignatureDoesNotMatch,
  bucketName = snapgram-media, objectName = null, resource = /snapgram-media)
```

So sánh credential hai phía:

```
snapgram-minio          : MINIO_ROOT_PASSWORD len = 27   (hardcode trong compose)
snapgram-media-service  : MINIO_ROOT_PASSWORD len = 13   (từ ../.env)
snapgram-content-service: MINIO_ROOT_PASSWORD len = 13   (từ ../.env)
snapgram-auth-service   : MINIO_ROOT_PASSWORD len = 13   (từ ../.env)
```

## 3. Root Cause

Service `minio` là **ngoại lệ duy nhất** trong stack không đọc `.env` cho credential. Các service khác đều có `env_file: - ../.env`.

**Lưu ý cách sửa:** KHÔNG dùng `${MINIO_ROOT_PASSWORD}` trong `environment:` — Docker Compose chỉ interpolate biến từ shell env hoặc `.env` **của thư mục chứa compose file** (`infra/`), không phải repo root, nên `${...}` sẽ **fail** (`required variable ... is missing a value`). Cách đúng và nhất quán với phần còn lại của file là dùng `env_file`.

## 4. Fix (BE PR #21)

```diff
-    environment:
-      MINIO_ROOT_USER: snapgram
-      MINIO_ROOT_PASSWORD: snapgram-minio-dev-password
+    env_file:
+      - ../.env
```

## 5. Verification (dev stack local, 2026-10-16)

```
docker exec snapgram-minio sh -c 'echo ${#MINIO_ROOT_PASSWORD}'   → 13  (khớp .env)
POST /api/media/upload                                            → 201, status = "READY", width/height = 400
GET  /api/media/me                                                → totalElements = 5
```

⇒ Sau fix, media feature hoạt động thật trên dev stack. **Chưa merge** nên `main` vẫn còn bug cho tới khi PR #21 được merge.

## 6. Ghi Chú Vận Hành (không phải bug)

Sau khi restart/recreate một service con, **phải restart `api-gateway`** — Spring Cloud LoadBalancer cache IP cũ của instance nên gateway trả `500` cho tới khi được restart. Gặp 2 lần trong session này (content-service, media-service).

---

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
