import { Response } from 'express';
import { GoogleGenerativeAI, Tool, SchemaType } from '@google/generative-ai';
import { AuthRequest } from '../middleware/auth';
import { Event } from '../models/Event';
import { Booking } from '../models/Booking';
import { Ticket } from '../models/Ticket';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ─────────────────────────────────────────────
// Helper: format VND currency
// ─────────────────────────────────────────────
const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// ─────────────────────────────────────────────
// Tool: search events (USER)
// ─────────────────────────────────────────────
async function toolSearchEvents(args: { query?: string; category?: string; limit?: number }) {
  const filter: any = { status: 'active' };
  if (args.category) filter.category = { $regex: args.category, $options: 'i' };
  if (args.query) {
    filter.$or = [
      { title: { $regex: args.query, $options: 'i' } },
      { description: { $regex: args.query, $options: 'i' } },
      { location: { $regex: args.query, $options: 'i' } },
    ];
  }

  const events = await Event.find(filter)
    .select('title description date location category price availableSeats image')
    .sort({ date: 1 })
    .limit(args.limit || 5);

  if (!events.length) return { found: false, message: 'Không tìm thấy sự kiện phù hợp.' };

  return {
    found: true,
    count: events.length,
    events: events.map((e) => ({
      id: e._id,
      title: e.title,
      date: new Date(e.date).toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      }),
      location: e.location,
      category: e.category,
      price: formatVND(e.price),
      availableSeats: e.availableSeats,
    })),
  };
}

// ─────────────────────────────────────────────
// Tool: get user bookings (USER — requires auth)
// ─────────────────────────────────────────────
async function toolGetMyBookings(userId: string, args: { limit?: number }) {
  const bookings = await Booking.find({ userId })
    .populate('eventId', 'title date location')
    .sort({ createdAt: -1 })
    .limit(args.limit || 5);

  if (!bookings.length) return { found: false, message: 'Bạn chưa có đơn hàng nào.' };

  return {
    found: true,
    count: bookings.length,
    bookings: bookings.map((b: any) => ({
      code: b.bookingCode,
      event: b.eventId?.title || 'N/A',
      date: b.eventId?.date
        ? new Date(b.eventId.date).toLocaleDateString('vi-VN')
        : 'N/A',
      totalPrice: formatVND(b.totalPrice),
      paymentStatus: b.paymentStatus,
      status: b.status,
    })),
  };
}

// ─────────────────────────────────────────────
// Tool: get user tickets (USER — requires auth)
// ─────────────────────────────────────────────
async function toolGetMyTickets(userId: string, args: { limit?: number }) {
  const tickets = await Ticket.find({ userId })
    .populate('eventId', 'title date location')
    .sort({ createdAt: -1 })
    .limit(args.limit || 5);

  if (!tickets.length) return { found: false, message: 'Bạn chưa có vé nào.' };

  return {
    found: true,
    count: tickets.length,
    tickets: tickets.map((t: any) => ({
      code: t.ticketCode,
      event: t.eventId?.title || 'N/A',
      date: t.eventId?.date
        ? new Date(t.eventId.date).toLocaleDateString('vi-VN')
        : 'N/A',
      ticketType: t.ticketType,
      isUsed: t.isUsed,
    })),
  };
}

