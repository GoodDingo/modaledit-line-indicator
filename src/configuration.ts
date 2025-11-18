import * as vscode from 'vscode';

/**
 * Theme kind supported by VS Code
 * VS Code provides 4 distinct theme kinds:
 * - dark: Regular dark theme
 * - light: Regular light theme
 * - darkHC: High contrast dark theme (ColorThemeKind.HighContrast)
 * - lightHC: High contrast light theme (ColorThemeKind.HighContrastLight)
 */
export type ThemeKind = 'dark' | 'light' | 'darkHC' | 'lightHC';

/**
 * Complete DecorationRenderOptions interface
 * Maps 1:1 to vscode.DecorationRenderOptions
 * All properties optional - only backgroundColor and border have defaults
 *
 * This interface represents the complete set of styling properties available
 * for decorations in VS Code. By providing direct passthrough to the VS Code API,
 * we eliminate transformation logic and support all current and future properties.
 */
export interface DecorationConfig {
  // ===== Text Styling =====
  backgroundColor?: string; // Background color (CSS color, rgba(), or ThemeColor)
  color?: string; // Text color (CSS color or ThemeColor)
  opacity?: string; // Opacity (0.0 to 1.0)

  // ===== Border (CSS shorthand OR individual properties) =====
  border?: string; // CSS border shorthand: "2px dotted #00aa00"
  borderColor?: string; // Border color (used if border not specified)
  borderRadius?: string; // Border radius
  borderSpacing?: string; // Border spacing
  borderStyle?: string; // Border style (solid, dotted, dashed, etc.)
  borderWidth?: string; // Border width (used if border not specified)

  // ===== Outline (CSS shorthand OR individual properties) =====
  outline?: string; // CSS outline shorthand: "1px solid #ff0000"
  outlineColor?: string; // Outline color
  outlineStyle?: string; // Outline style
  outlineWidth?: string; // Outline width

  // ===== Font Styling =====
  fontStyle?: string; // Font style (normal, italic, oblique)
  fontWeight?: string; // Font weight (normal, bold, 100-900)
  letterSpacing?: string; // Letter spacing
  textDecoration?: string; // Text decoration (underline, line-through, etc.)

  // ===== Cursor =====
  cursor?: string; // CSS cursor (pointer, default, etc.)

  // ===== Overview Ruler =====
  overviewRulerColor?: string; // Color in overview ruler
  overviewRulerLane?: string; // Position: 'Left' | 'Center' | 'Right' | 'Full'

  // ===== Gutter Icon =====
  gutterIconPath?: string; // Absolute path or URI to gutter icon
  gutterIconSize?: string; // Icon size: 'auto' | 'contain' | 'cover' | percentage

  // ===== Advanced =====
  rangeBehavior?: string; // 'OpenOpen' | 'ClosedClosed' | 'OpenClosed' | 'ClosedOpen'

  // ===== Attachments (deferred - complex) =====
  // before?: ThemableDecorationAttachmentRenderOptions;
  // after?: ThemableDecorationAttachmentRenderOptions;
}

/**
 * Theme-specific override configuration
 * Now supports all DecorationConfig properties instead of just 4
 */
export type ThemeOverride = DecorationConfig;

/**
 * Mode configuration with optional theme-specific overrides
 *
 * Extends DecorationConfig to support ALL decoration properties.
 * Supports cascading fallback hierarchy:
 * - dark: Regular dark theme (also fallback for darkHC)
 * - light: Regular light theme (also fallback for lightHC)
 * - darkHC: High contrast dark theme → falls back to dark
 * - lightHC: High contrast light theme → falls back to light
 *
 * Each property is resolved independently through the fallback chain,
 * enabling selective overrides.
 */
export interface ModeConfig extends DecorationConfig {
  // Theme-specific overrides (no brackets, shorter HC names)
  dark?: ThemeOverride;
  light?: ThemeOverride;
  darkHC?: ThemeOverride;
  lightHC?: ThemeOverride;
}

/**
 * Merged configuration after applying theme overrides
 * Now supports ALL DecorationConfig properties instead of just 4 required ones
 */
export type MergedModeConfig = DecorationConfig;

/**
 * Logger interface for optional logging
 */
export interface Logger {
  debug(message: string, data?: unknown): void;
  log(message: string, data?: unknown): void;
}

/**
 * Default configuration for normal mode (v0.3.0 format)
 * Uses backgroundColor and CSS border shorthand
 */
export const DEFAULT_NORMAL_MODE: MergedModeConfig = {
  backgroundColor: 'rgba(255, 255, 255, 0)',
  border: '2px dotted #00aa00',
};

/**
 * Default configuration for insert mode (v0.3.0 format)
 * Uses backgroundColor and CSS border shorthand
 */
