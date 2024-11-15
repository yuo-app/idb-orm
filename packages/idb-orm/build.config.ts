import fs from 'node:fs'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  hooks: {
    'build:done': () => {
      fs.copyFileSync('../../README.md', './README.md')
    },
  },
  entries: [
    'index',
    'src',
  ],
  clean: true,
  declaration: true,
})
