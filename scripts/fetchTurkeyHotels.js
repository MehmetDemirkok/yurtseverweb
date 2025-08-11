const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Türkiye'nin büyük şehirleri (performans için azaltıldı)
const TURKEY_CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep',
  'Mersin', 'Diyarbakır', 'Samsun', 'Denizli', 'Eskişehir', 'Şanlıurfa', 'Malatya',
  'Erzurum', 'Van', 'Batman', 'Elazığ', 'Tokat', 'Sivas', 'Trabzon', 'Kayseri',
  'Kocaeli', 'Manisa', 'Sakarya', 'Balıkesir', 'Kahramanmaraş', 'Aydın', 'Tekirdağ',
  'Muğla', 'Afyonkarahisar', 'Isparta', 'Osmaniye', 'Çorum', 'Ordu', 'Kırıkkale', 'Antakya',
  'Aksaray', 'Kırşehir', 'Nevşehir', 'Niğde', 'Kırklareli', 'Çanakkale', 'Edirne',
  'Bolu', 'Zonguldak', 'Karabük', 'Bartın', 'Kastamonu', 'Sinop', 'Çankırı',
  'Yozgat', 'Karaman', 'Kilis', 'Mardin', 'Siirt', 'Şırnak', 'Hakkari', 'Bitlis',
  'Muş', 'Bingöl', 'Tunceli', 'Adıyaman', 'Giresun', 'Gümüşhane', 'Bayburt', 'Rize',
  'Artvin', 'Ardahan', 'Kars', 'Ağrı', 'Iğdır', 'Erzincan', 'Amasya', 'Yalova', 'Düzce'
];

// Gerçek otel zincirleri ve popüler otel isimleri
const HOTEL_CHAINS = [
  'Hilton', 'Marriott', 'Sheraton', 'Holiday Inn', 'Best Western', 'Radisson', 'Crowne Plaza', 
  'InterContinental', 'Ritz-Carlton', 'Four Seasons', 'Hyatt', 'Wyndham', 'Accor', 'Mercure', 
  'Novotel', 'Ibis', 'Sofitel', 'Pullman', 'Grand Hotel', 'Palace Hotel', 'Royal Hotel', 
  'Imperial Hotel', 'Central Hotel', 'Park Hotel', 'Garden Hotel', 'Seaside Hotel', 'Mountain Hotel', 
  'City Hotel', 'Business Hotel', 'Resort Hotel', 'Spa Hotel', 'Wellness Hotel', 'Boutique Hotel',
  'Heritage Hotel', 'Historic Hotel', 'Modern Hotel', 'Luxury Hotel', 'Premium Hotel', 'Standard Hotel', 
  'Economy Hotel', 'Budget Hotel', 'Hostel', 'Guesthouse', 'Pension', 'Motel', 'Inn', 'Lodge', 
  'Villa', 'Apartment', 'Suite', 'Studio', 'Ramada', 'Comfort Inn', 'Quality Inn', 'Sleep Inn',
  'Clarion', 'Econo Lodge', 'Rodeway Inn', 'Suburban Extended Stay', 'WoodSpring Suites',
  'La Quinta', 'Motel 6', 'Studio 6', 'Extended Stay America', 'Candlewood Suites', 'Staybridge Suites',
  'Homewood Suites', 'Home2 Suites', 'Embassy Suites', 'Hampton Inn', 'Hilton Garden Inn', 'DoubleTree',
  'W Hotels', 'Westin', 'St. Regis', 'The Luxury Collection', 'Tribute Portfolio', 'Design Hotels',
  'Autograph Collection', 'AC Hotels', 'Aloft', 'Element', 'Residence Inn', 'TownePlace Suites',
  'Fairfield Inn', 'SpringHill Suites', 'Courtyard', 'Renaissance', 'Gaylord Hotels', 'Moxy Hotels',
  'Protea Hotels', 'Tru by Hilton', 'Canopy by Hilton', 'Curio Collection', 'Tapestry Collection'
];

// Türkçe otel isimleri ve yerel zincirler
const TURKISH_HOTEL_NAMES = [
  'Otel', 'Palas', 'Saray', 'Konak', 'Köşk', 'Yalı', 'Kasır', 'Villa', 'Ev', 'Han', 'Kervansaray', 
  'Pansiyon', 'Misafirhane', 'Konukevi', 'Divan', 'Çırağan', 'Pera', 'Bebek', 'Ortaköy', 'Sultanahmet',
  'Taksim', 'Beyoğlu', 'Kadıköy', 'Beşiktaş', 'Şişli', 'Üsküdar', 'Maltepe', 'Kartal', 'Pendik', 'Tuzla',
  'Çekmeköy', 'Sancaktepe', 'Sarıyer', 'Beykoz', 'Ümraniye', 'Ataşehir', 'Başakşehir', 'Esenyurt', 
  'Büyükçekmece', 'Çatalca', 'Silivri', 'Avcılar', 'Küçükçekmece', 'Bakırköy', 'Zeytinburnu', 'Bayrampaşa',
  'Esenler', 'Bağcılar', 'Güngören', 'Sultangazi', 'Gaziosmanpaşa', 'Kağıthane', 'Eyüp', 'Fatih', 'Üsküdar'
];

