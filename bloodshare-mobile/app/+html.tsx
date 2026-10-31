import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// 📖 Ce fichier définit le <head> commun à toutes les pages web (mode "static").
//    Il ne sert QUE sur web : iOS et Android natifs ne l'utilisent pas.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* PWA : nom, icônes, mode plein écran */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F6F1E4" />

        {/* 📖 iOS lit mal le manifest : Safari a ses propres balises pour
            l'icône de l'écran d'accueil et l'ouverture en plein écran. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Aïma" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* Réglage Expo indispensable pour que le défilement fonctionne sur web */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}