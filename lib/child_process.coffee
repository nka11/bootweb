{_} = require 'underscore'
child_process = require 'child_process'
async = require 'async'

healthCheckInterval = 60 * 1000
bounceInterval = 60 * 1000
bounceWait = bounceInterval + 30 * 1000

delayTimeout = (ms, func) -> setTimeout func, ms
class MonitoredChild
  constructor: (@script, @port, @healthCheck, @environmentVariables) ->
    @currentChild = null
    @healthCheckTimeout = null
    @bounceTimeout = null
    @expectedExit = false

  bounce: ->
    return @respawn() unless @currentChild?
    console.log "Requested bounce of #{@currentChild.pid}, port #{@port}"
    clearTimeout @healthCheckTimeout
    @expectedExit = true
    @currentChild.kill()
    @bounceTimeout = delayTimeout bounceInterval, =>
      console.error "Child did not exit in time, forcefully killing it"
      @currentChild.kill "SIGKILL"

  delayedHealthCheck: ->
    @healthCheckTimeout = delayTimeout config.healthCheckInterval, =>
      start = new Date()
      @healthCheck @port, (healthy) =>
        if healthy
          console.log "#{@port} is healthy - ping time #{new Date() - start}ms"
          @delayedHealthCheck()
        else
          console.error "#{@port} did not respond in time, killing it harshly"
          @currentChild.kill "SIGKILL"

  respawn: ->
    @currentChild = child_process.spawn process.execPath, [@script],
      env: _.extend(@environmentVariables, process.env)

    console.log "Started child", {port: @port, pid: @currentChild.pid}

    @currentChild.stdout.pipe process.stdout
    @currentChild.stderr.pipe process.stderr

    @currentChild.on 'exit', (code, signal) =>
      clearTimeout @healthCheckTimeout if @healthCheckTimeout?
      clearTimeout @bounceTimeout if @bounceTimeout?
      if @expectedExit
        @expectedExit = false
        console.info "Expected exit from child #{@currentChild.pid}, port #{@port} - respawning"
      else
        console.error "Child #{@currentChild.pid}, port #{@port} exited with code #{code}, signal #{signal}, respawning"
      @respawn()

    @delayedHealthCheck()


exports.bounceChildren = (monitoredChildren, callback) ->
  async.forEachSeries monitoredChildren,
    (monitoredChild, seriesCallback) ->
      monitoredChild.bounce()
      delayTimeout bounceWait, seriesCallback
    callback

exports.spawnMonitoredChild = (script, port, healthCheck, environmentVariables) ->
  ret = new MonitoredChild(script, port, healthCheck, environmentVariables)
  ret.respawn()
  ret