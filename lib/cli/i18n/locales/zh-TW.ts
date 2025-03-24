import { Messages } from '../index';

// 繁体中文翻译，这里暂时复用简体中文，后期可由专业翻译完善
const messages: Messages = {
  common: {
    error: '錯誤',
    warning: '警告',
    info: '信息',
    success: '成功',
    confirm: '確認',
    cancel: '取消',
    yes: '是',
    no: '否',
    loading: '加載中...',
    notFound: '未找到',
    invalidInput: '無效輸入',
    retry: '重試',
    exit: '退出',
    help: '幫助',
    version: '版本'
  },
  cli: {
    welcome: '歡迎使用 MCPM CLI',
    goodbye: '感謝使用 MCPM CLI',
    helpText: '使用 --help 查看使用信息',
    exampleHeader: '示例',
    documentationHeader: '文檔'
  },
  commands: {
    scaffold: {
      creating: '正在創建新的 MCP 服務器項目',
      created: 'MCP 服務器項目創建成功',
      error: '創建 MCP 服務器項目時出錯',
      templateNotFound: '未找到模板',
      confirmOverwrite: '目錄已存在。是否覆蓋？',
      scaffoldOptions: '腳手架選項'
    },
    deploy: {
      deploying: '正在部署 MCP 服務器',
      deployed: 'MCP 服務器部署成功',
      error: '部署 MCP 服務器時出錯',
      confirmDeploy: '部署到{0}環境？',
      deployOptions: '部署選項',
      preparingDeploy: '準備部署',
      checkingEnv: '檢查環境變量',
      uploadingFiles: '上傳文件',
      configuringServer: '配置服務器',
      startingServer: '啟動服務器'
    },
    status: {
      checking: '正在檢查 MCP 服務器狀態',
      online: 'MCP 服務器在線',
      offline: 'MCP 服務器離線',
      error: '檢查服務器狀態時出錯',
      statusOptions: '狀態選項',
      checkingConnection: '檢查連接',
      resourceStatus: '資源狀態',
      healthStatus: '健康狀態'
    },
    logs: {
      fetching: '正在獲取 MCP 服務器日誌',
      error: '獲取日誌時出錯',
      noLogs: '未找到日誌',
      logsOptions: '日誌選項',
      filtering: '過濾日誌',
      streamingLogs: '實時日誌流'
    },
    update: {
      checking: '正在檢查更新',
      updating: '正在更新 MCP 服務器',
      updated: 'MCP 服務器更新成功',
      noUpdates: '沒有可用更新',
      error: '更新 MCP 服務器時出錯',
      confirmUpdate: '更新 MCP 服務器到版本 {0}？',
      updateOptions: '更新選項',
      preparingUpdate: '準備更新',
      backingUp: '創建備份',
      downloadingUpdate: '下載更新',
      applyingUpdate: '應用更新',
      testingUpdate: '測試更新',
      rollingBack: '回滾更新'
    },
    backup: {
      creating: '正在創建 MCP 服務器備份',
      created: 'MCP 服務器備份創建成功',
      error: '創建備份時出錯',
      confirmBackup: '創建{0}環境的備份？',
      backupOptions: '備份選項',
      preparingBackup: '準備備份',
      savingDatabase: '保存數據庫',
      savingFiles: '保存文件',
      compressing: '壓縮備份',
      uploading: '上傳備份',
      cleaningUp: '清理'
    },
    restore: {
      restoring: '正在從備份恢復 MCP 服務器',
      restored: 'MCP 服務器恢復成功',
      error: '從備份恢復時出錯',
      confirmRestore: '從備份{0}恢復？',
      restoreOptions: '恢復選項',
      preparingRestore: '準備恢復',
      downloadingBackup: '下載備份',
      extractingBackup: '解壓備份',
      restoringDatabase: '恢復數據庫',
      restoringFiles: '恢復文件',
      finishingRestore: '完成恢復'
    },
    language: {
      description: '更改CLI的語言設置',
      listOption: '列出可用的語言',
      setOption: '設置CLI語言 (en, zh-CN, zh-TW, ja, ko)',
      currentOption: '顯示當前語言設置',
      availableLanguages: '可用語言:',
      current: '當前',
      currentLanguage: '當前語言:',
      languageChanged: '語言已更改為: {0}',
      restartRequired: '重啟CLI後更改將生效',
      setError: '設置語言失敗: {0}',
      availableOptions: '可用的語言選項:',
      commandTitle: '語言命令:',
      operationError: '語言操作失敗: {0}'
    }
  },
  errors: {
    missingRequiredOption: '缺少必需選項：{0}',
    invalidOption: '無效選項：{0}',
    fileNotFound: '文件未找到：{0}',
    directoryNotFound: '目錄未找到：{0}',
    permissionDenied: '權限被拒絕：{0}',
    networkError: '網絡錯誤：{0}',
    timeoutError: '超時錯誤：{0}',
    unknownError: '發生未知錯誤',
    environmentVariableMissing: '缺少環境變量：{0}',
    configError: '配置錯誤：{0}',
    validationError: '驗證錯誤：{0}',
    cloudProviderError: '雲服務商錯誤：{0}'
  },
  clouds: {
    aws: {
      name: '亞馬遜雲服務',
      missingCredentials: '缺少 AWS 憑證',
      deployingLambda: '部署 Lambda 函數',
      deployingECS: '部署 ECS 服務',
      configuringRDS: '配置 RDS 數據庫',
      configuringS3: '配置 S3 存儲桶',
      configuringRoute53: '配置 Route 53'
    },
    gcp: {
      name: '谷歌雲平台',
      missingCredentials: '缺少 GCP 憑證',
      deployingCloudRun: '部署 Cloud Run 服務',
      deployingGKE: '部署到 GKE',
      configuringCloudSQL: '配置 Cloud SQL 數據庫',
      configuringCloudStorage: '配置 Cloud Storage',
      configuringCloudDNS: '配置 Cloud DNS'
    },
    azure: {
      name: '微軟 Azure',
      missingCredentials: '缺少 Azure 憑證',
      deployingAppService: '部署 App Service',
      deployingAKS: '部署到 AKS',
      configuringAzureSQL: '配置 Azure SQL 數據庫',
      configuringBlobStorage: '配置 Blob Storage',
      configuringAzureDNS: '配置 Azure DNS'
    },
    alibaba: {
      name: '阿里雲',
      missingCredentials: '缺少阿里雲憑證',
      deployingECS: '部署 ECS 實例',
      deployingACK: '部署到 ACK',
      configuringRDS: '配置 ApsaraDB RDS',
      configuringOSS: '配置 OSS 存儲桶',
      configuringDNS: '配置阿里雲 DNS'
    }
  }
};

export = messages; 