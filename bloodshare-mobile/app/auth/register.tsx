import React, { useState } from 'react';
import { 
  View, Text, TextInput, Pressable, StyleSheet, 
  ActivityIndicator, ScrollView, SafeAreaView 
} from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { saveToken, saveUser } from '../../stores/auth.store';

export default function RegisterScreen() {
  // --- ÉTATS DU MULTI-STEP ---
  const [step, setStep] = useState(1);

  // --- ÉTATS DU FORMULAIRE ---
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [sexe, setSexe] = useState<'homme' | 'femme' | null>(null);
  const [codeParrainage, setCodeParrainage] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [cguAccepted, setCguAccepted] = useState(false);
  const [statutDonneur, setStatutDonneur] = useState<'jamais_donne' | 'quelques_dons' | 'donneur_regulier' | null>(null);
  const [avatarId, setAvatarId] = useState<number | null>(null);

  // --- ÉTATS UI / ERREURS ---
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const BOGUS_AVATARS = [1, 2, 3, 4, 5];

  // --- NAVIGATION ENTRE LES ÉTAPES ---
  const nextStep = () => {
    setLocalError('');
    // Validation basique par étape avant de continuer
    if (step === 1) {
      if (!pseudo || !email || !password || !passwordConfirmation) return setLocalError('Tous les champs sont obligatoires.');
      if (password !== passwordConfirmation) return setLocalError('Les mots de passe ne correspondent pas.');
    }
    if (step === 2) {
      if (!sexe) return setLocalError('Veuillez renseigner votre sexe biologique.');
      if (!privacyAccepted || !cguAccepted) return setLocalError('Vous devez accepter les conditions pour continuer.');
    }
    if (step === 3) {
      if (!statutDonneur) return setLocalError('Veuillez sélectionner votre expérience de don.');
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setLocalError('');
    if (step > 1) setStep(step - 1);
  };

  // --- SOUMISSION FINALE (Étape 4) ---
  const handleRegister = async () => {
    setLocalError('');
    setFieldErrors({});

    if (!avatarId) {
      setLocalError('Veuillez choisir un avatar.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', {
        pseudo: pseudo.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        sexe,
        statut_donneur: statutDonneur,
        avatar_id: avatarId,
        code_parrainage: codeParrainage.trim() || undefined,
      });

      await saveToken(response.data.token);
      await saveUser(response.data.user);
      router.replace('/tabs');

    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      if (error.response?.status === 422) {
        setFieldErrors(error.response.data.errors);
        // Si l'erreur concerne un champ des étapes précédentes, on ramène l'utilisateur à l'étape 1
        setStep(1); 
        setLocalError('Certaines informations sont incorrectes ou déjà utilisées.');
      } else {
        setLocalError(error.response?.data?.message || "Une erreur inattendue s'est produite.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderFieldError = (field: string) => {
    return fieldErrors[field] ? <Text style={styles.errorText}>{fieldErrors[field][0]}</Text> : null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* EN-TÊTE : Bouton Retour + Progression */}
        <View style={styles.header}>
          {step > 1 ? (
            <Pressable onPress={prevStep} style={styles.backButton} accessibilityLabel="Retour" accessibilityRole="button">
              <Text style={styles.backArrow}>{'<'}</Text>
            </Pressable>
          ) : <View style={styles.backButtonPlaceholder} />}
          
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.progressDot, step === i && styles.progressDotActive]} />
            ))}
          </View>
        </View>

        {localError ? <Text style={styles.globalError}>{localError}</Text> : null}

        {/* --- ÉTAPE 1 : IDENTIFIANTS --- */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Vos identifiants</Text>
            
            <Text style={styles.label}>Pseudo</Text>
            <TextInput style={styles.input} placeholder="Votre pseudo" value={pseudo} onChangeText={setPseudo} autoCapitalize="none" />
            {renderFieldError('pseudo')}

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="vous@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            {renderFieldError('email')}

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput style={styles.input} placeholder="********" value={password} onChangeText={setPassword} secureTextEntry />
            <Text style={styles.hintText}>8 caractères minimum, avec au moins un chiffre et une majuscule.</Text>
            {renderFieldError('password')}

            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <TextInput style={styles.input} placeholder="********" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry />

            <Pressable style={styles.primaryBtn} onPress={nextStep}>
              <Text style={styles.primaryBtnText}>Continuer</Text>
            </Pressable>

            <Pressable onPress={() => router.replace('/auth/login')} style={styles.linkContainer}>
              <Text style={styles.linkText}>Vous avez compte ? <Text style={styles.linkTextBold}>Connectez-vous</Text></Text>
            </Pressable>
          </View>
        )}

        {/* --- ÉTAPE 2 : INFORMATIONS --- */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Vos informations</Text>

            <Text style={styles.label}>Sexe biologique</Text>
            <View style={styles.row}>
              {(['homme', 'femme'] as const).map((s) => (
                <Pressable key={s} style={[styles.choiceBtn, sexe === s && styles.choiceBtnActive]} onPress={() => setSexe(s)}>
                  <Text style={[styles.choiceText, sexe === s && styles.choiceTextActive]}>
                    {s === 'homme' ? '♂ Homme' : '♀ Femme'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.hintText}>Sert à calculer votre délai d'éligibilité entre deux dons. Confidentiel, jamais affiché.</Text>

            <Text style={styles.label}>Code de parrainage</Text>
            <TextInput style={styles.input} placeholder="Code de parrainage (optionnel)" value={codeParrainage} onChangeText={setCodeParrainage} autoCapitalize="characters" />

            {/* Cases à cocher (Mockées avec du texte pour simplifier) */}
            <View style={styles.checkboxContainer}>
              <Pressable style={styles.checkboxRow} onPress={() => setPrivacyAccepted(!privacyAccepted)} accessibilityRole="checkbox" accessibilityState={{ checked: privacyAccepted }}>
                <Text style={styles.checkboxIcon}>{privacyAccepted ? '☑' : '☐'}</Text>
                <Text style={styles.checkboxText}>J'accepte la <Text style={styles.linkTextUnderline}>Politiques de confidentialité</Text>.</Text>
              </Pressable>
              <Pressable style={styles.checkboxRow} onPress={() => setCguAccepted(!cguAccepted)} accessibilityRole="checkbox" accessibilityState={{ checked: cguAccepted }}>
                <Text style={styles.checkboxIcon}>{cguAccepted ? '☑' : '☐'}</Text>
                <Text style={styles.checkboxText}>J'accepte les <Text style={styles.linkTextUnderline}>Conditions générales d'utilisation</Text> (CGU).</Text>
              </Pressable>
            </View>

            <Pressable style={styles.primaryBtn} onPress={nextStep}>
              <Text style={styles.primaryBtnText}>Continuer</Text>
            </Pressable>
          </View>
        )}

        {/* --- ÉTAPE 3 : DONNEUR --- */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.titleCenter}>Avez-vous déjà donné votre sang ?</Text>

            <View style={styles.radioContainer}>
              {[
                { id: 'donneur_regulier', label: "Oui, je suis donneur régulier." },
                { id: 'quelques_dons', label: "J'ai déjà donné une ou deux fois." },
                { id: 'jamais_donne', label: "Non, jamais." }
              ].map((statut) => (
                <Pressable key={statut.id} style={styles.radioRow} onPress={() => setStatutDonneur(statut.id as any)} accessibilityRole="radio" accessibilityState={{ checked: statutDonneur === statut.id }}>
                  <Text style={styles.radioIcon}>{statutDonneur === statut.id ? '◉' : '○'}</Text>
                  <Text style={styles.radioText}>{statut.label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.primaryBtn} onPress={nextStep}>
              <Text style={styles.primaryBtnText}>Continuer</Text>
            </Pressable>
          </View>
        )}

        {/* --- ÉTAPE 4 : AVATAR --- */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.titleCenter}>Choisissez votre avatar ^-^</Text>

            <View style={styles.avatarGrid}>
              {BOGUS_AVATARS.map((id) => (
                <Pressable key={id} style={[styles.avatarCircle, avatarId === id && styles.avatarCircleActive]} onPress={() => setAvatarId(id)}>
                  {/* Placeholder pour les silhouettes de la maquette */}
                  <Text style={styles.avatarText}>{id}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={[styles.primaryBtn, isLoading && styles.btnDisabled]} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Créer mon compte</Text>}
            </Pressable>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9F6' },
  scrollContainer: { padding: 24, flexGrow: 1 },
  
  // Header & Navigation
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, position: 'relative', height: 44 },
  backButton: { padding: 8, position: 'absolute', left: 0, zIndex: 10 },
  backButtonPlaceholder: { width: 40 },
  backArrow: { fontSize: 24, color: '#333' },
  progressContainer: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  progressDotActive: { backgroundColor: '#333' },

  stepContent: { flex: 1, paddingTop: 16 },
  
  // Typographie
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 24 },
  titleCenter: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 32, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16, color: '#333' },
  hintText: { fontSize: 12, color: '#888', marginTop: 4, marginBottom: 8 },
  errorText: { color: '#FF3B30', fontSize: 12, marginTop: 4 },
  globalError: { backgroundColor: '#FFEBEE', color: '#D32F2F', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center', fontWeight: '500' },

  // Inputs
  input: { borderWidth: 1, borderColor: '#DDD', padding: 14, borderRadius: 24, fontSize: 16, backgroundColor: '#FFF' },
  
  // Boutons Sexe
  row: { flexDirection: 'row', gap: 12 },
  choiceBtn: { flex: 1, padding: 14, borderWidth: 1, borderColor: '#DDD', borderRadius: 24, alignItems: 'center', backgroundColor: '#FFF' },
  choiceBtnActive: { borderColor: '#333', backgroundColor: '#F0F0F0' },
  choiceText: { color: '#666', fontWeight: '500' },
  choiceTextActive: { color: '#333', fontWeight: 'bold' },

  // Checkboxes & Radios
  checkboxContainer: { marginTop: 24, gap: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkboxIcon: { fontSize: 20, color: '#333' },
  checkboxText: { fontSize: 14, color: '#555' },
  radioContainer: { gap: 16, marginTop: 16, marginBottom: 32 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radioIcon: { fontSize: 24, color: '#333' },
  radioText: { fontSize: 16, color: '#333' },

  // Avatars
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 40 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarCircleActive: { borderColor: '#333' },
  avatarText: { color: '#999', fontSize: 24 },

  // Bouton d'action principal
  primaryBtn: { backgroundColor: '#333', padding: 16, borderRadius: 24, alignItems: 'center', marginTop: 'auto', marginBottom: 16 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // Liens
  linkContainer: { alignItems: 'center', paddingBottom: 16 },
  linkText: { color: '#666', fontSize: 14 },
  linkTextBold: { fontWeight: 'bold', color: '#333' },
  linkTextUnderline: { textDecorationLine: 'underline' },
});