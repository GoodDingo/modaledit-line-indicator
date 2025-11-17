import * as vscode from 'vscode';

/**
 * Theme kind supported by VS Code
 * VS Code provides 4 distinct theme kinds:
 * - dark: Regular dark theme
 * - light: Regular light theme
 * - highContrastDark: High contrast dark theme (ColorThemeKind.HighContrast)
 * - highContrastLight: High contrast light theme (ColorThemeKind.HighContrastLight)
 */
export type ThemeKind = 'dark' | 'light' | 'highContrastDark' | 'highContrastLight';

/**
 * Theme-specific override configuration
 */
export interface ThemeOverride {
  background?: string;
  border?: string;
  borderStyle?: string;
  borderWidth?: string;
}

/**
 * Mode configuration with optional theme-specific overrides
 *
 * STAGE 2: Supports cascading fallback hierarchy
 * - [dark]: Regular dark theme (also fallback for highContrastDark)
 * - [light]: Regular light theme (also fallback for highContrastLight)
 * - [highContrastDark]: High contrast dark theme → falls back to [dark]
 * - [highContrastLight]: High contrast light theme → falls back to [light]
 *
 * Each property (background, border, borderStyle, borderWidth) is resolved
 * independently through the fallback chain, enabling selective overrides.
 */
export interface ModeConfig {
  background?: string;
  border?: string;
  borderStyle?: string;
  borderWidth?: string;
  '[dark]'?: ThemeOverride;
  '[light]'?: ThemeOverride;
  '[highContrastDark]'?: ThemeOverride;
  '[highContrastLight]'?: ThemeOverride;
}

/**
 * Merged configuration after applying theme overrides
 */
export interface MergedModeConfig {
  background: string;
  border: string;
  borderStyle: string;
  borderWidth: string;
}

/**
 * Logger interface for optional logging
 */
interface Logger {
  debug(message: string, data?: unknown): void;
}

/**
 * Default configuration for normal mode
 * Matches package.json defaults
 */
export const DEFAULT_NORMAL_MODE: MergedModeConfig = {
  background: 'rgba(255, 255, 255, 0)',
  border: '#00aa00',
  borderStyle: 'dotted',
  borderWidth: '2px',
};

/**
 * Default configuration for insert mode
 * Matches package.json defaults
 */
export const DEFAULT_INSERT_MODE: MergedModeConfig = {
  background: 'rgba(255, 255, 255, 0)',
  border: '#aa0000',
  borderStyle: 'solid',
  borderWidth: '2px',
};

/**
 * Default configuration for visual mode
 * Matches package.json defaults
 */
export const DEFAULT_VISUAL_MODE: MergedModeConfig = {
  background: 'rgba(255, 255, 255, 0)',
  border: '#0000aa',
  borderStyle: 'dashed',
  borderWidth: '2px',
};

/**
 * Default configuration for search mode
 * Matches package.json defaults
 */
export const DEFAULT_SEARCH_MODE: MergedModeConfig = {
  background: 'rgba(255, 255, 255, 0)',
  border: '#aaaa00',
  borderStyle: 'solid',
  borderWidth: '2px',
};

/**
 * Get default configuration for a specific mode
 *
 * @param mode - The mode to get defaults for
 * @returns Default configuration for the specified mode
 */