// ─────────────────────────────────────────────
// Tool: booking stats (ADMIN)
// ─────────────────────────────────────────────
async function toolGetBookingStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [total, pending, successful, cancelled, revenueResult, todayBookings, todayRevResult] =
    await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ paymentStatus: 'pending' }),
      Booking.countDocuments({ paymentStatus: 'successful' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'successful' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Booking.countDocuments({ createdAt: { $gte: today } }),
      Booking.aggregate([
        { $match: { paymentStatus: 'successful', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ]);

  return {
    totalBookings: total,
    pendingBookings: pending,
    successfulBookings: successful,
    cancelledBookings: cancelled,
    totalRevenue: formatVND(revenueResult[0]?.total || 0),
    revenueThisMonth: formatVND(todayRevResult[0]?.total || 0),
    bookingsToday: todayBookings,
    conversionRate: total > 0 ? `${((successful / total) * 100).toFixed(1)}%` : '0%',
  };
}

// ─────────────────────────────────────────────
// Tool: get all bookings with filter (ADMIN)
// ─────────────────────────────────────────────
async function toolGetAllBookings(args: {
  paymentStatus?: string;
  status?: string;
  limit?: number;
  search?: string;
}) {
  const filter: any = {};
  if (args.paymentStatus) filter.paymentStatus = args.paymentStatus;
  if (args.status) filter.status = args.status;
  if (args.search) {
    filter.$or = [
      { bookingCode: { $regex: args.search, $options: 'i' } },
      { 'passengerInfo.name': { $regex: args.search, $options: 'i' } },
    ];
  }

  const bookings = await Booking.find(filter)
    .populate('eventId', 'title date')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(args.limit || 10);

  if (!bookings.length) return { found: false, message: 'Không có đơn hàng nào phù hợp.' };

  return {
    found: true,
    count: bookings.length,
    bookings: bookings.map((b: any) => ({
      code: b.bookingCode,
      customer: b.passengerInfo?.name || b.userId?.name || 'N/A',
      email: b.passengerInfo?.email || b.userId?.email || 'N/A',
      event: b.eventId?.title || 'N/A',
      totalPrice: formatVND(b.totalPrice),
      paymentStatus: b.paymentStatus,
      status: b.status,
      createdAt: new Date(b.createdAt).toLocaleDateString('vi-VN'),
    })),
  };
}

// ─────────────────────────────────────────────
// Tool: top events by revenue (ADMIN)
// ─────────────────────────────────────────────
async function toolGetTopEvents(args: { limit?: number }) {
  const eventStatsRaw = await Booking.aggregate([
    { $match: { paymentStatus: 'successful' } },
    {
      $group: {
        _id: '$eventId',
        revenue: { $sum: '$totalPrice' },
        ticketsSold: { $sum: { $size: '$selectedSeats' } },
        bookingsCount: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: args.limit || 5 },
  ]);

  const results = await Promise.all(
    eventStatsRaw.map(async (item) => {
      const event = await Event.findById(item._id).select('title date location status');
      return {
        title: event?.title || 'Sự kiện khác',
        date: event?.date ? new Date(event.date).toLocaleDateString('vi-VN') : 'N/A',
        location: event?.location || 'N/A',
        status: event?.status || 'N/A',
        revenue: formatVND(item.revenue),
        ticketsSold: item.ticketsSold,
        bookingsCount: item.bookingsCount,
      };
    })
  );

  return { found: true, count: results.length, events: results };
}

// ─────────────────────────────────────────────
// Tool: ticket stats (ADMIN)
// ─────────────────────────────────────────────
async function toolGetTicketStats() {
  const [total, used, unused] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.countDocuments({ isUsed: true }),
    Ticket.countDocuments({ isUsed: false }),
  ]);

  return {
    totalTickets: total,
    usedTickets: used,
    unusedTickets: unused,
    usageRate: total > 0 ? `${((used / total) * 100).toFixed(1)}%` : '0%',
  };
}

// ─────────────────────────────────────────────
// Tool definitions for Gemini
// ─────────────────────────────────────────────
const userToolDefs: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'searchEvents',
        description: 'Tìm kiếm sự kiện theo từ khóa, danh mục. Dùng khi user hỏi về sự kiện.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: 'Từ khóa tìm kiếm' },
            category: { type: SchemaType.STRING, description: 'Danh mục: music, sport, art, conference, etc.' },
            limit: { type: SchemaType.NUMBER, description: 'Số lượng kết quả, mặc định 5' },
          },
        },
      },
      {
        name: 'getMyBookings',
        description: 'Lấy danh sách đơn hàng của user. Dùng khi user hỏi về đơn đặt vé của họ.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            limit: { type: SchemaType.NUMBER, description: 'Số lượng kết quả, mặc định 5' },
          },
        },
      },
      {
        name: 'getMyTickets',
        description: 'Lấy danh sách vé của user. Dùng khi user hỏi về vé của họ.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            limit: { type: SchemaType.NUMBER, description: 'Số lượng kết quả, mặc định 5' },
          },
        },
      },
    ],
  },
];

