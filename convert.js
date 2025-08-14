const fs = require('fs');
const path = require('path');

// Configuration for theme generation
const THEME_CONFIG = [
  {
    objectName: "testTheme",
    themeName: "test",
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "typography-themes/default",
      "style-themes/ctr-light"
    ],
    patch: {
      "--sjs2-color-fg-basic-primary": "#000000e6",
      "--sjs2-color-fg-basic-secondary": "#00000080",
      "--sjs2-color-fg-basic-primary-alt": "#000000bf",
      "--sjs2-color-utility-scrollbar": "#00000026",
      "--sjs2-color-utility-overlay-screen": "color(srgb 0.800112 0.933371 0.933371 / 0.35)",
      "--sjs2-color-border-basic-secondary": "#dcdcdcff",
      "--sjs2-color-border-basic-secondary-for-tests-only": "#d4d4d4",
      "--sjs2-color-utility-shadow-medium": "#004c441a",
      "--sjs2-color-bg-basic-secondary-dim": "#eaeaeaff",
      "--sjs2-color-bg-basic-secondary": "#f4f4f4ff"
    }
  },
  {
    objectName: "defaultTheme",
    themeName: "default-light",
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "typography-themes/default",
      "style-themes/ctr-light"
    ]
  },
  {
    objectName: "darkTheme",
    themeName: "default-dark",
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "typography-themes/default",
      "style-themes/ctr-dark"
    ]
  },
  {
    objectName: "contrastTheme",
    themeName: "default-contrast",
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "typography-themes/default",
      "style-themes/ctr-contrast"
    ]
  },
  {
    objectName: "dsbLightTheme",
    themeName: "dsb-light",
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "typography-themes/default",
      "style-themes/dsb-light"
    ]
  },
  {
    objectName: "dsbDarkTheme",
    themeName: "dsb-dark",
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "typography-themes/default",
      "style-themes/ctr-dark"
    ]
  },
  {
    objectName: "dsbContrastTheme",
    themeName: "dsb-contrast",
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "typography-themes/default",
      "style-themes/ctr-contrast"
    ]
  }
];

// Cache for storing all tokens
let allTokensCache = {};

// Function for recursive traversal of token objects
function flattenTokens(obj, prefix = '', result = {}) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newPrefix = prefix ? `${prefix}-${key}` : key;
      
      if (typeof value === 'object' && value !== null && typeof value.value !== 'string' && !value.type) {
        // Recursively traverse nested objects
        flattenTokens(value, newPrefix, result);
      } else if (value && typeof value === 'object' && typeof value.value === 'string') {
        // This is a token with a value
        result[newPrefix] = value;
      } else if (value && typeof value === 'object' && (value.x !== undefined || value.y !== undefined || value.blur !== undefined || value.spread !== undefined || value.color !== undefined)) {
        // This is a shadow object, process it
        result[newPrefix] = {
          value: value,
          type: value.type || 'dropShadow'
        };
      } else if (value && typeof value === 'object' && (value.duration !== undefined || value.x1 !== undefined || value.y1 !== undefined || value.stiffness !== undefined)) {
        // This is animation or other complex tokens, skip them
        continue;
      }
    }
  }
  return result;
}

// Function for filtering results, excluding complex objects
function filterComplexTokens(cssVariables) {
  const filtered = {};
  for (const [key, value] of Object.entries(cssVariables)) {
    if (typeof value === 'string' || typeof value === 'number') {
      filtered[key] = value;
    }
  }
  return filtered;
}

// Function for resolving token references
function resolveTokenReference(tokenPath) {
  const pathParts = tokenPath.split('.');
  let current = allTokensCache;
  
  for (const part of pathParts) {
    if (current && current[part]) {
      current = current[part];
    } else {
      return null;
    }
  }
  
  return current;
}

