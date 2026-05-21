import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';

// Cấu hình lưu trữ tạm thời trong bộ nhớ
const storage = multer.memoryStorage();

// Bộ lọc file - chỉ cho phép hình ảnh
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload hình ảnh (JPEG, PNG, GIF, WebP)'));
  }
};

// Cấu hình multer
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

