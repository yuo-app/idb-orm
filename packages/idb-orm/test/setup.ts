import { JSDOM } from 'jsdom'
import { setup } from 'vitest-indexeddb'

setup()

if (!global.window) {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
  })
  global.window = dom.window as any
  global.document = dom.window.document
}

if (!global.indexedDB)
  global.indexedDB = window.indexedDB
