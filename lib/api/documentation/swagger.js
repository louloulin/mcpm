const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerOptions = require('./swagger-config');

/**
 * 初始化Swagger API文档
 * @param {import('express').Application} app - Express应用实例
 * @param {string} basePath - API基础路径，默认为 '/api-docs'
 */
function initSwagger(app, basePath = '/api-docs') {
  // 生成Swagger规范
  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  // 挂载Swagger UI
  app.use(
    basePath,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true, // 启用搜索
      customCss: '.swagger-ui .topbar { display: none }', // 隐藏顶部栏
      customSiteTitle: 'MCP Server API文档',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true, // 保持授权信息
        docExpansion: 'none', // 默认折叠所有接口
        filter: true, // 开启过滤功能
      },
    })
  );

  // 提供JSON格式的API规范
  app.get(`${basePath}.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // 提供YAML格式的API规范
  app.get(`${basePath}.yaml`, (req, res) => {
    const jsyaml = require('js-yaml');
    const yaml = jsyaml.dump(swaggerSpec);
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml);
  });

  console.log(`📚 API文档已挂载在 ${basePath}`);
  console.log(`📄 JSON格式API规范：${basePath}.json`);
  console.log(`📄 YAML格式API规范：${basePath}.yaml`);
}

module.exports = {
  initSwagger
}; 