const adminToolDefs: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'getBookingStats',
        description: 'Lấy thống kê tổng quan: tổng doanh thu, số đơn hàng, tỷ lệ chuyển đổi...',
        parameters: { type: SchemaType.OBJECT, properties: {} },
      },
      {
        name: 'getAllBookings',
        description: 'Lấy danh sách đơn hàng với filter. Dùng để liệt kê, tra cứu đơn.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            paymentStatus: { type: SchemaType.STRING, description: 'pending | successful | failed | refunded' },
            status: { type: SchemaType.STRING, description: 'pending | confirmed | cancelled' },
            limit: { type: SchemaType.NUMBER, description: 'Số lượng kết quả' },
            search: { type: SchemaType.STRING, description: 'Tìm theo mã đơn hoặc tên khách' },
          },
        },
      },
      {
        name: 'getTopEvents',
        description: 'Lấy top sự kiện theo doanh thu và số vé bán được.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            limit: { type: SchemaType.NUMBER, description: 'Số lượng sự kiện, mặc định 5' },
          },
        },
      },
      {
        name: 'getTicketStats',
        description: 'Thống kê vé: tổng số vé, đã sử dụng, chưa sử dụng, tỷ lệ sử dụng.',
        parameters: { type: SchemaType.OBJECT, properties: {} },
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Execute tool call helper
// ─────────────────────────────────────────────
async function executeUserTool(name: string, args: any, userId?: string): Promise<any> {
  switch (name) {
    case 'searchEvents': return toolSearchEvents(args);
    case 'getMyBookings':
      if (!userId) return { error: 'Bạn cần đăng nhập để xem đơn hàng.' };
      return toolGetMyBookings(userId, args);
    case 'getMyTickets':
      if (!userId) return { error: 'Bạn cần đăng nhập để xem vé.' };
      return toolGetMyTickets(userId, args);
    default: return { error: `Tool "${name}" không tồn tại.` };
  }
}

async function executeAdminTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'getBookingStats': return toolGetBookingStats();
    case 'getAllBookings': return toolGetAllBookings(args);
    case 'getTopEvents': return toolGetTopEvents(args);
    case 'getTicketStats': return toolGetTicketStats();
    default: return { error: `Tool "${name}" không tồn tại.` };
  }
}

// ─────────────────────────────────────────────
// Core Gemini chat with function calling loop
// ─────────────────────────────────────────────
async function runGeminiChat(
  systemPrompt: string,
  tools: Tool[],
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  userMessage: string,
  toolExecutor: (name: string, args: any) => Promise<any>
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: systemPrompt,
    tools,
  });

  const chat = model.startChat({ history });

  let result = await chat.sendMessage(userMessage);
  let response = result.response;

  // Function calling loop (max 3 iterations to prevent infinite loop)
  let iterations = 0;
  while (response.functionCalls()?.length && iterations < 3) {
    iterations++;
    const calls = response.functionCalls()!;

    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      calls.map(async (call) => {
        const toolResult = await toolExecutor(call.name, call.args || {});
        return {
          functionResponse: {
            name: call.name,
            response: toolResult,
          },
        };
      })
    );

    // Send tool results back
    result = await chat.sendMessage(toolResults as any);
    response = result.response;
  }

  return response.text();
}

