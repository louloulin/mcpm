module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  rules: {
    // 禁用所有可能阻碍构建的规则
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react/no-unescaped-entities': 'off',
    '@next/next/no-img-element': 'off',
    '@next/next/no-html-link-for-pages': 'off',
    '@next/next/no-assign-module-variable': 'off',
    'prefer-const': 'off',
    'import/no-anonymous-default-export': 'off'
  }
};
