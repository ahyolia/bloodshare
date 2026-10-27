import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Palette } from '../../constants/palette';
import { Theme } from '../../constants/colors';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { Flottement } from '../ui/Flottement';
import { PastilleStock } from '../ui/PastilleStock';

/**
 * Illustrations des 3 écrans d'onboarding (maquettes Onboarding 1 à 3).
 *
 * 📖 Exemples visuels avec de fausses données : cachées aux lecteurs d'écran, le
 *    titre et le texte de l'écran portent le message.
 * 📖 Aucun texte provisoire des maquettes ([MASCOTTE], [CARTE…]) : la mascotte est
 *    remplacée par une goutte en attendant d'être livrée.
 */
function Decoratif({ children }: { children: ReactNode }) {
  return (
    <View style={styles.zone} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {children}
    </View>
  );
}

/** Écran 1 — le geste du don (mascotte à venir). */
export function IllustrationDon() {
  return (
    <Decoratif>
      <View style={styles.mascotte}>
        <Ionicons name="water" size={80} color={Theme.marque.principal} />
      </View>
    </Decoratif>
  );
}

/** Écran 2 — deux cartes-souvenirs et des étoiles. */
export function IllustrationCartes() {
  return (
    <Decoratif>
      <View style={styles.zoneCartes}>
        <CarteSouvenir mois="Septembre 2026" couleur={Palette.orange[100]} rotation={-8} />
        <CarteSouvenir mois="Octobre 2026" couleur={Palette.corail[500]} rotation={7} decalage />
        <Flottement style={styles.etoileHaut} rang={1}>
          <View style={styles.etoile}>
            <Ionicons name="star-outline" size={22} color={Theme.texte.principal} />
          </View>
        </Flottement>
        <Flottement style={styles.etoileBas} rang={3}>
          <View style={[styles.etoile, styles.etoilePetite]}>
            <Ionicons name="star" size={18} color={Theme.texte.principal} />
          </View>
        </Flottement>
      </View>
    </Decoratif>
  );
}

function CarteSouvenir({
  mois,
  couleur,
  rotation,
  decalage,
}: {
  mois: string;
  couleur: string;
  rotation: number;
  decalage?: boolean;
}) {
  return (
    <View style={[styles.carte, decalage && styles.carteDecalee, { transform: [{ rotate: `${rotation}deg` }] }]}>
      <View style={[styles.carteVisuel, { backgroundColor: couleur }]} />
      <Text style={[Typo.legendeForte, { color: Theme.texte.principal }]}>{mois}</Text>
    </View>
  );
}

/** Écran 3 — ce que l'app tient à jour : stocks, collectes, défi. */
export function IllustrationInfos() {
  return (
    <Decoratif>
      <View style={styles.infos}>
        <CarteInfo icone="water-outline" fondIcone={Theme.etat.bas.surface} rotation={-2} rang={0}>
          <View style={styles.ligneStock}>
            <Text style={[Typo.corpsFort, { color: Theme.texte.principal }]}>O−</Text>
            <PastilleStock niveau="bas" />
          </View>
          <Text style={[Typo.legende, { color: Theme.texte.principal }]}>
            Les réserves O− ont besoin de renfort cette semaine.
          </Text>
        </CarteInfo>
        <CarteInfo
          icone="calendar-outline"
          fondIcone={Theme.info.fond}
          couleurIcone={Theme.info.icone}
          rotation={1.5}
          decalage
          rang={1}
        >
          <Text style={[Typo.legendeForte, { color: Theme.texte.principal }]}>Collecte mobile · Nouméa centre</Text>
          <Text style={[Typo.legende, { color: Theme.texte.secondaire }]}>Place des Cocotiers</Text>
        </CarteInfo>
        <CarteInfo icone="heart-outline" fondIcone={Theme.etat.bon.surface} rotation={-1} rang={2}>
          <Text style={[Typo.legendeForte, { color: Theme.texte.principal }]}>Défi du mois : 212 dons sur 300</Text>
          <Text style={[Typo.legende, { color: Theme.texte.secondaire }]}>Merci à toutes et à tous !</Text>
        </CarteInfo>
      </View>
    </Decoratif>
  );
}

function CarteInfo({
  icone,
  fondIcone,
  couleurIcone = Theme.texte.principal,
  rotation,
  decalage,
  rang,
  children,
}: {
  icone: ComponentProps<typeof Ionicons>['name'];
  fondIcone: string;
  couleurIcone?: string;
  rotation: number;
  decalage?: boolean;
  /** Mouvement du flottement : un rang par bloc, pour qu'ils ne bougent pas pareil. */
  rang: number;
  children: ReactNode;
}) {
  return (
    // 📖 Intensité réduite : un gros bloc qui bouge beaucoup deviendrait difficile à lire.
    <Flottement rang={rang} intensite={0.4}>
      <View
        style={[styles.carteInfo, decalage && styles.carteInfoDecalee, { transform: [{ rotate: `${rotation}deg` }] }]}
      >
        <View style={[styles.pastille, { backgroundColor: fondIcone }]}>
          <Ionicons name={icone} size={20} color={couleurIcone} />
        </View>
        <View style={styles.carteInfoTextes}>{children}</View>
      </View>
    </Flottement>
  );
}

const CARTE_L = 118;

const styles = StyleSheet.create({
  zone: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mascotte: {
    width: 210,
    height: 210,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.surface,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Theme.formulaire.bordure,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneCartes: {
    width: 300,
    height: 300,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carte: {
    // 📖 Ombre : les cartes semblent posées au-dessus du fond (effet surélevé).
    ...Ombre.flottante,
    width: CARTE_L,
    height: CARTE_L * 1.35,
    padding: Espace[2],
    gap: Espace[2],
    borderRadius: Rayon.md,
    borderWidth: 2,
    borderColor: Theme.texte.principal,
    backgroundColor: Theme.fond.surface,
  },
  carteDecalee: { marginLeft: -Espace[6], marginTop: Espace[8] },
  carteVisuel: { flex: 1, borderRadius: Rayon.sm },
  etoile: {
    width: 44,
    height: 44,
    borderRadius: Rayon.plein,
    borderWidth: 2,
    borderColor: Theme.texte.principal,
    backgroundColor: Theme.decor.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etoileHaut: { position: 'absolute', top: 34, right: 20 },
  etoileBas: { position: 'absolute', bottom: 40, left: 72 },
  etoilePetite: { width: 34, height: 34 },
  infos: { alignSelf: 'stretch', gap: Espace[3] },
  carteInfo: {
    ...Ombre.flottante,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    padding: Espace[3],
    marginRight: Espace[8],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
  },
  carteInfoDecalee: { marginLeft: Espace[6], marginRight: 0 },
  carteInfoTextes: { flex: 1, gap: 2 },
  pastille: { width: 40, height: 40, borderRadius: Rayon.md, alignItems: 'center', justifyContent: 'center' },
  ligneStock: { flexDirection: 'row', alignItems: 'center', gap: Espace[2] },
});