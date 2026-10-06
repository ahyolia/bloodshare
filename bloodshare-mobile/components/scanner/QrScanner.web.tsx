import jsQR from 'jsqr';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import type { QrScannerProps } from './QrScanner';

// 📖 Version web : expo-camera affiche la caméra mais ne décode pas les QR dans un
//    navigateur. On récupère donc nous-mêmes le flux vidéo, on en copie une image
//    4 fois par seconde dans un <canvas> invisible, et jsQR cherche un QR dedans.
export function QrScanner({ onScan, actif, style }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 📖 Refs : l'analyse tourne dans un setInterval créé une seule fois. Sans refs,
  //    elle garderait les valeurs de `actif` et `onScan` du premier rendu.
  const onScanRef = useRef(onScan);
  const actifRef = useRef(actif);
  onScanRef.current = onScan;
  actifRef.current = actif;

  useEffect(() => {
    let flux: MediaStream | null = null;
    let minuteur: ReturnType<typeof setInterval> | null = null;
    let annule = false;

    const analyser = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!actifRef.current || !video || !canvas) return;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

      // 📖 On réduit l'image à 480 px de large : le décodage reste fiable et beaucoup
      //    plus rapide qu'en pleine résolution, ce qui ménage la batterie du téléphone.
      const largeur = 480;
      const hauteur = Math.round((video.videoHeight * largeur) / video.videoWidth);
      canvas.width = largeur;
      canvas.height = hauteur;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, largeur, hauteur);

      const image = ctx.getImageData(0, 0, largeur, hauteur);
      const code = jsQR(image.data, largeur, hauteur, { inversionAttempts: 'dontInvert' });
      if (code?.data) onScanRef.current(code.data);
    };

    navigator.mediaDevices
      // 📖 facingMode 'environment' = caméra arrière du téléphone
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        // L'écran a été quitté pendant la demande d'accès : on coupe tout de suite.
        if (annule) {
          stream.getTracks().forEach((piste) => piste.stop());
          return;
        }
        flux = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.play();
        minuteur = setInterval(analyser, 250);
      })
      .catch(() => {
        // Accès refusé : l'écran de scan affiche déjà les messages de permission.
      });

    // 📖 Nettoyage en quittant l'écran : on arrête l'analyse ET la caméra.
    //    Sans ça, le voyant de la caméra resterait allumé sur le téléphone.
    return () => {
      annule = true;
      if (minuteur) clearInterval(minuteur);
      flux?.getTracks().forEach((piste) => piste.stop());
    };
  }, []);

  return (
    <View style={style}>
      {/* 📖 playsInline : sans lui, Safari iOS ouvre la vidéo dans son lecteur plein écran
          au lieu de l'afficher dans la page. muted : requis pour la lecture automatique. */}
      <video
        ref={videoRef}
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </View>
  );
}