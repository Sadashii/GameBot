const _ = {
  timeStampFromNow: (seconds) => (`<t:${Math.round(new Date().getTime() / 1000) + seconds}:R>`)
}
module.exports = _