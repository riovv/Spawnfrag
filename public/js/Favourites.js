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
    url: '/statuses',

    comparator: function (model) {
      return model.get('maxclients') - model.get('clients');
    },
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
    template_levelshot: _.template('<img src="http://qtv.quakeworld.nu/levelshots/{{ map }}.jpg" class="img-polaroid img-levelshot"/>'),
    template_players: _.template('<table class="table table-bordered"><thead><th>Frags</th><th>Team</th><th>Name</th><thead><tbody><% _.each(players, function(p) { %><tr><td>{{ p.frags }}</td><td>{{ p.team }}</td><td>{{ p.name }}</td><% }); %></table>'),

    events: {
      'mouseenter': 'showButtons',
      'mouseleave': 'hideButtons',
      'click .close': 'removeItem'
    },

    initialize: function () {
      _.bindAll(this, 'render', 'popoverPlacement', 'showButtons', 'hideButtons');
      // Rerender on update
      // TODO: Do this more nicely. Only rerender what has changed etc.
      this.model.on('change', this.render);
      // Create a DOM-friendly id class out of the host
      this.$el.addClass('server-id-' + this.model.get('id').replace(/[\.]/g, '_').replace(/[\:]/g, '_'));
    },

    render: function () {
      // TODO: Player HTML needs to be handled better.
      var playerTable; 
      // TODO: Find a better way, I dont like the whole img element here.
      this.model.set('levelshot', this.template_levelshot({ map: this.model.get('map') }));
      // Render the whole view
      this.$el.html(this.template(this.model.attributes));

      // Setup popover (if there are any players connected)
      if (this.model.get('clients') > 0) {
        playerTable = this.template_players({ players: this.model.get('players') });
        this.$el.find('.server-item-inner').popover({
          trigger: 'hover',
          placement: this.popoverPlacement,
          title: 'Players',
          content: playerTable,
          delay: { show: 500, hide: 50 }
        });       
      }

      return this;
    },

    popoverPlacement: function () {
      return (this.$el.is(':nth-child(4)')) ? 'left' : 'right';
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
      // TODO: This could be done more nicely?
      this.collection.on('reset', this.render);
      this.collection.on('add', this.render);
      this.collection.on('remove', this.render);
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