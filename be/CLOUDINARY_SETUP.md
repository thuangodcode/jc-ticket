# Hướng dẫn sử dụng Cloudinary

## 1. Thiết lập đã hoàn tất ✅

Các file sau đã được tạo:

- **`.env`** - Chứa thông tin Cloudinary (Cloud Name, API Key, API Secret)
- **`src/config/cloudinary.ts`** - File cấu hình Cloudinary
- **`src/utils/upload.ts`** - Hàm tiện ích để upload/xóa hình ảnh
- **`src/middleware/upload.ts`** - Middleware xử lý file upload
- **`src/routes/upload.ts`** - Routes API cho upload/xóa hình ảnh

## 2. API Endpoints

### Upload hình ảnh
```bash
POST /api/upload
Content-Type: multipart/form-data

Body:
- image: <file>
```

**Response:**
```json
{
  "success": true,
  "message": "Upload hình ảnh thành công",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "public_id": "jc-ticket/1234567890-image.jpg"
  }
}
```

### Xóa hình ảnh
```bash
DELETE /api/upload/{public_id}
```

**Response:**
```json
{
  "success": true,
  "message": "Xóa hình ảnh thành công"
}
```

## 3. Sử dụng trong Code

### Upload hình ảnh
```typescript
import { uploadImageToCloudinary } from './utils/upload';

// Giả sử bạn có file buffer
const result = await uploadImageToCloudinary(fileBuffer, 'my-image.jpg');
console.log(result.url); // URL hình ảnh
console.log(result.public_id); // ID công khai
```

### Xóa hình ảnh
```typescript
import { deleteImageFromCloudinary } from './utils/upload';

await deleteImageFromCloudinary('jc-ticket/my-image.jpg');
```

### Lấy thông tin hình ảnh
```typescript
import { getImageInfo } from './utils/upload';

const info = await getImageInfo('jc-ticket/my-image.jpg');
```

## 4. Thông tin Cloudinary

- **Cloud Name:** dvoexcswb
- **API Key:** 933528452158896
- **Folder:** jc-ticket

## 5. Giới hạn

- **File size:** 5MB tối đa
- **Các loại file hỗ trợ:** JPEG, PNG, GIF, WebP

## 6. Test API

Dùng curl hoặc Postman:

```bash
# Upload
curl -X POST http://localhost:5000/api/upload \
  -F "image=@/path/to/image.jpg"

# Xóa
curl -X DELETE http://localhost:5000/api/upload/jc-ticket/image-name
```

## 7. Lưu ý bảo mật

- ⚠️ Không commit file `.env` lên Git
- ⚠️ Chỉ sử dụng API Secret trên server (backend)
- ⚠️ Để quản lý công khai, hãy sử dụng Signed URLs hoặc Upload Presets

---

Mọi chi tiết thêm tại: https://cloudinary.com/documentation