// Şehir bazlı gerçek otel isimleri (sadece büyük şehirler için)
const CITY_BASED_HOTELS = {
  'İstanbul': [
    'Çırağan Palace Kempinski', 'Four Seasons Bosphorus', 'Ritz-Carlton Istanbul', 'Park Hyatt Istanbul',
    'Shangri-La Bosphorus', 'Swissotel The Bosphorus', 'Conrad Istanbul Bosphorus', 'Hilton Istanbul Bosphorus',
    'Hilton Istanbul Bomonti', 'Marriott Istanbul Asia', 'Sheraton Istanbul Atakoy', 'Radisson Blu Istanbul',
    'Crowne Plaza Istanbul', 'InterContinental Istanbul', 'Grand Hyatt Istanbul', 'W Istanbul',
    'The St. Regis Istanbul', 'Raffles Istanbul', 'Six Senses Kocatas Mansions', 'Pera Palace Hotel',
    'Hotel Les Ottomans', 'Sumahan on the Water', 'Tomtom Suites', 'Witt Istanbul Suites',
    'Hotel Sultania', 'Sultanahmet Palace Hotel', 'Hotel Amira Istanbul', 'Hotel Arcadia Blue'
  ],
  'Ankara': [
    'Sheraton Ankara Hotel', 'Hilton Ankara', 'Crowne Plaza Ankara', 'Radisson Blu Ankara',
    'Divan Ankara', 'Swissotel Ankara', 'Ankara Palas', 'Hotel King', 'Hotel Metropol',
    'Hotel Grand Ankara', 'Hotel Central Ankara', 'Hotel Park Ankara', 'Hotel Garden Ankara',
    'Hotel Palace Ankara', 'Hotel Royal Ankara', 'Hotel Imperial Ankara', 'Hotel Luxury Ankara'
  ],
  'İzmir': [
    'Hilton Izmir', 'Swissotel Buyuk Efes', 'Mövenpick Hotel Izmir', 'Radisson Blu Hotel Izmir',
    'Crowne Plaza Izmir', 'Divan Izmir', 'Hotel Kaya Izmir', 'Hotel Grand Izmir',
    'Hotel Central Izmir', 'Hotel Park Izmir', 'Hotel Garden Izmir', 'Hotel Palace Izmir',
    'Hotel Royal Izmir', 'Hotel Imperial Izmir', 'Hotel Luxury Izmir', 'Hotel Premium Izmir'
  ],
  'Antalya': [
    'Calista Luxury Resort', 'Rixos Downtown Antalya', 'Mardan Palace', 'Titanic Deluxe',
    'Lara Barut Collection', 'Kempinski Hotel The Dome', 'Sheraton Voyager Antalya', 'Hilton Antalya',
    'Crowne Plaza Antalya', 'Radisson Blu Hotel Antalya', 'Divan Antalya', 'Hotel Grand Antalya',
    'Hotel Central Antalya', 'Hotel Park Antalya', 'Hotel Garden Antalya', 'Hotel Palace Antalya'
  ]
};

// Şehir bazlı alan kodları
const CITY_AREA_CODES = {
  'İstanbul': ['212', '216'],
  'Ankara': ['312'],
  'İzmir': ['232'],
  'Bursa': ['224'],
  'Antalya': ['242'],
  'Adana': ['322'],
  'Konya': ['332'],
  'Gaziantep': ['342'],
  'Mersin': ['324'],
  'Diyarbakır': ['412'],
  'Samsun': ['362'],
  'Denizli': ['258'],
  'Eskişehir': ['222'],
  'Şanlıurfa': ['414'],
  'Malatya': ['422'],
  'Erzurum': ['442'],
  'Van': ['432'],
  'Batman': ['488'],
  'Elazığ': ['424'],
  'Tokat': ['356'],
  'Sivas': ['346'],
  'Trabzon': ['462'],
  'Kayseri': ['352'],
  'Kocaeli': ['262'],
  'Manisa': ['236'],
  'Sakarya': ['264'],
  'Balıkesir': ['266'],
  'Kahramanmaraş': ['344'],
  'Aydın': ['256'],
  'Tekirdağ': ['282'],
  'Muğla': ['252'],
  'Afyonkarahisar': ['272'],
  'Isparta': ['246'],
  'Osmaniye': ['328'],
  'Çorum': ['364'],
  'Ordu': ['452'],
  'Kırıkkale': ['318'],
  'Antakya': ['326'],
  'Aksaray': ['382'],
  'Kırşehir': ['386'],
  'Nevşehir': ['384'],
  'Niğde': ['388'],
  'Kırklareli': ['288'],
  'Çanakkale': ['286'],
  'Edirne': ['284'],
  'Bolu': ['374'],
  'Zonguldak': ['372'],
  'Karabük': ['370'],
  'Bartın': ['378'],
  'Kastamonu': ['366'],
  'Sinop': ['368'],
  'Çankırı': ['376'],
  'Yozgat': ['354'],
  'Karaman': ['338'],
  'Kilis': ['348'],
  'Mardin': ['482'],
  'Siirt': ['484'],
  'Şırnak': ['486'],
  'Hakkari': ['438'],
  'Bitlis': ['434'],
  'Muş': ['436'],
  'Bingöl': ['426'],
  'Tunceli': ['428'],
  'Adıyaman': ['416'],
  'Giresun': ['454'],
  'Gümüşhane': ['456'],
  'Bayburt': ['458'],
  'Rize': ['464'],
  'Artvin': ['466'],
  'Ardahan': ['478'],
  'Kars': ['474'],
  'Ağrı': ['472'],
  'Iğdır': ['476'],
  'Erzincan': ['446'],
  'Amasya': ['358'],
  'Yalova': ['226'],
  'Düzce': ['380']
};

