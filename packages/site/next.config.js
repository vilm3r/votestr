//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withNx } = require('@nrwl/next/plugins/with-nx');
const path = require('path');

/**
 * @type {import('@nrwl/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  // Disabling standalone builds until NX+Next issues are resolved
  // output: 'standalone',
  // experimental: {
  //   // this includes files from the monorepo base two directories up
  //   outputFileTracingRoot: path.join(__dirname, '../../'),
  // },
};

module.exports = withNx(nextConfig);
