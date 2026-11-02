import { LigneAction } from '../ui/LigneAction';

// 📖 Lien vers le site du Centre de don du sang, en pied de page (Don, fiches) : une
//    ligne à plat (LigneAction), qui ne s'ajoute pas aux blocs de la page.
export function LienSite({ onPress }: { onPress: () => void }) {
  return (
    <LigneAction
      titre="Le site du Don du Sang"
      sousTitre="Collectes, actualités et contacts"
      icone="globe-outline"
      externe
      onPress={onPress}
      accessibilityHint="Ouvre dondusang.nc"
    />
  );
}
