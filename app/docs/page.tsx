"use client";

import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Icon,
  Link,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Divider,
  Container,
} from '@chakra-ui/react';
import { FiCode, FiServer, FiTool, FiGithub, FiPlay } from 'react-icons/fi';
import NextLink from 'next/link';

export default function DocumentationPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading mb={2}>文档中心</Heading>
        <Text fontSize="lg" color="gray.600">学习如何使用和开发MCP服务器</Text>
      </Box>

      <Tabs variant="enclosed" colorScheme="blue" index={tabIndex} onChange={setTabIndex}>
        <TabList mb={4}>
          <Tab>新手指南</Tab>
          <Tab>API文档</Tab>
          <Tab>服务器开发</Tab>
          <Tab>使用案例</Tab>
        </TabList>

        <TabPanels>
          {/* 新手指南 */}
          <TabPanel p={0}>
            <Box p={6} borderWidth="1px" borderRadius="md" bg={bgColor} borderColor={borderColor}>
              <Heading size="md" mb={4}>MCP服务器入门</Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={8}>
                <Box>
                  <Flex align="center" mb={2}>
                    <Icon as={FiPlay} mr={2} color="blue.500" />
                    <Heading size="sm">快速开始</Heading>
                  </Flex>
                  <Text mb={4}>了解如何开始使用MCP服务器和Cloud平台</Text>
                  <Button as={NextLink} href="/docs/getting-started" colorScheme="blue" variant="outline" size="sm">查看指南</Button>
                </Box>
                
                <Box>
                  <Flex align="center" mb={2}>
                    <Icon as={FiServer} mr={2} color="blue.500" />
                    <Heading size="sm">安装服务器</Heading>
                  </Flex>
                  <Text mb={4}>学习如何安装和配置MCP服务器</Text>
                  <Button as={NextLink} href="/docs/installation" colorScheme="blue" variant="outline" size="sm">查看指南</Button>
                </Box>
              </SimpleGrid>
              
              <Accordion allowMultiple>
                <AccordionItem border="none">
                  <h2>
                    <AccordionButton px={0}>
                      <Box flex="1" textAlign="left" fontWeight="bold">
                        什么是MCP？
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4} pl={0}>
                    <Text mb={4}>
                      MCP (Modular Cognitive Protocol) 是一个用于构建和部署AI服务的开放协议，它允许开发者创建模块化的AI服务器，以便于集成到各种应用程序中。
                    </Text>
                    <Text>
                      通过MCP，开发者可以创建工具、函数和代理，使AI能够与各种服务和数据源交互，扩展其能力范围。
                    </Text>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem border="none">
                  <h2>
                    <AccordionButton px={0}>
                      <Box flex="1" textAlign="left" fontWeight="bold">
                        MCP服务器与传统API的区别
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4} pl={0}>
                    <Text mb={4}>
                      与传统API不同，MCP服务器是专门设计用于AI交互的，它们提供了结构化的工具和功能，使AI能够更容易理解和使用这些服务。
                    </Text>
                    <Text>
                      MCP服务器支持自我描述，提供丰富的元数据，并遵循一致的交互模式，使AI能够自动发现和使用这些服务。
                    </Text>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
          </TabPanel>
          
          {/* API文档 */}
          <TabPanel p={0}>
            <Box p={6} borderWidth="1px" borderRadius="md" bg={bgColor} borderColor={borderColor}>
              <Heading size="md" mb={4}>API参考文档</Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={8}>
                <Box>
                  <Flex align="center" mb={2}>
                    <Icon as={FiCode} mr={2} color="green.500" />
                    <Heading size="sm">MCP协议</Heading>
                  </Flex>
                  <Text mb={4}>了解MCP协议的详细规范和实现指南</Text>
                  <Button as={NextLink} href="/docs/mcp-protocol" colorScheme="green" variant="outline" size="sm">查看文档</Button>
                </Box>
                
                <Box>
                  <Flex align="center" mb={2}>
                    <Icon as={FiTool} mr={2} color="green.500" />
                    <Heading size="sm">工具API</Heading>
                  </Flex>
                  <Text mb={4}>学习如何使用MCP工具API创建强大的工具</Text>
                  <Button as={NextLink} href="/docs/tools-api" colorScheme="green" variant="outline" size="sm">查看文档</Button>
                </Box>
              </SimpleGrid>
              
              <Heading size="sm" mb={3}>REST API示例</Heading>
              <Box bg="gray.50" p={4} borderRadius="md" mb={6} _dark={{ bg: 'gray.700' }}>
                <Code display="block" whiteSpace="pre" overflowX="auto" colorScheme="gray">
{`// 获取服务器信息
GET /api/v1/server

// 调用工具
POST /api/v1/tools/:toolId
Content-Type: application/json

{
  "inputs": {
    "param1": "value1",
    "param2": "value2"
  }
}`}
                </Code>
              </Box>
              
              <Link href="/docs/api" color="blue.500">
                查看完整API文档 →
              </Link>
            </Box>
          </TabPanel>
          
          {/* 服务器开发 */}
          <TabPanel p={0}>
            <Box p={6} borderWidth="1px" borderRadius="md" bg={bgColor} borderColor={borderColor}>
              <Heading size="md" mb={4}>开发MCP服务器</Heading>
              
              <Text mb={6}>
                学习如何创建自己的MCP服务器，并发布到MCP Cloud平台。
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={8}>
                <Box>
                  <Flex align="center" mb={2}>
                    <Icon as={FiPlay} mr={2} color="purple.500" />
                    <Heading size="sm">开始开发</Heading>
                  </Flex>
                  <Text mb={4}>使用我们的CLI工具创建新的MCP服务器项目</Text>
                  <Button as={NextLink} href="/docs/create-server" colorScheme="purple" variant="outline" size="sm">查看指南</Button>
                </Box>
                
                <Box>
                  <Flex align="center" mb={2}>
                    <Icon as={FiTool} mr={2} color="purple.500" />
                    <Heading size="sm">创建工具</Heading>
                  </Flex>
                  <Text mb={4}>学习如何定义和实现MCP工具</Text>
                  <Button as={NextLink} href="/docs/create-tools" colorScheme="purple" variant="outline" size="sm">查看指南</Button>
                </Box>
                
                <Box>
                  <Flex align="center" mb={2}>
                    <Icon as={FiGithub} mr={2} color="purple.500" />
                    <Heading size="sm">示例代码</Heading>
                  </Flex>
                  <Text mb={4}>探索完整的MCP服务器示例项目</Text>
                  <Button as={Link} href="https://github.com/mcpai/examples" isExternal colorScheme="purple" variant="outline" size="sm">GitHub仓库</Button>
                </Box>
              </SimpleGrid>
              
              <Divider mb={6} />
              
              <Heading size="sm" mb={3}>MCP服务器示例代码</Heading>
              <Box bg="gray.50" p={4} borderRadius="md" _dark={{ bg: 'gray.700' }}>
                <Code display="block" whiteSpace="pre" overflowX="auto" colorScheme="gray">
{`// 定义一个简单的MCP服务器
import { createServer, createTool } from '@mcp/core';

// 创建问候工具
const greetingTool = createTool({
  name: 'greeting',
  description: '向用户发送问候',
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '要问候的用户名'
      }
    },
    required: ['name']
  },
  handler: async (inputs) => {
    return \`你好，\${inputs.name}！\`;
  }
});

// 创建并启动服务器
const server = createServer({
  name: '问候服务器',
  description: '提供简单的问候功能',
  tools: [greetingTool]
});

// 启动服务器
server.listen(3000);`}
                </Code>
              </Box>
            </Box>
          </TabPanel>
          
          {/* 使用案例 */}
          <TabPanel p={0}>
            <Box p={6} borderWidth="1px" borderRadius="md" bg={bgColor} borderColor={borderColor}>
              <Heading size="md" mb={4}>MCP服务器使用案例</Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                <Box>
                  <Heading size="sm" mb={3}>为AI提供数据访问</Heading>
                  <Text mb={4}>
                    创建一个MCP服务器，使AI能够访问专有数据库或API，例如公司内部文档、产品目录或客户数据。
                  </Text>
                  <Button as={NextLink} href="/docs/use-cases/data-access" colorScheme="teal" variant="outline" size="sm">查看案例</Button>
                </Box>
                
                <Box>
                  <Heading size="sm" mb={3}>扩展AI功能</Heading>
                  <Text mb={4}>
                    通过MCP服务器为AI提供特定领域的计算能力，如复杂数学计算、金融模型或科学仿真。
                  </Text>
                  <Button as={NextLink} href="/docs/use-cases/ai-extension" colorScheme="teal" variant="outline" size="sm">查看案例</Button>
                </Box>
                
                <Box>
                  <Heading size="sm" mb={3}>集成第三方服务</Heading>
                  <Text mb={4}>
                    使用MCP服务器将AI与第三方API和服务集成，如CRM系统、项目管理工具或电子商务平台。
                  </Text>
                  <Button as={NextLink} href="/docs/use-cases/integration" colorScheme="teal" variant="outline" size="sm">查看案例</Button>
                </Box>
                
                <Box>
                  <Heading size="sm" mb={3}>自动化业务流程</Heading>
                  <Text mb={4}>
                    构建MCP服务器以自动化业务流程，让AI能够执行数据处理、报告生成或内容管理任务。
                  </Text>
                  <Button as={NextLink} href="/docs/use-cases/automation" colorScheme="teal" variant="outline" size="sm">查看案例</Button>
                </Box>
              </SimpleGrid>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
} 