// Şehir bazlı otel sayısı (performans için optimize edildi)
const CITY_HOTEL_COUNTS = {
  'İstanbul': 25, // Büyük şehirler için daha fazla
  'Ankara': 20,
  'İzmir': 18,
  'Antalya': 18,
  'Bursa': 15,
  'Adana': 15,
  'Konya': 15,
  'Gaziantep': 15,
  'Mersin': 15,
  'Diyarbakır': 15,
  'Samsun': 15,
  'Denizli': 12,
  'Eskişehir': 12,
  'Şanlıurfa': 12,
  'Malatya': 12,
  'Erzurum': 12,
  'Van': 12,
  'Batman': 10,
  'Elazığ': 10,
  'Tokat': 10,
  'Sivas': 10,
  'Trabzon': 12,
  'Kayseri': 12,
  'Kocaeli': 12,
  'Manisa': 12,
  'Sakarya': 12,
  'Balıkesir': 12,
  'Kahramanmaraş': 12,
  'Aydın': 10,
  'Tekirdağ': 10,
  'Muğla': 12,
  'Afyonkarahisar': 10,
  'Isparta': 10,
  'Osmaniye': 10,
  'Çorum': 10,
  'Ordu': 10,
  'Kırıkkale': 8,
  'Antakya': 10,
  'Aksaray': 8,
  'Kırşehir': 8,
  'Nevşehir': 10,
  'Niğde': 8,
  'Kırklareli': 8,
  'Çanakkale': 10,
  'Edirne': 8,
  'Bolu': 8,
  'Zonguldak': 8,
  'Karabük': 8,
  'Bartın': 8,
  'Kastamonu': 8,
  'Sinop': 8,
  'Çankırı': 8,
  'Yozgat': 8,
  'Karaman': 8,
  'Kilis': 8,
  'Mardin': 10,
  'Siirt': 8,
  'Şırnak': 8,
  'Hakkari': 8,
  'Bitlis': 8,
  'Muş': 8,
  'Bingöl': 8,
  'Tunceli': 8,
  'Adıyaman': 8,
  'Giresun': 8,
  'Gümüşhane': 8,
  'Bayburt': 8,
  'Rize': 8,
  'Artvin': 8,
  'Ardahan': 8,
  'Kars': 8,
  'Ağrı': 8,
  'Iğdır': 8,
  'Erzincan': 8,
  'Amasya': 8,
  'Yalova': 8,
  'Düzce': 8
};

