import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../constants/colors';
import type { Profil } from '../../services/profil.service';

type NiveauModalProps = {
  visible: boolean;
  onClose: () => void;
  profil: Profil;
};

// 📖 Modale de progression gamifiée : points cumulés, niveau actuel, barre de
// progression vers le niveau suivant, et rappel des façons de gagner des points.
// Ouverte depuis la pastille de points de <EnTete />.
export function NiveauModal({ visible, onClose, profil }: NiveauModalProps) {
  const { niveau } = profil;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.card} activeOpacity={1}>
          {/* 📖 Même rendu que la pastille de l'en-tête (aplat signature, étoile,
              même gap) : c'est l'élément qu'on vient de toucher, il doit se
              reconnaître au premier coup d'œil. */}
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeText}>{profil.points_cumules}</Text>
            <Ionicons name="star" size={13} color={Theme.accent.signatureTexte} />
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

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 📖 Voile d'arrière-plan : le design system ne définit pas de token pour ça,
  //    un noir translucide n'étant pas une couleur de marque mais un assombrissement.
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
    backgroundColor: Theme.fond.surface,
    alignItems: 'center',
  },

  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Theme.accent.signatureAplat,
  },
  pointsBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.accent.signatureTexte,
  },

  niveauLabel: {
    color: Theme.texte.secondaire,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  niveauNumero: {
    fontSize: 64,
    fontWeight: '700',
    color: Theme.texte.principal,
    textAlign: 'center',
  },
  niveauNom: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.action.primaire,
    textAlign: 'center',
    marginBottom: 4,
  },
  // 📖 Token de bordure plutôt qu'un gris texte à 30 % d'opacité : c'est
  //    exactement ce que `fond.bordure` désigne, et la valeur ne dépend plus
  //    d'une opacité réglée à l'œil.
  separateur: {
    height: 1,
    width: '100%',
    backgroundColor: Theme.fond.bordure,
  },
  progressionLabel: {
    fontSize: 14,
    color: Theme.texte.secondaire,
    textAlign: 'center',
    marginTop: 12,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.fond.bordure,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.action.primaire,
  },

  infoCard: {
    width: '100%',
    backgroundColor: Theme.fond.surfaceEnfoncee,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoTitre: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.texte.principal,
  },
  infoItem: {
    fontSize: 13,
    color: Theme.texte.secondaire,
    lineHeight: 24,
  },

  closeButton: {
    backgroundColor: Theme.action.primaire,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: Theme.action.primaireTexte,
    fontWeight: '700',
  },
});