// Function for processing rgba values with CSS variables
function processRgbaValue(value) {
  // Process rgba values like "rgba( {sjs2.palette.gray.999}, {sjs2.opacity.x015} )"
  let processedValue = value.replace(/rgba\s*\(\s*\{([^}]+)\}\s*,\s*\{([^}]+)\}\s*\)/g, (match, colorToken, opacityToken) => {
    const colorVar = `var(--${colorToken.replace(/\./g, '-').toLowerCase()})`;
    const opacityVar = `var(--${opacityToken.replace(/\./g, '-').toLowerCase()})`;
    return `rgba(from ${colorVar} r g b / ${opacityVar})`;
  });
  
  // Process rgba values like "rgba( #19B394, {sjs2.opacity.x010} )"
  processedValue = processedValue.replace(/rgba\s*\(\s*([^,]+)\s*,\s*\{([^}]+)\}\s*\)/g, (match, color, opacityToken) => {
    const opacityVar = `var(--${opacityToken.replace(/\./g, '-').toLowerCase()})`;
    return `rgba(from ${color} r g b / ${opacityVar})`;
  });
  
  // Process rgba values like "rgba({sjs2.palette.gray.900}, {sjs2.opacity.x040})"
  processedValue = processedValue.replace(/rgba\s*\(\s*\{([^}]+)\}\s*,\s*\{([^}]+)\}\s*\)/g, (match, colorToken, opacityToken) => {
    const colorVar = `var(--${colorToken.replace(/\./g, '-').toLowerCase()})`;
    const opacityVar = `var(--${opacityToken.replace(/\./g, '-').toLowerCase()})`;
    return `rgba(from ${colorVar} r g b / ${opacityVar})`;
  });
  
  return processedValue;
}

// Function for processing shadow values
function processShadowValue(shadowObj) {
  if (!shadowObj || typeof shadowObj !== 'object') {
    return null;
  }

  const { x, y, blur, spread, color, type } = shadowObj;
  
  // Convert shadow properties to CSS string
  let shadowString = '';
  
  // Add offset values
  if (x !== undefined && y !== undefined) {
    shadowString += `${x} ${y}`;
  }
  
  // Add blur
  if (blur !== undefined) {
    shadowString += ` ${blur}`;
  }
  
  // Add spread
  if (spread !== undefined) {
    shadowString += ` ${spread}`;
  }
  
  // Add color
  if (color !== undefined) {
    shadowString += ` ${color}`;
  }
  
  // Add inset for innerShadow
  if (type === 'innerShadow') {
    shadowString = `inset ${shadowString}`;
  }
  
  return shadowString.trim();
}

// Function for processing shadow values with token resolution
function processShadowValueWithResolution(shadowObj, visited = new Set()) {
  if (!shadowObj || typeof shadowObj !== 'object') {
    return null;
  }

  const { x, y, blur, spread, color, type } = shadowObj;
  
  // Convert shadow properties to CSS string with token resolution
  let shadowString = '';
  
  // Add offset values
  if (x !== undefined && y !== undefined) {
    const resolvedX = evaluateTokenValue(x, 'sizing', visited);
    const resolvedY = evaluateTokenValue(y, 'sizing', visited);
    shadowString += `${resolvedX} ${resolvedY}`;
  }
  
  // Add blur
  if (blur !== undefined) {
    const resolvedBlur = evaluateTokenValue(blur, 'sizing', visited);
    shadowString += ` ${resolvedBlur}`;
  }
  
  // Add spread
  if (spread !== undefined) {
    const resolvedSpread = evaluateTokenValue(spread, 'sizing', visited);
    shadowString += ` ${resolvedSpread}`;
  }
  
  // Add color
  if (color !== undefined) {
    const resolvedColor = evaluateTokenValue(color, 'color', visited);
    shadowString += ` ${resolvedColor}`;
  }
  
  // Add inset for innerShadow
  if (type === 'innerShadow') {
    shadowString = `inset ${shadowString}`;
  }
  
  return shadowString.trim();
}

