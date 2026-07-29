import type { Locale } from "../i18n/ui";

/** Programme partner organisations shown in the footer's "Contact Us" column. */
export const partners: { name: Record<Locale, string>; email: string }[] = [
  {
    name: {
      en: "Provincial Secretariat for Economy and Tourism, Novi Sad",
      sr: "Pokrajinski sekretarijat za privredu i turizam, Novi Sad",
      hu: "Tartományi Gazdasági és Idegenforgalmi Titkárság, Újvidék",
    },
    email: "office.privreda@vojvodina.gov.rs",
  },
  {
    name: { en: "DKMT Szeged", sr: "DKMT Segedin", hu: "DKMT Szeged" },
    email: "office@dkmt.net",
  },
  {
    name: {
      en: "Faculty of Economics in Subotica (University of Novi Sad)",
      sr: "Ekonomski fakultet u Subotici (Univerzitet u Novom Sadu)",
      hu: "Szabadkai Közgazdaságtudományi Kar (Újvidéki Egyetem)",
    },
    email: "dekanat@ef.uns.ac.rs",
  },
];

export const siteContact = {
  email: "office@smartour.us",
  phone: "123-456-789",
  location: { en: "Subotica, Serbia", sr: "Subotica, Srbija", hu: "Szabadka, Szerbia" },
};

export const socialLinks = [
  { label: "Facebook", href: "https://facebook.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "YouTube", href: "https://youtube.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];
