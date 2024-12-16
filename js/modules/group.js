export default class Group {
    constructor(size, { inverted = false, divergent = false }) {
        this.size = size;
        this.inverted = inverted;
        this.divergent = divergent;
        this.numbers = [];
        this.currNum = -1;
        this.nextIndex = 0;
    }

    toString() {
        if (this.divergent) {
            const first = this.numbers[0];
            const second = this.numbers[1];
            if (this.inverted) {
                return first + '&rarr;|&larr;' + second;
            } else {
                return '&larr;' + first + '|' + second + '&rarr;';
            }
        } else {
            const first = this.numbers[0];
            const last = this.numbers[this.numbers.length - 1];

            return first + '&rarr;' + last;
        }
    }

    initNumbers() {
        let numbers = Array.from({ length: this.size }, (_, i) => i + 1);

        if (this.divergent) {
            const middle = Math.floor(this.size / 2);
            const firstHalf = numbers.slice(0, middle);
            const secondHalf = numbers.slice(middle);

            if (this.inverted) {
                secondHalf.reverse();
            } else {
                firstHalf.reverse();
            }

            numbers = [];
            for (let i = 0; i < firstHalf.length; i++) {
                numbers.push(firstHalf[i]);
                numbers.push(secondHalf[i]);
            }

            if (secondHalf.length !== firstHalf.length) {
                numbers.push(secondHalf[secondHalf.length - 1]);
            }
        } else if (this.inverted) {
            numbers.reverse();
        }

        this.numbers = numbers;
        this.currNum = numbers[0];
    }

    next() {
        const nextNum = (this.currNum = this.numbers[this.nextIndex]);
        this.nextIndex++;
        if (typeof nextNum === 'undefined') {
            return {
                done: true,
            };
        } else {
            return {
                value: nextNum,
            };
        }
    }

    [Symbol.iterator]() {
        return this;
    }
}
