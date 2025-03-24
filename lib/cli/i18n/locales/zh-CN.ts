import { Messages } from '../index';

const messages: Messages = {
  common: {
    error: '错误',
    warning: '警告',
    info: '信息',
    success: '成功',
    confirm: '确认',
    cancel: '取消',
    yes: '是',
    no: '否',
    loading: '加载中...',
    notFound: '未找到',
    invalidInput: '无效输入',
    retry: '重试',
    exit: '退出',
    help: '帮助',
    version: '版本'
  },
  cli: {
    welcome: '欢迎使用 MCPM CLI',
    goodbye: '感谢使用 MCPM CLI',
    helpText: '使用 --help 查看使用信息',
    exampleHeader: '示例',
    documentationHeader: '文档'
  },
  commands: {
    scaffold: {
      creating: '正在创建新的 MCP 服务器项目',
      created: 'MCP 服务器项目创建成功',
      error: '创建 MCP 服务器项目时出错',
      templateNotFound: '未找到模板',
      confirmOverwrite: '目录已存在。是否覆盖？',
      scaffoldOptions: '脚手架选项'
    },
    deploy: {
      deploying: '正在部署 MCP 服务器',
      deployed: 'MCP 服务器部署成功',
      error: '部署 MCP 服务器时出错',
      confirmDeploy: '部署到{0}环境？',
      deployOptions: '部署选项',
      preparingDeploy: '准备部署',
      checkingEnv: '检查环境变量',
      uploadingFiles: '上传文件',
      configuringServer: '配置服务器',
      startingServer: '启动服务器'
    },
    status: {
      checking: '正在检查 MCP 服务器状态',
      online: 'MCP 服务器在线',
      offline: 'MCP 服务器离线',
      error: '检查服务器状态时出错',
      statusOptions: '状态选项',
      checkingConnection: '检查连接',
      resourceStatus: '资源状态',
      healthStatus: '健康状态'
    },
    logs: {
      fetching: '正在获取 MCP 服务器日志',
      error: '获取日志时出错',
      noLogs: '未找到日志',
      logsOptions: '日志选项',
      filtering: '过滤日志',
      streamingLogs: '实时日志流'
    },
    update: {
      checking: '正在检查更新',
      updating: '正在更新 MCP 服务器',
      updated: 'MCP 服务器更新成功',
      noUpdates: '没有可用更新',
      error: '更新 MCP 服务器时出错',
      confirmUpdate: '更新 MCP 服务器到版本 {0}？',
      updateOptions: '更新选项',
      preparingUpdate: '准备更新',
      backingUp: '创建备份',
      downloadingUpdate: '下载更新',
      applyingUpdate: '应用更新',
      testingUpdate: '测试更新',
      rollingBack: '回滚更新'
    },
    backup: {
      creating: '正在创建 MCP 服务器备份',
      created: 'MCP 服务器备份创建成功',
      error: '创建备份时出错',
      confirmBackup: '创建{0}环境的备份？',
      backupOptions: '备份选项',
      preparingBackup: '准备备份',
      savingDatabase: '保存数据库',
      savingFiles: '保存文件',
      compressing: '压缩备份',
      uploading: '上传备份',
      cleaningUp: '清理'
    },
    restore: {
      restoring: '正在从备份恢复 MCP 服务器',
      restored: 'MCP 服务器恢复成功',
      error: '从备份恢复时出错',
      confirmRestore: '从备份{0}恢复？',
      restoreOptions: '恢复选项',
      preparingRestore: '准备恢复',
      downloadingBackup: '下载备份',
      extractingBackup: '解压备份',
      restoringDatabase: '恢复数据库',
      restoringFiles: '恢复文件',
      finishingRestore: '完成恢复'
    },
    language: {
      description: '更改CLI的语言设置',
      listOption: '列出可用的语言',
      setOption: '设置CLI语言 (en, zh-CN, zh-TW, ja, ko)',
      currentOption: '显示当前语言设置',
      availableLanguages: '可用语言:',
      current: '当前',
      currentLanguage: '当前语言:',
      languageChanged: '语言已更改为: {0}',
      restartRequired: '重启CLI后更改将生效',
      setError: '设置语言失败: {0}',
      availableOptions: '可用的语言选项:',
      commandTitle: '语言命令:',
      operationError: '语言操作失败: {0}'
    }
  },
  errors: {
    missingRequiredOption: '缺少必需选项：{0}',
    invalidOption: '无效选项：{0}',
    fileNotFound: '文件未找到：{0}',
    directoryNotFound: '目录未找到：{0}',
    permissionDenied: '权限被拒绝：{0}',
    networkError: '网络错误：{0}',
    timeoutError: '超时错误：{0}',
    unknownError: '发生未知错误',
    environmentVariableMissing: '缺少环境变量：{0}',
    configError: '配置错误：{0}',
    validationError: '验证错误：{0}',
    cloudProviderError: '云服务商错误：{0}'
  },
  clouds: {
    aws: {
      name: '亚马逊云服务',
      missingCredentials: '缺少 AWS 凭证',
      deployingLambda: '部署 Lambda 函数',
      deployingECS: '部署 ECS 服务',
      configuringRDS: '配置 RDS 数据库',
      configuringS3: '配置 S3 存储桶',
      configuringRoute53: '配置 Route 53'
    },
    gcp: {
      name: '谷歌云平台',
      missingCredentials: '缺少 GCP 凭证',
      deployingCloudRun: '部署 Cloud Run 服务',
      deployingGKE: '部署到 GKE',
      configuringCloudSQL: '配置 Cloud SQL 数据库',
      configuringCloudStorage: '配置 Cloud Storage',
      configuringCloudDNS: '配置 Cloud DNS'
    },
    azure: {
      name: '微软 Azure',
      missingCredentials: '缺少 Azure 凭证',
      deployingAppService: '部署 App Service',
      deployingAKS: '部署到 AKS',
      configuringAzureSQL: '配置 Azure SQL 数据库',
      configuringBlobStorage: '配置 Blob Storage',
      configuringAzureDNS: '配置 Azure DNS'
    },
    alibaba: {
      name: '阿里云',
      missingCredentials: '缺少阿里云凭证',
      deployingECS: '部署 ECS 实例',
      deployingACK: '部署到 ACK',
      configuringRDS: '配置 ApsaraDB RDS',
      configuringOSS: '配置 OSS 存储桶',
      configuringDNS: '配置阿里云 DNS'
    }
  }
};

export = messages; 