// ─────────────────────────────────────────────
// POST /api/ai/user-chat
// ─────────────────────────────────────────────
export const userChat = async (req: AuthRequest, res: Response) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }

    const userId = req.user?.id;

    const systemPrompt = `Bạn là JC Assistant — trợ lý AI thân thiện của nền tảng bán vé sự kiện JC-Ticket.
Nhiệm vụ của bạn: giúp người dùng tìm kiếm sự kiện, kiểm tra đơn hàng, xem vé, và trả lời các câu hỏi về dịch vụ.

Hướng dẫn:
- Luôn trả lời bằng tiếng Việt, thân thiện và ngắn gọn (tối đa 3-4 câu mỗi đoạn)
- Dùng emoji phù hợp để làm cho câu trả lời sinh động hơn
- Khi hiển thị danh sách sự kiện hoặc đơn hàng, format rõ ràng từng mục
- Nếu user chưa đăng nhập và hỏi về đơn hàng/vé, hãy nhắc họ đăng nhập
- Không bịa ra thông tin nếu tool không trả về kết quả
- Khi gợi ý sự kiện, nhấn mạnh số ghế còn lại và giá vé

Thông tin về JC-Ticket:
- Hỗ trợ thanh toán: VNPay, ZaloPay
- Có thể tải vé PDF sau khi đặt thành công
- Vé có mã QR để check-in tại sự kiện
- Đơn hàng hết hạn sau 30 phút nếu chưa thanh toán`;

    // Format history for Gemini
    const formattedHistory = (history || [])
      .filter((h: any) => h.role && h.content)
      .map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

    const reply = await runGeminiChat(
      systemPrompt,
      userToolDefs,
      formattedHistory,
      message.trim(),
      (name, args) => executeUserTool(name, args, userId)
    );

    return res.json({ success: true, reply });
  } catch (error: any) {
    console.error('User AI chat error:', error);
    if (error?.status === 429) {
      return res.status(429).json({ success: false, message: 'AI đang bận, vui lòng thử lại sau vài giây.' });
    }
    return res.status(500).json({ success: false, message: 'AI service error. Please try again.' });
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/admin-chat
// ─────────────────────────────────────────────
export const adminChat = async (req: AuthRequest, res: Response) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }

    const systemPrompt = `Bạn là JC Admin AI — trợ lý phân tích dữ liệu chuyên nghiệp của hệ thống quản lý JC-Ticket.
Bạn hỗ trợ Admin trong việc: thống kê doanh thu, phân tích đơn hàng, báo cáo sự kiện, và đưa ra insights.

Hướng dẫn:
- Luôn trả lời bằng tiếng Việt, chuyên nghiệp và chính xác
- Khi trình bày số liệu, luôn kèm đơn vị (₫, đơn, vé, %)
- Khi liệt kê nhiều items, dùng danh sách có số thứ tự hoặc bullet points
- Luôn dùng tools để lấy dữ liệu thực, không đoán mò
- Sau khi có dữ liệu, hãy phân tích và đưa ra nhận xét/gợi ý hữu ích
- Nếu số liệu tốt, hãy khen ngợi; nếu có vấn đề, hãy chỉ ra và gợi ý cải thiện
- Format số tiền rõ ràng với đơn vị ₫

Ví dụ về insights bạn có thể đưa ra:
- So sánh hiệu suất giữa các sự kiện
- Cảnh báo đơn hàng pending quá nhiều
- Gợi ý thời điểm tổ chức sự kiện hiệu quả
- Phân tích tỷ lệ hoàn vé và chuyển đổi`;

    const formattedHistory = (history || [])
      .filter((h: any) => h.role && h.content)
      .map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

    const reply = await runGeminiChat(
      systemPrompt,
      adminToolDefs,
      formattedHistory,
      message.trim(),
      (name, args) => executeAdminTool(name, args)
    );

    return res.json({ success: true, reply });
  } catch (error: any) {
    console.error('Admin AI chat error:', error);
    if (error?.status === 429) {
      return res.status(429).json({ success: false, message: 'AI đang bận, vui lòng thử lại sau vài giây.' });
    }
    return res.status(500).json({ success: false, message: 'AI service error. Please try again.' });
  }
};
