import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
    title: 'OWASP TOP 10 Labs',
    tagline: 'Hands-on Application Security Labs to Learn, Practice, and Master Web Vulnerabilities',
    favicon: 'img/favicon.ico',

    // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
    future: {
        v4: true, // Improve compatibility with the upcoming Docusaurus v4
    },

// Set the production url of your site here
    url: 'https://mehdiaitsaid.github.com',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/owasp-top-10-labs/',
    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'mehdiaitsaid', // Usually your GitHub org/user name.
    projectName: 'owasp-top-10-labs', // Usually your repo name.

    trailingSlash: false,
    deploymentBranch: "gh-pages",
    onBrokenLinks: 'throw',

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            {
                docs: {
                    path: 'labs',
                    routeBasePath: 'labs',
                    sidebarPath: './sidebars.ts',
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/mehdiaitsaid/owasp-top-10-labs.git',
                },
                // blog: {
                //     showReadingTime: true,
                //     feedOptions: {
                //         type: ['rss', 'atom'],
                //         xslt: true,
                //     },
                //     // Please change this to your repo.
                //     // Remove this to remove the "edit this page" links.
                //     editUrl:
                //         'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
                //     // Useful options to enforce blogging best practices
                //     onInlineTags: 'warn',
                //     onInlineAuthors: 'warn',
                //     onUntruncatedBlogPosts: 'warn',
                // },
                theme: {
                    customCss: './src/css/custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        // Replace with your project's social card
        image: 'img/logo.png',
        colorMode: {
            respectPrefersColorScheme: true,
        },
        navbar: {
            title: 'OWASP',
            logo: {
                alt: 'OWASP TOP 10 Labs',
                src: 'img/logo.png',
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'tutorialSidebar',
                    position: 'left',
                    label: 'Labs',
                },
                {
                    href: 'https://github.com/mehdiaitsaid/owasp-top-10-labs.git',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'Labs',
                    items: [
                        {
                            label: 'Hands-On Labs',
                            to: '/labs/intro',
                        },
                    ],
                },
                {
                    title: 'Contact me',
                    items: [
                        {
                            label: 'Linkedin',
                            href: 'https://www.linkedin.com/in/mehdi-aitsaid/',
                        },
                        {
                            label: 'Instagram',
                            href: 'https://www.instagram.com/mehdi.aitsaid/',
                        },
                        {
                            label: 'GitHub',
                            href: 'https://github.com/mehdiaitsaid',
                        },
                    ],
                },
                {
                    title: 'More',
                    items: [
                        {
                            label: 'Université Mohammed I',
                            to: 'https://www.ump.ma/',
                        },
                        {
                            label: 'EST Nador',
                            href: 'https://estn.ump.ma/',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Pr. AIT SAID Mehdi.`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
