import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { getUser, removeToken } from '../../stores/auth.store';

type UtilisateurLocal = {
  pseudo?: string;
  statut_donneur?: string;
  points_cumules?: number;
};

export default function ProfilScreen() {
  const [user, setUser] = useState<UtilisateurLocal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // On récupère les infos de l'utilisateur au montage de l'écran
    getUser()
      .then((userData) => {
        if (!cancelled) setUser(userData);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      // 1. On supprime le token et les données utilisateur du SecureStore
      await removeToken();

      // 2. On redirige vers l'écran de connexion en écrasant l'historique
      router.replace('/auth/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={Colors.deconnexion[500]} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Mon Profil</Text>

        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.text}>Pseudo : {user.pseudo}</Text>
            <Text style={styles.text}>Statut : {user.statut_donneur}</Text>
            <Text style={styles.text}>Points : {user.points_cumules ?? 0}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Se déconnecter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 126,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.aubergine,
    marginBottom: 24,
    textAlign: 'center',
  },
  userInfo: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: Colors.cremeClair,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  text: {
    fontSize: 14,
    color: Colors.aubergine,
    marginBottom: 8,
  },
  button: {
    backgroundColor: Colors.deconnexion[500],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: Colors.blanc,
    fontSize: 14,
    fontWeight: '700',
  },
});
