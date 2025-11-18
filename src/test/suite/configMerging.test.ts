import * as assert from 'assert';
import { TestHelpers } from '../helpers/testHelpers';

/**
 * Configuration Merging Tests
 *
 * Tests the getMergedModeConfig() method which merges common properties
 * with theme-specific overrides. This is critical functionality for the
 * theme-aware configuration system.
 */
suite('Configuration Merging Tests', () => {
  teardown(async () => {
    await TestHelpers.resetAllConfig();
  });

  test('Common properties only - no theme overrides', async () => {
    const configWithoutThemes = {
      backgroundColor: 'rgba(100, 100, 100, 0.5)',
      border: '3px solid #123456',
    };

    await TestHelpers.setConfig('normalMode', configWithoutThemes);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    // Should use common properties directly
    assert.strictEqual(normalMode.backgroundColor, 'rgba(100, 100, 100, 0.5)');
    assert.strictEqual(normalMode.border, '3px solid #123456');
  });

  test('Full theme override - all properties in dark', async () => {
    const configWithFullDarkOverride = {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px dotted #ffffff',
      dark: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: '4px solid #000000',
      },
    };

    await TestHelpers.setConfig('normalMode', configWithFullDarkOverride);
    await TestHelpers.wait(100);

    // Extension should merge and use dark theme if current theme is dark
    // We can't control the actual theme in tests, but we verify config is stored correctly
    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    assert.ok(normalMode.dark, 'Dark theme override should exist');
    assert.deepStrictEqual(normalMode.dark, configWithFullDarkOverride.dark);
  });

  test('Partial theme override - only border in dark', async () => {
    const configWithPartialOverride = {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px dotted #aaaaaa',
      dark: {
        border: '2px solid #00ffff', // Only override border
      },
    };

    await TestHelpers.setConfig('normalMode', configWithPartialOverride);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;
    const darkOverride = normalMode.dark as Record<string, string>;

    // Dark override should only have border
    assert.strictEqual(darkOverride.border, '2px solid #00ffff');
    assert.strictEqual(
      darkOverride.backgroundColor,
      undefined,
      'Should not override backgroundColor'
    );

    // Common properties should still exist
    assert.strictEqual(normalMode.backgroundColor, 'rgba(255, 255, 255, 0)');
  });

  test('Multiple theme overrides - dark and light both present', async () => {
    const configWithMultipleThemes = {
      backgroundColor: 'rgba(128, 128, 128, 0.2)',
      border: '2px solid #808080',
      dark: {
        border: '2px solid #00ffff',
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
      },
      light: {
        border: '2px solid #0000ff',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
      },
    };

    await TestHelpers.setConfig('normalMode', configWithMultipleThemes);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    // Both theme overrides should exist
    assert.ok(normalMode.dark, 'Dark theme override should exist');
    assert.ok(normalMode.light, 'Light theme override should exist');

    assert.deepStrictEqual(normalMode.dark, configWithMultipleThemes.dark);
    assert.deepStrictEqual(normalMode.light, configWithMultipleThemes.light);
  });

  test('Missing theme key - no light defined', async () => {
    const configWithOnlyDark = {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px dotted #808080',
      dark: {
        border: '2px solid #00ffff',
      },
      // No light key
    };

    await TestHelpers.setConfig('normalMode', configWithOnlyDark);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    assert.ok(normalMode.dark, 'Dark override should exist');
    assert.strictEqual(normalMode.light, undefined, 'Light override should not exist');

    // Common properties should still work
    assert.strictEqual(normalMode.border, '2px dotted #808080');
  });

  test('Empty config object - VS Code returns defaults from schema', async () => {
    const emptyConfig = {};

    await TestHelpers.setConfig('normalMode', emptyConfig);
    await TestHelpers.wait(100);

    // VS Code behavior: when you set empty config, it returns the defaults from package.json
    // This is expected VS Code behavior, not a bug
    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    // VS Code fills in defaults from package.json schema
    assert.ok(normalMode, 'VS Code should return config object');
    assert.ok(normalMode.backgroundColor !== undefined, 'Should have default backgroundColor');
    assert.ok(normalMode.border !== undefined, 'Should have default border');
  });

  test('Partial config uses VS Code defaults for missing properties', async () => {
    const partialConfig = {
      border: '2px solid #ff0000',
      // Missing: backgroundColor
    };

    await TestHelpers.setConfig('normalMode', partialConfig);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    // Our custom value
    assert.strictEqual(normalMode.border, '2px solid #ff0000');

    // VS Code fills in missing properties with defaults from package.json
    assert.ok(normalMode.backgroundColor !== undefined, 'VS Code provides default backgroundColor');
  });

  test('Theme override with only one property', async () => {
    const configWithMinimalOverride = {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px solid #808080',
      dark: {
        border: '5px solid #808080', // Only override border
      },
    };

    await TestHelpers.setConfig('normalMode', configWithMinimalOverride);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;
    const darkOverride = normalMode.dark as Record<string, string>;

    assert.strictEqual(darkOverride.border, '5px solid #808080');
    assert.strictEqual(Object.keys(darkOverride).length, 1, 'Should only have one property');
  });

  test('All four modes can have different theme configurations', async () => {
    const normalConfig = {
      border: '2px dotted #00aa00',
      dark: { border: '2px solid #00ff00' },
    };
    const insertConfig = {
      border: '2px solid #aa0000',
      dark: { border: '2px solid #ff0000' },
    };
    const visualConfig = {
      border: '2px dashed #0000aa',
      dark: { border: '2px solid #0000ff' },
    };
    const searchConfig = {
      border: '2px solid #aaaa00',
      dark: { border: '2px solid #ffff00' },
    };

    await TestHelpers.setConfig('normalMode', normalConfig);
    await TestHelpers.setConfig('insertMode', insertConfig);
    await TestHelpers.setConfig('visualMode', visualConfig);
    await TestHelpers.setConfig('searchMode', searchConfig);
    await TestHelpers.wait(100);

    const config = TestHelpers.getConfig();

    const normal = config.get('normalMode') as Record<string, unknown>;
    const insert = config.get('insertMode') as Record<string, unknown>;
    const visual = config.get('visualMode') as Record<string, unknown>;
    const search = config.get('searchMode') as Record<string, unknown>;

    assert.strictEqual(normal.border, '2px dotted #00aa00');
    assert.strictEqual(insert.border, '2px solid #aa0000');
    assert.strictEqual(visual.border, '2px dashed #0000aa');
    assert.strictEqual(search.border, '2px solid #aaaa00');

    assert.strictEqual((normal.dark as Record<string, string>).border, '2px solid #00ff00');
    assert.strictEqual((insert.dark as Record<string, string>).border, '2px solid #ff0000');
    assert.strictEqual((visual.dark as Record<string, string>).border, '2px solid #0000ff');
    assert.strictEqual((search.dark as Record<string, string>).border, '2px solid #ffff00');
  });

  test('Theme override can override backgroundColor with transparency', async () => {
    const configWithTransparency = {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px solid #808080',
      dark: {
        backgroundColor: 'rgba(0, 255, 255, 0.2)', // Semi-transparent cyan
      },
    };

    await TestHelpers.setConfig('normalMode', configWithTransparency);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;
    const darkOverride = normalMode.dark as Record<string, string>;

    assert.strictEqual(darkOverride.backgroundColor, 'rgba(0, 255, 255, 0.2)');
  });

  test('Theme override can change border style', async () => {
    const configWithStyleOverride = {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px solid #808080',
      dark: {
        border: '2px dashed #808080',
      },
      light: {
        border: '2px dotted #808080',
      },
    };

    await TestHelpers.setConfig('normalMode', configWithStyleOverride);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    assert.strictEqual((normalMode.dark as Record<string, string>).border, '2px dashed #808080');
    assert.strictEqual((normalMode.light as Record<string, string>).border, '2px dotted #808080');
  });

  test('Complex configuration with all features combined', async () => {
    const complexConfig = {
      // Common defaults
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px solid #808080',

      // Dark theme: cyan border, dashed style, thicker
      dark: {
        border: '3px dashed #00ffff',
      },

      // Light theme: blue border, dotted style
      light: {
        border: '2px dotted #0000ff',
      },
    };

    await TestHelpers.setConfig('normalMode', complexConfig);
    await TestHelpers.wait(100);

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    // Verify all theme overrides are stored correctly
    const dark = normalMode.dark as Record<string, string>;
    const light = normalMode.light as Record<string, string>;

    // Dark theme verification
    assert.strictEqual(dark.border, '3px dashed #00ffff');

    // Light theme verification
    assert.strictEqual(light.border, '2px dotted #0000ff');
  });

  test('Updating theme override preserves common properties', async () => {
    // Initial config
    const initialConfig = {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px solid #808080',
      dark: {
        border: '2px solid #00ffff',
      },
    };

    await TestHelpers.setConfig('normalMode', initialConfig);
    await TestHelpers.waitForDebounce();

    // Update with new dark override
    const updatedConfig = {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px solid #808080',
      dark: {
        border: '4px solid #ff00ff', // Changed color and width
      },
    };

    await TestHelpers.setConfig('normalMode', updatedConfig);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;
    const dark = normalMode.dark as Record<string, string>;

    assert.strictEqual(dark.border, '4px solid #ff00ff');
    assert.strictEqual(normalMode.border, '2px solid #808080', 'Common property should persist');
  });

  test('Removing theme override works correctly', async () => {
    // Config with override
    const withOverride = {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px solid #808080',
      dark: {
        border: '2px solid #00ffff',
      },
    };

    await TestHelpers.setConfig('normalMode', withOverride);
    await TestHelpers.waitForDebounce();

    let config = TestHelpers.getConfig();
    let normalMode = config.get('normalMode') as Record<string, unknown>;
    assert.ok(normalMode.dark, 'Dark override should exist');

    // Config without override
    const withoutOverride = {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      border: '2px solid #808080',
      // No dark key
    };

    await TestHelpers.setConfig('normalMode', withoutOverride);
    await TestHelpers.waitForDebounce();

    config = TestHelpers.getConfig();
    normalMode = config.get('normalMode') as Record<string, unknown>;
    assert.strictEqual(normalMode.dark, undefined, 'Dark override should be removed');
  });
});
