import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { getProfil, Profil } from '../../services/profil.service';
import { removeToken } from '../../stores/auth.store';

export default function ProfilScreen() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getProfil()
      .then((data) => {
        if (!cancelled) setProfil(data);
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération du profil', error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await removeToken();

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

        {profil && (
          <View style={styles.userInfo}>
            <Text style={styles.text}>Pseudo : {profil.pseudo}</Text>
            <Text style={styles.text}>Statut : {profil.statut}</Text>
            <Text style={styles.text}>Points : {profil.points_cumules}</Text>
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
