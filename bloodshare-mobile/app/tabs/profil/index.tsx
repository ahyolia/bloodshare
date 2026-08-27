import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

// 🛑 DONNÉES MOCKÉES
const MOCK_USER = {
  pseudo: 'Pseudo',
  level: 10,
  points: 1080,
  maxPoints: 1100,
  badgesCount: 6,
  history: [
    { id: 1, date: '04/07/26', number: 3 },
    { id: 2, date: '30/04/26', number: 2 },
    { id: 3, date: '27/02/26', number: 1 },
  ]
};

export default function ProfilScreen() {
  const router = useRouter();

  // Simulation de la déconnexion
  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => router.replace('/auth/login') },
    ]);
  };

  // Simulation de la suppression
  const handleDeleteAccount = () => {
    Alert.alert('Supprimer le compte', 'Action irréversible. Voulez-vous vraiment supprimer votre compte ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => router.replace('/auth/login') },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Réglages</Text>

      {/* CARTE UTILISATEUR */}
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => console.log('Aller vers Réglages Profil')}
      >
        <View style={styles.userRow}>
          <View style={styles.avatarPlaceholder} />
          <View style={styles.userInfo}>
            <Text style={styles.pseudo}>{MOCK_USER.pseudo}</Text>
            <Text style={styles.subText}>Profil et informations personnelles</Text>
          </View>
          <Text style={styles.chevron}>{'>'}</Text>
        </View>
      </TouchableOpacity>

      {/* CARTE NIVEAU & POINTS */}
      <TouchableOpacity style={[styles.card, styles.levelCard]} onPress={() => console.log('Ouvrir Pop-up points')}>
        <Text style={styles.levelText}>Niveau {MOCK_USER.level}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${(MOCK_USER.points / MOCK_USER.maxPoints) * 100}%` }]} />
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{MOCK_USER.points} ★</Text>
        </View>
      </TouchableOpacity>

      {/* CARTE BADGES */}
      <TouchableOpacity style={styles.card} onPress={() => console.log('Aller vers Galerie Badges')}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Mes badges</Text>
          <Text style={styles.badgesCount}>{MOCK_USER.badgesCount} badges obtenues</Text>
        </View>
        <View style={styles.badgesRow}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.badgePlaceholder} />
          ))}
        </View>
      </TouchableOpacity>

      {/* CARTE HISTORIQUE */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Historique</Text>
        {MOCK_USER.history.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <Text style={styles.historyText}>Don n°{item.number} : {item.date}</Text>
            <View style={styles.historyPill}>
              <Text style={styles.historyPillText}>Carte obtenu</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.expandButton}>
          <Text style={styles.chevronDown}>v</Text>
        </TouchableOpacity>
      </View>

      {/* BOUTONS D'ACTION */}
      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Parrainer quelqu'un</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
        <Text style={styles.secondaryButtonText}>Déconnexion</Text>
      </TouchableOpacity>
      
      {/* Bouton pour la suppression */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>Supprimer le compte</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 20, paddingBottom: 100 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  
  // Cartes générales
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  
  // Carte Utilisateur
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0E0E0', marginRight: 15 },
  userInfo: { flex: 1 },
  pseudo: { fontSize: 18, fontWeight: 'bold' },
  subText: { fontSize: 12, color: '#777', marginTop: 4 },
  chevron: { fontSize: 20, color: '#999', fontWeight: 'bold' },
  
  // Carte Niveau
  levelCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  levelText: { fontWeight: 'bold', marginRight: 10 },
  progressBarContainer: { flex: 1, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, marginHorizontal: 10 },
  progressBarFill: { height: '100%', backgroundColor: '#555', borderRadius: 3 },
  pointsBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 1, borderColor: '#DDD' },
  pointsText: { fontSize: 12, fontWeight: 'bold' },

  // Carte Badges
  badgesCount: { fontSize: 12, color: '#777' },
  badgesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badgePlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#555' },

  // Carte Historique
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  historyText: { fontSize: 14, color: '#333' },
  historyPill: { backgroundColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  historyPillText: { fontSize: 12, color: '#555' },
  expandButton: { alignItems: 'center', marginTop: 5 },
  chevronDown: { fontSize: 16, color: '#999', fontWeight: 'bold' },

  // Boutons Actions
  primaryButton: { backgroundColor: '#333', padding: 16, borderRadius: 25, alignItems: 'center', marginBottom: 15 },
  primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { backgroundColor: '#333', padding: 16, borderRadius: 25, alignItems: 'center', marginBottom: 15 },
  secondaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  deleteButton: { alignItems: 'center', padding: 10 },
  deleteButtonText: { color: '#777', fontSize: 12 },
});