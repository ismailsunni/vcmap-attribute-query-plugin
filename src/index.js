import { createToggleAction, ToolboxType } from '@vcmap/ui';
import { version, name } from '../package.json';
import weatherComponent from './ui/weatherComponent.vue';

/**
 * @typedef {Object} PluginState
 * @property {any} prop
 */

/**
 * @param {T} config - the configuration of this plugin instance, passed in from the app.
 * @param {string} baseUrl - the absolute URL from which the plugin was loaded (without filename, ending on /)
 * @returns {import("@vcmap/ui/src/vcsUiApp").VcsPlugin<T, PluginState>}
 * @template {Object} T
 */
export default function plugin(config, baseUrl) {
  // eslint-disable-next-line no-console
  console.log(config, baseUrl);

  return {
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    _destroyToggleAction: () => {},
    _removeToolbox: () => {},

    initialize(vcsUiApp, state) {
      const { action, destroy } = createToggleAction(
        {
          id: 'weatherToggleAction',
          name: 'Weather App',
          icon: 'mdi-umbrella',
        },
        {
          id: 'weatherWindow',
          component: weatherComponent,
        },
        vcsUiApp.windowManager,
        name,
      );

      this._destroyToggleAction = destroy;

      const { id } = vcsUiApp.toolboxManager.add(
        {
          type: ToolboxType.SINGLE,
          action,
        },
        name,
      );

      this._removeToolbox = () => {
        vcsUiApp.toolboxManager.remove(id);
      };
    },
    destroy() {
      this._destroyToggleAction();
      this._removeToolbox();
    },
  };
}
