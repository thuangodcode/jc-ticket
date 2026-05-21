import express, { Request, Response } from 'express';
import { uploadMiddleware } from '../middleware/upload';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '../utils/upload';

const router = express.Router();

/**
 * Route để upload hình ảnh lên Cloudinary
 * POST /api/upload
 */
router.post(
  ['/upload', '/upload/upload'],
  uploadMiddleware.single('image'),
  async (req: any, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'Không có file được chọn' });
        return;
      }

      // Upload lên Cloudinary
      const result = await uploadImageToCloudinary(
        req.file.buffer,
        `${Date.now()}-${req.file.originalname}`
      );

      res.json({
        success: true,
        message: 'Upload hình ảnh thành công',
        data: {
          url: result.url,
          public_id: result.public_id,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi upload hình ảnh',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Route để xóa hình ảnh từ Cloudinary (sử dụng query parameter để tránh lỗi giải mã đường dẫn chứa ký tự '/')
 * DELETE /api/upload?publicId=...
 */
router.delete('/upload', async (req: Request, res: Response): Promise<void> => {
  try {
    const publicId = req.query.publicId as string;

    if (!publicId) {
      res.status(400).json({ message: 'Public ID là bắt buộc' });
      return;
    }

    await deleteImageFromCloudinary(publicId);

    res.json({
      success: true,
      message: 'Xóa hình ảnh thành công',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa hình ảnh',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Route để xóa hình ảnh từ Cloudinary (fallback cho param-based cũ)
 * DELETE /api/upload/:publicId
 */
router.delete('/upload/:publicId', async (req: Request, res: Response): Promise<void> => {
  try {
    const publicId = req.params.publicId as string;

    if (!publicId) {
      res.status(400).json({ message: 'Public ID là bắt buộc' });
      return;
    }

    await deleteImageFromCloudinary(publicId);

    res.json({
      success: true,
      message: 'Xóa hình ảnh thành công',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa hình ảnh',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
