export default class ClickStats {
    constructor({ groupN, number, time, err, inverse, divergent }) {
        this.groupN = groupN;
        this.number = number;
        this.time = time;
        this.err = err;
        this.inverse = inverse;
        this.divergent = divergent;
    }
}
