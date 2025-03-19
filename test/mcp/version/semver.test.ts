import { describe, it, expect } from 'vitest';
import { 
  parseSemVer,
  compareSemVer,
  satisfiesRange,
  findLatestSatisfying,
  getNextVersion
} from '../../../lib/mcp/version/semver';

describe('SemVer工具', () => {
  describe('parseSemVer', () => {
    it('应该正确解析标准版本', () => {
      const version = parseSemVer('1.2.3');
      expect(version).toEqual({
        major: 1,
        minor: 2,
        patch: 3
      });
    });

    it('应该正确解析带预发布标识的版本', () => {
      const version = parseSemVer('1.2.3-beta.1');
      expect(version).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'beta.1'
      });
    });

    it('应该正确解析带构建元数据的版本', () => {
      const version = parseSemVer('1.2.3+20130313144700');
      expect(version).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        buildmetadata: '20130313144700'
      });
    });

    it('应该正确解析带预发布标识和构建元数据的版本', () => {
      const version = parseSemVer('1.2.3-beta.1+20130313144700');
      expect(version).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'beta.1',
        buildmetadata: '20130313144700'
      });
    });

    it('应该对无效版本抛出错误', () => {
      expect(() => parseSemVer('invalid')).toThrow();
      expect(() => parseSemVer('1.2')).toThrow();
      expect(() => parseSemVer('01.2.3')).toThrow();
      expect(() => parseSemVer('1.02.3')).toThrow();
      expect(() => parseSemVer('1.2.03')).toThrow();
    });
  });

  describe('compareSemVer', () => {
    it('应该正确比较主要版本号', () => {
      expect(compareSemVer('2.0.0', '1.0.0')).toBe(1);
      expect(compareSemVer('1.0.0', '2.0.0')).toBe(-1);
    });

    it('应该正确比较次要版本号', () => {
      expect(compareSemVer('1.2.0', '1.1.0')).toBe(1);
      expect(compareSemVer('1.1.0', '1.2.0')).toBe(-1);
    });

    it('应该正确比较修订版本号', () => {
      expect(compareSemVer('1.1.2', '1.1.1')).toBe(1);
      expect(compareSemVer('1.1.1', '1.1.2')).toBe(-1);
    });

    it('应该正确考虑预发布版本', () => {
      expect(compareSemVer('1.0.0', '1.0.0-alpha')).toBe(1);
      expect(compareSemVer('1.0.0-alpha', '1.0.0')).toBe(-1);
    });

    it('应该正确比较预发布版本', () => {
      expect(compareSemVer('1.0.0-alpha.1', '1.0.0-alpha')).toBe(1);
      expect(compareSemVer('1.0.0-alpha', '1.0.0-alpha.1')).toBe(-1);
      expect(compareSemVer('1.0.0-alpha.beta', '1.0.0-alpha.1')).toBe(1);
      expect(compareSemVer('1.0.0-alpha.1', '1.0.0-alpha.beta')).toBe(-1);
      expect(compareSemVer('1.0.0-beta', '1.0.0-alpha')).toBe(1);
      expect(compareSemVer('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
    });

    it('应该忽略构建元数据', () => {
      expect(compareSemVer('1.0.0+build.1', '1.0.0+build.2')).toBe(0);
    });

    it('应该正确处理相同版本', () => {
      expect(compareSemVer('1.2.3', '1.2.3')).toBe(0);
    });
  });

  describe('satisfiesRange', () => {
    it('应该验证精确版本匹配', () => {
      expect(satisfiesRange('1.2.3', '1.2.3')).toBe(true);
      expect(satisfiesRange('1.2.4', '1.2.3')).toBe(false);
    });

    it('应该验证大于等于范围', () => {
      expect(satisfiesRange('1.2.3', '>=1.2.3')).toBe(true);
      expect(satisfiesRange('1.2.4', '>=1.2.3')).toBe(true);
      expect(satisfiesRange('1.2.2', '>=1.2.3')).toBe(false);
    });

    it('应该验证小于等于范围', () => {
      expect(satisfiesRange('1.2.3', '<=1.2.3')).toBe(true);
      expect(satisfiesRange('1.2.2', '<=1.2.3')).toBe(true);
      expect(satisfiesRange('1.2.4', '<=1.2.3')).toBe(false);
    });

    it('应该验证大于范围', () => {
      expect(satisfiesRange('1.2.4', '>1.2.3')).toBe(true);
      expect(satisfiesRange('1.2.3', '>1.2.3')).toBe(false);
      expect(satisfiesRange('1.2.2', '>1.2.3')).toBe(false);
    });

    it('应该验证小于范围', () => {
      expect(satisfiesRange('1.2.2', '<1.2.3')).toBe(true);
      expect(satisfiesRange('1.2.3', '<1.2.3')).toBe(false);
      expect(satisfiesRange('1.2.4', '<1.2.3')).toBe(false);
    });

    it('应该验证波浪号范围', () => {
      expect(satisfiesRange('1.2.3', '~1.2.0')).toBe(true);
      expect(satisfiesRange('1.2.9', '~1.2.0')).toBe(true);
      expect(satisfiesRange('1.3.0', '~1.2.0')).toBe(false);
    });

    it('应该验证插入号范围', () => {
      expect(satisfiesRange('1.2.3', '^1.0.0')).toBe(true);
      expect(satisfiesRange('1.9.9', '^1.0.0')).toBe(true);
      expect(satisfiesRange('2.0.0', '^1.0.0')).toBe(false);
    });

    it('应该验证版本范围', () => {
      expect(satisfiesRange('1.2.3', '1.2.0 - 1.3.0')).toBe(true);
      expect(satisfiesRange('1.3.0', '1.2.0 - 1.3.0')).toBe(true);
      expect(satisfiesRange('1.3.1', '1.2.0 - 1.3.0')).toBe(false);
    });

    it('应该对无效范围抛出错误', () => {
      expect(() => satisfiesRange('1.2.3', 'invalid')).toThrow();
    });
  });

  describe('findLatestSatisfying', () => {
    it('应该找到满足范围的最新版本', () => {
      const versions = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '2.0.0'];
      expect(findLatestSatisfying(versions, '^1.0.0')).toBe('1.3.0');
      expect(findLatestSatisfying(versions, '~1.1.0')).toBe('1.1.0');
      expect(findLatestSatisfying(versions, '>1.1.0')).toBe('2.0.0');
      expect(findLatestSatisfying(versions, '<=1.2.0')).toBe('1.2.0');
    });

    it('当没有满足条件的版本时应该返回undefined', () => {
      const versions = ['1.0.0', '1.1.0', '1.2.0'];
      expect(findLatestSatisfying(versions, '^2.0.0')).toBeUndefined();
    });
  });

  describe('getNextVersion', () => {
    it('应该正确计算主要版本更新', () => {
      expect(getNextVersion('1.2.3', 'major')).toBe('2.0.0');
    });

    it('应该正确计算次要版本更新', () => {
      expect(getNextVersion('1.2.3', 'minor')).toBe('1.3.0');
    });

    it('应该正确计算修订版本更新', () => {
      expect(getNextVersion('1.2.3', 'patch')).toBe('1.2.4');
    });

    it('应该正确处理预发布版本', () => {
      expect(getNextVersion('1.2.3', 'prerelease', 'alpha')).toBe('1.2.4-alpha.0');
      expect(getNextVersion('1.2.3-alpha.0', 'prerelease')).toBe('1.2.3-alpha.1');
      expect(getNextVersion('1.2.3-alpha.9', 'prerelease')).toBe('1.2.3-alpha.10');
      expect(getNextVersion('1.2.3-alpha', 'prerelease')).toBe('1.2.3-alpha.1');
    });
  });
}); 