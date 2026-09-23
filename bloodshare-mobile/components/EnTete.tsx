import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/colors';
import type { Profil } from '../services/profil.service';
import { NiveauModal } from './layout/NiveauModal';

/* -------------------------------------------------------------------------
 * En-tête des écrans d'index d'onglets.
 *
 * Deux variantes pour un seul et même bloc d'actions (points + cloche) : seule
 * la place de l'avatar change. C'est volontairement un composant PRÉSENTATIONNEL
 * — il ne charge rien, l'écran lui passe ce qu'il affiche déjà. Un composant qui
 * irait chercher le profil lui-même déclencherait un appel réseau de plus par
 * écran, alors que les écrans concernés ont déjà la donnée en main.
 *
 * Il se pose en premier enfant du ScrollView de l'écran : il défile avec le
 * contenu et ne reste pas collé en haut.
 * ---------------------------------------------------------------------- */

type ProprietesCommunes = {
  /** 1re lettre du pseudo, pour l'avatar. */
  initiale: string;
  points: number;
  /**
   * Profil complet, dont la modale de progression a besoin (niveau, seuil du
   * palier suivant). Distinct de `points`, qui reste la valeur *affichée* : sur
   * l'écran Profil elle peut venir du cache local alors que le niveau, lui,
   * n'est connu qu'après GET /me. Tant que le profil n'est pas là, la pastille
   * reste inerte plutôt que d'ouvrir une modale vide.
   */
  profil?: Profil | null;
  notificationsNonLues: number;
  onPressNotifications: () => void;
};

// 📖 Union discriminée plutôt qu'un objet à champs optionnels : c'est la seule
//    façon d'obtenir du compilateur que `titre` soit exigé sur la variante
//    « page » et `pseudo` sur la variante « accueil ». Les points d'appel
//    s'écrivent exactement comme avec un type plat.
export type EnTeteProps = ProprietesCommunes &
  (
    | { variante: 'accueil'; pseudo: string; titre?: never }
    | { variante: 'page'; titre: string; pseudo?: never }
  );

/** Cible tactile minimale WCAG AA. Les visuels sont plus petits → hitSlop. */
const CIBLE_TACTILE_MIN = 48;

/**
 * De combien élargir la zone tactile d'un visuel de `taille` px pour atteindre
 * CIBLE_TACTILE_MIN. Calculé, pas réglé à l'œil : si un diamètre change
 * ci-dessous, la cible reste conforme sans qu'on y pense.
 */
const hitSlopPour = (taille: number) =>
  Math.max(0, Math.ceil((CIBLE_TACTILE_MIN - taille) / 2));

const AVATAR_ACCUEIL = 46;
const AVATAR_PAGE = 40;
const CLOCHE = 40;
const PASTILLE_HAUTEUR = 34;

export function EnTete(props: EnTeteProps) {
  const { initiale, points, profil, notificationsNonLues, onPressNotifications } = props;

  // 📖 L'état de la modale vit ici et non dans chaque écran : les cinq écrans
  //    d'onglets auraient sinon à déclarer le même useState et à rendre la même
  //    modale. Ouvrir une modale à partir de données reçues en props ne rompt
  //    pas le caractère présentationnel du composant — il ne charge toujours rien.
  const [modaleVisible, setModaleVisible] = useState(false);

  return (
    <View style={styles.enTete}>
      {props.variante === 'accueil' ? (
        <View style={styles.gauche}>
          <Avatar initiale={initiale} taille={AVATAR_ACCUEIL} />
          <View style={styles.salutation}>
            <Text style={styles.salut}>Salut,</Text>
            <Text style={styles.pseudo} numberOfLines={1} ellipsizeMode="tail">
              {props.pseudo}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.titre} numberOfLines={1} ellipsizeMode="tail">
          {props.titre}
        </Text>
      )}

      <View style={styles.droite}>
        <BlocActions
          points={points}
          pointsInertes={!profil}
          onPressPoints={() => setModaleVisible(true)}
          notificationsNonLues={notificationsNonLues}
          onPressNotifications={onPressNotifications}
        />
        {props.variante === 'page' && <Avatar initiale={initiale} taille={AVATAR_PAGE} />}
      </View>

      {profil && (
        <NiveauModal
          visible={modaleVisible}
          onClose={() => setModaleVisible(false)}
          profil={profil}
        />
      )}
    </View>
  );
}

