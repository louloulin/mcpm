import fs from 'fs';
import path from 'path';
import os from 'os';

// 支持的语言列表
export type SupportedLanguage = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko';

// 定义消息类型，用于类型检查
export interface Messages {
  common: {
    error: string;
    warning: string;
    info: string;
    success: string;
    confirm: string;
    cancel: string;
    yes: string;
    no: string;
    loading: string;
    notFound: string;
    invalidInput: string;
    retry: string;
    exit: string;
    help: string;
    version: string;
  };
  cli: {
    welcome: string;
    goodbye: string;
    helpText: string;
    exampleHeader: string;
    documentationHeader: string;
  };
  commands: {
    scaffold: {
      creating: string;
      created: string;
      error: string;
      templateNotFound: string;
      confirmOverwrite: string;
      scaffoldOptions: string;
    };
    deploy: {
      deploying: string;
      deployed: string;
      error: string;
      confirmDeploy: string;
      deployOptions: string;
      preparingDeploy: string;
      checkingEnv: string;
      uploadingFiles: string;
      configuringServer: string;
      startingServer: string;
    };
    status: {
      checking: string;
      online: string;
      offline: string;
      error: string;
      statusOptions: string;
      checkingConnection: string;
      resourceStatus: string;
      healthStatus: string;
    };
    logs: {
      fetching: string;
      error: string;
      noLogs: string;
      logsOptions: string;
      filtering: string;
      streamingLogs: string;
    };
    update: {
      checking: string;
      updating: string;
      updated: string;
      noUpdates: string;
      error: string;
      confirmUpdate: string;
      updateOptions: string;
      preparingUpdate: string;
      backingUp: string;
      downloadingUpdate: string;
      applyingUpdate: string;
      testingUpdate: string;
      rollingBack: string;
    };
    backup: {
      creating: string;
      created: string;
      error: string;
      confirmBackup: string;
      backupOptions: string;
      preparingBackup: string;
      savingDatabase: string;
      savingFiles: string;
      compressing: string;
      uploading: string;
      cleaningUp: string;
    };
    restore: {
      restoring: string;
      restored: string;
      error: string;
      confirmRestore: string;
      restoreOptions: string;
      preparingRestore: string;
      downloadingBackup: string;
      extractingBackup: string;
      restoringDatabase: string;
      restoringFiles: string;
      finishingRestore: string;
    };
    language: {
      description: string;
      listOption: string;
      setOption: string;
      currentOption: string;
      availableLanguages: string;
      current: string;
      currentLanguage: string;
      languageChanged: string;
      restartRequired: string;
      setError: string;
      availableOptions: string;
      commandTitle: string;
      operationError: string;
    };
  };
  errors: {
    missingRequiredOption: string;
    invalidOption: string;
    fileNotFound: string;
    directoryNotFound: string;
    permissionDenied: string;
    networkError: string;
    timeoutError: string;
    unknownError: string;
    environmentVariableMissing: string;
    configError: string;
    validationError: string;
    cloudProviderError: string;
  };
  clouds: {
    aws: {
      name: string;
      missingCredentials: string;
      deployingLambda: string;
      deployingECS: string;
      configuringRDS: string;
      configuringS3: string;
      configuringRoute53: string;
    };
    gcp: {
      name: string;
      missingCredentials: string;
      deployingCloudRun: string;
      deployingGKE: string;
      configuringCloudSQL: string;
      configuringCloudStorage: string;
      configuringCloudDNS: string;
    };
    azure: {
      name: string;
      missingCredentials: string;
      deployingAppService: string;
      deployingAKS: string;
      configuringAzureSQL: string;
      configuringBlobStorage: string;
      configuringAzureDNS: string;
    };
    alibaba: {
      name: string;
      missingCredentials: string;
      deployingECS: string;
      deployingACK: string;
      configuringRDS: string;
      configuringOSS: string;
      configuringDNS: string;
    };
  };
}

// 语言设置类
class I18n {
  private messages: Record<SupportedLanguage, Messages>;
  private currentLanguage: SupportedLanguage;
  private configPath: string;

