/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search` command */
  export type Search = ExtensionPreferences & {}
  /** Preferences accessible in the `bookmarks` command */
  export type Bookmarks = ExtensionPreferences & {}
  /** Preferences accessible in the `feed` command */
  export type Feed = ExtensionPreferences & {}
  /** Preferences accessible in the `subscriptions` command */
  export type Subscriptions = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search` command */
  export type Search = {}
  /** Arguments passed to the `bookmarks` command */
  export type Bookmarks = {}
  /** Arguments passed to the `feed` command */
  export type Feed = {}
  /** Arguments passed to the `subscriptions` command */
  export type Subscriptions = {}
}

