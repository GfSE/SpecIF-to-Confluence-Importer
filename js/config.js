/**
 * Created by Marcus Bätz on 13.04.2017.
 */
require.config({
    baseUrl: "/js",
    paths: {
        "ajv": "/lib/ajv/dist/ajv.min",
        "specifCheck": "/js/scheme/specif-check",
        "specIF-loader": "/js/plugin/specIF-loader",
        "ap-loader": "/js/plugin/ap-loader",
        "purl": "/lib/purl/purl",
        "vis": "/lib/vis/dist/vis-network.min",
        "jquery": "//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min",
        "lodash": "/lib/lodash/dist/lodash.compat.min",
        "controller": "plugin/controller",
        "host": "plugin/host",
        "jsZip": "/lib/jszip/dist/jszip.min",
        "jsZipUtils": "/lib/jszip-utils/dist/jszip-utils.min",
        "old-browser-helper": "/js/old-browser-helper",
        "graph": "/js/plugin/graph"
    },

    shim: {
        "jquery": {
            exports: "$"
        },

        "lodash": {
            exports: "_"
        }
    }
});