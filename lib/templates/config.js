var requireConfig = {
  baseUrl: '/js',
  paths: {
    "bootstrap": "/deps/bootstrap/js",
    "lib": "/deps/lib"
  },
  shim: {
    'jquery': {
      exports: function() {
        return jQuery.noConflict();
      }
    },
    'deps/lib/backbone': {
      //These script dependencies should be loaded before loading
      //backbone.js
      deps: ['deps/lib/underscore-min', 'jquery'],
      //Once loaded, use the global 'Backbone' as the
      //module value.
      exports: 'Backbone'
    },
    'deps/lib/TableTools.min': {
      deps: ["jquery", 'deps/lib/jquery.dataTables.min'],
      exports: 'TableTools'
    },
    'deps/lib/vie': {
      deps: ["jquery", "deps/lib/jquery.rdfquery.rules.min-1.0", "deps/lib/backbone"],
      exports: 'VIE'
    },
    'deps/lib/jquery.dataTables.min': ["jquery"],
    'bootstrap/bootstrap-collapse': ["jquery", "bootstrap/bootstrap-transition"],
    "bootstrap/bootstrap-transition": ["jquery"],
    "bootstrap/bootstrap-tooltip": ["jquery"],
    "bootstrap/bootstrap-button": ["jquery"],
    "bootstrap/bootstrap-modal": ["jquery"],
    "bootstrap/bootstrap-popover": ["jquery", "bootstrap/bootstrap-tooltip"]

  }
},
// gives a main global conf object (for template customs)
mainConfig = {
  scriptsLoad: []
};