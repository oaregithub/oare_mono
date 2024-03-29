import Vue from 'vue';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';

export default function () {
  const requireComponent = require.context(
    '@/components/base',
    false,
    // The regular expression used to match base component filenames
    /Oare[A-Z]\w+\.(vue|js)$/
  );

  requireComponent.keys().forEach(fileName => {
    // Get component config
    const componentConfig = requireComponent(fileName);

    const file = fileName.split('/').pop();

    if (file) {
      // Get PascalCase name of component
      const componentName = upperFirst(
        camelCase(
          // Gets the file name regardless of folder depth
          file.replace(/\.\w+$/, '')
        )
      );

      // Register component globally
      Vue.component(
        componentName,
        // Look for the component options on `.default`, which will
        // exist if the component was exported with `export default`,
        // otherwise fall back to module's root.
        componentConfig.default || componentConfig
      );
    }
  });
}
