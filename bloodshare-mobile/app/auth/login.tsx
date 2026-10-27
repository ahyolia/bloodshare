import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bouton } from '../../components/ui/Bouton';
import { Champ } from '../../components/ui/Champ';
import { FondDecoratif, type Forme } from '../../components/ui/FondDecoratif';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { login } from '../../services/auth.service';
import { saveToken, saveUser } from '../../stores/auth.store';

// 📖 Aplats du Figma (Connexion). La pilule a été éloignée du formulaire : sur la
//    maquette, elle passait entre deux champs et gênait la lecture.
const FORMES: Forme[] = [
  { type: 'ellipse', couleur: 'rose', taille: 290, etirement: 1.4, rotation: -8, position: { top: 40, left: 74 } },
  { type: 'rond', couleur: 'lime', taille: 40, position: { top: 75, right: 18 } },
  { type: 'pilule', couleur: 'aubergine', taille: 44, position: { bottom: 110, left: 32 } },
];

// 📖 Même message que l'e-mail ou le mot de passe soit faux : dire lequel
//    aiderait quelqu'un à deviner quels e-mails ont un compte.
const MESSAGE_IDENTIFIANTS =
  "L'e-mail ou le mot de passe ne correspond pas. Vérifie-les puis réessaie.";

type Erreurs = {
  email?: string;
  motDePasse?: string;
  /** 401 : les deux champs en rouge, un seul message. */
  identifiants?: boolean;
  /** Erreur qui ne concerne aucun champ (serveur, réseau, compte suspendu…). */
  generale?: string;
};

export default function LoginScreen() {
  // 📖 `session=expiree` : posé par services/api.ts quand un appel renvoie 401 avec un
  //    token (expiré au bout de 90 jours, ou révoqué).
  const { session } = useLocalSearchParams<{ session?: string }>();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreurs, setErreurs] = useState<Erreurs>({});

  // 📖 Corriger un champ efface son erreur, et celles qui le concernaient aussi.
  const saisir = (champ: 'email' | 'motDePasse', setter: (v: string) => void) => (valeur: string) => {
    setter(valeur);
    if (erreurs[champ] || erreurs.identifiants || erreurs.generale) {
      setErreurs((e) => ({ ...e, [champ]: undefined, identifiants: false, generale: undefined }));
    }
  };

  const seConnecter = async () => {
    if (enCours) return;

    const locales: Erreurs = {
      email: email.trim() ? undefined : 'Saisis ton adresse e-mail.',
      motDePasse: motDePasse ? undefined : 'Saisis ton mot de passe.',
    };
    if (locales.email || locales.motDePasse) {
      setErreurs(locales);
      return;
    }

    setErreurs({});
    setEnCours(true);

    try {
      const { token, user } = await login(email.trim(), motDePasse);

      await saveToken(token);
      await saveUser(user);

      router.replace('/tabs');
    } catch (error: any) {
      // 📖 Jamais l'objet d'erreur entier : il contient la requête envoyée, donc l'email
      //    et le mot de passe en clair (audit RGPD). Le statut suffit pour déboguer.
      if (__DEV__) console.warn('[auth] connexion échouée :', error.response?.status ?? error.message);

      const statut = error.response?.status;
      if (statut === 401) {
        setErreurs({ identifiants: true });
      } else if (statut === 403) {
        // 📖 Compte suspendu : le message vient de l'API.
        setErreurs({
          generale:
            error.response.data?.message ?? "Ton compte est suspendu. Contacte l'association pour en savoir plus.",
        });
      } else if (statut === 429) {
        // 📖 Limite de tentatives du back (throttle:connexion).
        setErreurs({ generale: 'Trop de tentatives. Patiente une minute avant de réessayer.' });
      } else if (error.response) {
        setErreurs({ generale: 'Le serveur a rencontré un souci. Réessaie dans un instant.' });
      } else if (error.request) {
        setErreurs({ generale: 'Impossible de joindre le serveur. Vérifie ta connexion.' });
      } else {
        setErreurs({ generale: "Une erreur inattendue s'est produite." });
      }
    } finally {
      setEnCours(false);
    }
  };

  const couleurLien = enCours ? Theme.texte.desactive : Theme.action.primaire;

  return (
    <FondDecoratif formes={FORMES}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.contenu}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.entete}>
            <Text style={[Typo.titre1, styles.titre]} accessibilityRole="header">
              Bon retour !
            </Text>
            <Text style={[Typo.corps, styles.sousTitre]}>Retrouve tes cartes, tes badges et tes quiz.</Text>
          </View>

          <View style={styles.formulaire}>
            {session === 'expiree' && !erreurs.generale && (
              <View style={[styles.encadre, styles.encadreInfo]} accessibilityLiveRegion="polite">
                <Ionicons name="information-circle-outline" size={20} color={Theme.info.icone} />
                <Text style={[Typo.legendeForte, styles.encadreTexte]}>Ta session a expiré. Reconnecte-toi.</Text>
              </View>
            )}

            <Champ
              libelle="Adresse e-mail"
              placeholder="toi@exemple.nc"
              value={email}
              onChangeText={saisir('email', setEmail)}
              erreur={erreurs.email}
              invalide={erreurs.identifiants}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!enCours}
            />

            <Champ
              libelle="Mot de passe"
              placeholder="Ton mot de passe"
              motDePasse
              value={motDePasse}
              onChangeText={saisir('motDePasse', setMotDePasse)}
              erreur={erreurs.motDePasse ?? (erreurs.identifiants ? MESSAGE_IDENTIFIANTS : undefined)}
              autoComplete="current-password"
              editable={!enCours}
              onSubmitEditing={seConnecter}
              returnKeyType="go"
            />

            <Pressable
              onPress={() => router.push('/auth/mot-de-passe-oublie')}
              disabled={enCours}
              style={styles.lienOublie}
              accessibilityRole="link"
              accessibilityState={{ disabled: enCours }}
            >
              <Text style={[Typo.bouton, { color: couleurLien }]}>Mot de passe oublié ?</Text>
            </Pressable>

            {erreurs.generale ? (
              // 📖 Couleur + icône + texte, et annoncé dès son apparition.
              <View style={[styles.encadre, styles.encadreErreur]} accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle-outline" size={20} color={Theme.feedback.erreurTexte} />
                <Text style={[Typo.legendeForte, styles.erreurTexte]}>{erreurs.generale}</Text>
              </View>
            ) : null}

            <Bouton
              libelle="Se connecter"
              libelleChargement="Connexion…"
              onPress={seConnecter}
              chargement={enCours}
            />

            {enCours && (
              // 📖 Le serveur de démo peut mettre plusieurs secondes : on rassure,
              //    pour qu'on n'appuie pas à nouveau ni ne croie l'app plantée.
              <Text style={[Typo.legende, styles.attente]} accessibilityLiveRegion="polite">
                Ça peut prendre quelques secondes.
              </Text>
            )}
          </View>

          <View style={styles.pied}>
            <View style={styles.piedLigne}>
              <Text style={[Typo.corps, styles.piedTexte]}>Pas encore de compte ?</Text>
              <Pressable
                onPress={() => router.push('/auth/register')}
                disabled={enCours}
                style={styles.lienPied}
                accessibilityRole="link"
                accessibilityHint="Ouvre l'inscription"
                accessibilityState={{ disabled: enCours }}
              >
                <Text style={[Typo.bouton, { color: couleurLien }]}>Inscris-toi</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </FondDecoratif>
  );
}

