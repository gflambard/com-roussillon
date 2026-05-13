# Com Roussillon — Site officiel

Site vitrine de l'agence Com Roussillon (Perpignan / Roussillon).
Stack : [Astro](https://astro.build) 6 en build statique, déployé sur Hostinger.

---

## Démarrage rapide

```sh
npm install
npm run dev        # http://localhost:4321
```

| Commande | Action |
|---|---|
| `npm run dev` | Serveur de dev avec hot reload |
| `npm run build` | Build prod dans `./dist` |
| `npm run preview` | Preview du build prod en local |
| `npm run optimize:images` | Liste les PNG/JPG de `/public` à convertir en WebP (dry run) |
| `npm run optimize:images:apply` | Convertit, met à jour les références dans `/src`, supprime les originaux |

Node ≥ 22.12.

---

## Structure du projet

```
.
├── public/                  Assets servis tels quels (images, robots.txt, .htaccess)
├── scripts/
│   └── optimize-images.mjs  Conversion auto PNG/JPG → WebP via sharp
├── src/
│   ├── components/          Briques UI réutilisables (.astro)
│   │   ├── Nav.astro
│   │   ├── Hero.astro
│   │   ├── Services.astro       Carousel "Ce que nous faisons"
│   │   ├── Pourquoi.astro       Bloc "Notre histoire" + stats
│   │   ├── Realisations.astro   Carousel "Sites web"
│   │   ├── RealisationsAutres.astro  Carousel "Logos / print / réseaux"
│   │   ├── Avis.astro           Carousel d'avis Google
│   │   ├── Partenaires.astro    Ticker de logos clients
│   │   ├── Contact.astro        Formulaire Web3Forms + coordonnées
│   │   ├── Footer.astro
│   │   └── CookieConsent.astro  Bandeau de consentement RGPD
│   ├── layouts/
│   │   ├── Layout.astro         <head> commun + JSON-LD LocalBusiness + OG/Twitter
│   │   └── BlogLayout.astro     Layout articles + JSON-LD BlogPosting
│   ├── pages/                   Routage de fichiers Astro (1 fichier = 1 URL)
│   │   ├── index.astro          /
│   │   ├── blog.astro           /blog
│   │   ├── blog/*.astro         /blog/<slug>
│   │   ├── notre-histoire.astro
│   │   ├── mentions-legales.astro
│   │   └── politique-de-confidentialite.astro
│   ├── styles/
│   │   └── global.css           Variables, reset, utilitaires .sec / .btn / .fade-up
│   └── assets/                  Inutilisés actuellement (réservés à <Image />)
├── astro.config.mjs             Site URL + intégrations (sitemap, partytown)
├── tsconfig.json
└── package.json
```

---

## Conventions

### Nommage des assets
Tous les fichiers de `/public` sont en **kebab-case ASCII** (`mon-fichier.webp`). Pas d'espaces, pas d'accents, pas de majuscules. Le script `optimize:images:apply` met automatiquement à jour les références si le nom change.

### Couleurs & typo
Variables CSS dans `src/styles/global.css` :

| Variable | Valeur | Usage |
|---|---|---|
| `--gold` | `#b8933e` | Accents, CTA, liens d'article |
| `--dark` | `#1d1d1f` | Texte principal, fonds sombres |
| `--mid` | `#515154` | Texte courant sur fond clair |
| `--light` | `#6e6e73` | Texte secondaire (AA, contraste ≥ 4.5:1) |
| `--bg-off` | `#f5f5f7` | Fond alterné |
| `--radius` | `18px` | Border-radius par défaut |

Police : **Plus Jakarta Sans** (Google Fonts, weights 300/400/500/600 + italic 300).

### Classes utilitaires globales
Définies dans `global.css` :
- `.sec`, `.sec-inner`, `.sec-label`, `.sec-title`, `.sec-intro` — squelette d'une section
- `.btn-dark`, `.btn-outline` — boutons
- `.fade-up` — animation d'apparition au scroll (déclenchée par IntersectionObserver dans `index.astro`)
- `.skip-link`, `.visually-hidden` — a11y
- `:focus-visible` — anneau de focus doré (a11y)

---

## SEO & marketing

### Balises dynamiques
`Layout.astro` accepte ces props :
```astro
<Layout
  title="Titre <60 char"
  description="Description <160 char"
  image="/og-image.webp"      <!-- optionnel, défaut: /hero-canigou.webp -->
  type="website"               <!-- ou "article" -->
  noindex={false}              <!-- mettre à true pour exclure de Google -->
  jsonLd={...}                 <!-- objet ou tableau Schema.org additionnel -->
/>
```

Génère automatiquement : canonical, Open Graph, Twitter card, JSON-LD `LocalBusiness` (toujours), apple-touch-icon, theme-color, preload du hero.

### JSON-LD
- **LocalBusiness** — injecté par `Layout.astro` (cf. `localBusiness` const).
  Si NAP change : modifier dans `Layout.astro:30-45` ET dans `Contact.astro` ET dans `mentions-legales.astro` ET dans `politique-de-confidentialite.astro`.
- **BlogPosting** — injecté par `BlogLayout.astro` à partir des props `heroTitle`, `description`, `category`, `datePublished` (ISO 8601, ex. `"2026-03-15"`).

### Sitemap
Généré automatiquement par `@astrojs/sitemap` à `/sitemap-index.xml` lors du build.
À soumettre dans **Google Search Console** (pas Google Analytics) : `https://comroussillon.fr/sitemap-index.xml`.

### Cookies / RGPD
Aucun cookie déposé tant que l'utilisateur n'a pas cliqué sur "Accepter" dans le bandeau.
- Composant : `CookieConsent.astro`
- Stockage du choix : `localStorage["cr-consent-v1"]` = `"accepted"` | `"refused"`
- Si accepté : chargement de `gtag.js` avec `anonymize_ip: true`
- L'utilisateur peut révoquer en effaçant les données de site (le bandeau réapparaît)

ID Google Analytics : `G-BLV3N7WTHD` (à modifier dans `CookieConsent.astro:91`).

---

## Performance

- Toutes les images sont en WebP (`npm run optimize:images:apply` pour ré-optimiser au besoin).
- `loading="lazy"` + `decoding="async"` sur toutes les images sous la ligne de flottaison.
- `<link rel="preload" fetchpriority="high">` sur l'image hero.
- Header `.htaccess` avec compression + cache long sur les assets statiques (1 an).
- Plus Jakarta Sans chargé depuis Google Fonts avec `display=swap` + preconnect.

### Améliorations futures possibles
- Auto-héberger Plus Jakarta Sans (gain ~150 ms LCP).
- Migrer `/public/*.webp` vers `src/assets/` + `<Image />` Astro pour générer auto le `srcset` responsive.
- Refactor des 3 carrousels (Services / Realisations / RealisationsAutres) en un seul composant `<Carousel>` — leur logique est quasi identique dans `pages/index.astro`.

---

## Accessibilité

- `<main id="main">` sur chaque page + lien "Aller au contenu" (skip-link).
- Tous les champs de formulaire ont un `<label class="visually-hidden">`.
- Tous les `target="_blank"` ont `rel="noopener noreferrer"`.
- Contraste du texte secondaire : `--light` à 4.6:1 (AA).
- Focus visible doré sur tous les éléments focusables.

---

## Sécurité (côté Hostinger)

Le fichier `public/.htaccess` configure :
- Force HTTPS (301 si HTTP)
- HSTS 2 ans avec preload
- CSP autorisant `self` + Google Fonts + Google Tag Manager + Web3Forms
- X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options
- Compression deflate
- Cache : 1 an pour images/fonts, 1 mois pour CSS/JS, 0 pour HTML

À vérifier dans hPanel :
- HTTPS activé (Let's Encrypt) sur `comroussillon.fr` **et** `www.comroussillon.fr`
- `mod_headers` et `mod_rewrite` actifs (par défaut chez Hostinger : OK)

Domaine canonique configuré : **apex** (`comroussillon.fr`). Tout accès en `www.comroussillon.fr` est redirigé en 301 vers `comroussillon.fr` (cf. `.htaccess`).

---

## Formulaire de contact

Backend : [Web3Forms](https://web3forms.com).
- Endpoint : `https://api.web3forms.com/submit`
- `access_key` dans `Contact.astro` (publique côté client, c'est normal — la sécurité repose sur la config Web3Forms)
- Protection anti-spam : champ honeypot `botcheck` (invisible, `aria-hidden`)
- Les messages arrivent à `comroussillon@gmail.com`

Pour changer la destination email : se connecter sur web3forms.com avec le même email et changer dans le dashboard.

---

## Déploiement

Astro est un **générateur de site statique** : le code source (`src/*.astro`) n'est pas compréhensible par un navigateur. Lors du build, Astro compile tout en HTML/CSS/JS classique dans le dossier `dist/`. C'est ce dossier `dist/` qu'on uploade sur Hostinger.

`dist/` n'est pas commité dans Git (cf. `.gitignore`) — il se régénère à chaque `npm run build`.

### Procédure

```sh
# 1. Sauvegarder le code source sur GitHub
git add .
git commit -m "Mise à jour XYZ"
git push

# 2. Builder le site
npm run build

# 3. Uploader le contenu de ./dist/* dans /public_html/ de Hostinger
#    via le Gestionnaire de fichiers ou un client FTP (FileZilla...)
#    → écraser les fichiers existants
```

Le fichier `.htaccess` est inclus dans le build et sera bien copié dans `dist/`.

> 💡 Tester le build en local avant l'upload : `npm run preview`

---

## Points de vigilance

1. **NAP (Nom / Adresse / Téléphone)** doit rester synchronisé entre :
   - `src/components/Contact.astro` (lignes ~29, 39)
   - `src/pages/mentions-legales.astro`
   - `src/pages/politique-de-confidentialite.astro`
   - `src/layouts/Layout.astro` (constante `localBusiness`)
   - Fiche Google Business Profile / Facebook / LinkedIn
2. **Date des articles** : utiliser `datePublished="YYYY-MM-DD"` (ISO) pour le SEO + `date="..."` pour l'affichage français.
3. **Modifier le hero** : éditer `Hero.astro` ET `blog.astro` (qui duplique le style hero — à factoriser un jour).
4. Ne **jamais** committer un PDF tiers ou un fichier client sans accord — les CGV de tiers ont été retirées le 2026-05-13.
