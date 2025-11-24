const fs = require('fs');
const path = require('path');

// Configuration for theme generation
const THEME_CONFIG = [
  {
    objectName: "Test",
    themeName: "test",
    iconSet: "v2",
    isLight: true,
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
      "--sjs2-color-bg-basic-primary-dim": "#f5f5f5",
      "--sjs2-color-fg-basic-primary-muted": "#000000bf",
      "--sjs2-color-utility-scrollbar": "#00000026",
      "--sjs2-color-utility-overlay-screen": "color(srgb 0.800112 0.933371 0.933371 / 0.35)",
      "--sjs2-color-border-basic-secondary": "#dcdcdcff",
      "--sjs2-color-border-basic-secondary-for-tests-only": "#d4d4d4",
      "--sjs2-color-utility-shadow-medium": "#004c441a",
      "--sjs2-color-bg-basic-secondary-dim": "#eaeaeaff",
      "--sjs2-color-bg-basic-secondary": "#f4f4f4ff",
	    "--sjs2-color-bg-accent-secondary-dim": "#19b39440",
      "--sjs2-color-control-formbox-design-bg": "#f8f8f8ff",
      "--sjs2-color-utility-shadow-surface-default": "#00000040"
    },
    products: ["survey-creator"]
  },
  {
    objectName: "DefaultLight",
    themeName: "default-light",
    iconSet: "v2",
    isLight: true,
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "typography-themes/default",
      "style-themes/ctr-light"
    ],
    products: ["survey-creator"]
  },
  {
    objectName: "DefaultDark",
    themeName: "default-dark",
    iconSet: "v2",
    isLight: false,
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "typography-themes/default",
      "style-themes/ctr-dark"
    ],
    products: ["survey-creator", "survey-analytics"]
  },
  {
    objectName: "contrastTheme",
    themeName: "default-contrast",
    iconSet: "v2",
    isLight: true,
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "typography-themes/default",
      "style-themes/ctr-contrast"
    ],
    products: ["survey-creator"]
  },
  {
    objectName: "Default",
    themeName: "default-light",
    iconSet: "v2",
    isLight: true,
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "typography-themes/default",
      "style-themes/dsb-light"
    ],
    products: ["survey-analytics"]
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

// Function to check if a CSS variable name represents a size value
function isSizeVariable(varName) {
  const sizeKeywords = [
    'spread', 'blur', 'offset-x', 'offset-y', 'offset',
    'width', 'height', 'size', 'radius', 'spacing',
    'padding', 'margin', 'gap', 'border-width'
  ];
  return sizeKeywords.some(keyword => varName.includes(keyword));
}

// Function to add "px" to numeric size values
function addPxToSizeValues(cssVariables) {
  const processed = {};
  for (const [key, value] of Object.entries(cssVariables)) {
    if (isSizeVariable(key)) {
      // If it's a string that's just a number, add "px"
      if (typeof value === 'string') {
        const trimmedValue = value.trim();
        // Check if the string is a valid number without units or functions
        const numValue = parseFloat(trimmedValue);
        const isNumericString = !isNaN(numValue) && 
            /^-?\d+(\.\d+)?$/.test(trimmedValue) &&
            !trimmedValue.includes('px') && !trimmedValue.includes('%') && 
            !trimmedValue.includes('em') && !trimmedValue.includes('rem') &&
            !trimmedValue.includes('var(') && !trimmedValue.includes('calc(') &&
            !trimmedValue.includes('rgb') && !trimmedValue.includes('hsl');
        if (isNumericString) {
          processed[key] = `${trimmedValue}px`;
        } else {
          processed[key] = value;
        }
      } else if (typeof value === 'number') {
        processed[key] = `${value}px`;
      } else {
        processed[key] = value;
      }
    } else {
      processed[key] = value;
    }
  }
  return processed;
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
    
    // If base color is a reference, convert to CSS variable
    if (typeof baseColor === 'string' && baseColor.includes('{')) {
      baseColor = baseColor.replace(/\{([^}]+)\}/g, (match, tokenPath) => {
        return `var(--${tokenPath.replace(/\./g, '-').toLowerCase()})`;
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
  const buildDir = path.join(__dirname, 'build');
  
  // Create Build directory if it doesn't exist
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Load all tokens into cache
  allTokensCache = loadAllTokens();
  
  // Process each theme configuration
  for (const themeConfig of THEME_CONFIG) {
    const { objectName, themeName, tokenPaths, products } = themeConfig;
    
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
      
      // Add "px" to numeric size values
      const sizeProcessedCssVariables = addPxToSizeValues(filteredCssVariables);
      
      // patch variables
      const patch = themeConfig.patch || {};
      const patchedCssVariables = {...sizeProcessedCssVariables, ...patch};
      
      // Add "px" to numeric size values in patched variables as well
      const finalCssVariables = addPxToSizeValues(patchedCssVariables);
      

      // Create output object
      const outputObject = {
        themeName: themeName,
        iconSet: themeConfig.iconSet,
        isLight: themeConfig.isLight,
        cssVariables: finalCssVariables
      };
      
      // Generate TypeScript content with embedded data
      const tsContent = `// Auto-generated theme: ${themeName}
export const ${objectName} = ${JSON.stringify(outputObject, null, 2)} as const;

export default ${objectName};
`;
      
      // Save to file in each product subdirectory with theme name
      for (const product of products) {
        const productDir = path.join(buildDir, product);
        if (!fs.existsSync(productDir)) {
          fs.mkdirSync(productDir, { recursive: true });
        }
        
        const outputPath = path.join(productDir, `${themeName}.ts`);
        fs.writeFileSync(outputPath, tsContent);
        
        console.log(`Created TypeScript file: ${outputPath}`);
      }
      
    } catch (error) {
      console.error(`Error processing theme ${themeName}:`, error.message);
    }
  }
}



// Main function
function main() {
  console.log('Starting design tokens conversion...');
  
  try {
    // Create TypeScript files with embedded data
    createTypeScriptFiles();
    
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
  createTypeScriptFiles
}; 