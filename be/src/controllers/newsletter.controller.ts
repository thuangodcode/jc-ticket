import { Request, Response, NextFunction } from 'express';
import { Subscriber } from '../models/Subscriber';
import { sendWelcomeNewsletterEmail } from '../utils/sendEmail';

/**
 * @desc    Đăng ký nhận tin tức mới (Newsletter)
 * @route   POST /api/newsletter/subscribe
 * @access  Public
 */
export const subscribeNewsletter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email hợp lệ.',
      });
      return;
    }

    // Kiểm tra định dạng email cơ bản
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email hợp lệ.',
      });
      return;
    }

    // Kiểm tra email trùng lặp trong database
    const existingSubscriber = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existingSubscriber) {
      res.status(400).json({
        success: false,
        message: 'Email này đã đăng ký nhận bản tin trước đó.',
      });
      return;
    }

    // Tạo subscriber mới
    const subscriber = await Subscriber.create({
      email: email.toLowerCase(),
    });

    // Gửi email chào mừng tự động (chạy background, không block API response)
    sendWelcomeNewsletterEmail(subscriber.email);

    res.status(201).json({
      success: true,
      message: 'Đăng ký nhận bản tin thành công! Vui lòng kiểm tra email của bạn.',
      data: {
        email: subscriber.email,
        subscribedAt: subscriber.subscribedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