  constructor() {
    // 初始化支持的语言消息
    this.messages = {
      'en': require('./locales/en'),
      'zh-CN': require('./locales/zh-CN'),
      'zh-TW': require('./locales/zh-TW'),
      'ja': require('./locales/ja'),
      'ko': require('./locales/ko')
    };

    // 配置文件路径
    this.configPath = path.join(os.homedir(), '.mcpm', 'config.json');
    
    // 默认语言为英文
    this.currentLanguage = 'en';
    
    // 尝试从配置文件加载语言设置
    this.loadLanguageFromConfig();
    
    // 如果没有配置，从系统环境变量获取语言设置
    if (!this.currentLanguage) {
      this.detectSystemLanguage();
    }
  }

  // 从配置文件加载语言设置
  private loadLanguageFromConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        if (config.language && this.isValidLanguage(config.language)) {
          this.currentLanguage = config.language;
        }
      }
    } catch (error) {
      // 如果加载失败，继续使用默认语言
      console.error(`Error loading language from config: ${error}`);
    }
  }

  // 从系统环境变量检测语言
  private detectSystemLanguage(): void {
    // 获取系统语言环境
    const sysLocale = process.env.LANG || 
                     process.env.LC_ALL || 
                     process.env.LC_MESSAGES || 
                     process.env.LANGUAGE || 
                     'en-US';
    
    // 简单映射系统语言到支持的语言
    if (sysLocale.startsWith('zh_CN') || sysLocale.startsWith('zh-CN')) {
      this.currentLanguage = 'zh-CN';
    } else if (sysLocale.startsWith('zh_TW') || sysLocale.startsWith('zh-TW')) {
      this.currentLanguage = 'zh-TW';
    } else if (sysLocale.startsWith('ja')) {
      this.currentLanguage = 'ja';
    } else if (sysLocale.startsWith('ko')) {
      this.currentLanguage = 'ko';
    } else {
      this.currentLanguage = 'en'; // 默认使用英文
    }
  }

  // 验证语言是否受支持
  private isValidLanguage(lang: string): lang is SupportedLanguage {
    return ['en', 'zh-CN', 'zh-TW', 'ja', 'ko'].includes(lang);
  }

  // 设置当前语言
  public setLanguage(lang: SupportedLanguage): void {
    if (this.isValidLanguage(lang)) {
      this.currentLanguage = lang;
      
      // 保存语言设置到配置文件
      try {
        const configDir = path.dirname(this.configPath);
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        
        let config = {};
        if (fs.existsSync(this.configPath)) {
          config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        }
        
        config = { ...config, language: lang };
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      } catch (error) {
        console.error(`Error saving language to config: ${error}`);
      }
    } else {
      throw new Error(`Unsupported language: ${lang}`);
    }
  }

  // 获取当前语言
  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  // 获取当前语言的所有消息
  public getAllMessages(): Messages {
    return this.messages[this.currentLanguage];
  }

  // 获取特定消息
  public t(keyPath: string): string {
    try {
      // 分解键路径，如 'commands.scaffold.creating'
      const keys = keyPath.split('.');
      let result: any = this.messages[this.currentLanguage];
      
      // 逐级获取消息
      for (const key of keys) {
        if (result[key] === undefined) {
          // 如果找不到对应消息，回退到英文
          let fallback = this.messages['en'];
          for (const fallbackKey of keys) {
            if (fallback[fallbackKey] === undefined) {
              return keyPath; // 如果英文也没有，返回键路径
            }
            fallback = fallback[fallbackKey];
          }
          return fallback;
        }
        result = result[key];
      }
      
      return result;
    } catch (error) {
      console.error(`Error getting translation for ${keyPath}: ${error}`);
      return keyPath;
    }
  }

  // 获取可用的语言列表
  public getAvailableLanguages(): SupportedLanguage[] {
    return Object.keys(this.messages) as SupportedLanguage[];
  }
}

// 创建单例实例
const i18n = new I18n();

// 导出
export default i18n; 