// Function for processing color modifications via $extensions.studio.tokens.modify
function processColorModifications(tokenData, visited = new Set()) {
  if (!tokenData || typeof tokenData !== 'object') {
    return tokenData;
  }

  // Check if token has color modifications
  if (tokenData.$extensions && 
      tokenData.$extensions['studio.tokens'] && 
      tokenData.$extensions['studio.tokens'].modify) {
    
    const modify = tokenData.$extensions['studio.tokens'].modify;
    const { type, value, space } = modify;
    
    // Get the base color value
    let baseColor = tokenData.value;
    
    // If base color is a reference, resolve it first
    if (typeof baseColor === 'string' && baseColor.includes('{')) {
      baseColor = baseColor.replace(/\{([^}]+)\}/g, (match, tokenPath) => {
        const resolvedToken = resolveTokenReference(tokenPath);
        return resolvedToken ? resolvedToken.value : match;
      });
    }
    
    // Apply color modification based on type
    if (type === 'darken' || type === 'lighten') {
      const modifierValue = parseFloat(value);
      if (!isNaN(modifierValue)) {
        // Calculate multiplier: darken = multiply by (1 - value), lighten = multiply by (1 + value)
        const multiplier = type === 'darken' ? (1 - modifierValue) : (1 + modifierValue);
        
        // Convert color to HSL if space is 'hsl'
        if (space === 'hsl') {
          // Modify lightness (L) component by multiplying
          if (type === 'darken') {
            return `hsl(from ${baseColor} h s calc(l * ${multiplier}))`;
          } else if (type === 'lighten') {
            return `hsl(from ${baseColor} h s calc(l * ${multiplier}))`;
          }
        }
        // Convert color to LCH if space is 'lch'
        else if (space === 'lch') {
          // Modify lightness (L) component by multiplying
          if (type === 'darken') {
            return `lch(from ${baseColor} calc(l * ${multiplier}) c h)`;
          } else if (type === 'lighten') {
            return `lch(from ${baseColor} calc(l * ${multiplier}) c h)`;
          }
        }
      }
    }
  }
  
  return tokenData.value;
}

// Function for evaluating token values with recursive reference resolution
function evaluateTokenValue(value, type, visited = new Set()) {
  if (typeof value === 'string') {
    let processedValue = value;

    // Process rgba values
    processedValue = processRgbaValue(processedValue);
    
    // Process references to other tokens
    processedValue = processedValue.replace(/\{([^}]+)\}/g, (match, tokenPath) => {
      return `var(--${tokenPath.replace(/\./g, '-').toLowerCase()})`;
    });
    
    
    // Process mathematical operations
    if (processedValue.includes('*')) {
      const parts = processedValue.split('*').map(part => part.trim());
      if (parts.length === 2) {
        const left = parts[0];
        const right = parts[1];
        
        // Check if both parts are numbers
        const leftNum = parseFloat(left);
        const rightNum = parseFloat(right);
        
        if (!isNaN(leftNum) && !isNaN(rightNum)) {
          // Both are numbers, calculate the result
          processedValue = (leftNum * rightNum).toString();
        } else {
          // At least one part is a CSS variable or complex expression, wrap in calc()
          processedValue = `calc(${left} * ${right})`;
        }
      }
    }
    
    // Add units for certain types
    if (type === 'sizing' || type === 'spacing' || type === 'borderRadius' || type === 'borderWidth' || type === 'baseUnit') {
      if (!processedValue.includes('px') && !processedValue.includes('%') && !processedValue.includes('em') && !processedValue.includes('rem')) {
        // If it's a number, add px
        if (!isNaN(parseFloat(processedValue))) {
          processedValue = `${processedValue}px`;
        }
      }
    }
    
    return processedValue;
  } else if (typeof value === 'object' && value !== null) {
    // Handle shadow objects
    if (value.x !== undefined || value.y !== undefined || value.blur !== undefined || value.spread !== undefined || value.color !== undefined) {
      return processShadowValueWithResolution(value, visited);
    }
  }
  
  return value;
}

// Function for converting token name to CSS variable
function tokenToCSSVariable(tokenName) {
  return `--${tokenName.replace(/\./g, '-').toLowerCase()}`;
}

// Function for loading all tokens
function loadAllTokens() {
  const tokensDir = path.join(__dirname, 'tokens');
  
  // Collect all unique token paths from all theme configurations
  const allTokenPaths = new Set();
  for (const themeConfig of THEME_CONFIG) {
    for (const tokenPath of themeConfig.tokenPaths) {
      allTokenPaths.add(tokenPath);
    }
  }
  
  // Collect all tokens
  const allTokens = {};
  
  for (const tokenPath of allTokenPaths) {
    const tokenFilePath = path.join(tokensDir, `${tokenPath}.json`);
    
    if (fs.existsSync(tokenFilePath)) {
      const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
      
      // Merge tokens from all files
      Object.assign(allTokens, tokenData);
    } else {
      console.warn(`Token file not found: ${tokenFilePath}`);
    }
  }
  
  return allTokens;
}

