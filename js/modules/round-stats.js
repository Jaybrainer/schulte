export default class RoundStats {
    constructor({ startTime, stopTime, clicks, correctClicks, wrongClicks }) {
        this.startTime = startTime;
        this.stopTime = stopTime;
        this.clicks = clicks;
        this.correctClicks = correctClicks;
        this.wrongClicks = wrongClicks;
    }

    get duration() {
        return this.stopTime - this.startTime;
    }
}