export function getDefaultsForMode(
  mode: 'normal' | 'insert' | 'visual' | 'search'
): MergedModeConfig {
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
 * @param logger - Optional logger for debug messages
 * @returns 'dark', 'light', 'highContrastDark', or 'highContrastLight'
 */
export function getCurrentThemeKind(logger?: Logger): ThemeKind {
  const themeKind = vscode.window.activeColorTheme.kind;

  switch (themeKind) {
    case vscode.ColorThemeKind.Dark:
      return 'dark';
    case vscode.ColorThemeKind.Light:
      return 'light';
    case vscode.ColorThemeKind.HighContrast:
      // HighContrast is the DARK variant of high contrast themes
      return 'highContrastDark';
    case vscode.ColorThemeKind.HighContrastLight:
      return 'highContrastLight';
    default:
      logger?.debug(`Unknown theme kind: ${themeKind}, defaulting to dark`);
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
export function getFallbackChain(themeKind: ThemeKind): string[] {
  switch (themeKind) {
    case 'highContrastDark':
      // HC Dark: [highContrastDark] → [dark] → common → defaults
      return ['[highContrastDark]', '[dark]'];
    case 'highContrastLight':
      // HC Light: [highContrastLight] → [light] → common → defaults
      return ['[highContrastLight]', '[light]'];
    case 'dark':
      // Regular dark: [dark] → common → defaults
      return ['[dark]'];
    case 'light':
      // Regular light: [light] → common → defaults
      return ['[light]'];
  }
}

/**
 * Resolves a single property through the fallback chain.
 * Checks theme overrides first, then common property, then default value.
 *
 * STAGE 2: Property-level cascading resolution (not object-level)
 * This allows selective overrides without duplicating entire config.
 *
 * @param propertyName - Property to resolve (background, border, borderStyle, borderWidth)
 * @param modeConfig - Mode configuration object from settings
 * @param fallbackChain - Array of theme keys to check in priority order
 * @param defaultValue - Default value if not found anywhere
 * @param logger - Optional logger for debug messages
 * @returns Resolved property value
 */
export function resolveProperty(
  propertyName: keyof ThemeOverride,
  modeConfig: ModeConfig,
  fallbackChain: string[],
  defaultValue: string,
  logger?: Logger
): string {
  // 1. Check theme-specific overrides in priority order
  for (const themeKey of fallbackChain) {
    const themeOverride = modeConfig[themeKey as keyof ModeConfig] as ThemeOverride | undefined;
    if (themeOverride?.[propertyName] !== undefined) {
      logger?.debug(`Resolved ${propertyName} from ${themeKey}: ${themeOverride[propertyName]}`);
      return themeOverride[propertyName]!;
    }
  }

  // 2. Check common property (base configuration)
  if (modeConfig[propertyName] !== undefined) {
    logger?.debug(`Resolved ${propertyName} from common config: ${modeConfig[propertyName]}`);
    return modeConfig[propertyName]!;
  }

  // 3. Use default value
  logger?.debug(`Resolved ${propertyName} from defaults: ${defaultValue}`);
  return defaultValue;
}

/**
 * Merges common mode configuration with theme-specific overrides.
 *
 * STAGE 2: Implements property-level cascading fallback hierarchy.
 * Each property (background, border, borderStyle, borderWidth) is resolved
 * independently through the fallback chain.
 *
 * Fallback hierarchy:
 * - HC Dark: [highContrastDark] → [dark] → common → defaults
 * - HC Light: [highContrastLight] → [light] → common → defaults
 * - Regular Dark/Light: [dark/light] → common → defaults
 *
 * Example:
 * {
 *   borderStyle: "dotted",              // common
 *   "[dark]": { borderWidth: "2px" },   // dark theme
 *   "[highContrastDark]": { border: "#ff0000" }  // HC dark
 * }
 * When theme = High Contrast Dark:
 * - border: "#ff0000"             ← from [highContrastDark]
 * - borderWidth: "2px"            ← from [dark] (fallback)
 * - borderStyle: "dotted"         ← from common
 * - background: "rgba(...)"       ← from defaults
 *
 * @param modeConfig - Nested configuration object from settings
 * @param defaults - Default configuration values to use as fallback
 * @param logger - Optional logger for debug messages
 * @returns Merged configuration with all required properties
 */
export function getMergedModeConfig(
  modeConfig: ModeConfig,
  defaults: MergedModeConfig,
  logger?: Logger
): MergedModeConfig {
  const themeKind = getCurrentThemeKind(logger);
  const fallbackChain = getFallbackChain(themeKind);

  logger?.debug(
    `Resolving mode config for theme: ${themeKind}, fallback chain: ${fallbackChain.join(' → ')}`
  );

  // STAGE 2: Resolve each property independently through the fallback chain
  // This enables selective overrides (e.g., only override borderWidth for HC, inherit rest from base theme)
  const merged: MergedModeConfig = {
    background: resolveProperty(
      'background',
      modeConfig,
      fallbackChain,
      defaults.background,
      logger
    ),
    border: resolveProperty('border', modeConfig, fallbackChain, defaults.border, logger),
    borderStyle: resolveProperty(
      'borderStyle',
      modeConfig,
      fallbackChain,
      defaults.borderStyle,
      logger
    ),
    borderWidth: resolveProperty(
      'borderWidth',
      modeConfig,
      fallbackChain,
      defaults.borderWidth,
      logger
    ),
  };

  return merged;
}
