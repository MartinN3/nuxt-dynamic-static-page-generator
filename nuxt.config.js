import axios from 'axios';

const fs = require('fs');
const path = require('path');
const strapiGridsome = fs.readFileSync(path.join(__dirname, 'requestString-strapi.graphql')).toString();
const _ = require('lodash');

export default {
  mode: 'universal',
  /*
  ** Headers of the page
  */
  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    ],
  },
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },
  /*
  ** Global CSS
  */
  css: [
  ],
  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
  ],
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module',
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/pwa',
  ],
  /*
  ** Axios module configuration
  ** See https://axios.nuxtjs.org/options
  */
  axios: {
  },
  generate: {
    routes: [],
  },
  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend(config, ctx) {
      if (ctx.isServer) {
        const parent = null;

        axios(`http://clevercmstest.sazkamobil.cleverlance.com:8888/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          data: {
            query: strapiGridsome,
            variables: null,
            operationName: 'find_pages'
          }
        }).then(({ data: contentTypeItemsResponse }) => {
          const contentTypeItems = _.get(contentTypeItemsResponse, 'data.pages', []);

          for (const contentTypeItem of contentTypeItems) {
            const { title } = contentTypeItem;
            console.groupCollapsed(`\n ${title}`);
            const isNodeIncludedInResults = _.get(contentTypeItem, 'entityStatus.workflowStep');

            if (isNodeIncludedInResults !== 'publish') {
              console.log(
                `!!! Warning !!! Excluded from results by strapi field 'entityStatus.workflowStep': ${isNodeIncludedInResults}`
              );
              console.groupEnd();
              continue;
            }

            //Get deeply nested values
            const id = _.get(contentTypeItem, 'id');
            const urlSlug = _.get(contentTypeItem, 'seo.urlSlug');
            const entityUid = _.get(contentTypeItem, 'helpers.systemEntityUid');
            const parent_id = _.get(contentTypeItem, 'parent_id', null);

            if (typeof id === 'undefined') {
              throw Error(`ContentType:, ${title} 'id' is not defined (path: "id")`);
            } else if (id === null) {
              throw Error(`ContentType:, ${title} 'id' is null (path: "id")`);
            }

            if (typeof urlSlug === 'undefined') {
              throw Error(`ContentType:, ${title} 'urlSlug' is not defined (path: "seo.urlSlug")`);
            } else if (urlSlug === null) {
              throw Error(`ContentType:, ${title} 'urlSlug' is null (path: "seo.urlSlug")`);
            }

            if (typeof entityUid === 'undefined') {
              throw Error(`ContentTypeItem: '${title}' - 'entityUid' is undefined  (path: "helpers.systemEntityUid")`);
            } else if (entityUid === null) {
              throw Error(`ContentTypeItem: '${title}' - 'entityUid' is null (path: "helpers.systemEntityUid")`);
            }

            //Is nesting implemented for this particular content type?
            const contentTypePath = parent_id === null ? urlSlug : getPathByAncestors(urlSlug, parent_id, contentTypeItems);

            //Is current contentType child of another contentType? Use parent 'path' + current content type 'urlSlug' as final URL
            const path = parent
              ? `${contentTypePages[`${parent.id}-${parent.contentType}`]}/${contentTypePath}`
              : contentTypePath === '/'
                ? contentTypePath
                : `/${contentTypePath}`;

            this.buildContext.options.generate.routes.push(path);

            console.groupEnd();
          }
        })

        //axios.get('http://clevercmstest.sazkamobil.cleverlance.com:8888/graphql')
        //  .then(({ data }) => {
        //    data.forEach((detailPage) => {
        //      this.buildContext.options.generate.routes.push(`/${detailPage.id}`);
        //    });
        //  });
      }
    },
  },
};

// Get url path according to parent_id which bubbles to root, eg.:/category/subpage/page
function getPathByAncestors(urlSlug, parent_id, allContentTypeItems) {
  if (parent_id) {
    const parent = allContentTypeItems.find((item) => parseInt(item.id, 10) === parent_id);

    if (parent) {
      const currentLoop_parent_id = _.get(parent, 'parent_id');
      const currentLoop_urlSlug = _.get(parent, 'seo.urlSlug');

      if (urlSlug) {
        return getPathByAncestors(currentLoop_urlSlug, currentLoop_parent_id, allContentTypeItems) + '/' + urlSlug;
      } else {
        throw new Error('Missing URL Slug on page');
      }
    }
  } else {
    return urlSlug;
  }
}
