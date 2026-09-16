import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

function TabBarButton({ children, onPress, accessibilityState }: any) {
  const focused = accessibilityState?.selected;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, focused && styles.tabButtonFocused]}
      accessibilityRole="button"
    >
      {children}
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#B7B3AF',
        tabBarInactiveTintColor: '#9A9692',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: styles.tabBar,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />,
        }}
      />
      {/* 📖 Groupe de routes secondaires de l'accueil (détail d'un événement...).
          href: null → la route existe (router.push la trouve) mais n'apparaît
          PAS comme onglet dans la barre. */}
      <Tabs.Screen name="accueil" options={{ href: null }} />
      <Tabs.Screen
        name="don"
        options={{
          title: '',
          tabBarButton: (props) => <TabBarButton {...props} />,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.centerButton, focused && styles.centerButtonFocused]}>
              <Ionicons name="heart-outline" size={40} color={Colors.aubergine} />
            </View>
          ),
        }}
        // 📖 Chaque onglet garde son propre historique de navigation en mémoire (le Stack "don" reste où on l'a laissé : scanner, éligibilité...)
        // → Pourquoi ce listener : sans lui, revenir sur l'onglet Don après être passé par Accueil réaffiche l'écran où on était (ex: le résultat du questionnaire) au lieu du hub Don ; on force donc un retour à l'écran "index" à CHAQUE appui sur l'onglet, qu'il soit déjà actif ou non
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('don', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="cartes"
        options={{
          title: 'Cartes',
          tabBarIcon: ({ color }) => <Ionicons name="card" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

// 📖 Exportée pour que les écrans imbriqués (ex: scanner QR) puissent restaurer exactement ce style après l'avoir masquée
export const TAB_BAR_STYLE = {
  position: 'absolute' as const,
  left: 40,
  right: 40,
  bottom: 15,
  height: 72,
  borderTopWidth: 0,
  borderRadius: 34,
  backgroundColor: '#3A3837',
  paddingTop: 6,
  paddingBottom: 8,
  paddingHorizontal: 10,
  shadowColor: '#000',
  shadowOpacity: 0.14,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
  elevation: 8,
};

const styles = StyleSheet.create({
  tabBar: TAB_BAR_STYLE,
  tabItem: {
    paddingTop: 0,
    marginHorizontal: 3,
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonFocused: {
    opacity: 1,
  },
  centerButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.cremeClair,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  centerButtonFocused: {
    transform: [{ scale: 1.02 }],
  },
});