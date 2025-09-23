# Database Configuration Guide

## PostgreSQL + TypeORM 配置

### 环境变量配置

创建 `.env` 文件并添加以下配置：

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=1d

# Application Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting Configuration
RATE_LIMIT_TTL=60000
RATE_LIMIT_LIMIT=10

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=hyperion
DB_SCHEMA=public

# Logging
LOG_LEVEL=info
```

### Schema 配置说明

1. **DB_SCHEMA**: PostgreSQL 数据库模式名称
   - 默认值: `public`
   - 生产环境建议使用专用的 schema（如 `hyperion_prod`）
   - 开发环境可以使用 `public` 或 `hyperion_dev`

2. **Schema 创建**:

   ```sql
   -- 创建专用 schema (可选)
   CREATE SCHEMA IF NOT EXISTS hyperion_dev;

   -- 设置搜索路径
   SET search_path TO hyperion_dev, public;
   ```

### 数据库迁移

#### 可用的迁移命令

```bash
# 生成新的迁移文件
npm run migration:generate src/migrations/MigrationName

# 运行迁移
npm run migration:run

# 回滚迁移
npm run migration:revert

# 创建空的迁移文件
npm run migration:create src/migrations/MigrationName
```

#### 初始化数据库

1. **启动 PostgreSQL**:

   ```bash
   # 使用 Docker
   docker-compose up postgres -d

   # 或使用本地 PostgreSQL
   brew services start postgresql
   ```

2. **运行迁移**:

   ```bash
   npm run migration:run
   ```

3. **启动应用**:
   ```bash
   npm run start:dev
   ```

### 生产环境注意事项

1. **禁用同步**: 生产环境中 `synchronize` 已设置为 `false`
2. **使用迁移**: 生产环境通过迁移管理数据库结构变更
3. **SSL 连接**: 生产环境启用 SSL 连接
4. **专用 Schema**: 建议为不同环境使用不同的 schema

### Docker 部署

使用 Docker Compose 时，数据库配置已预设：

```bash
# 启动完整应用栈
docker-compose up --build

# 仅启动数据库
docker-compose up postgres -d
```

### 故障排除

1. **连接失败**: 检查数据库服务是否运行
2. **Schema 不存在**: 确保指定的 schema 已创建
3. **权限问题**: 确保数据库用户有对应 schema 的操作权限

```sql
-- 授予用户对 schema 的权限
GRANT ALL PRIVILEGES ON SCHEMA hyperion_dev TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA hyperion_dev TO postgres;
```
