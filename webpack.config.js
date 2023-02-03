const GeneratePackageJsonPlugin = require('generate-package-json-webpack-plugin');
const { join: pathJoin } = require('node:path');
const { readFileSync } = require('node:fs');

module.exports = (config, { options }) => {
  config.plugins.push(
    new GeneratePackageJsonPlugin(
      {
        ...JSON.parse(
          readFileSync(
            pathJoin(options.root, options.sourceRoot, '..', 'package.json')
          )
        ),
        main: options.outputFileName,
      },
      {
        useInstalledVersions: false,
        resolveContextPaths: [options.root],
        sourcePackageFilenames: [pathJoin(options.root, 'package.json')],
      }
    )
  );

  return config;
};
