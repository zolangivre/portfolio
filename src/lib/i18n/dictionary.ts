import type { Locale } from '../locale'

export interface Dictionary {
  nav: {
    primaryLabel: string
    footerLabel: string
    languageSwitcherLabel: string
    themeToggleLabel: string
    lightLabel: string
    darkLabel: string
    skipToContent: string
    journalLabel: string
    openMenuLabel: string
    closeMenuLabel: string
    sectionIndexLabel: string
  }
  about: {
    eyebrow: string
  }
  projects: {
    eyebrow: string
    title: string
    description: string
    emptyState: string
    featuredBadge: string
    githubLabel: string
    liveLabel: string
    technologiesAriaLabelSuffix: string
    fallbackDescription: string
    statusLabels: Record<string, string>
    viewDetailsLabel: string
    galleryAriaLabelSuffix: string
    backLabel: string
  }
  experience: {
    eyebrow: string
    title: string
    description: string
    emptyState: string
    present: string
    fallbackCompany: string
  }
  education: {
    eyebrow: string
    title: string
    description: string
    emptyState: string
    fallbackSchool: string
  }
  skills: {
    eyebrow: string
    title: string
    description: string
    emptyState: string
    visitAriaLabelSuffix: string
  }
  testimonials: {
    eyebrow: string
    title: string
    description: string
    emptyState: string
  }
  contact: {
    eyebrow: string
    reachOut: string
    formNameLabel: string
    formEmailLabel: string
    formMessageLabel: string
    formNamePlaceholder: string
    formEmailPlaceholder: string
    formMessagePlaceholder: string
    submitLabel: string
    sendingLabel: string
    errors: Record<string, string>
  }
  journal: {
    eyebrow: string
    title: string
    description: string
    emptyState: string
    featuredBadge: string
    allCategoriesLabel: string
    readMoreLabel: string
    backLabel: string
  }
  lightbox: {
    closeLabel: string
    nextLabel: string
    previousLabel: string
  }
}

