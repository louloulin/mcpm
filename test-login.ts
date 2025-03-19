import { userRepository } from './lib/database/repositories/userRepository';
import bcrypt from 'bcryptjs';

async function main() {
  try {
    console.error('Testing login validation...');
    
    // 获取用户
    const user = await userRepository.findByUsername('admin');
    console.error('Found user:', user);
    
    if (user && user.password) {
      // 测试密码验证
      const testPassword = 'password123';
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.error(`Password validation for '${testPassword}': ${isValid ? 'SUCCESS' : 'FAILED'}`);
      
      // 测试完整登录验证
      const validatedUser = await userRepository.validateCredentials('admin', testPassword);
      console.error('Validated user:', validatedUser);
    } else {
      console.error('User not found or password not set');
    }
    
    console.error('Login test completed!');
  } catch (error) {
    console.error('Login test error:', error);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 