// Function for creating TypeScript files with embedded data
function createTypeScriptFiles() {
  const tokensDir = path.join(__dirname, 'tokens');
  const buildDir = path.join(__dirname, 'prebuild');
  
  // Create Build directory if it doesn't exist
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Load all tokens into cache
  allTokensCache = loadAllTokens();
  
  // Process each theme configuration
  for (const themeConfig of THEME_CONFIG) {
    const { objectName, themeName, tokenPaths } = themeConfig;
    
    try {
      // Collect all tokens for this theme
      const allThemeTokens = {};
      
      for (const tokenPath of tokenPaths) {
        const tokenFilePath = path.join(tokensDir, `${tokenPath}.json`);
        
        if (!fs.existsSync(tokenFilePath)) {
          console.warn(`Token file not found: ${tokenFilePath}`);
          continue;
        }
        
        const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
        const flattenedTokens = flattenTokens(tokenData);
        
        // Merge tokens into theme collection
        Object.assign(allThemeTokens, flattenedTokens);
      }
      
      // Convert tokens to CSS variables
      const cssVariables = {};
      for (const [tokenName, tokenData] of Object.entries(allThemeTokens)) {
        if (tokenData.value !== undefined && typeof(tokenData.value) === "string") {
          const cssVarName = tokenToCSSVariable(tokenName);
          
          // Check for color modifications first
          let processedValue = processColorModifications(tokenData);
          
          // If no modifications were applied, use the original value
          if (processedValue === tokenData.value) {
            processedValue = evaluateTokenValue(tokenData.value, tokenData.type);
          }
          
          cssVariables[cssVarName] = processedValue;
        }
      }
      
      // Filter complex objects
      const filteredCssVariables = filterComplexTokens(cssVariables);
      
      // patch variables
      const patch = themeConfig.patch || {};
      const patchedCssVariables = {...filteredCssVariables, ...patch};
      

      // Create output object
      const outputObject = {
        themeName: themeName,
        cssVariables: patchedCssVariables
      };
      
      // Generate TypeScript content with embedded data
      const tsContent = `// Auto-generated theme: ${themeName}
export const ${objectName} = ${JSON.stringify(outputObject, null, 2)} as const;

export default ${objectName};
`;
      
      // Save to file
      const outputPath = path.join(buildDir, `${objectName}.ts`);
      fs.writeFileSync(outputPath, tsContent);
      
      console.log(`Created TypeScript file: ${outputPath}`);
      
    } catch (error) {
      console.error(`Error processing theme ${themeName}:`, error.message);
    }
  }
}

// Function to generate index.ts with re-exports
function generateIndexFile() {
  console.log('Generating index.ts file...');
  
  const buildDir = path.join(__dirname, 'prebuild');
  const indexPath = path.join(buildDir, 'index.ts');
  
  // Generate index content
  let indexContent = '// Re-export all theme modules for convenience\n';
  
  for (const themeConfig of THEME_CONFIG) {
    const { objectName } = themeConfig;
    
    indexContent += `export { ${objectName} } from './${objectName}';\n`;
  }
  indexContent += `export { sc2020Theme } from './sc2020Theme';\n`;
  fs.writeFileSync(indexPath, indexContent);
  console.log(`Generated TypeScript index file: ${indexPath}`);
}

// Function to copy sc2020Theme.ts to prebuild directory
function copySc2020Theme() {
  const sourceFile = path.join(__dirname, 'src', 'sc2020Theme.ts');
  const targetDir = path.join(__dirname, 'prebuild');
  const targetFile = path.join(targetDir, 'sc2020Theme.ts');
  
  try {
    if (fs.existsSync(sourceFile)) {
      // Create prebuild directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copy the file
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`Copied sc2020Theme.ts to: ${targetFile}`);
    } else {
      console.warn(`Source file not found: ${sourceFile}`);
    }
  } catch (error) {
    console.error('Error copying sc2020Theme.ts:', error.message);
  }
}

// Main function
function main() {
  console.log('Starting design tokens conversion...');
  
  try {
    // Create TypeScript files with embedded data
    createTypeScriptFiles();
    
    // Generate index.ts
    generateIndexFile();
    
    // Copy sc2020Theme.ts to prebuild directory
    copySc2020Theme();
    
    console.log('Conversion completed successfully!');
  } catch (error) {
    console.error('Error converting tokens:', error.message);
  }
}

// Run script
if (require.main === module) {
  main();
}

module.exports = {
  flattenTokens,
  evaluateTokenValue,
  processColorModifications,
  tokenToCSSVariable,
  loadAllTokens,
  createTypeScriptFiles,
  generateIndexFile,
  copySc2020Theme
}; 