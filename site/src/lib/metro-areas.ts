/**
 * City -> metro area clusters (Malaysia). An address lookup can only say where the internet provider's network is,
 * so neighbouring towns are routinely confused (a phone in Kulai can show up as Ulu Tiram, Senai or Johor Bahru).
 * The dashboard therefore groups nearby cities into one area ("Greater Johor Bahru") and shows the specific cities
 * underneath as approximate. Cities that are not in any area are shown as they are.
 *
 * Clusters are matched inside one state, by city name. Edit this list freely; nothing else depends on it.
 */
type Area = {
  state: string; // state / territory name as stored by the lookup (see normRegion in scripts/geoip-build.mjs)
  name: string; // label shown on the dashboard
  /** Every city of the state belongs to the area, except the ones in `except` */
  all?: boolean;
  except?: RegExp;
  /** Otherwise: the city name must match this */
  match?: RegExp;
};

const AREAS: Area[] = [
  {
    state: "Johor",
    name: "Greater Johor Bahru",
    match:
      /^(johor bahru|skudai|ulu tiram|ulu tebrau|kulai|senai|taman senai|pasir gudang|gelang patah|iskandar puteri|nusajaya|seelong|tebrau|masai|kota masai|pelentong|larkin|kampung larkin|mount austin|tampoi|setia tropika|taman universiti|mukim pulai|johor jaya|scientex park|seri alam|permas|taman permas jaya|kangkar|kampung kangkar|horizon hills|bukit indah|perling|kempas|forest city|bandar putra kulai|medini|taman nusa|ulu choh|plentong|pasir gudang baru|kampung pasir gudang|kota tinggi town|new kangkar village|kemajuan tanah ulu tebrau|bandar seri alam|taman daya|taman molek|stulang|danga bay)/i,
  },
  { state: "Kuala Lumpur", name: "Klang Valley", all: true },
  { state: "Putrajaya", name: "Klang Valley", all: true },
  {
    state: "Selangor",
    name: "Klang Valley",
    all: true,
    except: /^(kuala selangor|sabak bernam|tanjung karang|banting|kuala langat|sekinchan|jeram|kampong sijangkang|sijangkang|bukit beruntung|hulu selangor|kerling|kuala kubu|batang kali|ijok|bestari jaya|tanjong sepat|morib|telok panglima garang|jenjarom|kampung kuantan)/i,
  },
  { state: "Penang", name: "Greater Penang", all: true },
  {
    state: "Perak",
    name: "Ipoh area",
    match:
      /^(ipoh|bercham|menglembu|chemor|gopeng|batu gajah|tambun|jelapang|falim|canning|simpang pulai|kampung manjoi|tanjung rambutan|tanjong rambutan|meru|pusing|kinta|buntong|taman ipoh|ipoh garden|lahat|sungai siput)/i,
  },
  {
    state: "Sarawak",
    name: "Kuching area",
    match: /^(kuching|kota samarahan|samarahan|petra jaya|metro city|siburan|padawan|stutong|tabuan|batu kawa|kenyalang|matang|santubong|bako|bau)/i,
  },
  {
    state: "Sabah",
    name: "Kota Kinabalu area",
    match: /^(kota kinabalu|inanam|putatan|penampang|donggongon|likas|menggatal|kinarut|telipok|sepanggar|tanjung aru|luyang|alamesra|petagas)/i,
  },
  {
    state: "Melaka",
    name: "Melaka City area",
    match: /^(melaka|malacca|ayer keroh|kampung ayer keroh|bukit beruang|batu berendam|klebang|bukit baharu|kampung bukit baharu|ayer molek|kampung ayer molek|durian tunggal|bertam|telok mas|tanjung minyak|kampung tanjung minyak|bemban|sungai udang)/i,
  },
  {
    state: "Negeri Sembilan",
    name: "Seremban–Nilai area",
    match: /^(seremban|senawang|nilai|kampung baharu nilai|enstek|sri sendayan|bandar sri sendayan|mantin|rasah|taman seremban jaya|taman dusun setia|lenggeng|kampung baharu paroi|paroi|labu|rahang|lukut)/i,
  },
  {
    state: "Kedah",
    name: "Alor Setar area",
    match: /^(alor star|alor setar|kampung padang cina|pokok sena|anak bukit|kota kuala muda|derga|bandar alor setar|mergong|kuala kedah)/i,
  },
  {
    state: "Kelantan",
    name: "Kota Bharu area",
    match: /^(kota bharu|wakaf bharu|pengkalan chepa|ketereh|kubang kerian|kampung wakaf sku|badang|bachok|tumpat|kadok|kampong kadok)/i,
  },
  { state: "Terengganu", name: "Kuala Terengganu area", match: /^(kuala terengganu|kuala nerus|batu buruk|marang|kampung telaga papan)/i },
  { state: "Pahang", name: "Kuantan area", match: /^(kuantan|gambang|beserah|sungai lembing|bukit goh|kemajuan tanah bukit goh|pandan)/i },
];

/** The area a city belongs to inside its state, or null when it is not part of any area. */
export function areaOfCity(state: string | null, city: string | null): string | null {
  if (!state || !city) return null;
  const c = city.trim();
  for (const a of AREAS) {
    if (a.state !== state) continue;
    if (a.all) {
      if (a.except && a.except.test(c)) continue;
      return a.name;
    }
    if (a.match && a.match.test(c)) return a.name;
  }
  return null;
}
