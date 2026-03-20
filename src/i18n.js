import useLanguageStore from './store/languageStore'

const translations = {
  en: {
    // Nav
    dashboard:     'Dashboard',
    nutrition:     'Nutrition',
    workouts:      'Workouts',
    feed:          'Feed',
    profile:       'Profile',
    notifications: 'Notifications',
    settings:      'Settings',
    admin:         'Admin',
    logout:        'Logout',

    // Settings page
    settings_title:          'SETTINGS',
    settings_avatar:         'Profile Photo',
    settings_avatar_sub:     'Click your photo to upload a new one.',
    settings_avatar_save:    'SAVE PHOTO',
    settings_profile:        'Profile',
    settings_firstname:      'First Name',
    settings_lastname:       'Last Name',
    settings_bio:            'Short Bio',
    settings_bio_placeholder:'A few words about you…',
    settings_save:           'SAVE CHANGES',
    settings_account:        'Account',
    settings_email:          'Email Address',
    settings_email_save:     'UPDATE EMAIL',
    settings_password:       'Change Password',
    settings_old_password:   'Current Password',
    settings_new_password:   'New Password',
    settings_confirm_password:'Confirm New Password',
    settings_password_save:  'UPDATE PASSWORD',
    settings_preferences:    'Preferences',
    settings_language:       'App Language',
    settings_lang_en:        'English',
    settings_lang_el:        'Ελληνικά',

    // Common
    saving:   'SAVING...',
    saved:    'Saved!',
    error:    'Something went wrong.',
    cancel:   'Cancel',
    passwords_no_match: 'Passwords do not match.',
  },

  el: {
    // Nav
    dashboard:     'Αρχική',
    nutrition:     'Διατροφή',
    workouts:      'Προπονήσεις',
    feed:          'Ροή',
    profile:       'Προφίλ',
    notifications: 'Ειδοποιήσεις',
    settings:      'Ρυθμίσεις',
    admin:         'Διαχείριση',
    logout:        'Αποσύνδεση',

    // Settings page
    settings_title:          'ΡΥΘΜΙΣΕΙΣ',
    settings_avatar:         'Φωτογραφία Προφίλ',
    settings_avatar_sub:     'Πάτησε τη φωτογραφία σου για να ανεβάσεις νέα.',
    settings_avatar_save:    'ΑΠΟΘΗΚΕΥΣΗ ΦΩΤΟ',
    settings_profile:        'Προφίλ',
    settings_firstname:      'Όνομα',
    settings_lastname:       'Επώνυμο',
    settings_bio:            'Σύντομη Περιγραφή',
    settings_bio_placeholder:'Λίγες λέξεις για σένα…',
    settings_save:           'ΑΠΟΘΗΚΕΥΣΗ',
    settings_account:        'Λογαριασμός',
    settings_email:          'Email',
    settings_email_save:     'ΕΝΗΜΕΡΩΣΗ EMAIL',
    settings_password:       'Αλλαγή Κωδικού',
    settings_old_password:   'Τρέχων Κωδικός',
    settings_new_password:   'Νέος Κωδικός',
    settings_confirm_password:'Επιβεβαίωση Νέου Κωδικού',
    settings_password_save:  'ΕΝΗΜΕΡΩΣΗ ΚΩΔΙΚΟΥ',
    settings_preferences:    'Προτιμήσεις',
    settings_language:       'Γλώσσα Εφαρμογής',
    settings_lang_en:        'English',
    settings_lang_el:        'Ελληνικά',

    // Common
    saving:   'ΑΠΟΘΗΚΕΥΣΗ...',
    saved:    'Αποθηκεύτηκε!',
    error:    'Κάτι πήγε στραβά.',
    cancel:   'Ακύρωση',
    passwords_no_match: 'Οι κωδικοί δεν ταιριάζουν.',
  },
}

export function useT() {
  const lang = useLanguageStore(s => s.lang)
  return (key) => translations[lang]?.[key] ?? translations.en[key] ?? key
}
