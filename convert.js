const fs = require('fs');
const path = require('path');

// Cache for storing all tokens
let allTokensCache = {};

// Function for recursive traversal of token objects
function flattenTokens(obj, prefix = '', result = {}) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newPrefix = prefix ? `${prefix}-${key}` : key;
      
      if (typeof value === 'object' && value !== null && !value.value && !value.type) {
        // Recursively traverse nested objects
        flattenTokens(value, newPrefix, result);
      } else if (value && typeof value === 'object' && value.value !== undefined) {
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
    return `rgba(${colorVar}, ${opacityVar})`;
  });
  
  // Process rgba values like "rgba( #19B394, {sjs2.opacity.x010} )"
  processedValue = processedValue.replace(/rgba\s*\(\s*([^,]+)\s*,\s*\{([^}]+)\}\s*\)/g, (match, color, opacityToken) => {
    const opacityVar = `var(--${opacityToken.replace(/\./g, '-').toLowerCase()})`;
    return `rgba(${color}, ${opacityVar})`;
  });
  
  // Process rgba values like "rgba({sjs2.palette.gray.900}, {sjs2.opacity.x040})"
  processedValue = processedValue.replace(/rgba\s*\(\s*\{([^}]+)\}\s*,\s*\{([^}]+)\}\s*\)/g, (match, colorToken, opacityToken) => {
    const colorVar = `var(--${colorToken.replace(/\./g, '-').toLowerCase()})`;
    const opacityVar = `var(--${opacityToken.replace(/\./g, '-').toLowerCase()})`;
    return `rgba(${colorVar}, ${opacityVar})`;
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

// Function for evaluating token values with recursive reference resolution
function evaluateTokenValue(value, type, visited = new Set()) {
  if (typeof value === 'string') {
    let processedValue = value;
    
    // Process references to other tokens
    processedValue = processedValue.replace(/\{([^}]+)\}/g, (match, tokenPath) => {
      // Check for circular references
      if (visited.has(tokenPath)) {
        console.warn(`Circular reference detected: ${tokenPath}`);
        return match;
      }
      
      const resolvedToken = resolveTokenReference(tokenPath);
      if (resolvedToken && resolvedToken.value !== undefined) {
        // Recursively evaluate the value
        visited.add(tokenPath);
        const resolvedValue = evaluateTokenValue(resolvedToken.value, resolvedToken.type, visited);
        visited.delete(tokenPath);
        return resolvedValue;
      }
      
      // If token is not found, convert path to CSS variable
      return `var(--${tokenPath.replace(/\./g, '-').toLowerCase()})`;
    });
    
    // Process rgba values
    processedValue = processRgbaValue(processedValue);
    
    // Process mathematical operations
    if (processedValue.includes('*')) {
      const parts = processedValue.split('*').map(part => part.trim());
      if (parts.length === 2) {
        const left = parseFloat(parts[0]);
        const right = parseFloat(parts[1]);
        if (!isNaN(left) && !isNaN(right)) {
          processedValue = (left * right).toString();
        }
      }
    }
    
    // Add units for certain types
    if (type === 'sizing' || type === 'spacing' || type === 'borderRadius' || type === 'borderWidth') {
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
  const metadataPath = path.join(tokensDir, '$metadata.json');
  
  if (!fs.existsSync(metadataPath)) {
    console.error('$metadata.json file not found');
    return {};
  }
  
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const tokenSetOrder = metadata.tokenSetOrder;
  
  // Collect all tokens
  const allTokens = {};
  
  for (const tokenSet of tokenSetOrder) {
    const tokenFilePath = path.join(tokensDir, `${tokenSet}.json`);
    
    if (fs.existsSync(tokenFilePath)) {
      const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
      
      // Merge tokens from all files
      Object.assign(allTokens, tokenData);
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
  
  // Load metadata to get token set order
  const metadataPath = path.join(tokensDir, '$metadata.json');
  if (!fs.existsSync(metadataPath)) {
    console.error('$metadata.json file not found');
    return;
  }
  
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const tokenSetOrder = metadata.tokenSetOrder;
  
  // Load all tokens into cache
  allTokensCache = loadAllTokens();
  
  // Track used export names to avoid conflicts
  const usedExportNames = new Set();
  
  for (const tokenSet of tokenSetOrder) {
    const tokenFilePath = path.join(tokensDir, `${tokenSet}.json`);
    
    if (!fs.existsSync(tokenFilePath)) {
      console.warn(`Token file not found: ${tokenFilePath}`);
      continue;
    }
    
    try {
      const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
      const flattenedTokens = flattenTokens(tokenData);
      
      const cssVariables = {};
      for (const [tokenName, tokenData] of Object.entries(flattenedTokens)) {
        if (tokenData.value !== undefined) {
          const cssVarName = tokenToCSSVariable(tokenName);
          const cssValue = evaluateTokenValue(tokenData.value, tokenData.type);
          cssVariables[cssVarName] = cssValue;
        }
      }
      
      // Filter complex objects
      const filteredCssVariables = filterComplexTokens(cssVariables);
      
      // Create output object
      const outputObject = {
        fileName: tokenSet,
        cssVariables: filteredCssVariables
      };
      
      // Determine output path based on token set structure
      const outputPathParts = tokenSet.split('/');
      const fileName = outputPathParts.pop(); // Get the filename
      const subDir = outputPathParts.join('/'); // Get the subdirectory path
      
      // Determine export name
      let exportName = fileName.replace(/-/g, '_');
      
      // Avoid using 'default' as export name (reserved word)
      if (exportName === 'default') {
        const prefix = subDir.replace(/-/g, '_').replace(/\//g, '_');
        exportName = `${prefix}_default`;
      }
      
      // Add prefix if export name is already used
      if (usedExportNames.has(exportName)) {
        const prefix = subDir.replace(/-/g, '_').replace(/\//g, '_');
        exportName = `${prefix}_${exportName}`;
      }
      usedExportNames.add(exportName);
      
      let outputPath;
      if (subDir) {
        // Create subdirectory structure in build folder
        const buildSubDir = path.join(buildDir, subDir);
        if (!fs.existsSync(buildSubDir)) {
          fs.mkdirSync(buildSubDir, { recursive: true });
        }
        outputPath = path.join(buildSubDir, `${fileName}.ts`);
      } else {
        // File is in root tokens directory
        outputPath = path.join(buildDir, `${fileName}.ts`);
      }
      
      // Generate TypeScript content with embedded data
      const tsContent = `// Auto-generated from ${tokenSet}.json
export const ${exportName} = ${JSON.stringify(outputObject, null, 2)} as const;

export default ${exportName};
`;
      
      // Save to file
      fs.writeFileSync(outputPath, tsContent);
      
      console.log(`Created TypeScript file: ${outputPath}`);
      
    } catch (error) {
      console.error(`Error processing token set ${tokenSet}:`, error.message);
    }
  }
}

// Function to generate index.ts with re-exports
function generateIndexFile() {
  console.log('Generating index.ts file...');
  
  const buildDir = path.join(__dirname, 'prebuild');
  const tokensDir = path.join(__dirname, 'tokens');
  const metadataPath = path.join(tokensDir, '$metadata.json');
  const indexPath = path.join(buildDir, 'index.ts');
  
  if (!fs.existsSync(metadataPath)) {
    console.error('$metadata.json file not found');
    return;
  }
  
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const tokenSetOrder = metadata.tokenSetOrder;
  
  // Track used export names to avoid conflicts
  const usedExportNames = new Set();
  
  // Generate index content
  let indexContent = '// Re-export all modules for convenience\n';
  
  for (const tokenSet of tokenSetOrder) {
    const tokenSetParts = tokenSet.split('/');
    const fileName = tokenSetParts.pop(); // Get the filename
    const subDir = tokenSetParts.join('/'); // Get the subdirectory path
    let exportName = fileName.replace(/-/g, '_');
    
    // Avoid using 'default' as export name (reserved word)
    if (exportName === 'default') {
      const prefix = subDir.replace(/-/g, '_').replace(/\//g, '_');
      exportName = `${prefix}_default`;
    }
    
    // Add prefix if export name is already used
    if (usedExportNames.has(exportName)) {
      const prefix = subDir.replace(/-/g, '_').replace(/\//g, '_');
      exportName = `${prefix}_${exportName}`;
    }
    usedExportNames.add(exportName);
    
    // Determine import path
    const importPath = subDir ? `${subDir}/${fileName}` : fileName;
    
    indexContent += `export { ${exportName} } from './${importPath}';\n`;
  }
  
  fs.writeFileSync(indexPath, indexContent);
  console.log(`Generated TypeScript index file: ${indexPath}`);
}

// Main function
function main() {
  console.log('Starting design tokens conversion...');
  
  try {
    // Create TypeScript files with embedded data
    createTypeScriptFiles();
    
    // Generate index.ts
    generateIndexFile();
    
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
  tokenToCSSVariable,
  loadAllTokens,
  createTypeScriptFiles,
  generateIndexFile
}; 