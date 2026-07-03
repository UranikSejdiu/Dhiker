import { ref, computed } from 'vue'
import { usePage, router } from '@inertiajs/vue3'

const languages = ['en', 'de', 'fr', 'sq']

const translations = {
  en: {
    appTitle: 'Dhikr Counter',
    subtitle: 'Remember Allah, find peace',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    confirmPassword: 'Confirm Password',
    signInBtn: 'Sign In',
    signUpBtn: 'Sign Up',
    continueGoogle: 'Continue with Google',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    resetDhikrConfirm: 'Reset this dhikr to 0?',
    myDhikrs: 'My Dhikrs',
    newBtn: '+ New',
    noDhikrsAdded: 'No dhikrs added yet',
    tapNewToCreate: "+ Tap '+ New' to create one",
    deleteConfirmTitle: 'Delete',
    deleteConfirmBody: 'Delete "{name}"? All counts will be lost.',
    cancel: 'Cancel',
    delete: 'Delete',
    settings: 'Settings',
    accountSection: 'ACCOUNT',
    aboutSection: 'ABOUT',
    version: 'Version',
    madeBy: 'Made by',
    signOut: 'Sign Out',
    appearanceSection: 'APPEARANCE',
    languageSection: 'LANGUAGE',
    editDhikr: 'Edit Dhikr',
    newDhikr: 'New Dhikr',
    nameLabel: 'NAME',
    namePlaceholder: 'e.g. SubhanAllah',
    limitLabel: 'DAILY LIMIT (optional)',
    limitPlaceholder: 'e.g. 100',
    saveBtn: 'Save',
    errorNoName: 'Please enter a name',
    errorLimitPositive: 'Limit must be a positive number',
    goalComplete: 'Daily Goal Complete!',
    noDhikrYet: 'No dhikr yet',
    addFirstDhikr: 'Add your first dhikr to begin counting',
    addDhikrBtn: '+ Add Dhikr',
    resetLabel: 'Reset',
    dhikrsLabel: 'Dhikrs',
    settingsLabel: 'Settings',
    limitReached: 'Daily limit reached',
    confirm: 'Confirm',
    today: 'Today',
    total: 'Total',
    refreshFromServer: 'Refresh from server',
    name: 'Name',
    email: 'Email',
    darkGold: 'Dark Gold',
    warmSand: 'Warm Sand',
    emerald: 'Emerald',
    saffron: 'Saffron',
    noor: 'Noor',
    tawheed: 'Tawheed',
    installApp: 'Install App',
  },
  de: {
    appTitle: 'Dhikr Zähler',
    subtitle: 'Gedenke Allahs, finde Frieden',
    emailLabel: 'E-Mail',
    passwordLabel: 'Passwort',
    confirmPassword: 'Passwort bestätigen',
    signInBtn: 'Anmelden',
    signUpBtn: 'Registrieren',
    continueGoogle: 'Weiter mit Google',
    noAccount: 'Kein Konto?',
    hasAccount: 'Bereits ein Konto?',
    resetDhikrConfirm: 'Diesen Dhikr auf 0 zurücksetzen?',
    myDhikrs: 'Meine Dhikrs',
    newBtn: '+ Neu',
    noDhikrsAdded: 'Noch keine Dhikrs hinzugefügt',
    tapNewToCreate: "Tippen Sie auf '+ Neu', um einen zu erstellen",
    deleteConfirmTitle: 'Löschen',
    deleteConfirmBody: '"{name}" löschen? Alle Zählungen gehen verloren.',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    settings: 'Einstellungen',
    accountSection: 'KONTO',
    aboutSection: 'ÜBER',
    version: 'Version',
    madeBy: 'Erstellt von',
    signOut: 'Abmelden',
    appearanceSection: 'ERSCHEINUNGSBILD',
    languageSection: 'SPRACHE',
    editDhikr: 'Dhikr bearbeiten',
    newDhikr: 'Neuer Dhikr',
    nameLabel: 'NAME',
    namePlaceholder: 'z.B. SubhanAllah',
    limitLabel: 'TAGESLIMIT (optional)',
    limitPlaceholder: 'z.B. 100',
    saveBtn: 'Speichern',
    errorNoName: 'Bitte geben Sie einen Namen ein',
    errorLimitPositive: 'Das Limit muss eine positive Zahl sein',
    goalComplete: 'Tagesziel erreicht!',
    noDhikrYet: 'Noch keine Dhikrs',
    addFirstDhikr: 'Fügen Sie Ihren ersten Dhikr hinzu',
    addDhikrBtn: '+ Dhikr hinzufügen',
    resetLabel: 'Zurücksetzen',
    dhikrsLabel: 'Dhikrs',
    settingsLabel: 'Einstellungen',
    limitReached: 'Tageslimit erreicht',
    confirm: 'Ja',
    today: 'Heute',
    total: 'Gesamt',
    refreshFromServer: 'Vom Server aktualisieren',
    name: 'Name',
    email: 'E-Mail',
    darkGold: 'Dark Gold',
    warmSand: 'Warm Sand',
    emerald: 'Emerald',
    saffron: 'Saffron',
    noor: 'Noor',
    tawheed: 'Tawheed',
    installApp: 'App installieren',
  },
  fr: {
    appTitle: 'Compteur Dhikr',
    subtitle: "Souvenez-vous d'Allah, trouvez la paix",
    emailLabel: 'Email',
    passwordLabel: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    signInBtn: 'Se connecter',
    signUpBtn: "S'inscrire",
    continueGoogle: 'Continuer avec Google',
    noAccount: 'Pas de compte?',
    hasAccount: 'Déjà un compte?',
    resetDhikrConfirm: 'Remettre ce dhikr à 0?',
    myDhikrs: 'Mes Dhikrs',
    newBtn: '+ Nouveau',
    noDhikrsAdded: 'Aucun dhikr ajouté',
    tapNewToCreate: "Appuyez sur '+ Nouveau' pour en créer un",
    deleteConfirmTitle: 'Supprimer',
    deleteConfirmBody: 'Supprimer "{name}"? Tous les comptes seront perdus.',
    cancel: 'Annuler',
    delete: 'Supprimer',
    settings: 'Paramètres',
    accountSection: 'COMPTE',
    aboutSection: 'À PROPOS',
    version: 'Version',
    madeBy: 'Créé par',
    signOut: 'Se déconnecter',
    appearanceSection: 'APPARENCE',
    languageSection: 'LANGUE',
    editDhikr: 'Modifier Dhikr',
    newDhikr: 'Nouveau Dhikr',
    nameLabel: 'NOM',
    namePlaceholder: 'ex: SubhanAllah',
    limitLabel: 'LIMITE QUOTIDIENNE (optionnel)',
    limitPlaceholder: 'ex: 100',
    saveBtn: 'Enregistrer',
    errorNoName: 'Veuillez entrer un nom',
    errorLimitPositive: 'La limite doit être un nombre positif',
    goalComplete: 'Objectif quotidien atteint!',
    noDhikrYet: 'Pas encore de Dhikrs',
    addFirstDhikr: 'Ajoutez votre premier dhikr pour commencer',
    addDhikrBtn: '+ Ajouter Dhikr',
    resetLabel: 'Réinitialiser',
    dhikrsLabel: 'Dhikrs',
    settingsLabel: 'Paramètres',
    limitReached: 'Limite quotidienne atteinte',
    confirm: 'Oui',
    today: "Aujourd'hui",
    total: 'Total',
    refreshFromServer: 'Actualiser depuis le serveur',
    name: 'Nom',
    email: 'Email',
    darkGold: 'Dark Gold',
    warmSand: 'Warm Sand',
    emerald: 'Emerald',
    saffron: 'Saffron',
    noor: 'Noor',
    tawheed: 'Tawheed',
    installApp: "Installer l'app",
  },
  sq: {
    appTitle: 'Dhikr Counter',
    subtitle: 'Përmend Allahun, gjej paqe',
    emailLabel: 'Email',
    passwordLabel: 'Fjalëkalimi',
    confirmPassword: 'Konfirmo fjalëkalimin',
    signInBtn: 'Hyr',
    signUpBtn: 'Regjistrohu',
    continueGoogle: 'Vazhdo me Google',
    noAccount: 'Nuk keni llogari?',
    hasAccount: 'Keni një llogari?',
    resetDhikrConfirm: 'Rikthe këtë dhikr në 0?',
    myDhikrs: 'Dhikret e mia',
    newBtn: '+ I ri',
    noDhikrsAdded: 'Asnjë dhikr nuk është shtuar',
    tapNewToCreate: "Kliko '+ I ri' për të krijuar një",
    deleteConfirmTitle: 'Fshi',
    deleteConfirmBody: 'Të fshihet "{name}"? Të gjitha numërimet do të humbasin.',
    cancel: 'Anulo',
    delete: 'Fshi',
    settings: 'Cilësimet',
    accountSection: 'LLOGARIA',
    aboutSection: 'RRETH NESH',
    version: 'Versioni',
    madeBy: 'Krijuar nga',
    signOut: 'Dil',
    appearanceSection: 'PAMJA',
    languageSection: 'GJUHA',
    editDhikr: 'Ndrysho Dhikr',
    newDhikr: 'Dhikr i ri',
    nameLabel: 'EMRI',
    namePlaceholder: 'psh. SubhanAllah',
    limitLabel: 'LIMITI DITOR (opsional)',
    limitPlaceholder: 'psh. 100',
    saveBtn: 'Ruaj',
    errorNoName: 'Ju lutem shkruani një emër',
    errorLimitPositive: 'Limiti duhet të jetë numër pozitiv',
    goalComplete: 'Qëllimi ditor u arrit!',
    noDhikrYet: 'Nuk ka Dhikr ende',
    addFirstDhikr: 'Shto dhikrin e parë për të filluar numërimin',
    addDhikrBtn: '+ Shto Dhikr',
    resetLabel: 'Rivendos',
    dhikrsLabel: 'Dhikret',
    settingsLabel: 'Cilësimet',
    limitReached: 'Limiti ditor u arrit',
    confirm: 'Po',
    today: 'Sot',
    total: 'Total',
    refreshFromServer: 'Rifresko nga serveri',
    name: 'Emri',
    email: 'Email',
    darkGold: 'Dark Gold',
    warmSand: 'Warm Sand',
    emerald: 'Emerald',
    saffron: 'Saffron',
    noor: 'Noor',
    tawheed: 'Tawheed',
    installApp: 'Instalo Aplikacionin',
  },
}

let initialized = false
const currentLanguage = ref('en')

function initializeLanguage() {
  if (initialized) return
  initialized = true

  const page = usePage()
  const serverLang = page.props.auth?.user?.language
  if (serverLang && languages.includes(serverLang)) {
    currentLanguage.value = serverLang
    return
  }

  const savedLang = localStorage.getItem('dhikr_language')
  const browserLang = navigator.language?.split('-')[0]
  currentLanguage.value = savedLang && languages.includes(savedLang)
    ? savedLang
    : browserLang && languages.includes(browserLang)
      ? browserLang
      : 'en'
}

export function useLanguage() {
  initializeLanguage()

  const t = (key, params) => {
    let text = translations[currentLanguage.value]?.[key] || translations['en'][key] || key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v))
      })
    }
    return text
  }

  const setLanguage = (lang) => {
    if (languages.includes(lang)) {
      currentLanguage.value = lang
      localStorage.setItem('dhikr_language', lang)
      router.patch(route('settings.update'), { language: lang }, {
        preserveScroll: true,
        preserveState: true,
      })
    }
  }

  return {
    language: currentLanguage,
    languages,
    t,
    setLanguage,
  }
}
