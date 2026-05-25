const fs = require('fs');
const path = require('path');
// Configuration for theme generation

const LAYOUT_CONFIG = [
    {
        objectName: "Compact",
        themeName: "compact",
        isConfig: true,
        tokenPaths: [
            "base-unit",
            "common",
            "typography-themes/default",
            "size-themes/default",
            "pdf-layout-themes/compact",
        ],
        output: "layouts/compact.ts"
    },
    {
        objectName: "Spacious",
        themeName: "spacious",
        isConfig: true,
        tokenPaths: [
            "pdf-layout-themes/spacious",
        ],
        output: "layouts/spacious.ts"
    },
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
    for (const themeConfig of LAYOUT_CONFIG) {
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
    for (const layoutConfig of LAYOUT_CONFIG) {
        const { objectName, themeName, tokenPaths, output } = layoutConfig;

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
            const patch = layoutConfig.patch || {};
            const patchedCssVariables = { ...sizeProcessedCssVariables, ...patch };

            // Add "px" to numeric size values in patched variables as well
            const finalCssVariables = addPxToSizeValues(patchedCssVariables);


            // Create output object
            const outputObject = finalCssVariables;


            // Generate TypeScript content with embedded data
            const tsContent = `// Auto-generated theme: ${themeName}
export default ${JSON.stringify(outputObject, null, 2)};
`;

            // Save to file in each product subdirectory with theme name
            const outputDir = path.resolve("./build/survey-pdf", path.dirname(output));
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const outputFileName = path.basename(output);
            const outputPath = path.join(outputDir, outputFileName);
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