// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // 📖 Règles « React Compiler » de eslint-plugin-react-hooks, arrivées avec le SDK 57 :
    //    elles signalent du code qui fonctionne (refs lues pendant le rendu dans l'écran
    //    quiz et le scanner web, setState au montage dans useNotifications /
    //    useProfilComplet) mais que le compilateur React ne saura pas optimiser. Les
    //    corriger demande de restructurer ces écrans : passées en avertissement pour que le
    //    lint puisse bloquer la CI dès maintenant, sans toucher à leur logique avant la V1.
    //    Les cas restent visibles en warning ; à repasser en 'error' une fois corrigés.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
