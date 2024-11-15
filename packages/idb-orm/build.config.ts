import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'index',
    'src',
  ],
  clean: true,
  declaration: true,
})
