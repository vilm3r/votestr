const { createGlobPatternsForDependencies } = require('@nrwl/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    join(
      __dirname,
      '{src,pages,components}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        vote0: '#FF6666',
        vote1: '#09FBD3',
        vote2: '#FE53BB',
        vote3: '#F5D300',
        vote4: '#560A86',
        vote5: '#FF2281',
        vote6: '#011FFD',
        vote7: '#9ACD32',
        vote8: '#13CA91',
        vote9: '#FF9472',
        vote10: '#75D5FD',
        vote11: '#FEC763',
        vote12: '#00C2BA',
        vote13: '#FE6B35',
        vote14: '#C24CF6',
        vote15: '#CE0000',
        vote16: '#7FFF00',
        vote17: '#440BD4',
        vote18: '#C6BDEA',
        vote19: '#12B296',
        vote20: '#FFAA01',
      },
    },
  },
  plugins: [],
  safelist: [
    {
      pattern: /.*vote[0-9]*/,
      variants: ['hover', 'focus'],
    },
  ],
};
