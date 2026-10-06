// Version native (iOS/Android) : le Web Push n'existe pas hors navigateur.
// Les notifications natives (Expo Push) sont repoussées en V2 — voir la
// roadmap. Le toggle de l'écran Paramètres reste géré par expo-notifications
// pour la permission système ; ce module n'a rien à faire ici.

export async function subscribe(): Promise<boolean> {
  return true;
}

export async function unsubscribe(): Promise<void> {}