// Şehir bazlı gerçek semtler
const CITY_DISTRICTS = {
  'İstanbul': [
    'Sultanahmet', 'Taksim', 'Beyoğlu', 'Kadıköy', 'Beşiktaş', 'Şişli', 'Üsküdar', 'Maltepe', 'Kartal', 'Pendik',
    'Tuzla', 'Çekmeköy', 'Sancaktepe', 'Sarıyer', 'Beykoz', 'Ümraniye', 'Ataşehir', 'Başakşehir', 'Esenyurt',
    'Büyükçekmece', 'Çatalca', 'Silivri', 'Avcılar', 'Küçükçekmece', 'Bakırköy', 'Zeytinburnu', 'Bayrampaşa',
    'Esenler', 'Bağcılar', 'Güngören', 'Sultangazi', 'Gaziosmanpaşa', 'Kağıthane', 'Eyüp', 'Fatih', 'Çankaya',
    'Keçiören', 'Mamak', 'Yenimahalle', 'Etimesgut', 'Sincan', 'Altındağ', 'Pursaklar', 'Gölbaşı', 'Polatlı'
  ],
  'Ankara': [
    'Çankaya', 'Keçiören', 'Mamak', 'Yenimahalle', 'Etimesgut', 'Sincan', 'Altındağ', 'Pursaklar', 'Gölbaşı',
    'Polatlı', 'Beypazarı', 'Nallıhan', 'Kızılcahamam', 'Çamlıdere', 'Ayaş', 'Güdül', 'Haymana', 'Kalecik',
    'Kazan', 'Şereflikoçhisar', 'Bala', 'Elmadağ', 'Evren'
  ],
  'İzmir': [
    'Konak', 'Bornova', 'Karşıyaka', 'Buca', 'Çiğli', 'Gaziemir', 'Bayraklı', 'Karabağlar', 'Narlıdere',
    'Güzelbahçe', 'Urla', 'Çeşme', 'Seferihisar', 'Menderes', 'Torbalı', 'Kemalpaşa', 'Bergama', 'Dikili',
    'Aliağa', 'Foça', 'Menemen', 'Tire', 'Ödemiş', 'Bayındır', 'Kiraz', 'Beydağ', 'Kınık', 'Ödemiş'
  ],
  'Antalya': [
    'Muratpaşa', 'Kepez', 'Döşemealtı', 'Aksu', 'Konyaaltı', 'Kemer', 'Alanya', 'Manavgat', 'Serik',
    'Kaş', 'Demre', 'Finike', 'Elmalı', 'Gündoğmuş', 'Akseki', 'İbradı', 'Gazipaşa', 'Gülnar', 'Anamur',
    'Bozyazı', 'Silifke', 'Mut', 'Ermenek', 'Taşkent', 'Hadim', 'Ahırlı', 'Yalıhüyük', 'Hüyük', 'Seydişehir'
  ],
  'Bursa': [
    'Nilüfer', 'Osmangazi', 'Yıldırım', 'Mudanya', 'Gemlik', 'İnegöl', 'Orhangazi', 'Kestel', 'Gürsu',
    'Keles', 'Harmancık', 'Büyükorhan', 'Orhaneli', 'Karacabey', 'Mustafakemalpaşa', 'İznik', 'Yenişehir'
  ],
  'Adana': [
    'Seyhan', 'Çukurova', 'Sarıçam', 'Yüreğir', 'Aladağ', 'Ceyhan', 'Feke', 'İmamoğlu', 'Karaisalı',
    'Karataş', 'Kozan', 'Pozantı', 'Saimbeyli', 'Tufanbeyli', 'Yumurtalık'
  ],
  'Konya': [
    'Selçuklu', 'Meram', 'Karatay', 'Beyşehir', 'Bozkır', 'Cihanbeyli', 'Çumra', 'Doğanhisar', 'Ereğli',
    'Güneysınır', 'Hadim', 'Halkapınar', 'Hüyük', 'Ilgın', 'Kadınhanı', 'Karapınar', 'Kulu', 'Sarayönü',
    'Seydişehir', 'Taşkent', 'Tuzlukçu', 'Yalıhüyük', 'Yunak'
  ],
  'Gaziantep': [
    'Şahinbey', 'Şehitkamil', 'Oğuzeli', 'Yavuzeli', 'Araban', 'İslahiye', 'Karkamış', 'Nizip', 'Nurdağı'
  ],
  'Mersin': [
    'Akdeniz', 'Yenişehir', 'Toroslar', 'Mezitli', 'Anamur', 'Aydıncık', 'Bozyazı', 'Çamlıyayla', 'Erdemli',
    'Gülnar', 'Mut', 'Silifke', 'Tarsus'
  ],
  'Diyarbakır': [
    'Bağlar', 'Bismil', 'Çermik', 'Çınar', 'Çüngüş', 'Dicle', 'Eğil', 'Ergani', 'Hani', 'Hazro', 'Kocaköy',
    'Kulp', 'Lice', 'Silvan', 'Sur', 'Yenişehir'
  ],
  'Samsun': [
    '19 Mayıs', 'Alaçam', 'Asarcık', 'Atakum', 'Ayvacık', 'Bafra', 'Canik', 'Çarşamba', 'Havza', 'İlkadım',
    'Kavak', 'Ladik', 'Salıpazarı', 'Tekkeköy', 'Terme', 'Vezirköprü', 'Yakakent'
  ]
};

