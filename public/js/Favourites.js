$(function() {
  var Favourite,
      Favourites,
      FavouriteItem,
      FavouriteList,
      FavouriteAdd,
      FavouriteApp;

  // Mustasche-ish template syntax works smother with Jade
  // Normal syntax for evaluate and escape
  _.templateSettings = {
    interpolate : /\{\{([\s\S]+?)\}\}/g,
    evaluate : /<%([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };

  /**
   * Model: Favourite
   */
  Favourite = Backbone.Model.extend({
    url: function () { return escape('/status/' + this.id); }
  });

  /**
   * Collection: Favourites
   * All favourites for a user.
   */
  Favourites = Backbone.Collection.extend({
    model: Favourite,
    url: '/statuses'
  });

  favourites = new Favourites();

  /**
   * View: FavouriteItem
   * A single favourite server in the favourite list.
   */
  FavouriteItem = Backbone.View.extend({
    collection: favourites,
    tagName: 'article',
    className: 'server-item span3',
    template: _.template($('#server-item-template').html()),
    levelshot_template: _.template('<img src="http://qtv.quakeworld.nu/levelshots/{{ map }}.jpg" class="img-polaroid img-levelshot"/>'),

    events: {
      'mouseenter': 'showButtons',
      'mouseleave': 'hideButtons',
      'click .close': 'removeItem'
    },

    initialize: function () {
      _.bindAll(this, 'render', 'showButtons', 'hideButtons');
      // Create a DOM-friendly id class out of the host
      this.$el.addClass('server-id-' + this.model.get('id').replace(/[\.]/g, '_').replace(/[\:]/g, '_'));
    },

    render: function () {
      this.model.set('levelshot', this.levelshot_template({ map: this.model.get('map') }));
      // Render the whole view
      this.$el.html(this.template(this.model.attributes));

      return this;
    },

    // Event listeners
    showButtons: function () {
      this.$el.find('.img-block-buttons').fadeIn(200);
      return this;
    },

    hideButtons: function () {
      this.$el.find('.img-block-buttons').fadeOut(0);
      return this;
    },

    removeItem: function (e) {
      var self = this;
      e.preventDefault();

      this.$el.fadeOut(200, function () {
        self.remove();
        self.collection.remove(self.model); 
        //self.model.destroy()
      });
      
      return this;
    }    
  });

  /**
   * View: FavouriteList
   * A list (collection) of favourite servers.
   */
  FavouriteList = Backbone.View.extend({
    collection: favourites,
    el: $('#server-list'),

    initialize: function () {
      _.bindAll(this, 'render', 'addServer');
      this.collection.on('reset', this.render);
      this.collection.on('add', this.addServer);
      this.collection.on('remove', this.removeServer);
    },

    render: function () {
      var self = this;

      // Reset view
      this.$el.html('');

      this.collection.models.forEach(function (model) {
        self.addServer(model);
      });

      return this;
    },

    addServer: function (model) {
      var lastRow = this.$el.children('div.row:last'),
          nItems = $(lastRow).children('.server-item').length,
          row = (nItems > 0 && nItems < 4) ? lastRow : $('<div class="row"></div>').appendTo(this.$el);

      row.append(new FavouriteItem({ model: model }).render().el);

      return this;
    },

    removeServer: function (model, options) {
      // Should resort etc.
    }
  });

  /**
   * View: AddFavourite
   * 
   * Handles the add favourite form
   */
   // TODO: Basically this whole view has to be refactored later, prototype now.
  AddFavourite = Backbone.View.extend({
    collection: favourites,
    el: $('#favourite-add'),

    events: {
      'click #btn-favourite-add': 'showModal',
      'click #btn-modal-favourite-close, .close': 'hideModal',
      'submit form': 'addServer'
    },

    initialize: function () {
      _.bindAll(this, 'addServer', 'showModal', 'hideModal');
      this.page = this.options.page;
    },

    // Event listeners
    showModal: function (e) {
      e.preventDefault();
      this.$el.children('#modal-favourite-add').modal('show');
      return this;
    },

    hideModal: function (e) {
      e.preventDefault();
      this.$el.children('#modal-favourite-add').modal('hide');
      return this;
    },

    addServer: function (e) {
      var model,
          self = this,
          $address = this.$el.find('input[name=address]'),
          $port = this.$el.find('input[name=port]'),
          address = $address.val(),
          port = parseInt($port.val(), 10);

      e.preventDefault();

      // TODO: Alot better validation, and also some nice error messages
      // and other candy stuff. Should even do a test so check that it is an qw server.
      // Check if server already is favourites.
      if (address === '' || isNaN(port)) {
        return this;
      }

      // Add server to collection and list view.
      self.collection.create({ id: address + ':' + port }, {
        success: function (model) {
          // Reset form elements
          $address.val('');
          $port.val('');
          // Hide modal again.
          self.$el.children('#modal-favourite-add').modal('hide');
        },
        wait: true
      });

      return this;
    }
  });

  /**
   * View: FavouriteApp
   * 
   * Glues favourites together
   */
  FavouriteApp = Backbone.View.extend({
    initialize: function() {
      this.favouriteList = new FavouriteList();
      this.addFavourite = new AddFavourite();
      this.favourites = favourites;

      this.favourites.fetch();
    }
  });

  if (!window.Spawnfrag) window.Spawnfrag = {};
  window.Spawnfrag.FavouriteApp = new FavouriteApp();
});