const CIBLE_MIN = 48;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contenu: {
    flexGrow: 1,
    paddingHorizontal: Espace[6],
    // 📖 Valeurs du Figma : le titre tombe dans la grande ellipse rose.
    paddingTop: 150,
    paddingBottom: Espace[8],
  },
  entete: { gap: Espace[2] },
  titre: { color: Theme.texte.principal },
  sousTitre: { color: Theme.texte.secondaire },
  formulaire: { gap: Espace[4], paddingTop: 72 },
  lienOublie: {
    alignSelf: 'flex-end',
    minHeight: CIBLE_MIN,
    justifyContent: 'center',
    // 📖 La cible fait 48 px mais le texte doit rester près du champ (Figma).
    marginVertical: -Espace[2],
  },
  encadre: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espace[2],
    padding: Espace[3],
    borderRadius: Rayon.md,
  },
  encadreInfo: { backgroundColor: Theme.info.fond },
  encadreErreur: { backgroundColor: Theme.feedback.erreurSurface },
  encadreTexte: { flex: 1, color: Theme.texte.principal },
  erreurTexte: { flex: 1, color: Theme.feedback.erreurTexte },
  attente: { color: Theme.texte.secondaire, textAlign: 'center' },
  // 📖 flexGrow + justifyContent: 'flex-end' : collé en bas sur un grand écran,
  //    juste sous le formulaire sur un petit (ou quand le clavier est ouvert).
  pied: { flexGrow: 1, justifyContent: 'flex-end', paddingTop: Espace[8] },
  piedLigne: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: Espace[1],
  },
  piedTexte: { color: Theme.texte.principal },
  lienPied: { minHeight: CIBLE_MIN, justifyContent: 'center' },
});
