/**
 * Site configuration
 */
export const siteConfig = {
  name: 'Priya LifePDF',
  description: "Ireland's pharma-grade private PDF toolkit — files never leave your device",
  url: 'https://pdf.priyalifescience.com',
  ogImage: '/images/og-image.png',
  links: {
    github: 'https://github.com/priyalifescience/priya-lifepdf',
    twitter: 'https://twitter.com/priyapdf',
  },
  creator: 'Priya Life Science',
  keywords: [
    'PDF tools',
    'PDF editor',
    'merge PDF',
    'split PDF',
    'compress PDF',
    'convert PDF',
    'free PDF tools',
    'online PDF editor',
    'browser-based PDF',
    'private PDF processing',
  ],
  // SEO-related settings
  seo: {
    titleTemplate: '%s | Priya LifePDF',
    defaultTitle: 'Priya LifePDF — Pharma Grade · Private · Ireland',
    twitterHandle: '@priyapdf',
    locale: 'en_US',
  },
};

/**
 * Navigation configuration
 */
export const navConfig = {
  mainNav: [
    { title: 'Home', href: '/' },
    { title: 'Tools', href: '/tools' },
    { title: 'About', href: '/about' },
    { title: 'FAQ', href: '/faq' },
  ],
  footerNav: [
    { title: 'Privacy', href: '/privacy' },
    { title: 'Terms', href: '/terms' },
    { title: 'Contact', href: '/contact' },
  ],
};
