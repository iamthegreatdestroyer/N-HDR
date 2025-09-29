/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Default configuration for external documentation services.
 */

module.exports = {
  services: {
    github: {
      token: process.env.GITHUB_TOKEN,
      defaultOwner: "hdr-empire",
      defaultRepo: "neural-hdr",
      defaultBranch: "main",
    },
    readthedocs: {
      defaultProject: "neural-hdr",
      defaultVersion: "latest",
    },
    swagger: {
      defaultUrl: "https://api.neural-hdr.com/docs/swagger.json",
      uiOptions: {
        theme: "dark",
        customCss: "assets/swagger-custom.css",
        customJs: "assets/swagger-custom.js",
      },
    },
  },
  cache: {
    directory: ".cache/external-docs",
    duration: 3600,
    maxSize: 104857600,
  },
  sync: {
    auto: true,
    interval: 86400,
    onStart: true,
  },
  transforms: {
    github: {
      syntaxHighlighting: true,
      embedImages: true,
    },
    readthedocs: {
      stripNav: true,
      inlineStyles: true,
    },
    swagger: {
      bundleAssets: true,
      minify: true,
    },
  },
  links: {
    position: "bottom",
    template: null,
    icons: true,
  },
  metadata: {
    save: true,
    format: "json",
  },
};
