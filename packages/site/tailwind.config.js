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
        vote0: '#C724B1',
        vote1: '#4D4DFF',
        vote2: '#E0E722',
        vote3: '#FFAD00',
        vote4: '#C724B1',
        vote5: '#C724B1',
        vote6: '#C724B1',
        vote7: '#C724B1',
        vote8: '#C724B1',
        vote9: '#C724B1',
        vote10: '#C724B1',
        vote11: '#C724B1',
        vote12: '#C724B1',
        vote13: '#C724B1',
        vote14: '#C724B1',
        vote15: '#C724B1',
        vote16: '#C724B1',
        vote17: '#C724B1',
        vote18: '#C724B1',
        vote19: '#C724B1',
        vote20: '#C724B1',
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
