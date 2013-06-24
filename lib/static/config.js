{{callback}}({
  requireConfig: {
    baseUrl: '/bootweb',
    paths: {
      "bootstrap": "/deps/bootstrap/js",
      "dep": "/deps/lib"
    },
    shim: {
      'jquery': {
        exports: function() {
          return jQuery.noConflict();
        }
      },
      'dep/backbone': {
        //These script dependencies should be loaded before loading
        //backbone.js
        deps: ['dep/underscore-min', 'jquery'],
        //Once loaded, use the global 'Backbone' as the
        //module value.
        exports: 'Backbone'
      },
      'dep/TableTools.min': {
        deps: ["jquery", 'dep/jquery.dataTables.min'],
        exports: 'TableTools'
      },
      'deps/lib/vie': {
        deps: ["jquery", "dep/jquery.rdfquery.rules.min-1.0", "dep/backbone"],
        exports: 'VIE'
      },
      'dep/jquery.dataTables.min': ["jquery"],
      'bootstrap/bootstrap-collapse': ["jquery", "bootstrap/bootstrap-transition"],
      "bootstrap/bootstrap-transition": ["jquery"],
      "bootstrap/bootstrap-tooltip": ["jquery"],
      "bootstrap/bootstrap-button": ["jquery"],
      "bootstrap/bootstrap-modal": ["jquery"],
      "bootstrap/bootstrap-popover": ["jquery", "bootstrap/bootstrap-tooltip"]

    }
  },
  // gives a main global conf object (for template customs)
  mainConfig: {
    scriptsLoad: []
  }
});