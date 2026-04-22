// constants/gazaLocations.ts

export interface Area {
  name: string;
  arabic_name: string;
  type: string; // 'city', 'camp', 'neighborhood', 'town', 'village', 'area'
}

export interface Governorate {
  name: string;
  arabic_name: string;
  areas: Area[];
}

export const GAZA_LOCATIONS: Governorate[] = [
  {
    "name": "North Gaza Governorate",
    "arabic_name": "محافظة شمال غزة",
    "areas": [
      {"name": "Jabalia", "arabic_name": "جباليا", "type": "city"},
      {"name": "Jabalia Camp", "arabic_name": "مخيم جباليا", "type": "camp"},
      {"name": "Beit Lahia", "arabic_name": "بيت لاهيا", "type": "city"},
      {"name": "Beit Hanoun", "arabic_name": "بيت حانون", "type": "city"},
      {"name": "Um al-Nasr", "arabic_name": "أم النصر", "type": "village"},
      {"name": "Bedouin Village", "arabic_name": "القرية البدوية", "type": "village"},
      {"name": "Al-Salateen", "arabic_name": "السلاطين", "type": "area"},
      {"name": "Izbat Abd Rabbo", "arabic_name": "عزبة عبد ربه", "type": "area"},
      {"name": "Al-Manshiya (Beit Hanoun)", "arabic_name": "المنشية", "type": "area"}
    ]
  },
  {
    "name": "Gaza Governorate",
    "arabic_name": "محافظة غزة",
    "areas": [
      {"name": "Gaza City", "arabic_name": "مدينة غزة", "type": "city"},
      {"name": "Al-Shati Camp", "arabic_name": "مخيم الشاطئ", "type": "camp"},
      {"name": "Shuja'iyya", "arabic_name": "الشجاعية", "type": "neighborhood"},
      {"name": "Al-Zeitoun", "arabic_name": "الزيتون", "type": "neighborhood"},
      {"name": "Al-Rimal", "arabic_name": "الرمال", "type": "neighborhood"},
      {"name": "Al-Tuffah", "arabic_name": "التفاح", "type": "neighborhood"},
      {"name": "Al-Daraj", "arabic_name": "الدرج", "type": "neighborhood"},
      {"name": "Sheikh Radwan", "arabic_name": "الشيخ رضوان", "type": "neighborhood"},
      {"name": "Tal al-Hawa", "arabic_name": "تل الهوى", "type": "neighborhood"},
      {"name": "Al-Sabra", "arabic_name": "الصبرة", "type": "neighborhood"},
      {"name": "Al-Nasr (Gaza)", "arabic_name": "النصر", "type": "neighborhood"},
      {"name": "Sheikh Ajleen", "arabic_name": "الشيخ عجلين", "type": "neighborhood"},
      {"name": "Al-Karama", "arabic_name": "الكرامة", "type": "neighborhood"},
      {"name": "Juhor ad-Dik", "arabic_name": "جحر الديك", "type": "area"},
      {"name": "Al-Zahra", "arabic_name": "الزهراء", "type": "area"}
    ]
  },
  {
    "name": "Deir al-Balah Governorate",
    "arabic_name": "محافظة دير البلح",
    "areas": [
      {"name": "Deir al-Balah", "arabic_name": "دير البلح", "type": "city"},
      {"name": "Nuseirat Camp", "arabic_name": "مخيم النصيرات", "type": "camp"},
      {"name": "Bureij Camp", "arabic_name": "مخيم البريج", "type": "camp"},
      {"name": "Maghazi Camp", "arabic_name": "مخيم المغازي", "type": "camp"},
      {"name": "Al-Zawayda", "arabic_name": "الزوايدة", "type": "town"},
      {"name": "Al-Masdar", "arabic_name": "المصدر", "type": "area"},
      {"name": "Al-Maghraqa", "arabic_name": "المغراقة", "type": "area"},
      {"name": "Wadi Gaza", "arabic_name": "وادي غزة", "type": "area"}
    ]
  },
  {
    "name": "Khan Yunis Governorate",
    "arabic_name": "محافظة خان يونس",
    "areas": [
      {"name": "Khan Yunis", "arabic_name": "خان يونس", "type": "city"},
      {"name": "Abasan al-Kabira", "arabic_name": "عبسان الكبيرة", "type": "town"},
      {"name": "Abasan al-Jadida", "arabic_name": "عبسان الجديدة", "type": "town"},
      {"name": "Bani Suheila", "arabic_name": "بني سهيلا", "type": "town"},
      {"name": "Khuza'a", "arabic_name": "خزاعة", "type": "town"},
      {"name": "Al-Qarara", "arabic_name": "القرارة", "type": "town"},
      {"name": "Jorat al-Lot", "arabic_name": "جورة اللوت", "type": "neighborhood"},
      {"name": "Al-Amal", "arabic_name": "حي الأمل", "type": "neighborhood"},
      {"name": "Al-Manara", "arabic_name": "حي المنارة", "type": "neighborhood"},
      {"name": "Al-Mawasi (Khan Yunis)", "arabic_name": "المواصي", "type": "area"}
    ]
  },
  {
    "name": "Rafah Governorate",
    "arabic_name": "محافظة رفح",
    "areas": [
      {"name": "Rafah", "arabic_name": "رفح", "type": "city"},
      {"name": "Rafah Camp", "arabic_name": "مخيم رفح", "type": "camp"},
      {"name": "Tel al-Sultan", "arabic_name": "تل السلطان", "type": "neighborhood"},
      {"name": "Al-Janina", "arabic_name": "الجنينة", "type": "neighborhood"},
      {"name": "Al-Shawka", "arabic_name": "الشوكة", "type": "town"},
      {"name": "Al-Salam (Rafah)", "arabic_name": "السلام", "type": "neighborhood"},
      {"name": "Al-Brazil", "arabic_name": "حي البرازيل", "type": "neighborhood"},
      {"name": "Al-Mawasi (Rafah)", "arabic_name": "المواصي", "type": "area"}
    ]
  }
];

// Helper functions
export const getGovernorates = (): Governorate[] => {
  return GAZA_LOCATIONS;
};

export const getAreasByGovernorate = (governorateName: string): Area[] => {
  const governorate = GAZA_LOCATIONS.find(g => g.name === governorateName || g.arabic_name === governorateName);
  return governorate ? governorate.areas : [];
};

export const getAllAreas = (): Area[] => {
  return GAZA_LOCATIONS.flatMap(g => g.areas);
};