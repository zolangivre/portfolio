/**
 * Worst-case homepage data for the dev-only break-ui route.
 *
 * Every value is something the CMS accepts (long ones sit at the field's
 * maxLength) and a real editor could plausibly type, paste or import — not
 * random filler. The failures are spread across rows, the way real content
 * mixes them: the first project is the long one, the second the bare one, the
 * third the short one, and so on. Shaped exactly like what `src/lib/queries`
 * returns, so it enters the page through the same props.
 */
import type { LexicalContent } from '@/lib/richText'
import type {
  About,
  Category,
  Company,
  Contact,
  Education,
  Experience,
  Hero,
  Media,
  Project,
  School,
  SectionsContent,
  Setting,
  Skill,
  Technology,
  Testimonial,
} from '@/payload-types'

import type { HomeData } from '../../HomeSections'

const STAMP = '2026-10-01T12:00:00.000Z'
const stamps = { createdAt: STAMP, updatedAt: STAMP }

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function paragraphs(...texts: string[]): LexicalContent {
  return {
    root: {
      type: 'root',
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
      children: texts.map((text) => ({
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        version: 1,
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
      })),
    },
  }
}

/** A solid-colour SVG of an exact size, standing in for an upload of that shape. */
function shape(width: number, height: number, fill: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" rx="${Math.min(width, height) / 8}" fill="${fill}"/></svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

let mediaId = 9000

function media(url: string, width: number, height: number, alt = ''): Media {
  mediaId += 1

  return {
    id: mediaId,
    alt,
    filename: url.split('/').pop() ?? null,
    height,
    mimeType: url.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
    url,
    width,
    ...stamps,
  }
}

/** An upload whose file is gone from storage: the doc exists, the URL 404s. */
const missing = (name: string, width = 512, height = 512) =>
  media(`/api/media/file/${name}`, width, height)

const panoramaLogo = media(shape(4000, 200, '#2f6fde'), 4000, 200)
const tallLogo = media(shape(200, 4000, '#d9480f'), 200, 4000)
const squareLogo = media(shape(64, 64, '#12b886'), 64, 64)
const darkOnlyLogo = media(shape(64, 64, '#111418'), 64, 64)
const landscapePhoto = media(shape(1600, 900, '#9c6ade'), 1600, 900)
const tallPortrait = media(shape(600, 2000, '#e8590c'), 600, 2000)

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

let categoryId = 9000

function category(name: string, group: Category['group'], _order: string | null): Category {
  categoryId += 1

  return { id: categoryId, name, slug: `bu-category-${categoryId}`, group, _order, ...stamps }
}

let technologyId = 9000

function technology(name: string, extra: Partial<Technology> = {}): Technology {
  technologyId += 1

  return { id: technologyId, name, slug: `bu-tech-${technologyId}`, ...extra, ...stamps }
}

const techs = {
  aws: technology('AWS Elastic Container Service', {
    color: '#ff9900',
    website: 'https://aws.example.com/ecs',
  }),
  mongo: technology('MongoDB / Mongoose', { color: '#47a248', logo: squareLogo }),
  apollo: technology('Apollo GraphQL', { logo: missing('apollo-graphql-logo-old.svg') }),
  ts: technology('TypeScript', { color: '#3178c6', logo: squareLogo }),
  next: technology('Next.js', { logo: darkOnlyLogo }),
  c: technology('C'),
  r: technology('R', { color: 'not-a-colour' }),
  spring: technology('Spring Boot', { color: '#6db33f' }),
  docker: technology('Docker', { logo: panoramaLogo }),
  k8s: technology('Kubernetes'),
  postgres: technology('PostgreSQL'),
  rn: technology('React Native', { website: 'https://reactnative.example.com' }),
  tailwind: technology('Tailwind CSS'),
  payload: technology('Payload CMS'),
  firebase: technology('Firebase Cloud Messaging (FCM)'),
}

const allTechs = Object.values(techs)

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------

const hero: Hero = {
  id: 1,
  availability: {
    enabled: true,
    label: 'Disponible pour un CDI full-stack dès janvier 2027 · Montpellier, Lyon ou remote',
  },
  eyebrow: 'Ingénieur logiciel full-stack — développeur d’applications web & mobiles',
  title: 'Aleksandra Wiśniewska-Kowalczyk',
  description: paragraphs(
    'Je conçois des applications web et mobiles de bout en bout, de la base de données à l’animation du dernier bouton.',
    'Le code source de ce portfolio est public : https://github.com/zolangivre/payload-portfolio/tree/main/src/components/sections',
  ),
  highlights: [
    {
      id: 'h1',
      value: 'Ceinture noire 2ᵉ dan, ancien athlète de haut niveau',
    },
    { id: 'h2', value: '3 ans d’alternance' },
    { id: 'h3', value: 'FR / EN' },
    { id: 'h4', value: '   ' },
    { id: 'h5', value: 'Kuala Lumpur → Rotterdam → Montpellier' },
  ],
  primaryCta: { label: 'Découvrir mes projets récents', href: '#projects' },
  secondaryCta: { label: 'Me contacter sur LinkedIn ou par e-mail', href: '#contact' },
  resumeCta: {
    label: 'Télécharger mon CV (PDF, 2 Mo)',
    file: media('/api/media/file/CV_Zolan_Givre_2026_v12_FINAL.pdf', 0, 0),
  },
}

const settings: Setting = {
  id: 1,
  name: 'Aleksandra Wiśniewska-Kowalczyk',
  profession: 'Ingénieur logiciel full-stack',
  // A landscape holiday photo where a portrait was expected.
  photo: landscapePhoto,
  theme: { primaryColor: 'orange' },
  contactEmail: 'bartholomew.fitzgerald@northwind-industries-holdings.example.com',
  socialLinks: [
    { id: 's1', platform: 'linkedin', url: 'https://linkedin.example.com/in/someone' },
    { id: 's2', platform: 'github', url: 'https://github.example.com/someone' },
    { id: 's3', platform: 'x', url: 'https://x.example.com/someone' },
    { id: 's4', platform: 'dribbble', url: 'https://dribbble.example.com/someone' },
    { id: 's5', platform: 'instagram', url: 'https://instagram.example.com/someone' },
    {
      id: 's6',
      platform: 'other',
      url: 'https://malt.example.com/profile/someone',
      icon: missing('malt-icon.png', 32, 32),
    },
  ],
}

const about: About = {
  id: 1,
  eyebrow: 'À propos de moi, de mon parcours et de ma façon de travailler',
  title:
    'Concevoir des produits réfléchis, avec la profondeur technique d’un ingénieur et la rigueur d’un judoka.',
  description: paragraphs(
    'Ancien athlète de haut niveau, j’ai appris la régularité avant d’apprendre le code.',
  ),
  body: paragraphs(
    'Formé à Polytech Montpellier, passé par Kuala Lumpur et Rotterdam.',
    'Ligne une\nLigne deux, collée depuis un e-mail.',
  ),
  pointGroups: [
    {
      id: 'p1',
      title: 'Judo — ceinture noire, ancien athlète de haut niveau (pôle France Montpellier)',
      content: paragraphs(
        'Douze ans de compétition, dont quatre en pôle France.',
        'La discipline, la défaite et la récupération : tout ce qui sert ensuite en équipe produit.',
      ),
    },
    { id: 'p2', title: 'Façon de travailler', content: null },
    { id: 'p3', title: 'Q&A', content: paragraphs('Oui.') },
    {
      id: 'p4',
      title: 'Benachrichtigungseinstellungen',
      content: paragraphs('Un titre allemand traduit automatiquement, sans espace.'),
    },
    { id: 'p5', title: 'Langues', content: paragraphs('Français, anglais, un peu de malais.') },
  ],
  portrait: tallPortrait,
}

const contact: Contact = {
  id: 1,
  eyebrow: 'Contact — réponse sous 48 h ouvrées, en français ou en anglais',
  title: 'Construisons ensemble quelque chose d’utile, de durable et d’agréable à utiliser.',
  description: paragraphs('Un projet, une alternance, un CDI, ou juste une question ?'),
  successMessage: 'Merci pour votre message — je vous réponds au plus vite.',
}

const sectionsContent: SectionsContent = {
  id: 1,
  projects: {
    eyebrow: 'Projets personnels, académiques et professionnels',
    title: 'Une sélection de projets construits de la base de données jusqu’à l’interface',
  },
  experience: { eyebrow: 'Expérience', title: 'Parcours' },
  education: {
    eyebrow: 'Formation',
    title: 'Études supérieures, certifications et formations complémentaires',
  },
  skills: { eyebrow: 'Compétences', title: 'Outils' },
  testimonials: {
    eyebrow: 'Témoignages',
    title: 'Ce qu’en disent les personnes avec qui j’ai travaillé',
  },
  journal: { eyebrow: 'Journal', title: 'Journal' },
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const projectCategories = {
  long: category('Application mobile & plateforme web', 'project', 'a1'),
  short: category('Web', 'project', 'a2'),
}

let projectId = 9000

function project(fields: Partial<Project> & Pick<Project, 'title'>): Project {
  projectId += 1

  return {
    id: projectId,
    slug: `bu-project-${projectId}`,
    shortDescription: 'Application web pour gérer un festival de jeux de société.',
    description: paragraphs('Description longue.'),
    visibility: 'public',
    ...fields,
    ...stamps,
  }
}

const longDescription =
  'Plateforme complète de gestion de festival : billetterie, réservation des tables par les éditeurs, suivi des factures, plan de salle interactif et tableau de bord en temps réel pour les bénévoles. ' +
  'Le back-office tourne sur Express et MongoDB, le front sur Angular, et une application mobile React Native permet de scanner les billets à l’entrée, même hors connexion. '.repeat(
    6,
  )

const projects: Project[] = [
  project({
    title: 'Plateforme de réservation FestivAWIn — édition 2026',
    featured: true,
    category: projectCategories.long,
    year: 2026,
    status: 'in-progress',
    coverImage: missing('festivawin-cover-2026-final.png', 1600, 1000),
    shortDescription: longDescription.slice(0, 280),
    technologies: allTechs,
    githubUrl: 'https://github.example.com/someone/festivawin',
    liveUrl: 'https://festivawin.example.com',
  }),
  project({
    // A repository name used as the title: no break opportunity at all.
    title: 'BagBuddyMarketplaceDashboard',
    shortDescription: '   ',
    technologies: [],
  }),
  project({
    title: 'Kō',
    year: 2019,
    status: 'archived',
    coverImage: panoramaLogo,
    category: projectCategories.short,
    technologies: [techs.c, techs.r],
  }),
  project({
    title: '<Portfolio /> & co',
    featured: true,
    status: 'live',
    category: projectCategories.short,
    // Desktop screenshot dropped into the phone frame.
    mockupFrame: 'phone',
    mockupImage: { relationTo: 'media', value: landscapePhoto },
    coverImage: tallLogo,
    shortDescription: 'Ligne une\nLigne deux — **gras** en markdown &amp; une entité.',
    technologies: [techs.next, techs.payload, techs.tailwind, techs.postgres, techs.docker],
  }),
  project({
    title: 'PatateProd App',
    year: 2025,
    category: 42 as unknown as Category,
    technologies: [techs.rn, techs.firebase],
  }),
  project({
    title: 'Dominique Memmi',
    year: 2024,
    status: 'live',
    coverImage: squareLogo,
    technologies: [techs.ts],
  }),
]

// ---------------------------------------------------------------------------
// Experience & education
// ---------------------------------------------------------------------------

let companyId = 9000

function company(name: string, extra: Partial<Company> = {}): Company {
  companyId += 1

  return { id: companyId, name, ...extra, ...stamps }
}

const experiences: Experience[] = [
  {
    id: 9001,
    position: 'Ingénieur logiciel Full-Stack — plateforme de paiement et infrastructure cloud',
    employmentType: 'Contrat de professionnalisation',
    location: 'Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaisie',
    company: company('Northwind Industries Holdings International B.V.', {
      website: 'https://northwind-industries-holdings.example.com',
      logo: panoramaLogo,
      description:
        'Éditeur de logiciels B2B pour la logistique portuaire, 1 284 salariés répartis sur 14 pays, coté à Euronext Amsterdam depuis 2011.',
    }),
    description: paragraphs(
      'Refonte du tunnel de paiement (Stripe, 3-D Secure) et migration de 40 microservices vers Kubernetes.',
      'Mise en place des tests end-to-end Playwright sur la CI, réduction du temps de build de 18 à 6 minutes.',
      'Encadrement de deux stagiaires, animation des rétrospectives, rédaction de la documentation d’architecture.',
      'Astreintes une semaine sur six, gestion des incidents de production et des post-mortems.',
      'https://northwind-industries-holdings.example.com/engineering/blog/2025/how-we-migrated-forty-services',
    ),
    technologies: allTechs,
    startDate: '2025-04-01T12:00:00.000Z',
    endDate: null,
    ...stamps,
    currentlyWorking: true,
  },
  {
    id: 9002,
    position: 'QA',
    company: company('J&J'),
    description: paragraphs('Tests.'),
    technologies: [],
    startDate: '2024-06-01T12:00:00.000Z',
    endDate: '2024-06-30T12:00:00.000Z',
    ...stamps,
  },
  {
    id: 9003,
    position: 'Développeur mobile',
    employmentType: 'Stage',
    // Saved through an import at Paris midnight, not the admin's noon.
    company: company('Lizard Global', { logo: missing('lizard-global-logo.png', 64, 64) }),
    description: paragraphs('Application React Native pour un client du secteur bancaire.'),
    startDate: '2023-08-31T22:00:00.000Z',
    endDate: '2024-01-31T23:00:00.000Z',
    ...stamps,
  },
  {
    id: 9004,
    position: 'Bénévole',
    // The company relation didn't resolve (deleted company).
    company: 77,
    description: paragraphs('Organisation du festival.'),
    startDate: '2022-05-01T12:00:00.000Z',
    endDate: '2022-05-01T12:00:00.000Z',
    ...stamps,
  },
]

let schoolId = 9000

function school(name: string, extra: Partial<School> = {}): School {
  schoolId += 1

  return { id: schoolId, name, ...extra, ...stamps }
}

const education: Education[] = [
  {
    id: 9001,
    degree:
      'Diplôme d’ingénieur en informatique et gestion — spécialité développement logiciel et systèmes d’information',
    fieldOfStudy:
      'Informatique et Gestion (IG) — parcours apprentissage, Polytech Montpellier, Université de Montpellier',
    school: school(
      'Polytech Montpellier — École polytechnique universitaire de l’Université de Montpellier',
      {
        website: 'https://polytech.example.com',
        logo: tallLogo,
        description: 'École d’ingénieurs publique du réseau Polytech.',
      },
    ),
    location: 'Montpellier, Occitanie, France',
    startDate: '2023-09-03T12:00:00.000Z',
    endDate: null,
    ...stamps,
    currentlyStudying: true,
  },
  {
    id: 9002,
    degree: 'BUT',
    school: school('IUT'),
    startDate: '2020-09-03T12:00:00.000Z',
    endDate: '2023-06-30T12:00:00.000Z',
    ...stamps,
    description: null,
  },
]

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

const skillCategories = {
  long: category('DevOps, intégration et déploiement', 'tech', 'a1'),
  one: category('IA', 'tech', 'a2'),
  many: category('Front-end', 'tech', 'a3'),
  noOrder: category('Bases de données', 'tech', null),
}

let skillId = 9000

function skill(name: string, cat: Skill['category'], extra: Partial<Skill> = {}): Skill {
  skillId += 1

  return { id: skillId, name, category: cat, ...extra, ...stamps }
}

const skills: Skill[] = [
  skill('GitHub Actions', skillCategories.long, {
    url: 'https://github.example.com/features/actions',
    logo: squareLogo,
  }),
  skill('Elasticsearch', skillCategories.long, {
    logo: squareLogo,
    url: 'https://elastic.example.com',
  }),
  skill('Kubernetes', skillCategories.long),
  skill('Docker Compose', skillCategories.long, { logo: missing('docker-compose.svg', 64, 64) }),
  skill('Claude', skillCategories.one, { url: 'https://claude.example.com', logo: darkOnlyLogo }),
  ...[
    'React',
    'React Native',
    'Angular',
    'Next.js',
    'Tailwind CSS',
    'Framer Motion',
    'Apollo Client',
    'TypeScript',
    'HTML',
    'CSS',
    'Storybook',
    'Vite',
    'Figma',
    'Accessibilité (WCAG 2.2)',
  ].map((name) => skill(name, skillCategories.many, { logo: squareLogo })),
  skill('MongoDB / Mongoose', skillCategories.noOrder, {
    logo: squareLogo,
    url: 'https://mongo.example.com',
  }),
  skill('PostgreSQL', skillCategories.noOrder),
  // Category relation unresolved: lands in the "uncategorized" bucket.
  skill('C', 99 as unknown as Skill['category']),
]

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

let testimonialId = 9000

function testimonial(
  fields: Partial<Testimonial> & Pick<Testimonial, 'author' | 'quote'>,
): Testimonial {
  testimonialId += 1

  return { id: testimonialId, ...fields, ...stamps }
}

const testimonials: Testimonial[] = [
  testimonial({
    author: 'Christopher Alexander Montgomery III',
    role: 'Senior Product Design Engineer, Platform Infrastructure',
    company: company('Northwind Industries Holdings International B.V.'),
    avatar: missing('christopher-montgomery.jpg', 400, 400),
    quote:
      'Zolan a repris un module que personne ne voulait toucher et l’a rendu lisible en deux semaines.',
  }),
  testimonial({ author: 'Jo', quote: 'Top.' }),
  testimonial({
    author: 'Đặng Thị Ngọc Hân',
    role: 'Product Owner',
    avatar: panoramaLogo,
    quote:
      '« Il pose les bonnes questions avant d’écrire la moindre ligne. » ' +
      'Nous avons travaillé ensemble pendant six mois sur l’application mobile de la banque : il a pris en charge la synchronisation hors ligne, les tests de bout en bout et la documentation, sans jamais perdre de vue l’utilisateur final. '
        .repeat(4)
        .slice(0, 730),
  }),
  testimonial({
    author: '🦊 Fox',
    company: company('Acme'),
    quote: '<b>Excellent</b> &amp; fiable.',
  }),
]

// ---------------------------------------------------------------------------
// Datasets
// ---------------------------------------------------------------------------

const visibleEverywhere = {
  id: 1,
  about: true,
  contact: true,
  education: true,
  experience: true,
  hero: true,
  journal: true,
  projects: true,
  skills: true,
  testimonials: true,
}

export const worstCase: HomeData = {
  about,
  contact,
  education,
  experiences,
  hero,
  projects,
  sections: visibleEverywhere,
  sectionsContent,
  settings,
  skills,
  testimonials,
}

/** A fresh install: every global unset, every collection empty. */
export const empty: HomeData = {
  about: null,
  contact: null,
  education: [],
  experiences: [],
  hero: null,
  projects: [],
  sections: visibleEverywhere,
  sectionsContent: null,
  settings: null,
  skills: [],
  testimonials: [],
}

/** Exactly one of everything: lone cards, lone chips, a single dot. */
export const one: HomeData = {
  about: { ...about, pointGroups: about.pointGroups?.slice(0, 1) ?? [] },
  contact,
  education: education.slice(1, 2),
  experiences: [{ ...experiences[2], technologies: [techs.ts] }],
  hero: { ...hero, highlights: hero.highlights?.slice(2, 3) ?? [] },
  projects: [{ ...projects[5] }],
  sections: visibleEverywhere,
  sectionsContent,
  settings: { ...settings, socialLinks: settings.socialLinks?.slice(0, 1) ?? [] },
  skills: [skills[4]],
  testimonials: [testimonials[1]],
}

/**
 * Every list at the cap its query sets (src/lib/queries): 100 projects,
 * 12 experiences, 50 schools, 100 skills, 20 testimonials. Nothing is
 * paginated, so this is the most the homepage can ever be asked to render.
 */
function repeat<T extends { id: number }>(
  rows: T[],
  count: number,
  rename: (row: T, i: number) => T,
) {
  return Array.from({ length: count }, (_, i) =>
    rename({ ...rows[i % rows.length], id: 20000 + i }, i),
  )
}

export const maxed: HomeData = {
  ...worstCase,
  projects: repeat(projects, 100, (row, i) => ({
    ...row,
    slug: `bu-max-${i}`,
    title: `${row.title} ${i + 1}`,
  })),
  experiences: repeat(experiences, 12, (row) => row),
  education: repeat(education, 50, (row) => row),
  skills: repeat(skills, 100, (row, i) => ({ ...row, name: `${row.name} ${i + 1}` })),
  testimonials: repeat(testimonials, 20, (row) => row),
}
