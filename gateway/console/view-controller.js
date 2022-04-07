const EventEmitter = require('events')

class ViewController extends EventEmitter {

  constructor (stdout, options = {
    topBufferSize: 2,
    bottomBufferSize: 2,
    margins: [ 0, 1, 1, 0 ],
  }) {
    super()
    /** @type {NodeJS.WriteStream} stdout */
    this.stdout = stdout
    /** @type {number} tbs Top Buffer Size */
    this.tbs = options.topBufferSize || 2
    /** @type {number} bbs Bottom Buffer Size */
    this.bbs = options.bottomBufferSize || 2
    /** @type {number} mt Margin Top */
    this.mt = (options.margins || [])[0] || 0
    /** @type {number} mtb Margin Top Between (middle) */
    this.mtb = (options.margins || [])[1] || 1
    /** @type {number} mbb Margin Bottom Between (middle) */
    this.mbb = (options.margins || [])[2] || 1
    /** @type {number} mb Margin Bottom */
    this.mb = (options.margins || [])[3] || 0

    /** @type {string[]} buff Main Buffer */
    this.buff = []
    /** @type {string[]} topBuff Top Buffer */
    this.topBuff = []
    /** @type {string[]} botBuff Bottom Buffer */
    this.botBuff = []
    /** @type {boolean} ready Is ready to accept data */
    this.ready = true
    /** @type {function[]} queue Operation queue */
    this.queue = []
    /** @type {boolean} paused Input is paused */
    this.paused = false
    /** @type {number} line The line scrolled to if detached */
    this.line = 0
    /** @type {boolean} detached If the view is detached from the buffer eg. scrolled up */
    this.detached = false

    this.rows = stdout.rows
    this.cols = stdout.columns
    /** @type {number} mbs Middle Buffer Size */
    this.mbs = this.rows - this.tbs - this.bbs - this.mt - this.mtb - this.mbb - this.mb
    stdout.on('resize', this.onResize)
  }

  onResize = () => {
    this.rows = this.stdout.rows
    this.cols = this.stdout.columns
    this.mbs = this.rows - this.tbs - this.bbs - this.mt - this.mtb - this.mbb - this.mb
    this.fullReRender()
  }

  pause () {
    this.paused = true
  }
  unpause () {
    this.paused = false
    this.ready = true
    this.fullReRender()
  }

  write (...str) {
    this._write(this.buff, ...str)
  }
  
  writeBottom (...str) {
    this._write(this.botBuff, ...str)
  }
  
  writeTop (...str) {
    this._write(this.topBuff, ...str)
  }

  scrollUp (lines) {
    this.line = this.detached
      ? Math.max(this.line - lines, this.mbs)
      : Math.max(this.buff.length - lines, this.mbs)
    this.detached = true
  }

  scrollDown(lines) {
    this.line = Math.min(this.line + lines, this.buff.length)
    if (this.line === this.buff.length)
      this.detached = false
  }

  attach() {
    this.detached = false
  }

  detach() {
    this.detached = true
  }

  // Break one line into multiple lines so that no line is longer than the screen width
  breakLine (line) {
    const words = line.split(/\s+/)
    const lines = []
    let currentLine = ''
    for (const word of words) {
      if (currentLine.length + word.length + 1 > this.cols) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine += ` ${word}`
      }
    }
    lines.push(currentLine)
    return lines
  }

  _write(buff, ...strings) {
    if (this.ready && !this.paused) {
      this.ready = false
      const lines = strings
        .map(str => str.split('\n'))
        .flat(Infinity)
        .map(l => this.breakLine(l.replace(/\s/g, ' ').replace(/\s/g, ' ')))
        .flat(Infinity)
      buff.push(...(lines))
      this.fullReRender()
    } else {
      this.queue.push(() => {
        const lines = strings
          .map(str => str
          .split('\n'))
          .flat(Infinity)
          .map(l => this.breakLine(l.replace(/\s/g, ' ').replace(/\s/g, ' ')))
          .flat(Infinity)
        buff.push(...(lines))
        this.fullReRender()
      })
    }
  }

  fullReRender () {

    const buffSlice = this.detached
      ? this.buff.slice(this.line - this.mbs, this.line)
      : this.buff.slice(-this.mbs)

    this.stdout.cursorTo(0, this.mt)
    this.stdout.clearScreenDown()
    this.stdout.write(
      [
        ...this.topBuff.slice(-this.tbs),
        ...(new Array(this.mtb)).fill(''),
        ...buffSlice,
        ...(new Array(this.mbb + Math.max(0, this.mbs - this.buff.length))).fill(''),
        ...this.botBuff.slice(-this.bbs)
      ]
      .join('\n')
    )
    this.stdout.moveCursor(-this.cols,1)
    
    if (this.queue.length > 0) {
      process.nextTick(() => this.queue.shift()())
    } else {
      this.ready = true
      this.emit('ready')
    }
    
  }

}

module.exports = ViewController
