import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { TAB_BAR_STYLE } from '../_layout';
import api from '../../../services/api';

export default function ScanScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  // 📖 On masque la tab bar tant que cet écran est affiché, et on la remet dès qu'on le quitte
  // → Pourquoi : le scanner occupe déjà tout l'écran (plein écran caméra) ; la tab bar flottante par-dessus gênerait le cadrage du QR Code et n'a aucune utilité pendant un scan
  // → Pourquoi useFocusEffect et pas useEffect : useEffect ne se redéclenche pas quand on REVIENT sur un écran déjà monté (navigation par Stack) ; useFocusEffect, lui, se relance à chaque fois que l'écran redevient actif, donc la tab bar est bien recachée si on revient sur /scan après être passé ailleurs
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

      // 📖 Fonction de nettoyage : exécutée quand l'écran perd le focus (on repart vers don, cartes...)
      // → Sans elle, la tab bar resterait cachée partout ailleurs dans l'app après un seul passage par le scanner
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
      };
    }, [navigation])
  );

  // 📖 permission = l'état actuel (accordée/refusée/inconnue), requestPermission = la fonction qui déclenche la popup système
  // → Pourquoi : useCameraPermissions ne fait QUE lire l'état ; c'est nous qui décidons quand appeler requestPermission (au clic, jamais au montage)
  const [permission, requestPermission] = useCameraPermissions();

  // 📖 scanned évite de traiter plusieurs fois le même QR Code tant qu'un scan est en cours de traitement
  // → Si on ne le faisait pas : la caméra détecte le même QR Code plusieurs fois par seconde et enverrait des dizaines de requêtes /scan pour un seul passage devant le lecteur
  const [scanned, setScanned] = useState(false);

  // 📖 loading = l'appel API /scan est en cours
  // → Pourquoi : donner un retour visuel immédiat à l'utilisateur pendant que le réseau répond, même si c'est rapide
  const [loading, setLoading] = useState(false);

  // 📖 Cas 1 : la permission n'a pas encore de valeur connue (ex: hook pas encore chargé)
  // → Pourquoi : permission peut être `null` très brièvement au tout premier rendu, avant que le hook n'ait fini de lire l'état système
  if (!permission) {
    return <View style={styles.screen} />;
  }

  // 📖 Cas 2 : la permission n'a jamais été accordée ET l'utilisateur peut encore la redemander (canAskAgain)
  // → Pourquoi : on distingue "jamais demandé" de "refusé définitivement" pour proposer la bonne action (popup vs réglages téléphone)
  if (!permission.granted && permission.canAskAgain) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={56} color={Colors.aubergine} />
        <Text style={styles.permissionText}>
          BloodShare a besoin d'accéder à votre caméra pour scanner le QR Code après votre don.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 📖 Cas 3 : la permission a été refusée ET l'utilisateur ne peut plus la redemander via la popup
  // → Pourquoi : iOS/Android n'affichent la popup qu'une seule fois ; après un refus, seul un passage par les Réglages du téléphone permet de changer d'avis
  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={56} color={Colors.aubergine} />
        <Text style={styles.permissionText}>
          Accès à la caméra refusé. Activez-le dans les paramètres de votre téléphone.
        </Text>
        <TouchableOpacity style={styles.outlineButton} onPress={() => Linking.openSettings()}>
          <Text style={styles.outlineButtonText}>Ouvrir les paramètres</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 📖 handleScan reçoit l'objet renvoyé par CameraView à chaque QR Code détecté ; on ne garde que son champ `data` (le contenu textuel du QR Code), renommé `token`
  // → Pourquoi setScanned(true) en premier : la caméra scanne plusieurs fois par seconde. Si on attendait la réponse de l'API pour bloquer les scans suivants, on enverrait déjà 3 ou 4 requêtes avant que la première ne réponde. En le mettant AVANT l'appel API, on bloque immédiatement les scans suivants dès la première détection.
  const handleScan = async ({ data: token }: { data: string }) => {
    setScanned(true);
    setLoading(true);

    try {
      // 📖 On envoie le contenu du QR Code (token) au backend, qui seul sait le valider (don réel, éligibilité, expiration...)
      // → Pourquoi côté serveur et pas côté app : un token de QR Code peut être falsifié ou rejoué ; toute la logique de validité doit rester côté backend, jamais faire confiance à ce que l'app "croit" avoir scanné
      const response = await api.post('/scan', { token });

      // 📖 response.data contient le corps JSON renvoyé par le backend (type, carte_obtenue, badges_debloques...)
      handleSuccess(response.data);
    } catch (error) {
      // 📖 error.response existe quand le serveur A répondu mais avec un code d'erreur (404, 422...)
      //    error.request existe quand la requête est partie mais qu'AUCUNE réponse n'est arrivée (pas de réseau, timeout, serveur injoignable)
      // → Pourquoi la distinction compte : un 422 veut dire "le serveur a compris ta demande mais elle est invalide" (ex: pas éligible), alors qu'une absence de réponse veut dire "problème réseau" — le message à afficher n'est pas le même
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // 📖 handleSuccess redirige vers l'écran résultat en transmettant les infos via les params de navigation
  // → Pourquoi router.push et pas router.replace : on garde l'écran de scan dans l'historique, pour que l'utilisateur puisse revenir en arrière si besoin (contrairement à resultat-scan → cartes/accueil, où on veut EMPÊCHER de revenir en arrière avec replace)
  // → Pourquoi passer par les params plutôt qu'un state global : le résultat du scan est une donnée éphémère, utile uniquement le temps d'afficher cet écran une fois ; pas besoin de la stocker durablement dans un store partagé par toute l'app
  const handleSuccess = (data: any) => {
    if (data.type === 'don' || data.type === 'evenement') {
      router.push({
        pathname: '/tabs/don/resultat-scan',
        params: {
          type: data.type,
          carte_id: data.carte_obtenue?.id,
          carte_titre: data.carte_obtenue?.titre,
          carte_categorie: data.carte_obtenue?.categorie,
          badges: JSON.stringify(data.badges_debloques ?? []),
        },
      });
    }
  };

  // 📖 handleError choisit le message à afficher selon le code HTTP renvoyé par le backend
  // → Pourquoi des codes HTTP différents plutôt qu'un code d'erreur générique : le code HTTP dit la NATURE du problème (422 = requête comprise mais refusée pour une raison métier, 404 = ressource introuvable) ; ça permet à l'app d'adapter le message sans avoir à parser un texte d'erreur fragile
  // → Le "?." (optional chaining) : error.response peut être `undefined` (erreur réseau, cf. ci-dessus) ; sans le "?", error.response.status planterait l'app avec un "Cannot read property 'status' of undefined"
  // → Pourquoi remettre scanned à false seulement en cas d'erreur : après un succès, on quitte l'écran de scan (navigation vers resultat-scan), donc pas besoin de le réautoriser ; après une erreur, l'utilisateur reste sur l'écran caméra et doit pouvoir rescanner
  const handleError = (error: any) => {
    const status = error.response?.status;

    if (status === 422) {
      Alert.alert(
        'Don non validé',
        `Vous n'êtes pas encore éligible.\nProchain don possible le : ${error.response.data.prochaine_eligibilite}`,
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    if (status === 404) {
      Alert.alert(
        'QR Code invalide',
        'Ce QR Code est invalide ou expiré.',
        [{ text: 'Réessayer', onPress: () => setScanned(false) }]
      );
      return;
    }

    // 📖 401 = l'utilisateur n'a pas de session valide (token absent, expiré, ou jamais connecté)
    // → Pourquoi un message dédié : l'intercepteur de services/api.ts efface le token stocké sur un 401, mais ne redirige pas vers l'écran de login automatiquement ; sans ce cas, l'utilisateur verrait "vérifiez votre connexion" et penserait à un problème réseau, alors que le vrai souci est qu'il doit se reconnecter
    if (status === 401) {
      Alert.alert(
        'Session expirée',
        'Vous devez être connecté pour valider un scan. Reconnectez-vous puis réessayez.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    // 📖 503 = le backend a bien compris et accepté la requête, mais ne peut pas la traiter (ex: carte du mois pas encore créée dans le backoffice)
    // → Pourquoi un message dédié : ce n'est ni un problème de connexion utilisateur, ni un token expiré, ni un QR invalide — c'est un souci de configuration côté backoffice, que l'utilisateur ne peut pas résoudre lui-même en réessayant
    if (status === 503) {
      Alert.alert(
        'Service temporairement indisponible',
        "La carte à débloquer n'est pas encore configurée. Réessayez plus tard.",
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    Alert.alert(
      'Erreur',
      'Une erreur est survenue. Vérifiez votre connexion et réessayez.',
      [{ text: 'OK', onPress: () => setScanned(false) }]
    );
  };

  return (
    <View style={styles.screen}>
      {/* 📖 CameraView est le composant caméra léger d'expo-camera, dédié à l'AFFICHAGE + à la détection de codes-barres/QR
          → Pourquoi lui et pas "la caméra complète" : on n'a besoin ni de prendre des photos, ni de filmer ; CameraView embarque juste ce qu'il faut (flux vidéo + scanner de codes), ce qui est plus léger et plus simple à configurer que l'API caméra complète */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        // 📖 barcodeTypes: ['qr'] filtre le scanner pour qu'il ne réagisse qu'aux QR Codes
        // → Pourquoi : CameraView sait aussi lire des codes-barres classiques (EAN, Code128...) ; sans ce filtre, l'app tenterait de scanner n'importe quel code visible, avec le risque de traiter un code-barres de supermarché comme un token BloodShare
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        // 📖 onBarcodeScanned n'appelle handleScan que si !scanned
        // → Pourquoi : CameraView continue d'appeler ce callback à chaque frame où un QR Code est détecté ; sans cette garde, on redéclencherait handleScan en boucle tant que le QR Code reste dans le cadre
        onBarcodeScanned={!scanned ? handleScan : undefined}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>

        <View style={styles.centerArea} pointerEvents="none">
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Placez le QR Code dans le cadre</Text>
        </View>
      </View>

      {/* 📖 Overlay affiché uniquement si loading est vrai, par-dessus tout le reste
          → Pourquoi un loading même pour un appel rapide : sans lui, l'utilisateur voit l'écran figé pendant les quelques centaines de ms de l'appel réseau et peut croire que l'app a planté, ou re-scanner par réflexe. ActivityIndicator est un composant NATIF (spinner iOS/Android natif, pas une animation React) : c'est plus fluide et plus reconnaissable pour l'utilisateur qu'un composant custom */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.blanc} size="large" />
          <Text style={styles.loadingText}>Validation en cours...</Text>
        </View>
      )}
    </View>
  );
}

const FRAME_SIZE = 250;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: Colors.creme,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  permissionText: {
    color: Colors.aubergine,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
  primaryButton: {
    backgroundColor: Colors.corail[500],
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: Colors.blanc,
    fontWeight: '700',
    fontSize: 14,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: Colors.aubergine,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  outlineButtonText: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  backButton: {
    marginTop: 54,
    marginLeft: 18,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60,
    gap: 20,
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.blanc,
  },
  scanHint: {
    color: Colors.blanc,
    fontSize: 16,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.blanc,
    marginTop: 12,
  },
});
