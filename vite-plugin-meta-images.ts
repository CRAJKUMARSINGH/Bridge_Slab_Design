import type { Plugin } from "vite";

/**
 * Optional meta-images plugin placeholder.
 * Keeps Vite config stable when project-specific implementation
 * is not present in this workspace.
 */
export function metaImagesPlugin(): Plugin {
  return {
    name: "meta-images-plugin-noop",
  };
}
