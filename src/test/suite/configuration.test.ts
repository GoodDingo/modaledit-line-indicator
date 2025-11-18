import * as assert from 'assert';
import { TestHelpers } from '../helpers/testHelpers';

/**
 * Configuration Management Tests
 *
 * Tests configuration reading, updating, and validation.
 * Updated for nested configuration structure with theme-specific overrides.
 */
suite('Configuration Tests', () => {
  teardown(async () => {
    await TestHelpers.resetAllConfig();
  });

  test('Default configuration values are correct', () => {
    const config = TestHelpers.getConfig();

    // Test enabled flag
    assert.strictEqual(config.get('enabled'), true, 'enabled should default to true');

    // Test nested mode configurations
    const normalMode = config.get('normalMode');
    assert.deepStrictEqual(
      normalMode,
      {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        border: '2px dotted #00aa00',
      },
      'normalMode should have correct defaults'
    );

    const insertMode = config.get('insertMode');
    assert.deepStrictEqual(
      insertMode,
      {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        border: '2px solid #aa0000',
      },
      'insertMode should have correct defaults'
    );

    const visualMode = config.get('visualMode');
    assert.deepStrictEqual(
      visualMode,
      {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        border: '2px dashed #0000aa',
      },
      'visualMode should have correct defaults'
    );

    const searchMode = config.get('searchMode');
    assert.deepStrictEqual(
      searchMode,
      {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        border: '2px solid #aaaa00',
      },
      'searchMode should have correct defaults'
    );

    // Test logLevel configuration
    const logLevel = config.get('logLevel');
    assert.strictEqual(logLevel, 'error', 'logLevel should default to error');
  });

  test('Can read nested configuration values', () => {
    const config = TestHelpers.getConfig();

    const enabled = config.get('enabled');
    const normalMode = config.get('normalMode');

    assert.strictEqual(typeof enabled, 'boolean');
    assert.strictEqual(typeof normalMode, 'object');
    assert.ok(normalMode, 'normalMode should be an object');
  });

  test('Can update enabled configuration', async () => {
    await TestHelpers.setConfig('enabled', false);

    let config = TestHelpers.getConfig();
    assert.strictEqual(config.get('enabled'), false);

    await TestHelpers.setConfig('enabled', true);

    // Re-get config to see updated value
    config = TestHelpers.getConfig();
    assert.strictEqual(config.get('enabled'), true);
  });

  test('Can update nested mode configuration', async () => {
    const newNormalMode = {
      backgroundColor: '#123456',
      border: '3px solid #654321',
    };

    await TestHelpers.setConfig('normalMode', newNormalMode);

    const config = TestHelpers.getConfig();
    assert.deepStrictEqual(config.get('normalMode'), newNormalMode);
  });

  test('Can update mode configuration with theme overrides', async () => {
    const newNormalMode = {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px dotted #808080',
      dark: {
        border: '2px solid #00ffff',
      },
      light: {
        border: '2px solid #0000ff',
      },
    };

    await TestHelpers.setConfig('normalMode', newNormalMode);

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    assert.ok(normalMode, 'normalMode should exist');

    // Compare nested objects using deepStrictEqual
    assert.deepStrictEqual(normalMode.dark, newNormalMode.dark);
    assert.deepStrictEqual(normalMode.light, newNormalMode.light);
  });

  test('Can reset nested configuration to default', async () => {
    // Change configuration
    const customConfig = {
      backgroundColor: '#ff0000',
      border: '5px dashed #00ff00',
    };

    await TestHelpers.setConfig('normalMode', customConfig);
    assert.deepStrictEqual(TestHelpers.getConfig().get('normalMode'), customConfig);

    // Reset
    await TestHelpers.resetConfig('normalMode');

    // Should be back to default
    const defaultNormalMode = {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px dotted #00aa00',
    };

    assert.deepStrictEqual(TestHelpers.getConfig().get('normalMode'), defaultNormalMode);
  });

  test('Configuration changes are persisted', async () => {
    // Change config
    const newInsertMode = {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      border: '4px double #ff00ff',
    };

    await TestHelpers.setConfig('insertMode', newInsertMode);

    // Re-read config (simulates reload)
    const config = TestHelpers.getConfig();

    // Should still have changed value
    assert.deepStrictEqual(config.get('insertMode'), newInsertMode);
  });

  test('Invalid nested configuration values are handled', async () => {
    // Try to set invalid structure
    await TestHelpers.setConfig('normalMode', { invalid: 'structure' });

    // VS Code might accept it or reject it
    // Either way, should not crash
    const config = TestHelpers.getConfig();
    const value = config.get('normalMode');

    // Test passes if we got here without error
    assert.ok(value !== undefined, 'Should have some value');
  });

  test('Configuration scope is correct', () => {
    const config = TestHelpers.getConfig();

    // Check that we're getting workspace configuration
    assert.ok(config, 'Configuration should exist');
    assert.strictEqual(typeof config.get, 'function', 'Should have get method');
    assert.strictEqual(typeof config.update, 'function', 'Should have update method');
  });

  test('Can read configuration with correct types', () => {
    const config = TestHelpers.getConfig();

    // Boolean
    const enabled = config.get<boolean>('enabled');
    assert.strictEqual(typeof enabled, 'boolean');

    // Nested object
    const normalMode = config.get<Record<string, unknown>>('normalMode');
    assert.strictEqual(typeof normalMode, 'object');
    assert.ok(normalMode, 'normalMode should be an object');

    // Check object properties
    assert.strictEqual(typeof normalMode.backgroundColor, 'string');
    assert.strictEqual(typeof normalMode.border, 'string');
  });

  test('Can read and update logLevel configuration', async () => {
    const config = TestHelpers.getConfig();

    // Test default value
    assert.strictEqual(config.get('logLevel'), 'error', 'Default logLevel should be error');

    // Test updating to each valid level
    const validLevels = ['error', 'warn', 'info', 'debug'];

    for (const level of validLevels) {
      await TestHelpers.setConfig('logLevel', level);
      const updatedConfig = TestHelpers.getConfig();
      assert.strictEqual(
        updatedConfig.get('logLevel'),
        level,
        `logLevel should be updatable to ${level}`
      );
    }

    // Reset to default
    await TestHelpers.resetConfig('logLevel');
    const resetConfig = TestHelpers.getConfig();
    assert.strictEqual(resetConfig.get('logLevel'), 'error', 'logLevel should reset to error');
  });

  test('logLevel configuration has correct type', () => {
    const config = TestHelpers.getConfig();
    const logLevel = config.get<string>('logLevel');

    assert.strictEqual(typeof logLevel, 'string', 'logLevel should be a string');
    assert.ok(
      ['error', 'warn', 'info', 'debug'].includes(logLevel || ''),
      'logLevel should be one of the valid enum values'
    );
  });
});
