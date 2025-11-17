import * as assert from 'assert';
import { TestHelpers } from '../helpers/testHelpers';

/**
 * Configuration Management Tests
 *
 * Tests configuration reading, updating, and validation.
 */
suite('Configuration Tests', () => {
  teardown(async () => {
    await TestHelpers.resetAllConfig();
  });

  test('Default configuration values are correct', () => {
    const config = TestHelpers.getConfig();

    const defaults = {
      enabled: true,
      normalModeBackground: '#00770020',
      normalModeBorder: '#005500',
      insertModeBackground: '#77000020',
      insertModeBorder: '#aa0000',
      borderStyle: 'solid',
      borderWidth: '2px',
    };

    Object.entries(defaults).forEach(([key, expectedValue]) => {
      const actualValue = config.get(key);
      assert.strictEqual(
        actualValue,
        expectedValue,
        `Config ${key} should default to ${expectedValue}, got ${actualValue}`
      );
    });
  });

  test('Can read configuration values', () => {
    const config = TestHelpers.getConfig();

    const enabled = config.get('enabled');
    const normalBg = config.get('normalModeBackground');

    assert.strictEqual(typeof enabled, 'boolean');
    assert.strictEqual(typeof normalBg, 'string');
  });

  test('Can update configuration values', async () => {
    await TestHelpers.setConfig('enabled', false);

    let config = TestHelpers.getConfig();
    assert.strictEqual(config.get('enabled'), false);

    await TestHelpers.setConfig('enabled', true);

    // Re-get config to see updated value
    config = TestHelpers.getConfig();
    assert.strictEqual(config.get('enabled'), true);
  });

  test('Can update all configuration values without errors', async () => {
    const testValues: Record<string, any> = {
      enabled: false,
      normalModeBackground: '#123456',
      normalModeBorder: '#654321',
      insertModeBackground: '#abcdef',
      insertModeBorder: '#fedcba',
      borderStyle: 'dashed',
      borderWidth: '5px',
    };

    // Update all
    for (const [key, value] of Object.entries(testValues)) {
      await TestHelpers.setConfig(key, value);
    }

    // Verify all
    const config = TestHelpers.getConfig();
    for (const [key, expectedValue] of Object.entries(testValues)) {
      const actualValue = config.get(key);
      assert.strictEqual(
        actualValue,
        expectedValue,
        `Config ${key} should update to ${expectedValue}`
      );
    }
  });

  test('Can reset configuration to default', async () => {
    // Change configuration
    await TestHelpers.setConfig('normalModeBackground', '#ff0000');
    assert.strictEqual(TestHelpers.getConfig().get('normalModeBackground'), '#ff0000');

    // Reset
    await TestHelpers.resetConfig('normalModeBackground');

    // Should be back to default
    assert.strictEqual(TestHelpers.getConfig().get('normalModeBackground'), '#00770020');
  });

  test('Configuration changes are persisted', async () => {
    // Change config
    await TestHelpers.setConfig('borderStyle', 'dotted');

    // Re-read config (simulates reload)
    const config = TestHelpers.getConfig();

    // Should still have changed value
    assert.strictEqual(config.get('borderStyle'), 'dotted');
  });

  test('Invalid configuration values are handled', async () => {
    // Try to set invalid borderStyle
    await TestHelpers.setConfig('borderStyle', 'invalid-style');

    // VS Code might accept it (no validation) or reject it
    // Either way, should not crash
    const config = TestHelpers.getConfig();
    const value = config.get('borderStyle');

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

  test('Can read configuration with different types', () => {
    const config = TestHelpers.getConfig();

    // Boolean
    const enabled = config.get<boolean>('enabled');
    assert.strictEqual(typeof enabled, 'boolean');

    // String
    const bgColor = config.get<string>('normalModeBackground');
    assert.strictEqual(typeof bgColor, 'string');

    // Enum (borderStyle)
    const borderStyle = config.get<string>('borderStyle');
    assert.ok(['solid', 'dashed', 'dotted'].includes(borderStyle as string));
  });
});