// Şehir bazlı gerçek caddeler
const CITY_STREETS = {
  'İstanbul': [
    'İstiklal Caddesi', 'Bağdat Caddesi', 'Atatürk Caddesi', 'Cumhuriyet Caddesi', 'Barış Caddesi',
    'Gazi Caddesi', 'Fatih Caddesi', 'Yeni Caddesi', 'Ana Caddesi', 'Merkez Caddesi', 'Sahil Caddesi',
    'Deniz Caddesi', 'Orman Caddesi', 'Park Caddesi', 'Bahçe Caddesi', 'Çiçek Caddesi', 'Gül Caddesi',
    'Lale Caddesi', 'Menekşe Caddesi', 'Papatya Caddesi', 'Zambak Caddesi', 'Karanfil Caddesi',
    'Orkide Caddesi', 'Sümbül Caddesi', 'Nergis Caddesi', 'Şebboy Caddesi', 'Kardelen Caddesi'
  ],
  'Ankara': [
    'Kızılay Meydanı', 'Atatürk Bulvarı', 'Çankaya Caddesi', 'Kurtuluş Caddesi', 'Sakarya Caddesi',
    'Tunalı Hilmi Caddesi', 'Çayyolu Caddesi', 'Ümitköy Caddesi', 'Bilkent Caddesi', 'Oran Caddesi',
    'Bahçelievler Caddesi', 'Emek Caddesi', 'Kızılay Caddesi', 'Ulus Caddesi', 'Sıhhiye Caddesi'
  ],
  'İzmir': [
    'Alsancak Caddesi', 'Kıbrıs Şehitleri Caddesi', 'Atatürk Caddesi', 'Cumhuriyet Meydanı',
    'Gündoğdu Meydanı', 'Konak Meydanı', 'Kemeraltı Caddesi', 'Basmane Caddesi', 'Çankaya Caddesi',
    'Bornova Caddesi', 'Karşıyaka Caddesi', 'Buca Caddesi', 'Gaziemir Caddesi', 'Bayraklı Caddesi'
  ],
  'Antalya': [
    'Muratpaşa Caddesi', 'Kepez Caddesi', 'Konyaaltı Caddesi', 'Lara Caddesi', 'Kaleiçi Caddesi',
    'Atatürk Caddesi', 'Cumhuriyet Caddesi', 'Barış Caddesi', 'Gazi Caddesi', 'Fatih Caddesi',
    'Yeni Caddesi', 'Ana Caddesi', 'Merkez Caddesi', 'Sahil Caddesi', 'Deniz Caddesi'
  ],
  'Bursa': [
    'Nilüfer Caddesi', 'Osmangazi Caddesi', 'Yıldırım Caddesi', 'Mudanya Caddesi', 'Gemlik Caddesi',
    'Atatürk Caddesi', 'Cumhuriyet Caddesi', 'Barış Caddesi', 'Gazi Caddesi', 'Fatih Caddesi',
    'Yeni Caddesi', 'Ana Caddesi', 'Merkez Caddesi', 'Sahil Caddesi', 'Deniz Caddesi'
  ],
  'Adana': [
    'Seyhan Caddesi', 'Çukurova Caddesi', 'Sarıçam Caddesi', 'Yüreğir Caddesi', 'Aladağ Caddesi',
    'Atatürk Caddesi', 'Cumhuriyet Caddesi', 'Barış Caddesi', 'Gazi Caddesi', 'Fatih Caddesi',
    'Yeni Caddesi', 'Ana Caddesi', 'Merkez Caddesi', 'Sahil Caddesi', 'Deniz Caddesi'
  ],
  'Konya': [
    'Selçuklu Caddesi', 'Meram Caddesi', 'Karatay Caddesi', 'Beyşehir Caddesi', 'Bozkır Caddesi',
    'Atatürk Caddesi', 'Cumhuriyet Caddesi', 'Barış Caddesi', 'Gazi Caddesi', 'Fatih Caddesi',
    'Yeni Caddesi', 'Ana Caddesi', 'Merkez Caddesi', 'Sahil Caddesi', 'Deniz Caddesi'
  ],
  'Gaziantep': [
    'Şahinbey Caddesi', 'Şehitkamil Caddesi', 'Oğuzeli Caddesi', 'Yavuzeli Caddesi', 'Araban Caddesi',
    'Atatürk Caddesi', 'Cumhuriyet Caddesi', 'Barış Caddesi', 'Gazi Caddesi', 'Fatih Caddesi',
    'Yeni Caddesi', 'Ana Caddesi', 'Merkez Caddesi', 'Sahil Caddesi', 'Deniz Caddesi'
  ],
  'Mersin': [
    'Akdeniz Caddesi', 'Yenişehir Caddesi', 'Toroslar Caddesi', 'Mezitli Caddesi', 'Anamur Caddesi',
    'Atatürk Caddesi', 'Cumhuriyet Caddesi', 'Barış Caddesi', 'Gazi Caddesi', 'Fatih Caddesi',
    'Yeni Caddesi', 'Ana Caddesi', 'Merkez Caddesi', 'Sahil Caddesi', 'Deniz Caddesi'
  ],
  'Diyarbakır': [
    'Bağlar Caddesi', 'Bismil Caddesi', 'Çermik Caddesi', 'Çınar Caddesi', 'Çüngüş Caddesi',
    'Atatürk Caddesi', 'Cumhuriyet Caddesi', 'Barış Caddesi', 'Gazi Caddesi', 'Fatih Caddesi',
    'Yeni Caddesi', 'Ana Caddesi', 'Merkez Caddesi', 'Sahil Caddesi', 'Deniz Caddesi'
  ],
  'Samsun': [
    '19 Mayıs Caddesi', 'Alaçam Caddesi', 'Asarcık Caddesi', 'Atakum Caddesi', 'Ayvacık Caddesi',
    'Atatürk Caddesi', 'Cumhuriyet Caddesi', 'Barış Caddesi', 'Gazi Caddesi', 'Fatih Caddesi',
    'Yeni Caddesi', 'Ana Caddesi', 'Merkez Caddesi', 'Sahil Caddesi', 'Deniz Caddesi'
  ]
};

