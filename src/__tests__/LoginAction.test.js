/* globals test expect beforeAll afterAll */
/* eslint-disable flowtype/require-valid-file-annotation */

import { LOCAL_ACCOUNT_DEFAULTS, LOCAL_ACCOUNT_TYPES, SYNCED_ACCOUNT_DEFAULTS, SYNCED_ACCOUNT_TYPES } from '../modules/Core/Account/settings.js'
import { mergeSettings } from '../modules/Login/action.js'

// Mute dependency warnings
const originalWarn = console.warn.bind(console.warn)
const originalError = console.error.bind(console.error)
beforeAll(() => {
  console.warn = msg => !msg.toString().includes('Settings overwrite') && originalWarn(msg)
  console.error = msg => !msg.toString().includes('MismatchedDefaultSettingType') && originalError(msg)
})
afterAll(() => {
  console.warn = originalWarn
  console.error = originalError
})

test('synced settings missing properties are replaced', () => {
  const loadedSyncedSettings = {}
  const mergedSettings = mergeSettings(loadedSyncedSettings, SYNCED_ACCOUNT_DEFAULTS, SYNCED_ACCOUNT_TYPES)
  const finalSettings = mergedSettings.finalSettings
  expect(finalSettings).toEqual(SYNCED_ACCOUNT_DEFAULTS)
  expect(mergedSettings.isOverwriteNeeded).toEqual(true)
  expect(mergedSettings.isDefaultTypeIncorrect).toEqual(false)
})

test('synced settings missing default causes console.error', () => {
  const mergedSettings = mergeSettings(SYNCED_ACCOUNT_DEFAULTS, SYNCED_ACCOUNT_DEFAULTS, {})
  const finalSettings = mergedSettings.finalSettings
  expect(finalSettings).toEqual(SYNCED_ACCOUNT_DEFAULTS)
  expect(mergedSettings.isOverwriteNeeded).toEqual(true)
  expect(mergedSettings.isDefaultTypeIncorrect).toEqual(true)
})

test('local settings missing properties are replaced', () => {
  const loadedLocalSettings = {}
  const mergedSettings = mergeSettings(loadedLocalSettings, LOCAL_ACCOUNT_DEFAULTS, LOCAL_ACCOUNT_TYPES)
  const finalSettings = mergedSettings.finalSettings
  expect(finalSettings).toEqual(LOCAL_ACCOUNT_DEFAULTS)
  expect(mergedSettings.isOverwriteNeeded).toEqual(true)
  expect(mergedSettings.isDefaultTypeIncorrect).toEqual(false)
})

test('local settings missing default causes console.error', () => {
  const mergedSettings = mergeSettings(LOCAL_ACCOUNT_DEFAULTS, LOCAL_ACCOUNT_DEFAULTS, {})
  const finalSettings = mergedSettings.finalSettings
  expect(finalSettings).toEqual(LOCAL_ACCOUNT_DEFAULTS)
  expect(mergedSettings.isOverwriteNeeded).toEqual(true)
  expect(mergedSettings.isDefaultTypeIncorrect).toEqual(true)
})
