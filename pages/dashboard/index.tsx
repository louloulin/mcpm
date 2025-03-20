import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  ButtonGroup,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { FiServer, FiActivity, FiCpu, FiHardDrive, FiUpload, FiDownload, FiMoreVertical, FiPlus } from 'react-icons/fi';
import Layout from '../../components/Layout';

// 模拟的部署服务器数据
const DEPLOYED_SERVERS = [
  {
    id: 'deploy-1',
    name: '问候服务器',
    status: 'running',
    uptime: '5天12小时',
    cpu: 5,
    memory: 128,
    requests: 1240,
    region: '上海',
  },
  {
    id: 'deploy-2',
    name: 'AI助手服务器',
    status: 'running',
    uptime: '2天8小时',
    cpu: 25,
    memory: 512,
    requests: 5678,
    region: '北京',
  },
  {
    id: 'deploy-3',
    name: '数据分析服务器',
    status: 'stopped',
    uptime: '0',
    cpu: 0,
    memory: 0,
    requests: 932,
    region: '广州',
  },
];

// 模拟的使用统计数据
const USAGE_STATS = {
  totalServers: 3,
  activeServers: 2,
  totalRequests: 7850,
  totalCpu: 1200, // CPU时间(分钟)
  totalMemory: 1.2, // GB小时
  costEstimate: 12.50, // 元
};

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.800');
  const statBgColor = useColorModeValue('blue.50', 'blue.900');
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'green';
      case 'stopped':
        return 'gray';
      case 'error':
        return 'red';
      case 'starting':
        return 'yellow';
      default:
        return 'gray';
    }
  };
  
  return (
    <Layout title="仪表盘 | MCP Cloud">
      <Flex mb={8} justify="space-between" align="center">
        <Box>
          <Heading mb={2}>仪表盘</Heading>
          <Text color="gray.600">管理您的MCP服务器和监控使用情况</Text>
        </Box>
        <Button leftIcon={<FiPlus />} colorScheme="blue">
          部署新服务器
        </Button>
      </Flex>
      
      {/* 统计卡片 */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={10}>
        <Box p={5} borderRadius="lg" backgroundColor={statBgColor}>
          <Flex mb={2}>
            <Icon as={FiServer} boxSize={6} mr={2} />
            <Stat>
              <StatLabel>服务器</StatLabel>
              <StatNumber>{USAGE_STATS.totalServers}</StatNumber>
              <StatHelpText>{USAGE_STATS.activeServers} 个运行中</StatHelpText>
            </Stat>
          </Flex>
        </Box>
        
        <Box p={5} borderRadius="lg" backgroundColor={statBgColor}>
          <Flex mb={2}>
            <Icon as={FiActivity} boxSize={6} mr={2} />
            <Stat>
              <StatLabel>请求数</StatLabel>
              <StatNumber>{USAGE_STATS.totalRequests.toLocaleString()}</StatNumber>
              <StatHelpText>本月累计</StatHelpText>
            </Stat>
          </Flex>
        </Box>
        
        <Box p={5} borderRadius="lg" backgroundColor={statBgColor}>
          <Flex mb={2}>
            <Icon as={FiCpu} boxSize={6} mr={2} />
            <Stat>
              <StatLabel>CPU用量</StatLabel>
              <StatNumber>{USAGE_STATS.totalCpu}分钟</StatNumber>
              <StatHelpText>本月累计</StatHelpText>
            </Stat>
          </Flex>
        </Box>
        
        <Box p={5} borderRadius="lg" backgroundColor={statBgColor}>
          <Flex mb={2}>
            <Icon as={FiHardDrive} boxSize={6} mr={2} />
            <Stat>
              <StatLabel>内存用量</StatLabel>
              <StatNumber>{USAGE_STATS.totalMemory}GB时</StatNumber>
              <StatHelpText>本月累计</StatHelpText>
            </Stat>
          </Flex>
        </Box>
      </SimpleGrid>
      
      {/* 服务器列表和详细信息 */}
      <Tabs 
        variant="enclosed" 
        colorScheme="blue" 
        index={activeTab} 
        onChange={setActiveTab}
        bg={bgColor}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        p={4}
      >
        <TabList>
          <Tab>部署的服务器</Tab>
          <Tab>使用统计</Tab>
          <Tab>账单估算</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel px={0}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>服务器名称</Th>
                  <Th>状态</Th>
                  <Th>区域</Th>
                  <Th>运行时间</Th>
                  <Th>CPU</Th>
                  <Th>内存</Th>
                  <Th>请求数</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {DEPLOYED_SERVERS.map((server) => (
                  <Tr key={server.id}>
                    <Td fontWeight="medium">{server.name}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(server.status)}>
                        {server.status === 'running' ? '运行中' : 
                         server.status === 'stopped' ? '已停止' :
                         server.status === 'error' ? '错误' : '启动中'}
                      </Badge>
                    </Td>
                    <Td>{server.region}</Td>
                    <Td>{server.uptime}</Td>
                    <Td>
                      <Flex align="center">
                        <Text mr={2}>{server.cpu}%</Text>
                        <Progress 
                          value={server.cpu} 
                          size="sm" 
                          width="80px" 
                          colorScheme={server.cpu > 80 ? 'red' : server.cpu > 50 ? 'yellow' : 'green'} 
                        />
                      </Flex>
                    </Td>
                    <Td>
                      <Flex align="center">
                        <Text mr={2}>{server.memory}MB</Text>
                        <Progress 
                          value={(server.memory / 1024) * 100} 
                          size="sm" 
                          width="80px" 
                          colorScheme="blue" 
                        />
                      </Flex>
                    </Td>
                    <Td>{server.requests}</Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={Button}
                          variant="ghost"
                          size="sm"
                          colorScheme="gray"
                        >
                          <Icon as={FiMoreVertical} />
                        </MenuButton>
                        <MenuList>
                          <MenuItem>查看详情</MenuItem>
                          <MenuItem>日志</MenuItem>
                          <MenuItem>重启</MenuItem>
                          <MenuItem color="red.500">停止</MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>
          
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              <Box p={5} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                <Heading size="md" mb={4}>请求统计</Heading>
                
                <Flex justify="space-between" align="center" mb={4}>
                  <Text>API请求总数</Text>
                  <Text fontWeight="bold">{USAGE_STATS.totalRequests.toLocaleString()}</Text>
                </Flex>
                
                <Flex justify="space-between" align="center" mb={4}>
                  <Text>平均响应时间</Text>
                  <Text fontWeight="bold">127ms</Text>
                </Flex>
                
                <Flex justify="space-between" align="center">
                  <Text>成功率</Text>
                  <Text fontWeight="bold">99.8%</Text>
                </Flex>
              </Box>
              
              <Box p={5} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                <Heading size="md" mb={4}>资源使用</Heading>
                
                <Flex justify="space-between" align="center" mb={4}>
                  <Text>总CPU时间</Text>
                  <Text fontWeight="bold">{USAGE_STATS.totalCpu}分钟</Text>
                </Flex>
                
                <Flex justify="space-between" align="center" mb={4}>
                  <Text>总内存用量</Text>
                  <Text fontWeight="bold">{USAGE_STATS.totalMemory}GB时</Text>
                </Flex>
                
                <Flex justify="space-between" align="center">
                  <Text>总带宽</Text>
                  <Text fontWeight="bold">23.5GB</Text>
                </Flex>
              </Box>
            </SimpleGrid>
          </TabPanel>
          
          <TabPanel>
            <Box p={5} borderWidth="1px" borderRadius="md" borderColor={borderColor} mb={6}>
              <Heading size="md" mb={6}>本月费用估算</Heading>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={6}>
                <Stat>
                  <StatLabel>服务器托管</StatLabel>
                  <StatNumber>¥8.50</StatNumber>
                  <StatHelpText>基于运行时间</StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>API请求</StatLabel>
                  <StatNumber>¥3.20</StatNumber>
                  <StatHelpText>{USAGE_STATS.totalRequests}次请求</StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>估计总费用</StatLabel>
                  <StatNumber>¥{USAGE_STATS.costEstimate.toFixed(2)}</StatNumber>
                  <StatHelpText>截至今天</StatHelpText>
                </Stat>
              </SimpleGrid>
              
              <ButtonGroup>
                <Button colorScheme="blue" variant="outline">查看详细账单</Button>
                <Button colorScheme="blue">管理付款方式</Button>
              </ButtonGroup>
            </Box>
            
            <Box p={5} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
              <Heading size="md" mb={4}>价格说明</Heading>
              
              <Text mb={4}>
                MCP Cloud采用按使用量计费模式，您只需为实际使用的资源付费。主要计费项目包括：
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Flex align="center">
                  <Icon as={FiServer} mr={2} />
                  <Text>服务器运行时间: ¥0.05/小时</Text>
                </Flex>
                
                <Flex align="center">
                  <Icon as={FiCpu} mr={2} />
                  <Text>CPU用量: ¥0.01/CPU分钟</Text>
                </Flex>
                
                <Flex align="center">
                  <Icon as={FiHardDrive} mr={2} />
                  <Text>内存用量: ¥0.02/MB小时</Text>
                </Flex>
                
                <Flex align="center">
                  <Icon as={FiDownload} mr={2} />
                  <Text>API请求: ¥0.0005/次</Text>
                </Flex>
                
                <Flex align="center">
                  <Icon as={FiUpload} mr={2} />
                  <Text>数据传输: ¥0.50/GB</Text>
                </Flex>
              </SimpleGrid>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Layout>
  );
};

export default DashboardPage; 