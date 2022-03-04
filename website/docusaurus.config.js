// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Cluster, Grid and Cloud Courses (SysDevOps Crunch)',
  tagline: 'Be your own SysAdmin!',
  url: 'https://scgc.pages.upb.ro',
  baseUrl: '/cloud-courses/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/scgc_light.png',
  organizationName: 'SCGC Inc.', // Usually your GitHub org/user name.
  projectName: 'cloud-courses', // Usually your repo name.

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          editUrl: 'https://gitlab.cs.pub.ro/scgc/courses/website/docs',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'SysDevOps Crash Courses',
        logo: {
          alt: 'Logo',
          src: 'img/scgc_light.png',
          srcDark: 'img/scgc_dark.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'All Courses',
          },
          {
            to: '/docs/basic',
            label: 'Setup',
            position: 'left',
            activeBaseRegex: `/docs/basic/`,
          },
          {
            to: '/docs/management/',
            label: 'SPD',
            position: 'left',
            activeBaseRegex: `/docs/management/`,
          },
          {
            to: '/docs/security',
            label: 'SCGC',
            position: 'left'
          },
          {
            href: 'https://gitlab.cs.pub.ro/SCGC/cloud-courses',
            label: 'Repository',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Courses',
            items: [
              {
                label: 'Intro',
                to: '/docs/basic',
              },
              {
                label: 'SPD',
                to: '/docs/management',
              },
              {
                label: 'SCGC',
                to: '/docs/security',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Main site',
                href: 'https://curs.upb.ro',
              },
              {
                label: 'OpenStack',
                href: 'https://cloud.grid.pub.ro',
              },
              {
                label: 'OCW',
                href: 'https://ocw.cs.pub.ro/courses/scgc',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Cluster & Grid Team, Facultatea de Automatică și Calculatoare, Universitatea Politehnica București. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      hideableSidebar: true,
    }),
};

module.exports = config;
