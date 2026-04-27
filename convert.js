const fs = require('fs');
const path = require('path');
// Configuration for theme generation

const booleanPatch = {
  "--sjs2-border-effect-component-boolean-default": "inset 0px 1px 2px 0px var(--sjs2-color-component-boolean-default-border)",
  "--sjs2-border-effect-component-boolean-disabled": "inset 0px 0px 0px var(--sjs2-border-width-x100) var(--sjs2-color-component-boolean-disabled-border)",
  "--sjs2-border-effect-component-boolean-invalid": "inset 0px 0px 0px var(--sjs2-border-width-x100) var(--sjs2-color-component-boolean-invalid-border)",
  "--sjs2-border-effect-component-boolean-highlighted": "inset 0px 0px 0px var(--sjs2-border-width-x200) var(--sjs2-color-component-boolean-highlighted-border)",
  "--sjs2-border-effect-component-boolean-readonly": "inset 0px 0px 0px var(--sjs2-border-width-x100) var(--sjs2-color-component-boolean-readonly-border)",
  "--sjs2-border-effect-component-boolean-design": "inset 0px 1px 2px 0px var(--sjs2-color-component-boolean-design-border)",

  "--sjs2-border-effect-component-boolean-item-false-default": "0px 0px 0px 0px var(--sjs2-color-component-boolean-item-false-default-border)",
  "--sjs2-border-effect-component-boolean-item-false-disabled": "0px 0px 0px 0px var(--sjs2-color-component-boolean-item-false-disabled-border)",
  "--sjs2-border-effect-component-boolean-item-false-readonly": "0px 0px 0px 0px var(--sjs2-color-component-boolean-item-false-readonly-border)",
  "--sjs2-border-effect-component-boolean-item-false-hovered": "0px 0px 0px 0px var(--sjs2-color-component-boolean-item-false-hovered-border)",

  "--sjs2-border-effect-component-boolean-item-true-default": "0px 2px 4px 0px var(--sjs2-color-component-boolean-item-true-default-border)",
  "--sjs2-border-effect-component-boolean-item-true-disabled": "inset 0px 0px 0px var(--sjs2-border-width-x200) var(--sjs2-color-component-boolean-item-true-disabled-border)",
  "--sjs2-border-effect-component-boolean-item-true-readonly": "inset 0px 0px 0px var(--sjs2-border-width-x200) var(--sjs2-color-component-boolean-item-true-readonly-border)",
}

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
      "radius-themes/default",
      "typography-themes/default",
      "style-themes/soft-light"
    ],
    patch: {
      ...booleanPatch,
      "--sjs2-color-component-boolean-item-false-hovered-value": "rgba(0, 0, 0, 0.45)",
      "--sjs2-color-component-boolean-readonly-border": "transparent",
      "--sjs2-color-component-boolean-item-true-readonly-border": "#161616",
      "--sjs2-color-component-boolean-invalid-border": "rgba(0, 0, 0, 0.15)",
      "--sjs2-base-unit-radius": "4px",
      "--sjs2-color-bg-neutral-tertiary-dim": "#f3f3f3",
      "--sjs2-radius-component-panel": "4px",
      "--sjs2-color-component-action-neutral-tertiary-default-icon": "rgba(from #1C1B20 r g b / calc(1% * 60))",
      "--sjs2-color-component-action-neutral-tertiary-hovered-icon": "#909090",
      "--sjs2-color-component-action-neutral-tertiary-hovered-bg": "#f3f3f3",
      "--sjs2-border-effect-component-formbox-invalid": "inset 0 1px 2px 0 rgba(0, 0, 0, 0.15)",
      "--sjs2-color-component-formbox-invalid-bg": "rgba(230, 10, 62, .1)",
      "--sjs2-color-component-formbox-invalid-focused-bg": "rgba(230, 10, 62, .1)",
      "--sjs2-border-effect-component-formbox-invalid-focused": "0px 0px 0px 2px var(--sjs2-color-bg-brand-primary)",
      "--sjs2-color-component-formbox-readonly-bg": "#f8f8f8",
      "--sjs2-border-effect-component-formbox-readonly": "none",
      "--sjs2-base-unit-spacing": "var(--sjs2-base-unit-size)",
      "--sjs2-base-unit-line-height": "var(--sjs2-base-unit-font-size)",
      "--sjs2-border-effect-component-formbox-focused": "0px 0px 0px 2px var(--sjs2-color-bg-brand-primary)",
      "--sjs2-typography-font-weight-component-header-title": "700",
      "--sjs2-typography-font-weight-component-page-title": "700",
      "--sjs2-typography-font-size-component-header-description": "20px",
      "--sjs2-color-component-buttongroup-item-false-default-value": "#1c1b20",
      "--sjs2-color-component-action-neutral-tertiary-default-icon": "rgba(from #1c1b20 r g b / calc(1% * 60))",
      "--sjs2-color-component-tagbox-item-default-bg": "#19b394",
      "--sjs2-color-component-tagbox-item-hovered-bg": "#19b394",
      "--sjs2-color-component-tagbox-item-default-border": "transparent",
      "--sjs2-color-component-tagbox-item-hovered-border": "transparent",
      "--sjs2-color-component-tagbox-item-action-hovered-bg": "rgba(255, 255, 255, 0.25)",
      "--sjs2-color-component-tagbox-item-action-default-bg": "rgba(255, 255, 255, 0.25)",
      "--sjs2-color-component-tagbox-item-default-label": "#ffffff",
      "--sjs2-color-component-tagbox-item-hovered-label": "#ffffff",
      "--sjs2-color-component-tagbox-item-action-default-icon": "#ffffff",
      "--sjs2-color-component-tagbox-item-action-hovered-icon": "#ffffff",
      "--sjs2-color-component-check-true-readonly-icon": "#161616",
      "--sjs2-radius-component-page": "8px",
      "--sjs2-radius-component-drop": "4px",
      "--sjs2-radius-component-modal": "8px",
      "--sjs2-typography-line-height-component-header-description": "calc(1.5 * var(--sjs2-typography-font-size-component-header-description))",
      "--sjs2-typography-line-height-component-page-title": "calc(1.33 * var(--sjs2-typography-font-size-component-page-title))",
      "--sjs2-color-component-track-default-bg": "#d4d4d4",
      "--sjs2-color-component-check-false-invalid-bg": "rgba(230, 10, 62, .1)",
      "--sjs2-color-component-boolean-invalid-bg": "rgba(230, 10, 62, .1)",
      "--sjs2-border-effect-component-check-false-invalid": "inset 0 1px 2px 0 rgba(0, 0, 0, 0.15)",
      "--sjs2-border-effect-component-boolean-invalid": "inset 0 1px 2px 0 rgba(0, 0, 0, 0.15)"
    }
  },
  {
    objectName: "SoftLight",
    themeName: "soft-light",
    fileName: "soft-light",
    iconSet: "v2",
    isLight: true,
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "radius-themes/default",
      "typography-themes/default",
      "style-themes/soft-light"
    ],
    patch: {...booleanPatch},
  },
  {
    objectName: "DefaultLight",
    themeName: "default",
    fileName: "default-light",
    iconSet: "v2",
    isLight: true,
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "radius-themes/default",
      "typography-themes/default",
      "style-themes/default-light"
    ],
    patch: {...booleanPatch},
  },
  {
    objectName: "DefaultDark",
    themeName: "default",
    fileName: "default-dark",
    iconSet: "v2",
    isLight: false,
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "radius-themes/default",
      "typography-themes/default",
      "style-themes/default-dark"
    ],
    patch: {...booleanPatch},
    
  },
  {
    objectName: "ContrastLight",
    themeName: "default",
    fileName: "contrast-light",
    iconSet: "v2",
    isLight: true,
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "radius-themes/default",
      "typography-themes/default",
      "style-themes/contrast-light"
    ],
    patch: {...booleanPatch},
  },
  {
    objectName: "MonochromeLight",
    themeName: "monochrome-light",
    fileName: "monochrome-light",
    iconSet: "v2",
    isLight: true,
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "radius-themes/default",
      "typography-themes/default",
      "style-themes/monochrome-light"
    ],
    patch: {...booleanPatch},
  },
  {
    objectName: "TestCreator",
    themeName: "test-creator",
    iconSet: "v2",
    isLight: true,
    tokenPaths: [
      "base-unit",
      "common",
      "palette",
      "size-themes/default",
      "radius-themes/default",
      "typography-themes/default",
      "style-themes/default-light"
    ],
    patch: {
      "--sjs2-radius-component-formbox": "var(--sjs2-radius-x075)",
      "--sjs2-color-fg-basic-primary": "#000000e6",
      "--sjs2-color-fg-basic-secondary": "#00000080",
      "--sjs2-color-bg-basic-primary-dim": "#f5f5f5",
      "--sjs2-color-fg-basic-primary-muted": "#000000bf",
      "--sjs2-color-utility-scrollbar": "#00000026",
      "--sjs2-color-utility-overlay": "color(srgb 0.800112 0.933371 0.933371 / 0.35)",
      "--sjs2-color-border-basic-secondary": "#dcdcdcff",
      "--sjs2-color-border-basic-secondary-for-tests-only": "#d4d4d4",
      "--sjs2-color-utility-shadow-floating-default": "#004c441a",
      "--sjs2-color-bg-basic-secondary-dim": "#eaeaeaff",
      "--sjs2-color-bg-basic-secondary": "#f4f4f4ff",
	    "--sjs2-color-bg-accent-secondary-dim": "#19b39440",
      "--sjs2-color-component-formbox-design-bg": "#f8f8f8ff",
      "--sjs2-color-utility-shadow-surface-default": "#00000040",
      "--sjs2-color-component-check-true-default-bg": "#ffffff",
      "--sjs2-color-component-check-true-default-border": "#d4d4d4",
      "--sjs2-color-component-check-true-default-icon": "#19B394",
      "--sjs2-color-component-buttongroup-item-false-default-value": "rgb(28, 27, 32)",
      "--sjs2-color-component-formbox-action-default-icon": "rgb(66, 65, 70)",
      "--sjs2-color-component-formbox-action-pressed-icon": "rgba(66, 65, 70, 0.5)",
      "--sjs2-radius-component-modal": "16px",
      "--sjs2-color-component-toggle-false-default-thumb": "#000000BF",
      "--sjs2-color-component-toggle-false-hovered-thumb": "#000000BF",
    }
  }
];