/**
 * Pastille de points + cloche. Identique dans les deux variantes — c'est
 * précisément pour cela qu'il est extrait : l'avatar, lui, change de côté.
 */
function BlocActions({
  points,
  pointsInertes,
  onPressPoints,
  notificationsNonLues,
  onPressNotifications,
}: Pick<ProprietesCommunes, 'points' | 'notificationsNonLues' | 'onPressNotifications'> & {
  pointsInertes: boolean;
  onPressPoints: () => void;
}) {
  return (
    <>
      <Pressable
        style={styles.pastille}
        onPress={onPressPoints}
        disabled={pointsInertes}
        hitSlop={hitSlopPour(PASTILLE_HAUTEUR)}
        accessibilityRole="button"
        accessibilityLabel={`${points} points, voir ma progression`}
      >
        <Text style={styles.pastilleTexte}>{points}</Text>
        <Ionicons name="star" size={13} color={Theme.accent.signatureTexte} />
      </Pressable>

      <Pressable
        style={styles.cloche}
        onPress={onPressNotifications}
        hitSlop={hitSlopPour(CLOCHE)}
        accessibilityRole="button"
        // 📖 Le compte non lu passe par le libellé : le point coloré ne porte
        //    aucune information à lui seul (WCAG 1.4.1, « pas la couleur seule »).
        accessibilityLabel={
          notificationsNonLues > 0
            ? `Notifications, ${notificationsNonLues} non lues`
            : 'Notifications'
        }
      >
        <Ionicons name="notifications-outline" size={19} color={Theme.texte.principal} />
        {notificationsNonLues > 0 && (
          <View style={styles.pointNotification} pointerEvents="none" />
        )}
      </Pressable>
    </>
  );
}

function Avatar({ initiale, taille }: { initiale: string; taille: number }) {
  const router = useRouter();

  return (
    <Pressable
      style={[styles.avatar, { width: taille, height: taille, borderRadius: taille / 2 }]}
      onPress={() => router.push('/tabs/profil')}
      hitSlop={hitSlopPour(taille)}
      accessibilityRole="button"
      accessibilityLabel="Mon profil"
    >
      <Text style={[styles.avatarInitiale, { fontSize: Math.round(taille * 0.4) }]}>
        {initiale}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 📖 Aucun fond : l'en-tête se pose directement sur Theme.fond.page.
  enTete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  // 📖 flex + shrink : c'est ce qui permet au pseudo et au titre de se couper
  //    en « … » au lieu de pousser la pastille et la cloche hors de l'écran.
  gauche: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 12,
  },
  salutation: {
    marginLeft: 12,
    flexShrink: 1,
  },
  salut: {
    fontSize: 13,
    color: Theme.texte.secondaire,
  },
  pseudo: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.texte.principal,
  },
  titre: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.texte.principal,
    flexShrink: 1,
    marginRight: 12,
  },
  droite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  pastille: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: PASTILLE_HAUTEUR,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: Theme.accent.signatureAplat,
  },
  pastilleTexte: {
    color: Theme.accent.signatureTexte,
    fontSize: 14,
    fontWeight: '700',
  },

  cloche: {
    width: CLOCHE,
    height: CLOCHE,
    borderRadius: CLOCHE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  // 📖 Bordure couleur de page : elle détache le point du fond de la cloche
  //    sans ajouter de couleur au thème. Posé à l'intérieur du cercle (et non
  //    en débordement) pour ne pas être rogné sur Android.
  pointNotification: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: Theme.action.primaire,
    borderWidth: 2,
    borderColor: Theme.fond.page,
  },

  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.fond.pastilleCorail,
    borderWidth: 2,
    borderColor: Theme.action.primaire,
  },
  avatarInitiale: {
    color: Theme.action.primaire,
    fontWeight: '700',
  },
});
