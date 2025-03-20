import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';
import { merge } from 'lodash';

// 配置文件路径
const CONFIG_FILE = path.join(os.homedir(), '.mcpmrc');

// 默认配置
export const DEFAULT_CONFIG: Config = {
  registry: {
    url: 'https://registry.mcpm.io',
  },
  client: {
    type: 'claude',
    configPath: path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  },
  servers: {
    installPath: path.join(os.homedir(), '.mcpm', 'servers'),
    autoUpdate: true,
  },
  cache: {
    dir: path.join(os.homedir(), '.mcpm', 'cache'),
    sizeLimit: 500 // MB
  }
};

// 配置类型定义
export interface Config {
  registry: {
    url: string;
    token?: string;
  };
  client: {
    type: string;
    configPath: string;
  };
  servers: {
    installPath: string;
    autoUpdate: boolean;
  };
  cache: {
    dir: string;
    sizeLimit: number; // MB
  };
}

/**
 * 获取配置
 */
export function getConfig(): Config {
  // 如果配置文件不存在，则创建默认配置
  if (!fs.existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  try {
    // 读取配置文件
    const fileContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    const userConfig = yaml.load(fileContent) as Partial<Config>;

    // 合并默认配置和用户配置
    return merge({}, DEFAULT_CONFIG, userConfig);
  } catch (error) {
    console.error(`读取配置文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return DEFAULT_CONFIG;
  }
}

/**
 * 保存配置
 */
function saveConfig(config: Config): void {
  try {
    // 转换为YAML
    const yamlContent = yaml.dump(config);
    
    // 创建目录（如果不存在）
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 写入文件
    fs.writeFileSync(CONFIG_FILE, yamlContent, 'utf8');
  } catch (error) {
    console.error(`保存配置文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 更新配置
 */
export function updateConfig(updates: Partial<Config>): Config {
  // 获取当前配置
  const currentConfig = getConfig();
  
  // 合并更新
  const newConfig = merge({}, currentConfig, updates);
  
  // 保存更新后的配置
  saveConfig(newConfig);
  
  return newConfig;
} 