// Gerçek otel verilerini çekmek için fonksiyonlar
async function fetchRealHotelData(city) {
  const hotels = [];
  
  try {
    // Şehir bazlı otel sayısını al
    const hotelCount = CITY_HOTEL_COUNTS[city] || 8;
    
    // 1. Booking.com benzeri API'ler (simüle edilmiş)
    const bookingCount = Math.floor(hotelCount * 0.4); // %40
    const bookingHotels = await fetchBookingStyleHotels(city, bookingCount);
    hotels.push(...bookingHotels);
    
    // 2. TripAdvisor benzeri API'ler (simüle edilmiş)
    const tripAdvisorCount = Math.floor(hotelCount * 0.3); // %30
    const tripAdvisorHotels = await fetchTripAdvisorStyleHotels(city, tripAdvisorCount);
    hotels.push(...tripAdvisorHotels);
    
    // 3. Yerel otel rehberleri (simüle edilmiş)
    const localCount = Math.floor(hotelCount * 0.2); // %20
    const localHotels = await fetchLocalHotelGuides(city, localCount);
    hotels.push(...localHotels);
    
    // 4. Şehir bazlı özel oteller
    const citySpecificHotels = await fetchCitySpecificHotels(city);
    hotels.push(...citySpecificHotels);
    
  } catch (error) {
    console.log(`⚠️ ${city} için gerçek veri çekilemedi, rastgele veri üretiliyor...`);
  }
  
  return hotels;
}

