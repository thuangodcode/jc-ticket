import './src/config/loadEnv';
import { sendVerificationOTP, sendPasswordResetOTP } from './src/utils/sendEmail';

async function main() {
  console.log('Testing sendVerificationOTP...');
  try {
    await sendVerificationOTP('120304thuan@gmail.com', 'Thuan Local', '123456');
    console.log('✅ sendVerificationOTP succeeded');
  } catch (err: any) {
    console.error('❌ sendVerificationOTP failed:', err.message);
  }

  console.log('Testing sendPasswordResetOTP...');
  try {
    await sendPasswordResetOTP('120304thuan@gmail.com', 'Thuan Local', '654321');
    console.log('✅ sendPasswordResetOTP succeeded');
  } catch (err: any) {
    console.error('❌ sendPasswordResetOTP failed:', err.message);
  }
}

main();
