import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import type { Profil } from '../../services/profil.service';

type NiveauModalProps = {
  visible: boolean;
  onClose: () => void;
  profil: Profil;
};

// 📖 Modale de progression gamifiée : points cumulés, niveau actuel, barre de
// progression vers le niveau suivant, et rappel des façons de gagner des points.
// Ouverte depuis la pilule de points de <AppHeader />.
export function NiveauModal({ visible, onClose, profil }: NiveauModalProps) {
  const { niveau } = profil;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.card} activeOpacity={1}>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeText}>{profil.points_cumules} ★</Text>
          </View>

          <Text style={styles.niveauLabel}>Vous êtes au niveau</Text>
          <Text style={styles.niveauNumero}>{niveau.niveau}</Text>
          <Text style={styles.niveauNom}>{niveau.label}</Text>

          <View style={styles.separateur} />

          <Text style={styles.progressionLabel}>
            {niveau.points_prochain_niveau !== null
              ? `${profil.points_cumules}/${niveau.points_prochain_niveau}`
              : 'Niveau maximum atteint ! 🎉'}
          </Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${niveau.progression}%` }]} />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitre}>Comment gagner des points ?</Text>
            <Text style={styles.infoItem}>• Faire les quiz</Text>
            <Text style={styles.infoItem}>• Participer au défi du mois</Text>
            <Text style={styles.infoItem}>• Parrainer un ami</Text>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
    backgroundColor: Colors.blanc,
    alignItems: 'center',
  },
  pointsBadge: {
    backgroundColor: Colors.fondNeutre,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pointsBadgeText: {
    fontSize: 14,
    color: Colors.aubergine,
    fontWeight: '700',
  },
  niveauLabel: {
    color: Colors.grisMoyen,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  niveauNumero: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
  },
  niveauNom: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.corail[600],
    textAlign: 'center',
    marginBottom: 4,
  },
  separateur: {
    height: 1,
    width: '100%',
    backgroundColor: Colors.grisMoyen,
    opacity: 0.3,
  },
  progressionLabel: {
    fontSize: 14,
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 12,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.fondGris,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.corail[600],
  },
  infoCard: {
    width: '100%',
    backgroundColor: Colors.creme,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoTitre: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  infoItem: {
    fontSize: 13,
    color: Colors.grisMoyen,
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: Colors.aubergine,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.blanc,
    fontWeight: '700',
  },
});