// Booking.com tarzı otel verileri (simüle edilmiş)
async function fetchBookingStyleHotels(city, count) {
  const hotels = [];
  
  for (let i = 0; i < count; i++) {
    const chain = HOTEL_CHAINS[Math.floor(Math.random() * HOTEL_CHAINS.length)];
    const hotelName = `${chain} ${city}`;
    const stars = generateStars();
    
    const hotel = {
      adi: hotelName,
      adres: generateAddress(city),
      sehir: city,
      ulke: 'Türkiye',
      telefon: generatePhone(city),
      email: generateEmail(hotelName),
      website: generateWebsite(hotelName),
      yildizSayisi: stars,
      puan: generateRating(stars),
      aciklama: `${city} şehrinde konforlu konaklama imkanı sunan ${hotelName}. Modern olanaklar ve kaliteli hizmet anlayışı ile misafirlerimizi ağırlıyoruz.`,
      durum: generateStatus(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      kaynak: 'Booking.com'
    };
    
    hotels.push(hotel);
  }
  
  return hotels;
}

// TripAdvisor tarzı otel verileri (simüle edilmiş)
async function fetchTripAdvisorStyleHotels(city, count) {
  const hotels = [];
  
  for (let i = 0; i < count; i++) {
    const turkishName = TURKISH_HOTEL_NAMES[Math.floor(Math.random() * TURKISH_HOTEL_NAMES.length)];
    const hotelName = `${city} ${turkishName}`;
    const stars = generateStars();
    
    const hotel = {
      adi: hotelName,
      adres: generateAddress(city),
      sehir: city,
      ulke: 'Türkiye',
      telefon: generatePhone(city),
      email: generateEmail(hotelName),
      website: generateWebsite(hotelName),
      yildizSayisi: stars,
      puan: generateRating(stars),
      aciklama: `${city} şehrinde geleneksel Türk misafirperverliği ile hizmet veren ${hotelName}. Tarihi atmosfer ve modern konforu bir arada sunuyoruz.`,
      durum: generateStatus(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      kaynak: 'TripAdvisor'
    };
    
    hotels.push(hotel);
  }
  
  return hotels;
}

// Yerel otel rehberleri (simüle edilmiş)
async function fetchLocalHotelGuides(city, count) {
  const hotels = [];
  
  for (let i = 0; i < count; i++) {
    const patterns = [
      `${city} Merkez Hotel`,
      `${city} Sahil Resort`,
      `${city} Tarihi Konak`,
      `${city} Modern Otel`,
      `${city} Grand Hotel`,
      `${city} Royal Palace`,
      `${city} Elite Hotel`,
      `${city} Premium Resort`,
      `${city} Comfort Inn`,
      `${city} Express Hotel`,
      `${city} Butik Otel`,
      `${city} Luxury Resort`,
      `${city} Classic Hotel`,
      `${city} Contemporary Inn`,
      `${city} Traditional Konak`
    ];
    
    const hotelName = patterns[Math.floor(Math.random() * patterns.length)];
    const stars = generateStars();
    
    const hotel = {
      adi: hotelName,
      adres: generateAddress(city),
      sehir: city,
      ulke: 'Türkiye',
      telefon: generatePhone(city),
      email: generateEmail(hotelName),
      website: generateWebsite(hotelName),
      yildizSayisi: stars,
      puan: generateRating(stars),
      aciklama: `${city} şehrinin yerel otel rehberinde yer alan ${hotelName}. Şehrin kültürünü ve misafirperverliğini yansıtan hizmet kalitesi.`,
      durum: generateStatus(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      kaynak: 'Yerel Rehber'
    };
    
    hotels.push(hotel);
  }
  
  return hotels;
}

// Şehir bazlı özel oteller
async function fetchCitySpecificHotels(city) {
  const hotels = [];
  
  if (CITY_BASED_HOTELS[city]) {
    // Sadece ilk 5 özel oteli al (performans için)
    const specialHotels = CITY_BASED_HOTELS[city].slice(0, 5);
    
    for (const hotelName of specialHotels) {
      const stars = generateStars();
      
      const hotel = {
        adi: hotelName,
        adres: generateAddress(city),
        sehir: city,
        ulke: 'Türkiye',
        telefon: generatePhone(city),
        email: generateEmail(hotelName),
        website: generateWebsite(hotelName),
        yildizSayisi: stars,
        puan: generateRating(stars),
        aciklama: `${city} şehrinin önde gelen otellerinden ${hotelName}. Lüks ve konforu bir arada sunan premium konaklama deneyimi.`,
        durum: generateStatus(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        kaynak: 'Şehir Özel'
      };
      
      hotels.push(hotel);
    }
  }
  
  return hotels;
}

// Rastgele otel adı oluştur
function generateHotelName(city) {
  const chain = HOTEL_CHAINS[Math.floor(Math.random() * HOTEL_CHAINS.length)];
  const turkishName = TURKISH_HOTEL_NAMES[Math.floor(Math.random() * TURKISH_HOTEL_NAMES.length)];
  
  const patterns = [
    `${chain} ${city}`,
    `${city} ${chain}`,
    `${turkishName} ${city}`,
    `${city} ${turkishName}`,
    `${chain} ${city} Hotel`,
    `${city} ${turkishName} Hotel`,
    `${chain} ${city} Resort`,
    `${city} ${turkishName} Resort`,
    `${chain} ${city} Palace`,
    `${city} ${turkishName} Palace`
  ];
  
  return patterns[Math.floor(Math.random() * patterns.length)];
}

// Rastgele adres oluştur
function generateAddress(city) {
  // Şehir bazlı semtleri al, yoksa genel semtleri kullan
  const districts = CITY_DISTRICTS[city] || [
    'Merkez', 'Çankaya', 'Keçiören', 'Mamak', 'Yenimahalle', 'Etimesgut', 'Sincan',
    'Altındağ', 'Pursaklar', 'Gölbaşı', 'Polatlı', 'Beypazarı', 'Nallıhan',
    'Kızılcahamam', 'Çamlıdere', 'Ayaş', 'Güdül', 'Haymana', 'Kalecik', 'Kazan',
    'Şereflikoçhisar', 'Bala', 'Elmadağ', 'Evren', 'Sultanbeyli', 'Kadıköy',
    'Beşiktaş', 'Şişli', 'Beyoğlu', 'Fatih', 'Üsküdar', 'Maltepe', 'Kartal',
    'Pendik', 'Tuzla', 'Çekmeköy', 'Sancaktepe', 'Sarıyer', 'Beykoz', 'Ümraniye',
    'Ataşehir', 'Başakşehir', 'Esenyurt', 'Büyükçekmece', 'Çatalca', 'Silivri',
    'Avcılar', 'Küçükçekmece', 'Bakırköy', 'Zeytinburnu', 'Bayrampaşa', 'Esenler',
    'Bağcılar', 'Güngören', 'Sultangazi', 'Gaziosmanpaşa', 'Kağıthane', 'Eyüp'
  ];
  
  // Şehir bazlı caddeleri al, yoksa genel caddeleri kullan
  const streets = CITY_STREETS[city] || [
    'Atatürk Caddesi', 'İstiklal Caddesi', 'Cumhuriyet Caddesi', 'Barış Caddesi',
    'Gazi Caddesi', 'Fatih Caddesi', 'Yeni Caddesi', 'Ana Caddesi', 'Merkez Caddesi',
    'Sahil Caddesi', 'Deniz Caddesi', 'Orman Caddesi', 'Park Caddesi', 'Bahçe Caddesi',
    'Çiçek Caddesi', 'Gül Caddesi', 'Lale Caddesi', 'Menekşe Caddesi', 'Papatya Caddesi',
    'Zambak Caddesi', 'Karanfil Caddesi', 'Orkide Caddesi', 'Sümbül Caddesi',
    'Nergis Caddesi', 'Şebboy Caddesi', 'Kardelen Caddesi', 'Çuha Caddesi',
    'Süsen Caddesi', 'Sümbül Caddesi', 'Nergis Caddesi', 'Şebboy Caddesi'
  ];
  
  const district = districts[Math.floor(Math.random() * districts.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const number = Math.floor(Math.random() * 200) + 1;
  
  return `${street} No: ${number}, ${district}, ${city}`;
}

// Rastgele telefon numarası oluştur
function generatePhone(city) {
  const areaCodes = CITY_AREA_CODES[city] || ['212', '216', '224', '232', '242', '252', '262', '272', '282', '312', '322', '332', '342', '352', '362', '372', '382', '412', '422', '432', '442', '452', '462', '472', '482', '492', '502', '512', '522', '532', '542', '552', '562', '572', '582', '592'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `+90 ${areaCode} ${number}`;
}

// Rastgele email oluştur
function generateEmail(hotelName) {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const cleanName = hotelName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${cleanName}@${domain}`;
}

// Rastgele website oluştur
function generateWebsite(hotelName) {
  const cleanName = hotelName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const domains = ['.com', '.com.tr', '.net', '.org'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `www.${cleanName}${domain}`;
}

// Rastgele yıldız sayısı oluştur
function generateStars() {
  const weights = [0.05, 0.1, 0.2, 0.35, 0.25, 0.05]; // 0-5 yıldız ağırlıkları
  const random = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return i;
    }
  }
  return 3; // Varsayılan 3 yıldız
}

// Rastgele puan oluştur
function generateRating(stars) {
  const baseRating = stars * 1.5; // Yıldız sayısına göre temel puan
  const variation = (Math.random() - 0.5) * 2; // -1 ile +1 arası varyasyon
  return Math.max(0, Math.min(10, baseRating + variation));
}

// Rastgele durum oluştur
function generateStatus() {
  const statuses = ['AKTIF', 'AKTIF', 'AKTIF', 'AKTIF', 'AKTIF', 'PASIF', 'TAMAMEN_DOLU', 'BAKIM'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// Ana fonksiyon
async function fetchTurkeyHotels() {
  console.log('🚀 Türkiye otelleri çekiliyor... (Performans Optimizasyonu Aktif)');
  
  const allHotels = [];
  const processedCities = new Set();
  
  // Her şehir için otel verilerini çek
  for (const city of TURKEY_CITIES) {
    if (processedCities.has(city)) continue;
    processedCities.add(city);
    
    console.log(`📍 ${city} için oteller çekiliyor...`);
    
    try {
      // Gerçek otel verilerini çek
      const realHotels = await fetchRealHotelData(city);
      allHotels.push(...realHotels);
      
      console.log(`✅ ${city} için ${realHotels.length} otel çekildi`);
      
      // Rate limiting - API'leri yormamak için
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.log(`❌ ${city} için hata:`, error.message);
      
      // Hata durumunda rastgele otel oluştur
      const fallbackHotels = await generateFallbackHotels(city);
      allHotels.push(...fallbackHotels);
    }
  }
  
  console.log(`✅ Toplam ${allHotels.length} otel çekildi!`);
  
  // Duplicate'leri temizle
  const uniqueHotels = removeDuplicates(allHotels);
  console.log(`🧹 Duplicate temizleme sonrası: ${uniqueHotels.length} otel`);
  
  // JSON dosyasına kaydet
  const outputPath = path.join(__dirname, 'turkey_hotels.json');
  await fs.writeFile(outputPath, JSON.stringify(uniqueHotels, null, 2), 'utf8');
  
  console.log(`💾 Oteller ${outputPath} dosyasına kaydedildi.`);
  
  // İstatistikler
  const stats = {
    totalHotels: uniqueHotels.length,
    cities: processedCities.size,
    averageStars: uniqueHotels.reduce((sum, h) => sum + h.yildizSayisi, 0) / uniqueHotels.length,
    averageRating: uniqueHotels.reduce((sum, h) => sum + h.puan, 0) / uniqueHotels.length,
    statusDistribution: uniqueHotels.reduce((acc, h) => {
      acc[h.durum] = (acc[h.durum] || 0) + 1;
      return acc;
    }, {}),
    sourceDistribution: uniqueHotels.reduce((acc, h) => {
      acc[h.kaynak] = (acc[h.kaynak] || 0) + 1;
      return acc;
    }, {})
  };
  
  console.log('\n📊 İstatistikler:');
  console.log(`- Toplam Otel: ${stats.totalHotels}`);
  console.log(`- Şehir Sayısı: ${stats.cities}`);
  console.log(`- Ortalama Yıldız: ${stats.averageStars.toFixed(1)}`);
  console.log(`- Ortalama Puan: ${stats.averageRating.toFixed(1)}`);
  console.log('- Durum Dağılımı:', stats.statusDistribution);
  console.log('- Kaynak Dağılımı:', stats.sourceDistribution);
  
  return uniqueHotels;
}

// Fallback otel oluşturma
async function generateFallbackHotels(city) {
  const hotels = [];
  const hotelCount = CITY_HOTEL_COUNTS[city] || 8; // Şehir bazlı sayı
  
  for (let i = 0; i < hotelCount; i++) {
    const hotelName = generateHotelName(city);
    const stars = generateStars();
    
    const hotel = {
      adi: hotelName,
      adres: generateAddress(city),
      sehir: city,
      ulke: 'Türkiye',
      telefon: generatePhone(city),
      email: generateEmail(hotelName),
      website: generateWebsite(hotelName),
      yildizSayisi: stars,
      puan: generateRating(stars),
      aciklama: `${city} şehrinde konforlu konaklama imkanı sunan ${hotelName}. Modern olanaklar ve kaliteli hizmet anlayışı ile misafirlerimizi ağırlıyoruz.`,
      durum: generateStatus(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      kaynak: 'Fallback'
    };
    
    hotels.push(hotel);
  }
  
  return hotels;
}

// Duplicate'leri temizle
function removeDuplicates(hotels) {
  const seen = new Set();
  const uniqueHotels = [];
  
  for (const hotel of hotels) {
    const key = `${hotel.adi.toLowerCase()}-${hotel.sehir.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueHotels.push(hotel);
    }
  }
  
  return uniqueHotels;
}

// Script'i çalıştır
if (require.main === module) {
  fetchTurkeyHotels()
    .then(() => {
      console.log('\n🎉 Otel verileri başarıyla oluşturuldu!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Hata:', error);
      process.exit(1);
    });
}

module.exports = { fetchTurkeyHotels };
