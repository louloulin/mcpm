-- 删除原有的外键约束
ALTER TABLE IF EXISTS "server_downloads" DROP CONSTRAINT IF EXISTS "server_downloads_user_id_users_id_fk";
ALTER TABLE IF EXISTS "server_downloads" DROP CONSTRAINT IF EXISTS "server_downloads_server_id_servers_id_fk";

-- 确保server_downloads的user_id和server_id字段是UUID类型
ALTER TABLE IF EXISTS "server_downloads" ALTER COLUMN "id" TYPE uuid USING (gen_random_uuid());
ALTER TABLE IF EXISTS "server_downloads" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "server_downloads" ALTER COLUMN "user_id" TYPE uuid USING (gen_random_uuid());
ALTER TABLE IF EXISTS "server_downloads" ALTER COLUMN "server_id" TYPE uuid USING (gen_random_uuid());

-- 重新添加外键约束
ALTER TABLE IF EXISTS "server_downloads" ADD CONSTRAINT "server_downloads_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE IF EXISTS "server_downloads" ADD CONSTRAINT "server_downloads_server_id_servers_id_fk" 
  FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE; 