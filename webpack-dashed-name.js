class DashedNamePlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('DashedNamePlugin', (compilation) => {
      compilation.hooks.afterOptimizeChunkIds.tap('DashedNamePlugin', (chunks) => {
        chunks.forEach(chunk => {
          if (chunk.name) {
            // Convert camelCase or PascalCase to kebab-case
            const dashedName = chunk.name
              .replace(/([a-z])([A-Z])/g, '$1-$2')
              .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
              .toLowerCase();
            
            // Store the dashed name for use in output templates
            chunk.dashedName = dashedName;
          }
        });
      });
    });
  }
}

module.exports = DashedNamePlugin; 