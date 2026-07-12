export interface BeerGlassware {
  id: string;
  name: string;
  family: string;
  bowlPath: string;
  outlinePath: string;
  extraPath?: string;
  fillY: number;
}

const shapes: Record<string, Omit<BeerGlassware, 'id' | 'name' | 'family'>> = {
  pint: { bowlPath: 'M38 20H112L102 190H48Z', outlinePath: 'M35 16H115L105 194H45Z', fillY: 48 },
  nonic: {
    bowlPath: 'M38 20H112L108 60Q118 72 108 83L101 190H49L42 83Q32 72 42 60Z',
    outlinePath: 'M35 16H115L111 58Q123 72 111 86L104 194H46L39 86Q27 72 39 58Z',
    fillY: 48,
  },
  willy: {
    bowlPath: 'M42 20H108L104 55Q114 105 99 190H51Q36 105 46 55Z',
    outlinePath: 'M39 16H111L108 55Q118 105 102 194H48Q32 105 42 55Z',
    fillY: 48,
  },
  tulip: {
    bowlPath: 'M48 24Q75 12 102 24Q95 42 105 65Q114 112 88 148H62Q36 112 45 65Q55 42 48 24Z',
    outlinePath: 'M45 20Q75 8 105 20Q98 42 109 64Q119 114 91 152H59Q31 114 41 64Q52 42 45 20Z',
    extraPath: 'M68 151H82V202H108V212H42V202H68Z',
    fillY: 48,
  },
  teku: {
    bowlPath: 'M52 18Q75 14 98 18L96 50L108 112Q102 139 82 151H68Q48 139 42 112L54 50Z',
    outlinePath: 'M48 14Q75 9 102 14L100 51L112 113Q106 143 85 155H65Q44 143 38 113L50 51Z',
    extraPath: 'M69 154H81V202Q81 207 87 208H108V214H42V208H63Q69 207 69 202Z',
    fillY: 52,
  },
  snifter: {
    bowlPath: 'M51 28H99Q94 45 104 67Q111 119 84 148H66Q39 119 46 67Q56 45 51 28Z',
    outlinePath: 'M48 24H102Q97 45 108 66Q116 122 87 152H63Q34 122 42 66Q53 45 48 24Z',
    extraPath: 'M68 151H82V201H105V211H45V201H68Z',
    fillY: 48,
  },
  goblet: {
    bowlPath: 'M39 25H111Q108 118 84 148H66Q42 118 39 25Z',
    outlinePath: 'M35 20H115Q112 121 87 153H63Q38 121 35 20Z',
    extraPath: 'M67 152H83V199H110V212H40V199H67Z',
    fillY: 48,
  },
  weizen: {
    bowlPath: 'M49 17Q75 8 101 17L105 57Q96 85 100 182Q75 195 50 182Q54 85 45 57Z',
    outlinePath: 'M46 13Q75 3 104 13L109 58Q100 86 104 187Q75 202 46 187Q50 86 41 58Z',
    fillY: 45,
  },
  pilsner: {
    bowlPath: 'M48 18H102L91 166H59Z',
    outlinePath: 'M44 14H106L95 170H55Z',
    extraPath: 'M65 169H85V201H111V212H39V201H65Z',
    fillY: 45,
  },
  stange: { bowlPath: 'M57 14H93V190H57Z', outlinePath: 'M53 10H97V194H53Z', fillY: 42 },
  mug: {
    bowlPath: 'M37 28H99V188H37Z',
    outlinePath: 'M33 24H103V192H33Z',
    extraPath:
      'M103 48H119Q135 48 135 67V137Q135 158 103 158V144Q120 144 120 132V72Q120 62 103 62Z',
    fillY: 52,
  },
  dimple: {
    bowlPath: 'M35 32H102L96 186H41Z',
    outlinePath: 'M31 27H106L100 191H37Z',
    extraPath:
      'M106 50H121Q136 50 136 70V137Q136 158 100 158V144Q121 144 121 132V74Q121 64 106 64ZM47 65l13-10 13 10-5 17H52Zm30 0 13-10 10 12-7 15H80ZM45 97l15-10 13 11-6 18H50Zm31 1 14-11 9 13-7 16H80Z',
    fillY: 54,
  },
  ipa: {
    bowlPath:
      'M45 20H105Q99 43 107 67Q112 118 88 145H62Q38 118 43 67Q51 43 45 20ZM60 145H90L86 190H64Z',
    outlinePath:
      'M41 16H109Q103 43 111 66Q117 121 91 149H59Q33 121 39 66Q47 43 41 16ZM57 148H93L89 194H61Z',
    fillY: 46,
  },
  kwak: {
    bowlPath:
      'M48 18H102Q94 50 103 76Q109 122 84 145H66Q41 122 47 76Q56 50 48 18ZM68 145H82V203H68Z',
    outlinePath:
      'M44 14H106Q98 50 107 75Q114 125 87 149H63Q36 125 43 75Q52 50 44 14ZM65 148H85V207H65Z',
    extraPath: 'M39 204H111V214H39Z',
    fillY: 45,
  },
  boot: {
    bowlPath:
      'M55 18H94V133Q99 149 116 166Q126 179 116 192Q109 200 92 194L48 177Q38 173 41 160L55 124Z',
    outlinePath:
      'M51 14H98V132Q102 146 120 163Q135 178 121 196Q111 207 90 199L46 182Q32 177 37 158L51 123Z',
    fillY: 45,
  },
  horn: {
    bowlPath: 'M43 24H108Q101 86 84 130Q68 168 42 190Q65 151 54 111Z',
    outlinePath: 'M39 20H113Q105 88 88 133Q70 174 33 201Q59 156 50 113Z',
    fillY: 48,
  },
  yard: {
    bowlPath: 'M65 10H85V155Q104 165 101 188Q98 207 75 210Q52 207 49 188Q46 165 65 155Z',
    outlinePath: 'M61 6H89V152Q110 163 105 190Q101 214 75 217Q49 214 45 190Q40 163 61 152Z',
    fillY: 38,
  },
  gueuze: {
    bowlPath: 'M48 25H102L98 187H52Z',
    outlinePath: 'M44 21H106L102 192H48Z',
    extraPath: 'M48 150H102M49 164H101M50 178H100',
    fillY: 50,
  },
  bormioli: {
    bowlPath:
      'M51 25Q75 20 99 25L96 50Q109 73 108 108Q106 137 84 151H66Q44 137 42 108Q41 73 54 50Z',
    outlinePath:
      'M47 21Q75 15 103 21L100 51Q113 74 112 109Q110 141 87 155H63Q40 141 38 109Q37 74 50 51Z',
    extraPath: 'M68 154H82V200Q82 207 91 208H109V214H41V208H59Q68 207 68 200Z',
    fillY: 53,
  },
  sidra: {
    bowlPath: 'M43 28Q75 20 107 28L103 181Q75 191 47 181Z',
    outlinePath: 'M39 24Q75 14 111 24L107 186Q75 198 43 186Z',
    extraPath: 'M48 48Q75 40 102 48',
    fillY: 52,
  },
};

