// Mock for inquirer
const inquirer = {
  prompt: jest.fn().mockResolvedValue({
    cloudProvider: 'aws',
    environment: 'development'
  })
};

module.exports = inquirer; 