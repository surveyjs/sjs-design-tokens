const fs = require('fs');
const path = require('path');
// Configuration for theme generation

const THEME_CONFIG = [];

const styleThemes = ["default", "soft", "contrast", "monochrome", "3d", "borderless", "flat", "plain"];
const palletes = ["light", "dark"];

for (const themeInList of styleThemes) {
  const theme = themeInList === "3d" ? "threedimensional" : themeInList;
  for (const pallete of palletes) {
    const fileName = `${theme}-${pallete}`;
    const styleTokenPath = `style-themes/${fileName}`;
    const styleTokenFilePath = path.join(__dirname, 'tokens', `${styleTokenPath}.json`);
    if (!fs.existsSync(styleTokenFilePath)) {
      // Style theme tokens are required for generating the theme.
      // If missing, skip creating this theme altogether.
      continue;
    }
    const defaultConfig = {
      themeName: theme,
      fileName: fileName,
      isLight: pallete === "light",
      colorPalette: pallete,
      tokenPaths: 
      [
        "base-unit", 
        "common", 
        "palette", 
        "layout-themes/default",
        "size-themes/default", 
        "radius-themes/default", 
        "typography-themes/default",
        styleTokenPath
      ],
    };
    
    THEME_CONFIG.push(defaultConfig);
    THEME_CONFIG.push({...defaultConfig, fileName: `${fileName}-panelless`, isPanelless: true});
  }
}

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
      } else if (value && typeof value === 'object' && (typeof value.value === 'string' || typeof value.value === 'number')) {
        // This is a token with a scalar value (string or number)
        result[newPrefix] = value;
      } else if (value && typeof value === 'object' && Array.isArray(value.value)) {
        // This is a token with array value (e.g. boxShadow - array of shadow objects)
        result[newPrefix] = value;
      } else if (value && typeof value === 'object' && isShadowObject(value.value)) {
        // This is a token with a single shadow object value
        result[newPrefix] = value;
      } else if (value && typeof value === 'object' && isShadowObject(value)) {
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

// Convert token references in shadow dimensions to CSS var() in border-effect values.
function shadowComponentRefToVar(value) {
  if (typeof value === 'number') return formatShadowDimension(value);
  if (typeof value !== 'string') return value;
  const refMatch = value.match(/^\{([^}]+)\}$/);
  if (refMatch) {
    return `var(--${refMatch[1].replace(/\./g, '-').toLowerCase()})`;
  }
  return formatShadowDimension(value);
}

// Convert bare zero shadow dimensions to "0px" (border-effect tokens use "0")
function formatShadowDimension(value) {
  if (value === 0 || value === '0') {
    return '0px';
  }
  return value;
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

function isZeroShadowDimension(value) {
  if (value === undefined || value === null) return true;
  if (value === 0 || value === '0' || value === '0px') return true;
  return false;
}

function isTransparentShadowColor(color) {
  if (color === undefined || color === null) return true;
  if (typeof color !== 'string') return false;
  if (color.includes('{')) return false;
  const normalized = color.trim().toLowerCase().replace(/\s+/g, '');
  if (normalized === 'transparent') return true;
  const match = normalized.match(/^rgba?\(([^)]+)\)$/);
  if (match) {
    const parts = match[1].split(',');
    if (parts.length === 4) {
      return parseFloat(parts[3]) === 0;
    }
  }
  return false;
}

function isShadowObject(obj) {
  return obj && typeof obj === 'object' &&
    (obj.x !== undefined || obj.y !== undefined || obj.blur !== undefined || obj.spread !== undefined || obj.color !== undefined);
}

// Drop placeholder shadows (zero size + fully transparent color), keep zero-size border-effects.
function isShadowObjectInvisible(shadowObj) {
  if (!shadowObj || typeof shadowObj !== 'object') return true;
  const { x, y, blur, spread, color } = shadowObj;
  if (![x, y, blur, spread].every(isZeroShadowDimension)) return false;
  return isTransparentShadowColor(color);
}

// Function for processing shadow values
function processShadowValue(shadowObj, keepIfInvisible = false) {
  if (!shadowObj || typeof shadowObj !== 'object') {
    return null;
  }

  const { x, y, blur, spread, color, type } = shadowObj;
  
  // Convert shadow properties to CSS string
  let shadowString = '';
  
  // Add offset values
  if (x !== undefined && y !== undefined) {
    shadowString += `${formatShadowDimension(x)} ${formatShadowDimension(y)}`;
  }
  
  // Add blur
  if (blur !== undefined) {
    shadowString += ` ${formatShadowDimension(blur)}`;
  }
  
  // Add spread
  if (spread !== undefined) {
    shadowString += ` ${formatShadowDimension(spread)}`;
  }
  
  // Add color
  if (color !== undefined) {
    shadowString += ` ${color}`;
  }
  
  // Add inset for innerShadow
  if (type === 'innerShadow') {
    shadowString = `inset ${shadowString}`;
  }
  
  const result = shadowString.trim();
  return isShadowObjectInvisible(shadowObj) && !keepIfInvisible ? null : result;
}