const entries: [string, string, string][] = [
  ['american-pint', 'Pinta Americana', 'pint'],
  ['nonic-pint', 'Pinta Nonic', 'nonic'],
  ['imperial-pint', 'Pinta Inglesa', 'nonic'],
  ['shaker-pint', 'Pinta Shaker', 'pint'],
  ['tulip', 'Tulipa (Tulip)', 'tulip'],
  ['teku', 'Teku', 'teku'],
  ['snifter', 'Snifter', 'snifter'],
  ['goblet', 'Goblet', 'goblet'],
  ['chalice', 'Chalice', 'goblet'],
  ['trappist-cup', 'Copa Trapense', 'goblet'],
  ['belgian-cup', 'Copa Belga', 'goblet'],
  ['weizen', 'Weizen (trigo alemán)', 'weizen'],
  ['weizen-pokal', 'Weizen Pokal', 'weizen'],
  ['willybecher', 'Willybecher', 'willy'],
  ['seidel', 'Seidel', 'mug'],
  ['stein', 'Stein (gres alemán)', 'mug'],
  ['bierkrug', 'Bierkrug con tapa', 'mug'],
  ['masskrug', 'Maßkrug (1 litro)', 'dimple'],
  ['stange', 'Stange', 'stange'],
  ['kolsch-stange', 'Kölsch Stange', 'stange'],
  ['altbier-becher', 'Altbier Becher', 'willy'],
  ['pilsner', 'Pilsner Glass', 'pilsner'],
  ['pokal', 'Pokal', 'pilsner'],
  ['flute', 'Flute', 'pilsner'],
  ['thistle', 'Thistle Glass', 'tulip'],
  ['ipa', 'IPA Glass', 'ipa'],
  ['spiegelau-ipa', 'Spiegelau IPA Glass', 'ipa'],
  ['willi-becher', 'Willi Becher', 'willy'],
  ['dimple-mug', 'Dimple Mug', 'dimple'],
  ['tankard', 'Tankard', 'mug'],
  ['mug', 'Mug', 'mug'],
  ['tubinger', 'Tübinger', 'willy'],
  ['tasting', 'Tasting Glass', 'teku'],
  ['rastal-harmony', 'Rastal Harmony', 'teku'],
  ['sensorik', 'Sensorik Glass', 'teku'],
  ['sommelier', 'Sommelier Glass', 'teku'],
  ['balloon', 'Balloon Glass', 'snifter'],
  ['stemmed-tulip', 'Stemmed Tulip', 'tulip'],
  ['footed-pilsner', 'Footed Pilsner', 'pilsner'],
  ['lambic-goblet', 'Copa Lambic', 'goblet'],
  ['gueuze', 'Vaso Gueuze', 'gueuze'],
  ['stout-snifter', 'Stout · Bormioli Snifter 53 cl', 'bormioli'],
  ['kwak', 'Vaso Kwak', 'kwak'],
  ['yard', 'Yard of Ale', 'yard'],
  ['boot', 'Bota (Bierstiefel)', 'boot'],
  ['steinzeug', 'Steinzeug Mug', 'mug'],
  ['ceramic-stein', 'Ceramic Stein', 'mug'],
  ['saison', 'Saison Glass', 'tulip'],
  ['abbey-goblet', 'Abbey Goblet', 'goblet'],
  ['trappist-goblet', 'Trappist Goblet', 'goblet'],
  ['berliner-bowl', 'Berliner Weisse Bowl', 'goblet'],
  ['cervoise-horn', 'Cervoise Horn', 'horn'],
  ['copper-mug', 'Copper Mug', 'mug'],
  ['asturian-cider', 'Vaso de Sidra Asturiana', 'sidra'],
];

export const BEER_GLASSWARE: BeerGlassware[] = entries.map(([id, name, family]) => ({
  id,
  name,
  family,
  ...shapes[family],
}));