const dictionaries: Record<Locale, Dictionary> = {
  fr: {
    nav: {
      primaryLabel: 'Navigation principale',
      footerLabel: 'Navigation de pied de page',
      languageSwitcherLabel: 'Changer de langue',
      themeToggleLabel: 'Changer de thème',
      lightLabel: 'Thème clair',
      darkLabel: 'Thème sombre',
      skipToContent: 'Aller au contenu principal',
      journalLabel: 'Journal',
      openMenuLabel: 'Ouvrir le menu',
      closeMenuLabel: 'Fermer le menu',
      sectionIndexLabel: 'Index des sections',
    },
    about: {
      eyebrow: 'À propos',
    },
    projects: {
      eyebrow: 'Travaux sélectionnés',
      title: 'Projets',
      description:
        'Une sélection de projets pensés pour des produits rapides, une expérience utilisateur soignée et une ingénierie fiable.',
      emptyState: 'Aucun projet mis en avant n’a encore été publié.',
      featuredBadge: 'À la une',
      githubLabel: 'GitHub ↗',
      liveLabel: 'Voir le site ↗',
      technologiesAriaLabelSuffix: 'technologies',
      fallbackDescription: 'Un projet récent construit avec des choix produit et techniques réfléchis.',
      statusLabels: {
        live: 'En ligne',
        'in-progress': 'En cours',
        archived: 'Archivé',
      },
      viewDetailsLabel: 'Voir le projet →',
      galleryAriaLabelSuffix: 'galerie',
      backLabel: '← Retour aux projets',
    },
    experience: {
      eyebrow: 'Parcours',
      title: 'Expérience',
      description:
        'Un parcours de construction de produits avec une forte implication technique.',
      emptyState: 'Aucune expérience n’a encore été publiée.',
      present: 'Aujourd’hui',
      fallbackCompany: 'Entreprise',
    },
    education: {
      eyebrow: 'Formation',
      title: 'Formation',
      description: 'Parcours académique et apprentissage continu, gérés depuis Payload CMS.',
      emptyState: 'Aucune formation n’a encore été publiée.',
      fallbackSchool: 'École',
    },
    skills: {
      eyebrow: 'Compétences',
      title: 'Compétences',
      description:
        'Une palette d’outils affûtée pour le développement produit moderne, du frontend au delivery.',
      emptyState: 'Aucune compétence n’a encore été publiée.',
      visitAriaLabelSuffix: '(ouvre un nouvel onglet)',
    },
    testimonials: {
      eyebrow: 'Témoignages',
      title: 'Ce qu’on en dit',
      description: 'Retours de personnes avec qui j’ai collaboré sur des produits livrés.',
      emptyState: 'Aucun témoignage n’a encore été publié.',
    },
    contact: {
      eyebrow: 'Contact',
      reachOut: 'Me contacter',
      formNameLabel: 'Nom',
      formEmailLabel: 'Email',
      formMessageLabel: 'Message',
      formNamePlaceholder: 'Votre nom',
      formEmailPlaceholder: 'vous@exemple.com',
      formMessagePlaceholder: 'Votre message...',
      submitLabel: 'Envoyer',
      sendingLabel: 'Envoi en cours...',
      errors: {
        'missing-fields': 'Merci de renseigner tous les champs.',
        'invalid-email': 'Merci de saisir une adresse email valide.',
        'server-error': 'Une erreur est survenue. Merci de réessayer plus tard.',
      },
    },
    journal: {
      eyebrow: 'En dehors du code',
      title: 'Journal',
      description:
        'Voyages, sport, accomplissements et moments marquants — une autre facette du parcours.',
      emptyState: 'Aucune entrée n’a encore été publiée.',
      featuredBadge: 'À la une',
      allCategoriesLabel: 'Tout',
      readMoreLabel: 'Lire l’article',
      backLabel: '← Retour au journal',
    },
    lightbox: {
      closeLabel: 'Fermer',
      nextLabel: 'Image suivante',
      previousLabel: 'Image précédente',
    },
  },
  en: {
    nav: {
      primaryLabel: 'Primary navigation',
      footerLabel: 'Footer navigation',
      languageSwitcherLabel: 'Switch language',
      themeToggleLabel: 'Switch theme',
      lightLabel: 'Light theme',
      darkLabel: 'Dark theme',
      skipToContent: 'Skip to main content',
      journalLabel: 'Journal',
      openMenuLabel: 'Open menu',
      closeMenuLabel: 'Close menu',
      sectionIndexLabel: 'Section index',
    },
    about: {
      eyebrow: 'About',
    },
    projects: {
      eyebrow: 'Selected work',
      title: 'Projects',
      description:
        'Selected work shaped for fast-moving products, thoughtful UX, and reliable engineering.',
      emptyState: 'No featured projects have been published yet.',
      featuredBadge: 'Featured',
      githubLabel: 'GitHub ↗',
      liveLabel: 'Live demo ↗',
      technologiesAriaLabelSuffix: 'technologies',
      fallbackDescription: 'A recent project built with thoughtful product and engineering decisions.',
      statusLabels: {
        live: 'Live',
        'in-progress': 'In progress',
        archived: 'Archived',
      },
      viewDetailsLabel: 'View project →',
      galleryAriaLabelSuffix: 'gallery',
      backLabel: '← Back to projects',
    },
    experience: {
      eyebrow: 'Background',
      title: 'Experience',
      description: 'A track record of building product experiences with strong technical ownership.',
      emptyState: 'No experience entries have been published yet.',
      present: 'Present',
      fallbackCompany: 'Company',
    },
    education: {
      eyebrow: 'Education',
      title: 'Education',
      description: 'Academic background and continuing learning paths managed from Payload CMS.',
      emptyState: 'No education entries have been published yet.',
      fallbackSchool: 'School',
    },
    skills: {
      eyebrow: 'Capabilities',
      title: 'Skills',
      description:
        'A toolkit refined for modern product development across frontend, backend, and delivery.',
      emptyState: 'No skills have been published yet.',
      visitAriaLabelSuffix: '(opens in a new tab)',
    },
    testimonials: {
      eyebrow: 'Testimonials',
      title: 'What people say',
      description: "Feedback from people I've worked with on shipped products.",
      emptyState: 'No testimonials have been published yet.',
    },
    contact: {
      eyebrow: 'Contact',
      reachOut: 'Reach out',
      formNameLabel: 'Name',
      formEmailLabel: 'Email',
      formMessageLabel: 'Message',
      formNamePlaceholder: 'Your name',
      formEmailPlaceholder: 'you@example.com',
      formMessagePlaceholder: 'Your message...',
      submitLabel: 'Send inquiry',
      sendingLabel: 'Sending...',
      errors: {
        'missing-fields': 'Please fill in all fields.',
        'invalid-email': 'Please enter a valid email address.',
        'server-error': 'Something went wrong. Please try again later.',
      },
    },
    journal: {
      eyebrow: 'Beyond code',
      title: 'Journal',
      description:
        'Travel, sport, achievements, and milestones — another side of the journey.',
      emptyState: 'No entries have been published yet.',
      featuredBadge: 'Featured',
      allCategoriesLabel: 'All',
      readMoreLabel: 'Read entry',
      backLabel: '← Back to journal',
    },
    lightbox: {
      closeLabel: 'Close',
      nextLabel: 'Next image',
      previousLabel: 'Previous image',
    },
  },
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