// Cache for storing all tokens
let allTokensCache = {};

// Current theme's flattened tokens (set per theme during processing)
let currentThemeFlatTokens = {};

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
      } else if (value && typeof value === 'object' && Array.isArray(value.value)) {
        // This is a token with array value (e.g. boxShadow - array of shadow objects)
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

// Check if a token path refers to a shadow component (offset, blur, spread)
function isShadowComponentToken(tokenPath) {
  const lower = tokenPath.toLowerCase();
  return lower.startsWith('sjs2.border-offset.') || 
         lower.startsWith('sjs2.border-blur.') || 
         lower.startsWith('sjs2.border-spread.');
}

// Check if a CSS variable name is a shadow component
function isShadowComponentCSSVar(cssVarName) {
  return cssVarName.startsWith('--sjs2-border-offset-') || 
         cssVarName.startsWith('--sjs2-border-blur-') || 
         cssVarName.startsWith('--sjs2-border-spread-');
}

// Resolve a shadow component token reference to its underlying value.
// If the token itself references another shadow component, resolve recursively.
// Non-shadow references are kept as `{token.path}` for later conversion to var().
function resolveShadowComponentRef(value) {
  if (typeof value !== 'string') return value;
  const refMatch = value.match(/^\{([^}]+)\}$/);
  if (refMatch && isShadowComponentToken(refMatch[1])) {
    const flatKey = refMatch[1].replace(/\./g, '-');
    const token = currentThemeFlatTokens[flatKey];
    if (token && token.value !== undefined) {
      return resolveShadowComponentRef(String(token.value));
    }
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

// Check if a CSS shadow string represents an invisible shadow (all dimensions are 0)
function isShadowInvisible(shadowString) {
  if (!shadowString || typeof shadowString !== 'string') return false;
  const s = shadowString.trim().replace(/^inset\s+/, '');
  const tokens = s.split(/\s+/);
  if (tokens.length < 2) return false;
  const dimensions = [];
  for (let i = 0; i < 4 && i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '0' || t === '0px') {
      dimensions.push(0);
    } else if (/^-?\d+(\.\d+)?(px)?$/.test(t)) {
      dimensions.push(parseFloat(t) === 0 ? 0 : 1);
    } else {
      dimensions.push(1);
    }
  }
  return dimensions.length >= 2 && dimensions.every(d => d === 0);
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
  
  const result = shadowString.trim();
  return isShadowInvisible(result) ? null : result;
}

// Function for processing shadow values with token resolution
function processShadowValueWithResolution(shadowObj, visited = new Set()) {
  if (!shadowObj || typeof shadowObj !== 'object') {
    return null;
  }

  const { x, y, blur, spread, color, type } = shadowObj;
  
  // Convert shadow properties to CSS string with token resolution.
  // Shadow component references (border-offset, border-blur, border-spread)
  // are resolved inline rather than emitted as separate CSS variables.
  let shadowString = '';
  
  if (x !== undefined && y !== undefined) {
    const resolvedX = evaluateTokenValue(resolveShadowComponentRef(x), 'sizing', visited);
    const resolvedY = evaluateTokenValue(resolveShadowComponentRef(y), 'sizing', visited);
    shadowString += `${resolvedX} ${resolvedY}`;
  }
  
  if (blur !== undefined) {
    const resolvedBlur = evaluateTokenValue(resolveShadowComponentRef(blur), 'sizing', visited);
    shadowString += ` ${resolvedBlur}`;
  }
  
  if (spread !== undefined) {
    const resolvedSpread = evaluateTokenValue(resolveShadowComponentRef(spread), 'sizing', visited);
    shadowString += ` ${resolvedSpread}`;
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
  return isShadowInvisible(result) ? null : result;
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
    if (Array.isArray(value)) {
      return value
        .map(item => processShadowValueWithResolution(item, visited))
        .filter(Boolean)
        .join(', ');
    }
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

  function getBaseThemeConfig() {
    // One common base for all themes so they stay compatible.
    // Prefer DefaultLight + style-themes/default-light.
    const candidates = THEME_CONFIG.filter(cfg =>
      cfg &&
      cfg.objectName === "DefaultLight" &&
      cfg.isLight === true &&
      Array.isArray(cfg.tokenPaths) &&
      cfg.tokenPaths.includes("style-themes/default-light")
    );

    const byFileName = candidates.find(c => c.fileName === "default-light");
    if (byFileName) return byFileName;

    const byThemeName = candidates.find(c => c.themeName === "default-light" || c.themeName === "default");
    if (byThemeName) return byThemeName;

    return candidates[0] || THEME_CONFIG[0];
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

    // Make flattened tokens available for shadow component resolution
    currentThemeFlatTokens = allThemeTokens;

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
      } else if (tokenData.value !== undefined && Array.isArray(tokenData.value)) {
        // Array of shadows (boxShadow) -> single CSS box-shadow value
        cssVariables[cssVarName] = evaluateTokenValue(tokenData.value, tokenData.type);
      }
    }

    // Remove shadow component variables (their values are inlined into border-effect)
    for (const key of Object.keys(cssVariables)) {
      if (isShadowComponentCSSVar(key)) {
        delete cssVariables[key];
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
    return addPxToSizeValues(patchedCssVariables);
  }

  function chunkArray(items, chunkSize) {
    if (!Array.isArray(items)) return [];
    if (!Number.isFinite(chunkSize) || chunkSize <= 0) return [items];
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  }

  function toRootScss(cssVariables, { selector = '.sd-theme-root', chunkSize = 50 } = {}) {
    const keys = Object.keys(cssVariables).sort();
    const blocks = chunkArray(keys, chunkSize).map((chunkKeys) => {
      const lines = chunkKeys.map(k => `  ${k}: ${cssVariables[k]};`);
      return `${selector} {\n${lines.join('\n')}\n}\n`;
    });
    return blocks.join('\n');
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
  const baseCssVariables = buildThemeCssVariables(baseThemeConfig);

  // Write base theme SCSS file into build/ (chunked to avoid huge selectors)
  const baseForScssVars = baseCssVariables;
  const baseScssPath = path.join(buildDir, "base-theme.scss");
  fs.writeFileSync(baseScssPath, toRootScss(baseForScssVars, { selector: '.sd-theme-root', chunkSize: 50 }));
  console.log(`Created SCSS file: ${baseScssPath}`);
  
  // Process each theme configuration
  for (const themeConfig of THEME_CONFIG) {
    const { objectName, themeName, tokenPaths } = themeConfig;
    
    try {
      const themeCssVariables = buildThemeCssVariables(themeConfig);

      const isBase = themeConfig === baseThemeConfig;
      const finalCssVariables = isBase ? {} : diffCssVariables(themeCssVariables, baseCssVariables);

      const outputObject = {
        themeName: themeName,
        iconSet: themeConfig.iconSet,
        isLight: themeConfig.isLight,
        cssVariables: finalCssVariables
      };

      const tsContent = `// Auto-generated theme: ${themeName}
export default ${JSON.stringify(outputObject, null, 2)};
`;

      const themesDir = path.join(buildDir, "themes");
      if (!fs.existsSync(themesDir)) {
        fs.mkdirSync(themesDir, { recursive: true });
      }

      const outputFileName = (themeConfig.fileName !== undefined ? themeConfig.fileName : themeName) + '.ts';
      const outputPath = path.join(themesDir, outputFileName);
      fs.writeFileSync(outputPath, tsContent);

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