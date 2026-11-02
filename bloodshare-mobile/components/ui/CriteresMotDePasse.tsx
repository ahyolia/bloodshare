import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { criteresMotDePasse } from '../../utils/motDePasse';

/**
 * Critères du mot de passe cochés en direct, sous le champ (maquettes Inscription 1
 * et Nouveau mot de passe).
 *
 * 📖 Jamais la couleur seule : un critère validé change de COULEUR, d'ICÔNE
 *    (coche / rond vide) et de GRAISSE.
 * 📖 Pas d'annonce automatique à chaque frappe (ce serait un bavardage continu
 *    pour un lecteur d'écran) : chaque critère se lit avec son état.
 */
type Props = { motDePasse: string };

export function CriteresMotDePasse({ motDePasse }: Props) {
  return (
    <View style={styles.liste}>
      {criteresMotDePasse(motDePasse).map((critere) => (
        <View
          key={critere.id}
          style={styles.critere}
          accessible
          accessibilityLabel={`${critere.libelle} : ${critere.valide ? 'validé' : 'pas encore'}`}
        >
          <Ionicons
            name={critere.valide ? 'checkmark' : 'ellipse-outline'}
            size={critere.valide ? 16 : 12}
            color={critere.valide ? Theme.info.icone : Theme.texte.secondaire}
          />
          <Text
            style={[
              critere.valide ? Typo.legendeForte : Typo.legende,
              { color: critere.valide ? Theme.info.icone : Theme.texte.secondaire },
            ]}
          >
            {critere.libelle}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  liste: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Espace[3], rowGap: Espace[1] },
  critere: { flexDirection: 'row', alignItems: 'center', gap: Espace[1] },
});