export const DEFAULT_INSERT_MODE: MergedModeConfig = {
  backgroundColor: 'rgba(255, 255, 255, 0)',
  border: '2px solid #aa0000',
};

/**
 * Default configuration for visual mode (v0.3.0 format)
 * Uses backgroundColor and CSS border shorthand
 */
export const DEFAULT_VISUAL_MODE: MergedModeConfig = {
  backgroundColor: 'rgba(255, 255, 255, 0)',
  border: '2px dashed #0000aa',
};

/**
 * Default configuration for search mode (v0.3.0 format)
 * Uses backgroundColor and CSS border shorthand
 */
export const DEFAULT_SEARCH_MODE: MergedModeConfig = {
  backgroundColor: 'rgba(255, 255, 255, 0)',
  border: '2px solid #aaaa00',
};

/**
 * Configuration Manager - Singleton class for managing mode configurations
 *
 * Handles all configuration logic:
 * - Reading VS Code settings
 * - Theme detection
 * - Cascading fallback hierarchy
 * - Property-level merging
 *
 * Usage:
 *   const config = ConfigurationManager.getInstance(logger);
 *   const normalConfig = config.getConfig('normal');
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager | null = null;
  private logger?: Logger;

  private constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Get singleton instance of ConfigurationManager
   *
   * @param logger - Optional logger for debug messages
   * @returns Singleton ConfigurationManager instance
   */
  public static getInstance(logger?: Logger): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager(logger);
    }
    // Update logger if provided (allows changing logger after first instantiation)
    if (logger) {
      ConfigurationManager.instance.logger = logger;
    }
    return ConfigurationManager.instance;
  }

  /**
   * Get merged configuration for a specific mode
   *
   * This is the ONLY public API method. It handles everything:
   * 1. Read VS Code configuration
   * 2. Detect current theme
   * 3. Apply cascading fallback
   * 4. Merge with defaults
   *
   * @param mode - The mode to get configuration for
   * @returns Complete merged configuration with all properties resolved
   */
  public getConfig(mode: 'normal' | 'insert' | 'visual' | 'search'): MergedModeConfig {
    // Get VS Code configuration
    const config = vscode.workspace.getConfiguration('modaledit-line-indicator');
    const modeConfigKey = `${mode}Mode`;
    const userModeConfig = config.get<ModeConfig>(modeConfigKey);
    const modeConfig =
      userModeConfig ??
      (config.inspect<ModeConfig>(modeConfigKey)?.defaultValue as ModeConfig | undefined) ??
      {};

    if (!userModeConfig) {
      this.logger?.debug(
        `Using ${mode} mode defaults from schema because no user configuration was found.`
      );
    }

    // Get defaults and merge
    const defaults = this.getDefaultsForMode(mode);
    return this.getMergedModeConfig(modeConfig, defaults);
  }

  /**
   * Get default configuration for a specific mode
   *
   * @param mode - The mode to get defaults for
   * @returns Default configuration for the specified mode
   */
  private getDefaultsForMode(mode: 'normal' | 'insert' | 'visual' | 'search'): MergedModeConfig {
    switch (mode) {
      case 'normal':
        return DEFAULT_NORMAL_MODE;
      case 'insert':
        return DEFAULT_INSERT_MODE;
      case 'visual':
        return DEFAULT_VISUAL_MODE;
      case 'search':
        return DEFAULT_SEARCH_MODE;
    }
  }

  /**
   * Get the current active color theme kind from VS Code
   *
   * VS Code provides 4 distinct theme kinds, and we now distinguish between
   * high contrast dark and high contrast light themes (Stage 1 of Issue #4).
   *
   * @returns 'dark', 'light', 'darkHC', or 'lightHC'
   */
  private getCurrentThemeKind(): ThemeKind {
    const themeKind = vscode.window.activeColorTheme.kind;

    switch (themeKind) {
      case vscode.ColorThemeKind.Dark:
        return 'dark';
      case vscode.ColorThemeKind.Light:
        return 'light';
      case vscode.ColorThemeKind.HighContrast:
        // HighContrast is the DARK variant of high contrast themes
        return 'darkHC';
      case vscode.ColorThemeKind.HighContrastLight:
        return 'lightHC';
      default:
        this.logger?.debug(`Unknown theme kind: ${themeKind}, defaulting to dark`);
        return 'dark';
    }
  }

  /**
   * Returns the fallback chain for a given theme kind.
   * Each property is resolved by checking these keys in order until a value is found.
   *
   * STAGE 2: Implements cascading fallback hierarchy per Issue #4
   * - HC Dark falls back to regular dark theme
   * - HC Light falls back to regular light theme
   * - Regular themes have no fallback (check theme override only)
   *
   * @param themeKind - Current theme kind
   * @returns Array of theme override keys to check in priority order
   */
  private getFallbackChain(themeKind: ThemeKind): string[] {
    switch (themeKind) {
      case 'darkHC':
        // HC Dark: darkHC → dark → common → defaults
        return ['darkHC', 'dark'];
      case 'lightHC':
        // HC Light: lightHC → light → common → defaults
        return ['lightHC', 'light'];
      case 'dark':
        // Regular dark: dark → common → defaults
        return ['dark'];
      case 'light':
        // Regular light: light → common → defaults
        return ['light'];
    }
  }

  /**
   * Resolves a single property through the fallback chain.
   * Checks theme overrides first, then common property, then default value.
   *
   * STAGE 2: Generic property resolution for ANY DecorationConfig property
   * This allows selective overrides without duplicating entire config.
   *
   * @param propertyName - Property to resolve (any key from DecorationConfig)
   * @param modeConfig - Mode configuration object from settings
   * @param fallbackChain - Array of theme keys to check in priority order
   * @param defaultValue - Default value if not found anywhere (may be undefined for optional properties)
   * @returns Resolved property value or undefined
   */
  private resolveProperty(
    propertyName: keyof DecorationConfig,
    modeConfig: ModeConfig,
    fallbackChain: string[],
    defaultValue?: string
  ): string | undefined {
    // 1. Check theme-specific overrides in priority order
    for (const themeKey of fallbackChain) {
      const themeOverride = modeConfig[themeKey as keyof ModeConfig] as ThemeOverride | undefined;
      if (themeOverride?.[propertyName] !== undefined) {
        this.logger?.debug(
          `Resolved ${propertyName} from ${themeKey}: ${themeOverride[propertyName]}`
        );
        return themeOverride[propertyName];
      }
    }

    // 2. Check common property (base configuration)
    if (modeConfig[propertyName] !== undefined) {
      this.logger?.debug(
        `Resolved ${propertyName} from common config: ${modeConfig[propertyName]}`
      );
      return modeConfig[propertyName];
    }

    // 3. Use default value (may be undefined for optional properties)
    if (defaultValue !== undefined) {
      this.logger?.debug(`Resolved ${propertyName} from defaults: ${defaultValue}`);
    }
    return defaultValue;
  }

  /**
   * Merges common mode configuration with theme-specific overrides.
   *
   * STAGE 2: Generic property-level cascading fallback hierarchy.
   * Each property is resolved independently through the fallback chain.
   *
   * Fallback hierarchy:
   * - HC Dark: darkHC → dark → common → defaults
   * - HC Light: lightHC → light → common → defaults
   * - Regular Dark/Light: dark/light → common → defaults
   *
   * Example:
   * {
   *   borderStyle: "dotted",                    // common
   *   dark: { border: "2px solid #00ff00" },    // dark theme
   *   darkHC: { border: "4px solid #ff0000" }   // HC dark
   * }
   * When theme = High Contrast Dark:
   * - border: "4px solid #ff0000"   ← from darkHC
   * - borderStyle: "dotted"         ← from common
   * - backgroundColor: "rgba(...)"  ← from defaults
   *
   * @param modeConfig - Nested configuration object from settings
   * @param defaults - Default configuration values to use as fallback
   * @returns Merged configuration with all properties resolved
   */
  private getMergedModeConfig(
    modeConfig: ModeConfig,
    defaults: MergedModeConfig
  ): MergedModeConfig {
    const themeKind = this.getCurrentThemeKind();
    const fallbackChain = this.getFallbackChain(themeKind);

    this.logger?.debug(
      `Resolving mode config for theme: ${themeKind}, fallback chain: ${fallbackChain.join(' → ')}`
    );

    // Define all properties we want to resolve
    // Single source of truth for all supported properties
    // NOTE: borderStyle and borderWidth are valid VS Code API fallback properties
    const propertiesToResolve: (keyof DecorationConfig)[] = [
      // Text styling
      'backgroundColor',
      'color',
      'opacity',
      // Border (CSS shorthand only)
      'border',
      'borderColor',
      'borderRadius',
      'borderSpacing',
      // Outline
      'outline',
      'outlineColor',
      'outlineStyle',
      'outlineWidth',
      // Font
      'fontStyle',
      'fontWeight',
      'letterSpacing',
      'textDecoration',
      // Cursor
      'cursor',
      // Overview ruler
      'overviewRulerColor',
      'overviewRulerLane',
      // Gutter
      'gutterIconPath',
      'gutterIconSize',
      // Advanced
      'rangeBehavior',
    ];

    // GENERIC RESOLUTION: Loop through all properties
    const merged: MergedModeConfig = {};

    for (const prop of propertiesToResolve) {
      const value = this.resolveProperty(
        prop,
        modeConfig,
        fallbackChain,
        defaults[prop] // May be undefined for optional properties
      );

      // Only add to merged config if value exists
      if (value !== undefined) {
        merged[prop] = value;
      }
    }

    return merged;
  }
}
