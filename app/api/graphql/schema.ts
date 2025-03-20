// GraphQL 模式定义
export const typeDefs = `
  # 服务器类型
  type Server {
    id: ID!
    key: String!
    name: String!
    description: String
    version: String
    author: User
    homepage: String
    repository: String
    license: String
    tags: [String]
    tools: [String]
    startCommand: String
    envVars: [EnvVar]
    downloads: Int
    rating: Float
    compatibleClients: [String]
    createdAt: String
    updatedAt: String
  }

  # 环境变量类型
  type EnvVar {
    name: String!
    description: String
    required: Boolean
    default: String
  }

  # 用户类型
  type User {
    id: ID!
    username: String!
    email: String!
    fullName: String
    bio: String
    avatarUrl: String
    role: String
    createdAt: String
    servers: [Server]
  }

  # 统计概览类型
  type StatsOverview {
    servers: ServerStats
    users: UserStats
    requests: RequestStats
    resources: ResourceStats
    timestamp: String
  }

  # 服务器统计类型
  type ServerStats {
    total: Int!
    active: Int!
    inactive: Int!
  }

  # 用户统计类型
  type UserStats {
    total: Int!
    activeToday: Int!
    activeWeek: Int!
    activeMonth: Int!
  }

  # 请求统计类型
  type RequestStats {
    today: Int!
    week: Int!
    month: Int!
    avgResponseTime: Float!
  }

  # 资源使用统计类型
  type ResourceStats {
    cpuUsage: Float!
    memoryUsage: Float!
    storageUsage: Float!
  }

  # 分页信息
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # 服务器连接（用于分页）
  type ServerConnection {
    edges: [ServerEdge]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  # 服务器边（用于分页）
  type ServerEdge {
    node: Server!
    cursor: String!
  }

  # 用户连接（用于分页）
  type UserConnection {
    edges: [UserEdge]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  # 用户边（用于分页）
  type UserEdge {
    node: User!
    cursor: String!
  }

  # 查询
  type Query {
    # 服务器查询
    server(key: String!): Server
    servers(
      first: Int
      after: String
      filter: ServerFilter
      sort: ServerSort
    ): ServerConnection!
    
    # 用户查询
    user(id: ID!): User
    users(
      first: Int
      after: String
      filter: UserFilter
      sort: UserSort
    ): UserConnection!
    me: User
    
    # 统计查询
    statsOverview: StatsOverview!
    popularServers(
      period: StatsPeriod
      limit: Int
    ): [Server]!
    
    # 搜索
    searchServers(query: String!, limit: Int): [Server]!
  }

  # 服务器过滤器
  input ServerFilter {
    tag: String
    search: String
    author: ID
    minRating: Float
    license: String
  }

  # 服务器排序
  enum ServerSort {
    CREATED_ASC
    CREATED_DESC
    DOWNLOADS_ASC
    DOWNLOADS_DESC
    RATING_ASC
    RATING_DESC
    NAME_ASC
    NAME_DESC
  }

  # 用户过滤器
  input UserFilter {
    role: String
    search: String
  }

  # 用户排序
  enum UserSort {
    CREATED_ASC
    CREATED_DESC
    USERNAME_ASC
    USERNAME_DESC
  }

  # 统计周期
  enum StatsPeriod {
    DAY
    WEEK
    MONTH
    YEAR
  }

  # 突变（修改操作）
  type Mutation {
    # 服务器操作
    createServer(input: CreateServerInput!): Server!
    updateServer(key: String!, input: UpdateServerInput!): Server!
    deleteServer(key: String!): Boolean!
    
    # 用户操作
    login(username: String!, password: String!): AuthPayload!
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    
    # 令牌操作
    createToken(input: CreateTokenInput!): Token!
    revokeToken(id: ID!): Boolean!
  }

  # 认证负载
  type AuthPayload {
    token: String!
    user: User!
    expiresAt: String!
  }

  # 令牌类型
  type Token {
    id: ID!
    token: String!
    name: String!
    scopes: [String]!
    createdAt: String!
    expiresAt: String!
  }

  # 创建服务器输入
  input CreateServerInput {
    key: String!
    name: String!
    description: String
    version: String!
    homepage: String
    repository: String
    license: String
    tags: [String]
    tools: [String]
    startCommand: String
    envVars: [EnvVarInput]
    compatibleClients: [String]
  }

  # 更新服务器输入
  input UpdateServerInput {
    name: String
    description: String
    version: String
    homepage: String
    repository: String
    license: String
    tags: [String]
    tools: [String]
    startCommand: String
    envVars: [EnvVarInput]
    compatibleClients: [String]
  }

  # 环境变量输入
  input EnvVarInput {
    name: String!
    description: String
    required: Boolean
    default: String
  }

  # 创建用户输入
  input CreateUserInput {
    username: String!
    email: String!
    password: String!
    fullName: String
    bio: String
    avatarUrl: String
  }

  # 更新用户输入
  input UpdateUserInput {
    email: String
    password: String
    fullName: String
    bio: String
    avatarUrl: String
  }

  # 创建令牌输入
  input CreateTokenInput {
    name: String!
    expiresIn: Int
    scopes: [String]!
  }
`;

export default typeDefs; 