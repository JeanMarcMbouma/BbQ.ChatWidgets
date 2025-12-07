import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const buildOptions = {
  entryPoints: [
    'dist/index.js',
    'dist/models/index.js',
    'dist/renderers/index.js',
    'dist/handlers/index.js',
  ],
  outdir: 'dist',
  outExtension: { '.js': '.cjs' },
  bundle: false,
  format: 'cjs',
  platform: 'browser',
  target: 'es2020',
};

async function build() {
  try {
    // Build CJS versions
    await esbuild.build(buildOptions);
    console.log('? Built CommonJS versions');

    // Ensure package.json is in dist
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const distPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      license: packageJson.license,
      main: './index.js',
      module: './index.js',
      types: './index.d.ts',
      exports: {
        '.': {
          import: './index.js',
          require: './index.cjs',
          types: './index.d.ts',
        },
      },
    };

    fs.writeFileSync(
      'dist/package.json',
      JSON.stringify(distPackageJson, null, 2)
    );
    console.log('? Created dist/package.json');

    // Copy README
    if (fs.existsSync('README.md')) {
      fs.copyFileSync('README.md', 'dist/README.md');
      console.log('? Copied README.md');
    }

    // Copy LICENSE
    if (fs.existsSync('LICENSE')) {
      fs.copyFileSync('LICENSE', 'dist/LICENSE');
      console.log('? Copied LICENSE');
    }

    console.log('? Build complete!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
