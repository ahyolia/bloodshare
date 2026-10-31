import { CameraView } from 'expo-camera';
import { StyleProp, ViewStyle } from 'react-native';

export type QrScannerProps = {
  onScan: (contenu: string) => void;
  // 📖 false = on ignore les QR détectés (un scan est déjà en cours de traitement)
  actif: boolean;
  style?: StyleProp<ViewStyle>;
};

// Version iOS / Android : CameraView détecte les QR nativement.
export function QrScanner({ onScan, actif, style }: QrScannerProps) {
  return (
    <CameraView
      style={style}
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={actif ? ({ data }) => onScan(data) : undefined}
    />
  );
}