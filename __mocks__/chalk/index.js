// Mock for chalk
const chalk = {
  // Basic colors
  red: (text) => text,
  green: (text) => text,
  blue: (text) => text,
  yellow: (text) => text,
  cyan: (text) => text,
  magenta: (text) => text,
  white: (text) => text,
  gray: (text) => text,
  black: (text) => text,
  
  // Bright colors
  redBright: (text) => text,
  greenBright: (text) => text,
  blueBright: (text) => text,
  yellowBright: (text) => text,
  cyanBright: (text) => text,
  magentaBright: (text) => text,
  whiteBright: (text) => text,
  
  // Background colors
  bgRed: (text) => text,
  bgGreen: (text) => text,
  bgBlue: (text) => text,
  bgYellow: (text) => text,
  bgCyan: (text) => text,
  bgMagenta: (text) => text,
  bgWhite: (text) => text,
  bgBlack: (text) => text,
  
  // Modifiers
  bold: (text) => text,
  dim: (text) => text,
  italic: (text) => text,
  underline: (text) => text,
  inverse: (text) => text,
  strikethrough: (text) => text,
};

// Add chaining capabilities
Object.keys(chalk).forEach(key => {
  const colorFn = chalk[key];
  chalk[key] = function(text) {
    const result = colorFn(text);
    // Copy all methods to the result
    Object.keys(chalk).forEach(k => {
      result[k] = function(t) {
        return chalk[k](t);
      };
    });
    return result;
  };
});

module.exports = chalk; 