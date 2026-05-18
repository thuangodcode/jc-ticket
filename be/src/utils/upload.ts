import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

/**
 * Upload hình ảnh lên Cloudinary từ file buffer
 * @param fileBuffer - Buffer của file
 * @param fileName - Tên file để lưu lên Cloudinary
 * @returns Promise chứa URL của hình ảnh đã upload
 */
export const uploadImageToCloudinary = (
  fileBuffer: Buffer,
  fileName: string
): Promise<{ url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: fileName,
        folder: 'jc-ticket', // Thư mục trên Cloudinary
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result?.secure_url || '',
            public_id: result?.public_id || '',
          });
        }
      }
    );

    // Đưa buffer vào stream
    const bufferStream = Readable.from(fileBuffer);
    bufferStream.pipe(stream);
  });
};

/**
 * Xóa hình ảnh từ Cloudinary
 * @param publicId - Public ID của hình ảnh trên Cloudinary
 */
export const deleteImageFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Lỗi khi xóa hình ảnh: ${error}`);
  }
};

/**
 * Lấy thông tin hình ảnh từ Cloudinary
 * @param publicId - Public ID của hình ảnh
 */
export const getImageInfo = async (publicId: string) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    throw new Error(`Lỗi khi lấy thông tin hình ảnh: ${error}`);
  }
};
