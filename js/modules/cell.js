export default class Cell {
    constructor(number, orderIndex) {
        this.number = number;
        this.symbol = String(number);
        this.orderIndex = orderIndex;
        this.group = 0;
        this.traced = false;
        this.rightClick = false;
        this.cssClasses = {
            'rotate-90': false,
            'rotate-180': false,
            'rotate-270': false,
            'spin-right': false,
            'spin-left': false,
            underline: false,
        };
        this.isReact = false;
        this.opacity = 1;
    }
}
