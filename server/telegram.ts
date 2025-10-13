
import TelegramBot from 'node-telegram-bot-api';

// معلومات البوت - يجب إضافتها في متغيرات البيئة
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '';

let bot: TelegramBot | null = null;

// تهيئة البوت
export function initTelegramBot() {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    console.log('⚠️ Telegram bot not configured. Add TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID to environment variables.');
    return;
  }

  try {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
    console.log('✅ Telegram bot initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Telegram bot:', error);
  }
}

// إرسال إشعار لمستخدم جديد
export async function notifyNewUser(username: string, email: string, referralCode: string) {
  if (!bot || !TELEGRAM_ADMIN_CHAT_ID) return;

  const message = `
🆕 <b>مستخدم جديد</b>

👤 اسم المستخدم: <code>${username}</code>
📧 البريد: <code>${email}</code>
🔗 كود الإحالة: <code>${referralCode}</code>
⏰ الوقت: ${new Date().toLocaleString('ar-EG')}
  `.trim();

  try {
    await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

// إشعار طلب إيداع جديد
export async function notifyNewDeposit(username: string, amount: number, currency: string, paymentMethod: string) {
  if (!bot || !TELEGRAM_ADMIN_CHAT_ID) return;

  const currencySymbol = currency === 'USD' ? '$' : '£';
  const message = `
💰 <b>طلب إيداع جديد</b>

👤 المستخدم: <code>${username}</code>
💵 المبلغ: <b>${currencySymbol}${amount.toLocaleString()}</b>
💳 الطريقة: ${paymentMethod}
⏰ الوقت: ${new Date().toLocaleString('ar-EG')}

⚠️ يحتاج إلى مراجعة وموافقة
  `.trim();

  try {
    await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

// إشعار طلب سحب جديد
export async function notifyNewWithdrawal(username: string, amount: number, paymentMethod: string, address: string) {
  if (!bot || !TELEGRAM_ADMIN_CHAT_ID) return;

  const message = `
💸 <b>طلب سحب جديد</b>

👤 المستخدم: <code>${username}</code>
💵 المبلغ: <b>£${amount.toLocaleString()}</b>
💳 الطريقة: ${paymentMethod}
📍 العنوان: <code>${address}</code>
⏰ الوقت: ${new Date().toLocaleString('ar-EG')}

⚠️ يحتاج إلى مراجعة وموافقة
  `.trim();

  try {
    await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

// إشعار موافقة/رفض إيداع
export async function notifyDepositStatus(username: string, amount: number, status: 'approved' | 'rejected') {
  if (!bot || !TELEGRAM_ADMIN_CHAT_ID) return;

  const emoji = status === 'approved' ? '✅' : '❌';
  const statusText = status === 'approved' ? 'تمت الموافقة' : 'تم الرفض';
  
  const message = `
${emoji} <b>تحديث حالة الإيداع</b>

👤 المستخدم: <code>${username}</code>
💵 المبلغ: <b>£${amount.toLocaleString()}</b>
📊 الحالة: <b>${statusText}</b>
⏰ الوقت: ${new Date().toLocaleString('ar-EG')}
  `.trim();

  try {
    await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

// إشعار موافقة/رفض سحب
export async function notifyWithdrawalStatus(username: string, amount: number, status: 'approved' | 'rejected') {
  if (!bot || !TELEGRAM_ADMIN_CHAT_ID) return;

  const emoji = status === 'approved' ? '✅' : '❌';
  const statusText = status === 'approved' ? 'تمت الموافقة' : 'تم الرفض';
  
  const message = `
${emoji} <b>تحديث حالة السحب</b>

👤 المستخدم: <code>${username}</code>
💵 المبلغ: <b>£${amount.toLocaleString()}</b>
📊 الحالة: <b>${statusText}</b>
⏰ الوقت: ${new Date().toLocaleString('ar-EG')}
  `.trim();

  try {
    await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}