// Function for processing shadow values with token resolution
function processShadowValueWithResolution(shadowObj, visited = new Set(), keepIfInvisible = false) {
  if (!shadowObj || typeof shadowObj !== 'object') {
    return null;
  }

  const { x, y, blur, spread, color, type } = shadowObj;
  
  // Shadow component references (border-offset, border-blur, border-spread)
  // are emitted as var() references to their own CSS variables.
  let shadowString = '';
  
  if (x !== undefined && y !== undefined) {
    shadowString += `${shadowComponentRefToVar(x)} ${shadowComponentRefToVar(y)}`;
  }
  
  if (blur !== undefined) {
    shadowString += ` ${shadowComponentRefToVar(blur)}`;
  }
  
  if (spread !== undefined) {
    shadowString += ` ${shadowComponentRefToVar(spread)}`;
  }
  
  if (color !== undefined) {
    const resolvedColor = evaluateTokenValue(color, 'color', visited);
    shadowString += ` ${resolvedColor}`;
  }
  
  // Add inset for innerShadow
  if (type === 'innerShadow') {
    shadowString = `inset ${shadowString}`;
  }
  
  const result = shadowString.trim();
  return isShadowObjectInvisible(shadowObj) && !keepIfInvisible ? null : result;
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
  if (typeof value === 'number') {
    if (type === 'sizing' || type === 'spacing' || type === 'borderRadius' || type === 'borderWidth' || type === 'baseUnit' || type === 'number') {
      return `${value}px`;
    }
    return String(value);
  }
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
    if (Array.isArray(value)) {
      const keepIfInvisible = value.length === 1;
      return value
        .map(item => processShadowValueWithResolution(item, visited, keepIfInvisible))
        .filter(Boolean)
        .join(', ');
    }
    if (isShadowObject(value)) {
      return processShadowValueWithResolution(value, visited, true);
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

  function getBaseThemeConfig() {
    // One common base for all themes so they stay compatible.
    // Prefer DefaultLight + style-themes/default-light.
    return THEME_CONFIG[0];
  }

  function buildThemeCssVariables(themeConfig) {
    const { tokenPaths } = themeConfig;

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
      const cssVarName = tokenToCSSVariable(tokenName);
      if (tokenData.value !== undefined && typeof tokenData.value === "string") {
        // Check for color modifications first
        let processedValue = processColorModifications(tokenData);

        // If no modifications were applied, use the original value
        if (processedValue === tokenData.value) {
          processedValue = evaluateTokenValue(tokenData.value, tokenData.type);
        }

        cssVariables[cssVarName] = processedValue;
      } else if (tokenData.value !== undefined && (Array.isArray(tokenData.value) || isShadowObject(tokenData.value))) {
        // boxShadow token (array or single shadow object) -> CSS box-shadow value
        cssVariables[cssVarName] = evaluateTokenValue(tokenData.value, tokenData.type);
      }
    }

    // Filter complex objects
    const filteredCssVariables = filterComplexTokens(cssVariables);

    // Add "px" to numeric size values
    const sizeProcessedCssVariables = addPxToSizeValues(filteredCssVariables);

    // patch variables
    const patch = themeConfig.patch || {};
    const patchedCssVariables = { ...sizeProcessedCssVariables, ...patch };

    // Add "px" to numeric size values in patched variables as well
    return {
      cssVariables: addPxToSizeValues(patchedCssVariables)
    };
  }

  function writeThemeTsFile(outputPath, label, themeConfig, cssVariables) {
    const outputObject = {
      themeName: themeConfig.themeName,
      iconSet: themeConfig.iconSet,
      colorPalette: themeConfig.colorPalette,
      isPanelless: themeConfig.isPanelless,
      cssVariables
    };

    const tsContent = `// Auto-generated theme: ${label}
export default ${JSON.stringify(outputObject, null, 2)};
`;
    fs.writeFileSync(outputPath, tsContent);
  }

  function diffCssVariables(themeCssVariables, baseCssVariables) {
    const diff = {};
    for (const [key, value] of Object.entries(themeCssVariables)) {
      if (!(key in baseCssVariables) || baseCssVariables[key] !== value) {
        diff[key] = value;
      }
    }
    return diff;
  }

  // Compute base theme once (used for diff generation of all themes)
  const baseThemeConfig = getBaseThemeConfig();
  if (!baseThemeConfig) {
    throw new Error('Base theme config not found.');
  }
  const baseBuilt = buildThemeCssVariables(baseThemeConfig);
  const baseCssVariables = baseBuilt.cssVariables;

  const baseTsPath = path.join(buildDir, "base-theme.ts");
  writeThemeTsFile(baseTsPath, "base", baseThemeConfig, baseCssVariables);
  console.log(`Created TypeScript file: ${baseTsPath}`);

  // Process each theme configuration
  for (const themeConfig of THEME_CONFIG) {
    const { objectName, themeName, tokenPaths } = themeConfig;
    
    try {
      const built = buildThemeCssVariables(themeConfig);
      const themeCssVariables = built.cssVariables;

      const isBase = themeConfig === baseThemeConfig;
      // Base theme variables live in base-theme.ts; per-theme files store only diffs.
      let finalCssVariables;
      if (themeConfig.exportAll) {
        finalCssVariables = { ...themeCssVariables };
      } else {
        finalCssVariables = isBase ? {} : diffCssVariables(themeCssVariables, baseCssVariables);
      }

      const themesDir = path.join(buildDir, "themes");
      if (!fs.existsSync(themesDir)) {
        fs.mkdirSync(themesDir, { recursive: true });
      }

      const outputFileName = (themeConfig.fileName !== undefined ? themeConfig.fileName : themeName) + '.ts';
      const outputPath = path.join(themesDir, outputFileName);
      writeThemeTsFile(outputPath, themeName, themeConfig, finalCssVariables);

      console.log(`Created TypeScript file: ${outputPath}`);
      
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