import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Bouton } from '../../components/ui/Bouton';
import { EnTeteSousPage } from '../../components/ui/EnTeteSousPage';
import { Groupe } from '../../components/ui/Groupe';
import { entreeSousPage } from '../../constants/animations';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

const EMAIL_CONTACT = 'aima.dondusang@outlook.fr';
const OBJET = 'Mot de passe oublié';

// 📖 Pas d'envoi de mail automatique en V1 : cet écran n'appelle pas l'API, il explique
//    la procédure manuelle. L'utilisateur écrit depuis l'adresse de son compte (même
//    procédure que dans les CGU), ce qui permet à l'admin de vérifier que la demande
//    vient bien du titulaire du compte. Le reset se fait dans le backoffice (action
//    "Réinitialiser le mot de passe" sur la fiche utilisateur), et l'admin répond avec
//    un mot de passe temporaire. À la connexion suivante, l'app impose d'en choisir un
//    nouveau (écran changer-mot-de-passe, mode forcé).
// 📖 Ouvert depuis la connexion ET depuis Paramètres (compte connecté) : le retour
//    revient donc à l'écran précédent, jamais de force sur la connexion.
const ETAPES = [
  {
    titre: "Écris-nous depuis l'adresse de ton compte",
    detail: "C'est ce qui nous permet de vérifier que la demande vient bien de toi.",
  },
  {
    titre: "L'équipe réinitialise ton mot de passe",
    detail: "Un membre de l'association s'en occupe à la main.",
  },
  {
    titre: 'Tu reçois un mot de passe temporaire',
    detail: 'En réponse à ton email.',
  },
  {
    titre: 'Connecte-toi et choisis-en un nouveau',
    detail: "L'app te le demande dès ta connexion avec le mot de passe temporaire.",
  },
];

export default function MotDePasseOublieScreen() {
  const ecrire = () =>
    // 📖 Échoue si aucune application mail n'est installée : on l'ignore, l'adresse
    //    reste affichée (et sélectionnable) pour être recopiée.
    Linking.openURL(`mailto:${EMAIL_CONTACT}?subject=${encodeURIComponent(OBJET)}`).catch(() => {});

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EnTeteSousPage titre="Mot de passe oublié" />

        <Animated.View entering={entreeSousPage}>
          <Text style={[Typo.corps, styles.intro]}>
            {"Pas encore de réinitialisation automatique : c'est l'équipe qui s'en charge. " +
              'Voici comment faire.'}
          </Text>

          <Groupe variante="info">
            <View style={styles.etapes}>
              {ETAPES.map((etape, i) => (
                <View key={etape.titre} style={styles.etape}>
                  <View style={styles.numero} accessibilityElementsHidden importantForAccessibility="no">
                    <Text style={[Typo.legendeForte, styles.numeroTexte]}>{i + 1}</Text>
                  </View>
                  <View style={styles.etapeTextes} accessible accessibilityLabel={`Étape ${i + 1} : ${etape.titre}. ${etape.detail}`}>
                    <Text style={[Typo.corpsFort, { color: Theme.texte.principal }]}>{etape.titre}</Text>
                    <Text style={[Typo.legende, { color: Theme.texte.secondaire }]}>{etape.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Groupe>

          <Text style={[Typo.legende, styles.adresseLibelle]}>{"Adresse de l'équipe"}</Text>
          <Text style={[Typo.corpsFort, styles.adresse]} selectable>
            {EMAIL_CONTACT}
          </Text>

          <Bouton
            libelle="Écrire à l'équipe"
            icone="mail-outline"
            onPress={ecrire}
            accessibilityHint="Ouvre ton application mail avec l'adresse de l'équipe"
            style={styles.bouton}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const NUMERO = 32;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: Espace[12],
  },
  intro: {
    color: Theme.texte.secondaire,
    marginBottom: Espace[6],
  },
  etapes: {
    padding: Espace[4],
    gap: Espace[4],
  },
  etape: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espace[3],
  },
  numero: {
    width: NUMERO,
    height: NUMERO,
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.info.fond,
  },
  numeroTexte: {
    color: Theme.info.icone,
  },
  etapeTextes: {
    flex: 1,
    gap: 2,
  },
  adresseLibelle: {
    color: Theme.texte.secondaire,
    textAlign: 'center',
    marginTop: Espace[8],
  },
  adresse: {
    color: Theme.texte.principal,
    textAlign: 'center',
    marginTop: Espace[1],
  },
  bouton: {
    marginTop: Espace[4],
  },
});
