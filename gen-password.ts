import bcrypt from 'bcryptjs';

async function main() {
  const password = 'password123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.error(`Password: ${password}`);
  console.error(`Hash: ${hash}`);
}

main(); 