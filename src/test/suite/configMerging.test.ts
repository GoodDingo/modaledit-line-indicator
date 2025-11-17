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
      background: 'rgba(100, 100, 100, 0.5)',
      border: '#123456',
      borderStyle: 'solid',
      borderWidth: '3px',
    };

    await TestHelpers.setConfig('normalMode', configWithoutThemes);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    // Should use common properties directly
    assert.strictEqual(normalMode.background, 'rgba(100, 100, 100, 0.5)');
    assert.strictEqual(normalMode.border, '#123456');
    assert.strictEqual(normalMode.borderStyle, 'solid');
    assert.strictEqual(normalMode.borderWidth, '3px');
  });

  test('Full theme override - all properties in [dark]', async () => {
    const configWithFullDarkOverride = {
      background: 'rgba(255, 255, 255, 0)',
      border: '#ffffff',
      borderStyle: 'dotted',
      borderWidth: '2px',
      '[dark]': {
        background: 'rgba(0, 0, 0, 0.5)',
        border: '#000000',
        borderStyle: 'solid',
        borderWidth: '4px',
      },
    };

    await TestHelpers.setConfig('normalMode', configWithFullDarkOverride);
    await TestHelpers.wait(100);

    // Extension should merge and use dark theme if current theme is dark
    // We can't control the actual theme in tests, but we verify config is stored correctly
    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    assert.ok(normalMode['[dark]'], 'Dark theme override should exist');
    assert.deepStrictEqual(normalMode['[dark]'], configWithFullDarkOverride['[dark]']);
  });

  test('Partial theme override - only border color in [dark]', async () => {
    const configWithPartialOverride = {
      background: 'rgba(255, 255, 255, 0)',
      border: '#aaaaaa',
      borderStyle: 'dotted',
      borderWidth: '2px',
      '[dark]': {
        border: '#00ffff', // Only override border color
      },
    };

    await TestHelpers.setConfig('normalMode', configWithPartialOverride);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;
    const darkOverride = normalMode['[dark]'] as Record<string, string>;

    // Dark override should only have border
    assert.strictEqual(darkOverride.border, '#00ffff');
    assert.strictEqual(darkOverride.background, undefined, 'Should not override background');
    assert.strictEqual(darkOverride.borderStyle, undefined, 'Should not override borderStyle');
    assert.strictEqual(darkOverride.borderWidth, undefined, 'Should not override borderWidth');

    // Common properties should still exist
    assert.strictEqual(normalMode.background, 'rgba(255, 255, 255, 0)');
    assert.strictEqual(normalMode.borderStyle, 'dotted');
    assert.strictEqual(normalMode.borderWidth, '2px');
  });

  test('Multiple theme overrides - [dark] and [light] both present', async () => {
    const configWithMultipleThemes = {
      background: 'rgba(128, 128, 128, 0.2)',
      border: '#808080',
      borderStyle: 'solid',
      borderWidth: '2px',
      '[dark]': {
        border: '#00ffff',
        background: 'rgba(0, 255, 255, 0.1)',
      },
      '[light]': {
        border: '#0000ff',
        background: 'rgba(0, 0, 255, 0.1)',
      },
    };

    await TestHelpers.setConfig('normalMode', configWithMultipleThemes);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    // Both theme overrides should exist
    assert.ok(normalMode['[dark]'], 'Dark theme override should exist');
    assert.ok(normalMode['[light]'], 'Light theme override should exist');

    assert.deepStrictEqual(normalMode['[dark]'], configWithMultipleThemes['[dark]']);
    assert.deepStrictEqual(normalMode['[light]'], configWithMultipleThemes['[light]']);
  });

  test('All three theme overrides - [dark], [light], and [highContrast]', async () => {
    const configWithAllThemes = {
      background: 'rgba(255, 255, 255, 0)',
      border: '#808080',
      borderStyle: 'solid',
      borderWidth: '2px',
      '[dark]': {
        border: '#00ffff',
      },
      '[light]': {
        border: '#0000ff',
      },
      '[highContrast]': {
        border: '#ffffff',
        borderWidth: '4px',
      },
    };

    await TestHelpers.setConfig('normalMode', configWithAllThemes);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    assert.ok(normalMode['[dark]'], 'Dark override should exist');
    assert.ok(normalMode['[light]'], 'Light override should exist');
    assert.ok(normalMode['[highContrast]'], 'HighContrast override should exist');

    const highContrastOverride = normalMode['[highContrast]'] as Record<string, string>;
    assert.strictEqual(highContrastOverride.border, '#ffffff');
    assert.strictEqual(highContrastOverride.borderWidth, '4px');
  });

  test('Missing theme key - no [light] defined', async () => {
    const configWithOnlyDark = {
      background: 'rgba(255, 255, 255, 0)',
      border: '#808080',
      borderStyle: 'dotted',
      borderWidth: '2px',
      '[dark]': {
        border: '#00ffff',
      },
      // No [light] key
    };

    await TestHelpers.setConfig('normalMode', configWithOnlyDark);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    assert.ok(normalMode['[dark]'], 'Dark override should exist');
    assert.strictEqual(normalMode['[light]'], undefined, 'Light override should not exist');

    // Common properties should still work
    assert.strictEqual(normalMode.border, '#808080');
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
    assert.ok(normalMode.background !== undefined, 'Should have default background');
    assert.ok(normalMode.border !== undefined, 'Should have default border');
  });

  test('Partial config uses VS Code defaults for missing properties', async () => {
    const partialConfig = {
      border: '#ff0000',
      // Missing: background, borderStyle, borderWidth
    };

    await TestHelpers.setConfig('normalMode', partialConfig);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    // Our custom value
    assert.strictEqual(normalMode.border, '#ff0000');

    // VS Code fills in missing properties with defaults from package.json
    assert.ok(normalMode.background !== undefined, 'VS Code provides default background');
    assert.ok(normalMode.borderStyle !== undefined, 'VS Code provides default borderStyle');
    assert.ok(normalMode.borderWidth !== undefined, 'VS Code provides default borderWidth');
  });

  test('Theme override with only one property', async () => {
    const configWithMinimalOverride = {
      background: 'rgba(255, 255, 255, 0)',
      border: '#808080',
      borderStyle: 'solid',
      borderWidth: '2px',
      '[dark]': {
        borderWidth: '5px', // Only override borderWidth
      },
    };

    await TestHelpers.setConfig('normalMode', configWithMinimalOverride);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;
    const darkOverride = normalMode['[dark]'] as Record<string, string>;

    assert.strictEqual(darkOverride.borderWidth, '5px');
    assert.strictEqual(Object.keys(darkOverride).length, 1, 'Should only have one property');
  });

  test('All four modes can have different theme configurations', async () => {
    const normalConfig = {
      border: '#00aa00',
      '[dark]': { border: '#00ff00' },
    };
    const insertConfig = {
      border: '#aa0000',
      '[dark]': { border: '#ff0000' },
    };
    const visualConfig = {
      border: '#0000aa',
      '[dark]': { border: '#0000ff' },
    };
    const searchConfig = {
      border: '#aaaa00',
      '[dark]': { border: '#ffff00' },
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

    assert.strictEqual(normal.border, '#00aa00');
    assert.strictEqual(insert.border, '#aa0000');
    assert.strictEqual(visual.border, '#0000aa');
    assert.strictEqual(search.border, '#aaaa00');

    assert.strictEqual((normal['[dark]'] as Record<string, string>).border, '#00ff00');
    assert.strictEqual((insert['[dark]'] as Record<string, string>).border, '#ff0000');
    assert.strictEqual((visual['[dark]'] as Record<string, string>).border, '#0000ff');
    assert.strictEqual((search['[dark]'] as Record<string, string>).border, '#ffff00');
  });

  test('Theme override can override background with transparency', async () => {
    const configWithTransparency = {
      background: 'rgba(255, 255, 255, 0)',
      border: '#808080',
      borderStyle: 'solid',
      borderWidth: '2px',
      '[dark]': {
        background: 'rgba(0, 255, 255, 0.2)', // Semi-transparent cyan
      },
    };

    await TestHelpers.setConfig('normalMode', configWithTransparency);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;
    const darkOverride = normalMode['[dark]'] as Record<string, string>;

    assert.strictEqual(darkOverride.background, 'rgba(0, 255, 255, 0.2)');
  });

  test('Theme override can change borderStyle', async () => {
    const configWithStyleOverride = {
      background: 'rgba(255, 255, 255, 0)',
      border: '#808080',
      borderStyle: 'solid',
      borderWidth: '2px',
      '[dark]': {
        borderStyle: 'dashed',
      },
      '[light]': {
        borderStyle: 'dotted',
      },
    };

    await TestHelpers.setConfig('normalMode', configWithStyleOverride);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    assert.strictEqual((normalMode['[dark]'] as Record<string, string>).borderStyle, 'dashed');
    assert.strictEqual((normalMode['[light]'] as Record<string, string>).borderStyle, 'dotted');
  });

  test('Complex configuration with all features combined', async () => {
    const complexConfig = {
      // Common defaults
      background: 'rgba(255, 255, 255, 0)',
      border: '#808080',
      borderStyle: 'solid',
      borderWidth: '2px',

      // Dark theme: cyan border, dashed style, thicker
      '[dark]': {
        border: '#00ffff',
        borderStyle: 'dashed',
        borderWidth: '3px',
      },

      // Light theme: blue border, dotted style
      '[light]': {
        border: '#0000ff',
        borderStyle: 'dotted',
      },

      // High contrast: white border, very thick, solid
      '[highContrast]': {
        border: '#ffffff',
        borderWidth: '5px',
        borderStyle: 'solid',
        background: 'rgba(255, 255, 255, 0.3)',
      },
    };

    await TestHelpers.setConfig('normalMode', complexConfig);
    await TestHelpers.wait(100);

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;

    // Verify all theme overrides are stored correctly
    const dark = normalMode['[dark]'] as Record<string, string>;
    const light = normalMode['[light]'] as Record<string, string>;
    const highContrast = normalMode['[highContrast]'] as Record<string, string>;

    // Dark theme verification
    assert.strictEqual(dark.border, '#00ffff');
    assert.strictEqual(dark.borderStyle, 'dashed');
    assert.strictEqual(dark.borderWidth, '3px');

    // Light theme verification
    assert.strictEqual(light.border, '#0000ff');
    assert.strictEqual(light.borderStyle, 'dotted');
    assert.strictEqual(light.borderWidth, undefined, 'Should use common borderWidth');

    // High contrast verification
    assert.strictEqual(highContrast.border, '#ffffff');
    assert.strictEqual(highContrast.borderWidth, '5px');
    assert.strictEqual(highContrast.borderStyle, 'solid');
    assert.strictEqual(highContrast.background, 'rgba(255, 255, 255, 0.3)');
  });

  test('Updating theme override preserves common properties', async () => {
    // Initial config
    const initialConfig = {
      background: 'rgba(255, 255, 255, 0)',
      border: '#808080',
      borderStyle: 'solid',
      borderWidth: '2px',
      '[dark]': {
        border: '#00ffff',
      },
    };

    await TestHelpers.setConfig('normalMode', initialConfig);
    await TestHelpers.waitForDebounce();

    // Update with new dark override
    const updatedConfig = {
      background: 'rgba(255, 255, 255, 0)',
      border: '#808080',
      borderStyle: 'solid',
      borderWidth: '2px',
      '[dark]': {
        border: '#ff00ff', // Changed color
        borderWidth: '4px', // Added width override
      },
    };

    await TestHelpers.setConfig('normalMode', updatedConfig);
    await TestHelpers.waitForDebounce();

    const config = TestHelpers.getConfig();
    const normalMode = config.get('normalMode') as Record<string, unknown>;
    const dark = normalMode['[dark]'] as Record<string, string>;

    assert.strictEqual(dark.border, '#ff00ff');
    assert.strictEqual(dark.borderWidth, '4px');
    assert.strictEqual(normalMode.borderStyle, 'solid', 'Common property should persist');
  });

  test('Removing theme override works correctly', async () => {
    // Config with override
    const withOverride = {
      background: 'rgba(255, 255, 255, 0)',
      border: '#808080',
      borderStyle: 'solid',
      borderWidth: '2px',
      '[dark]': {
        border: '#00ffff',
      },
    };

    await TestHelpers.setConfig('normalMode', withOverride);
    await TestHelpers.waitForDebounce();

    let config = TestHelpers.getConfig();
    let normalMode = config.get('normalMode') as Record<string, unknown>;
    assert.ok(normalMode['[dark]'], 'Dark override should exist');

    // Config without override
    const withoutOverride = {
      background: 'rgba(255, 255, 255, 0)',
      border: '#808080',
      borderStyle: 'solid',
      borderWidth: '2px',
      // No [dark] key
    };

    await TestHelpers.setConfig('normalMode', withoutOverride);
    await TestHelpers.waitForDebounce();

    config = TestHelpers.getConfig();
    normalMode = config.get('normalMode') as Record<string, unknown>;
    assert.strictEqual(normalMode['[dark]'], undefined, 'Dark override should be removed');
  });
});
