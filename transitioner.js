# sits in front of the router and provides 'currentPage' and 'nextPage',
# whilst setting the correct classes on the body to allow transitions, namely:
#
#   body.transitioning.from_X.to_Y
(->
  Transitioner = ->
    @_currentPage = null
    # @_currentPageListeners = new Meteor.deps._ContextSet()
    @_currentPageListeners = new Deps.Dependency()
    @_nextPage = null
    @_nextPageListeners = new Deps.Dependency()
    @_direction = null
    @_options = {}

  Transitioner::_transitionEvents = "webkitTransitionEnd.transitioner oTransitionEnd.transitioner transitionEnd.transitioner msTransitionEnd.transitioner transitionend.transitioner"
  Transitioner::_transitionClasses = ->
    "transitioning from_" + @_currentPage + " to_" + @_nextPage + " going_" + @_direction

  Transitioner::setOptions = (options) ->
    _.extend @_options, options

  Transitioner::currentPage = ->
    Deps.depend @_currentPageListeners
    @_currentPage

  Transitioner::_setCurrentPage = (page) ->
    @_currentPage = page
    @_currentPageListeners.changed()

  Transitioner::nextPage = ->
    Deps.depend @_nextPageListeners
    @_nextPage

  Transitioner::_setNextPage = (page) ->
    @_nextPage = page
    @_nextPageListeners.changed()

  Transitioner::listen = ->
    self = this
    Deps.autorun ->
      self.transition Sparrow.shift()

  # derp

  
  # self.transition(Meteor.Router.page()); 
  
  # do a transition to newPage, if we are already set and there already
  #
  # note: this is called inside an autorun, so we need to take care to not 
  # do anything reactive.
  
  # var shift_current = Session.get("shift_current")
  # console.log("shift_current", shift_current)
  # console.log("shift_area", Session.get("shift_area"))
  Transitioner::transition = (newPage) ->
    self = this
    
    # this is our first page? don't do a transition
    return self._setCurrentPage(Session.get("shift_current"))  unless self._currentPage
    
    # return self._setCurrentPage(newPage); 
    
    # if we are transitioning already, quickly finish that transition
    
    # console.log("_nextPage", self._nextPage) 
    self.endTransition()  if self._nextPage
    
    # if we are transitioning to the page we are already on, no-op
    
    # console.log(self._currentPage, newPage) 
    return  if self._currentPage is newPage
    
    # Start the transition -- first tell any listeners to re-draw themselves
    self._setNextPage newPage
    
    # wait until they are done/doing:
    Meteor._atFlush ->
      self._options.before and self._options.before()

      # derp a herp

      # add relevant classes to the body and wait for the body to finish 
      # transitioning (this is how we know the transition is done)
      self.transitionClasses = self._transitionClasses()
      $("body").addClass(self.transitionClasses).on self._transitionEvents, (e) ->
        self.endTransition()  if $(e.target).is("body")



  Transitioner::endTransition = ->
    self = this
    
    # if nextPage isn't set, something weird is going on, bail
    return  unless self._nextPage
    
    # switch
    self._setCurrentPage self._nextPage
    self._setNextPage null
    
    # clean up our transitioning state
    Meteor._atFlush ->
      classes = self.transitionClasses
      $("body").off(".transitioner").removeClass classes
      self._options.after and self._options.after()


  Meteor.Transitioner = new Transitioner()
  Meteor.startup ->
    Meteor.Transitioner.listen()

)()
