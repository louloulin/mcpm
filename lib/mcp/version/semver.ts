/**
 * 语义化版本控制工具
 * 用于解析和比较符合语义化版本规范的版本号
 * 规范参考: https://semver.org/
 */

/**
 * 语义化版本结构
 */
export interface SemVerVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  buildmetadata?: string;
}

/**
 * 解析语义化版本字符串
 * 格式: major.minor.patch[-prerelease][+buildmetadata]
 * @param version 版本字符串
 * @returns 解析后的版本对象
 * @throws 如果版本格式不正确
 */
export function parseSemVer(version: string): SemVerVersion {
  // 版本正则表达式，根据语义化版本规范
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  
  const match = version.match(semverRegex);
  
  if (!match) {
    throw new Error(`无效的语义化版本格式: ${version}`);
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    buildmetadata: match[5]
  };
}

/**
 * 比较两个语义化版本
 * @param versionA 第一个版本
 * @param versionB 第二个版本
 * @returns {number} 如果versionA > versionB返回1，如果versionA < versionB返回-1，如果相等返回0
 */
export function compareSemVer(versionA: string, versionB: string): number {
  const a = parseSemVer(versionA);
  const b = parseSemVer(versionB);
  
  // 比较主版本号
  if (a.major > b.major) return 1;
  if (a.major < b.major) return -1;
  
  // 比较次版本号
  if (a.minor > b.minor) return 1;
  if (a.minor < b.minor) return -1;
  
  // 比较修订号
  if (a.patch > b.patch) return 1;
  if (a.patch < b.patch) return -1;
  
  // 比较预发布版本 (有预发布标识的版本小于没有预发布标识的版本)
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && b.prerelease) return 1;
  
  // 如果都有预发布标识，按字典序比较
  if (a.prerelease && b.prerelease) {
    const aParts = a.prerelease.split('.');
    const bParts = b.prerelease.split('.');
    
    const minLength = Math.min(aParts.length, bParts.length);
    
    for (let i = 0; i < minLength; i++) {
      const aIsNum = /^\d+$/.test(aParts[i]);
      const bIsNum = /^\d+$/.test(bParts[i]);
      
      // 数字部分比字母部分低
      if (aIsNum && !bIsNum) return -1;
      if (!aIsNum && bIsNum) return 1;
      
      // 都是数字时，数值比较
      if (aIsNum && bIsNum) {
        const aNum = parseInt(aParts[i], 10);
        const bNum = parseInt(bParts[i], 10);
        if (aNum > bNum) return 1;
        if (aNum < bNum) return -1;
        continue;
      }
      
      // 都是字符串时，字典序比较
      const comp = aParts[i].localeCompare(bParts[i]);
      if (comp !== 0) return comp;
    }
    
    // 处理长度不同的情况
    return aParts.length - bParts.length;
  }
  
  // 忽略构建元数据比较
  return 0;
}

/**
 * 验证版本号是否满足版本范围要求
 * @param version 待验证的版本号
 * @param range 版本范围表达式
 * @returns 是否满足版本范围要求
 */
export function satisfiesRange(version: string, range: string): boolean {
  // 简化实现，支持几种常见的范围表达式
  
  // 精确匹配: 1.2.3
  if (/^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$/.test(range)) {
    return compareSemVer(version, range) === 0;
  }
  
  // 大于等于: >=1.2.3
  if (range.startsWith('>=')) {
    const minVersion = range.substring(2);
    return compareSemVer(version, minVersion) >= 0;
  }
  
  // 小于等于: <=1.2.3
  if (range.startsWith('<=')) {
    const maxVersion = range.substring(2);
    return compareSemVer(version, maxVersion) <= 0;
  }
  
  // 大于: >1.2.3
  if (range.startsWith('>')) {
    const minVersion = range.substring(1);
    return compareSemVer(version, minVersion) > 0;
  }
  
  // 小于: <1.2.3
  if (range.startsWith('<')) {
    const maxVersion = range.substring(1);
    return compareSemVer(version, maxVersion) < 0;
  }
  
  // 波浪号范围: ~1.2.3 (允许修订号变化)
  if (range.startsWith('~')) {
    const baseVersion = range.substring(1);
    const base = parseSemVer(baseVersion);
    const minVersion = `${base.major}.${base.minor}.0`;
    const maxVersion = `${base.major}.${base.minor + 1}.0`;
    
    return compareSemVer(version, minVersion) >= 0 && compareSemVer(version, maxVersion) < 0;
  }
  
  // 插入号范围: ^1.2.3 (允许次版本号和修订号变化，但主版本号需相同)
  if (range.startsWith('^')) {
    const baseVersion = range.substring(1);
    const base = parseSemVer(baseVersion);
    const minVersion = `${base.major}.0.0`;
    const maxVersion = `${base.major + 1}.0.0`;
    
    return compareSemVer(version, minVersion) >= 0 && compareSemVer(version, maxVersion) < 0;
  }
  
  // 范围组合: 1.2.3 - 2.3.4
  if (range.includes(' - ')) {
    const [minVersion, maxVersion] = range.split(' - ');
    return compareSemVer(version, minVersion) >= 0 && compareSemVer(version, maxVersion) <= 0;
  }
  
  // 无法识别的范围表达式
  throw new Error(`不支持的版本范围表达式: ${range}`);
}

/**
 * 在版本列表中找到满足范围的最新版本
 * @param versions 版本列表
 * @param range 版本范围
 * @returns 满足范围的最新版本，如果没有则返回undefined
 */
export function findLatestSatisfying(versions: string[], range: string): string | undefined {
  const satisfying = versions.filter(version => {
    try {
      return satisfiesRange(version, range);
    } catch (err) {
      return false;
    }
  });
  
  // 按版本从高到低排序
  satisfying.sort((a, b) => -compareSemVer(a, b));
  
  return satisfying[0];
}

/**
 * 获取下一个版本
 * @param currentVersion 当前版本
 * @param releaseType 发布类型: major, minor, patch, prerelease
 * @param prereleaseId 预发布标识(可选)
 * @returns 下一个版本
 */
export function getNextVersion(
  currentVersion: string,
  releaseType: 'major' | 'minor' | 'patch' | 'prerelease',
  prereleaseId?: string
): string {
  const version = parseSemVer(currentVersion);
  let { major, minor, patch, prerelease } = version;
  
  switch (releaseType) {
    case 'major':
      major++;
      minor = 0;
      patch = 0;
      prerelease = undefined;
      break;
    case 'minor':
      minor++;
      patch = 0;
      prerelease = undefined;
      break;
    case 'patch':
      patch++;
      prerelease = undefined;
      break;
    case 'prerelease':
      if (!prerelease) {
        // 如果当前不是预发布版本，增加修订号并添加预发布标识
        patch++;
        prerelease = prereleaseId ? `${prereleaseId}.0` : 'alpha.0';
      } else {
        // 如果当前已经是预发布版本，更新预发布版本号
        const parts = prerelease.split('.');
        const lastPart = parts[parts.length - 1];
        
        if (/^\d+$/.test(lastPart)) {
          // 数字部分递增
          const num = parseInt(lastPart, 10);
          parts[parts.length - 1] = (num + 1).toString();
          prerelease = parts.join('.');
        } else {
          // 非数字部分，附加.1
          prerelease = `${prerelease}.1`;
        }
      }
      break;
  }
  
  let result = `${major}.${minor}.${patch}`;
  if (prerelease) {
    result += `-${prerelease}`;
  }
  
  return result;
}

export default {
  parseSemVer,
  compareSemVer,
  satisfiesRange,
  findLatestSatisfying,
  getNextVersion
}; 