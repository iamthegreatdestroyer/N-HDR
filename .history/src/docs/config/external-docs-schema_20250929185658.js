/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * External documentation services configuration schema.
 */

const externalDocsSchema = {
  type: "object",
  properties: {
    services: {
      type: "object",
      properties: {
        github: {
          type: "object",
          properties: {
            token: { type: "string", description: "GitHub access token" },
            defaultOwner: {
              type: "string",
              description: "Default repository owner",
            },
            defaultRepo: {
              type: "string",
              description: "Default repository name",
            },
            defaultBranch: {
              type: "string",
              description: "Default branch name",
              default: "main",
            },
          },
        },
        readthedocs: {
          type: "object",
          properties: {
            defaultProject: {
              type: "string",
              description: "Default project name",
            },
            defaultVersion: {
              type: "string",
              description: "Default documentation version",
              default: "latest",
            },
            customDomain: {
              type: "string",
              description: "Custom documentation domain",
            },
          },
        },
        swagger: {
          type: "object",
          properties: {
            defaultUrl: {
              type: "string",
              description: "Default Swagger documentation URL",
            },
            uiOptions: {
              type: "object",
              description: "Swagger UI customization options",
              properties: {
                theme: {
                  type: "string",
                  enum: ["default", "dark", "custom"],
                  default: "default",
                },
                customCss: {
                  type: "string",
                  description: "Custom CSS for Swagger UI",
                },
                customJs: {
                  type: "string",
                  description: "Custom JavaScript for Swagger UI",
                },
              },
            },
          },
        },
      },
    },
    cache: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "Cache directory path",
          default: ".cache/external-docs",
        },
        duration: {
          type: "integer",
          description: "Cache duration in seconds",
          default: 3600,
          minimum: 60,
        },
        maxSize: {
          type: "integer",
          description: "Maximum cache size in bytes",
          default: 104857600, // 100MB
          minimum: 1048576, // 1MB
        },
      },
    },
    sync: {
      type: "object",
      properties: {
        auto: {
          type: "boolean",
          description: "Enable automatic documentation sync",
          default: false,
        },
        interval: {
          type: "integer",
          description: "Auto-sync interval in seconds",
          default: 86400, // 24 hours
          minimum: 3600, // 1 hour
        },
        onStart: {
          type: "boolean",
          description: "Sync documentation on startup",
          default: true,
        },
      },
    },
    transforms: {
      type: "object",
      properties: {
        github: {
          type: "object",
          description: "GitHub content transformation options",
          properties: {
            syntaxHighlighting: {
              type: "boolean",
              description: "Enable syntax highlighting for code blocks",
              default: true,
            },
            embedImages: {
              type: "boolean",
              description: "Convert image links to embedded images",
              default: true,
            },
          },
        },
        readthedocs: {
          type: "object",
          description: "ReadTheDocs content transformation options",
          properties: {
            stripNav: {
              type: "boolean",
              description: "Remove navigation elements",
              default: true,
            },
            inlineStyles: {
              type: "boolean",
              description: "Convert external styles to inline styles",
              default: true,
            },
          },
        },
        swagger: {
          type: "object",
          description: "Swagger content transformation options",
          properties: {
            bundleAssets: {
              type: "boolean",
              description: "Bundle Swagger UI assets",
              default: true,
            },
            minify: {
              type: "boolean",
              description: "Minify generated HTML",
              default: true,
            },
          },
        },
      },
    },
    links: {
      type: "object",
      properties: {
        position: {
          type: "string",
          enum: ["top", "bottom", "custom"],
          description: "Position of external documentation links",
          default: "bottom",
        },
        template: {
          type: "string",
          description: "Custom template for documentation links",
        },
        icons: {
          type: "boolean",
          description: "Show service icons in links",
          default: true,
        },
      },
    },
    metadata: {
      type: "object",
      properties: {
        save: {
          type: "boolean",
          description: "Save metadata alongside documentation",
          default: true,
        },
        format: {
          type: "string",
          enum: ["json", "yaml"],
          description: "Metadata file format",
          default: "json",
        },
      },
    },
  },
  required: ["services"],
};

module.exports = externalDocsSchema;
