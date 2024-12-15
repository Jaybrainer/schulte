const PB_KEY = 'schulte-pbs';

class Cell {
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

class Group {
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

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Click {
    constructor(x, y, correct) {
        this.x = x;
        this.y = y;
        this.correct = correct;
    }
}

class ClickStats {
    constructor({ groupN, number, time, err, inverse, divergent }) {
        this.groupN = groupN;
        this.number = number;
        this.time = time;
        this.err = err;
        this.inverse = inverse;
        this.divergent = divergent;
    }
}

class RoundStats {
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

function timeString(diff) {
    if (diff >= 3600000) {
        // 1 hour or more
        return new Date(diff).toISOString().slice(11, -1);
    }
    return new Date(diff).toISOString().slice(14, -1);
}

var appData = {
    maxGridSize: 30,
    maxFrenzyCount: 6,

    gridSize: 5,
    cells: [], // array of Cell

    roundCount: 1,
    roundBreaks: true,
    showRounds: true,
    showTransitions: true,
    betweenRounds: false,
    roundOptions: [1, 2, 3, 5, 10, 25, 100],

    personalBests: {},

    groupCount: 1,
    inverseCount: false,
    divergentCount: false,
    variousCounts: false,
    collateGroups: false,
    originalColors: false,
    spinTable: false,
    spinTableSpeed: 'speed1',
    noErrors: false,
    useClickSound: false,
    startOnClick: false,
    hasClickedYet: false,
    timerMinutes: 5,
    frenzyCount: 3,
    currGroup: 0,
    groups: [], // array of Group: setups in makeGridCells() method

    newGroupColorStyles: ['black', 'blue', 'green', '#d90', 'red', 'magenta'],
    oringinalGroupColorStyles: [
        'black',
        'green',
        'red',
        'blue',
        'magenta',
        'brown',
    ],
    groupColorStyles: [],

    gameStarted: false,

    hoverIndex: -1,
    clickIndex: -1,
    correctIndex: -1,
    currOrderIndex: 0,

    clearCorrect: true,
    showHover: true,
    showClickResult: true,
    showClickAnimation: true,
    showTrace: true,
    showCenterDot: false,
    shuffleSymbols: false,
    turnSymbols: false,
    spinSymbols: false,
    frenzyMode: false,
    hideReact: false,
    hoverMode: false,
    blindMode: false,
    flashlightMode: false,
    mathMode: false,
    lettersMode: false,
    leftRightClick: false,
    lastClickButton: 0,
    tableSize: 600,
    fontSize: 100,
    nOffset: 0,

    mouseTracking: false,
    mouseMoves: [],
    mouseClicks: [],

    tableWidth: 600,
    tableHeight: 600,
    cellFontSize: 16,
    selectTimeOut: 500,
    selectedTimerId: -1,
    gameTimerId: -1,

    dialogShowed: false,
    settingsTabVisible: true,
    statsTabVisible: false,
    mousemapTabVisible: false,
    clickSound: false,

    stats: {
        startTime: 0,
        stopTime: 0,
        lastTime: 0,
        correctClicks: 0,
        wrongClicks: 0,
        clicks: [],
        rounds: [],
        startRound() {
            const now = performance.now();
            this.startTime = now;
            this.stopTime = now;
            this.lastTime = now;
            this.correctClicks = 0;
            this.wrongClicks = 0;
            this.clicks = [];
            this.rounds = [];
        },
        addClick(groupN, number, err, inverse, divergent) {
            const now = performance.now();
            const time = ((now - this.lastTime) / 1000).toFixed(2);
            this.clicks.push(
                new ClickStats({
                    groupN,
                    number,
                    time,
                    err,
                    inverse,
                    divergent,
                }),
            );
            this.lastTime = now;
        },
        resultTimeString() {
            const rounds = this.rounds.length;
            if (rounds < appData.roundCount) return timeString(0);
            const total = this.totalTime();
            const time = timeString(total);

            if (rounds > 1) {
                const best = timeString(this.bestRoundTime());
                const avg = timeString(total / rounds);
                return `${time} (${avg} average, ${best} best)`;
            }

            return time;
        },
        totalCorrectClicks() {
            return (
                this.correctClicks + // in the case of an unfinished round
                this.rounds.reduce((a, b) => a + b.correctClicks, 0)
            );
        },
        totalWrongClicks() {
            return (
                this.wrongClicks + // in the case of an unfinished round
                this.rounds.reduce((a, b) => a + b.wrongClicks, 0)
            );
        },
        endRound() {
            const now = performance.now();
            this.rounds.push(
                new RoundStats({
                    startTime: this.startTime,
                    stopTime: now,
                    clicks: this.clicks,
                    correctClicks: this.correctClicks,
                    wrongClicks: this.wrongClicks,
                }),
            );
            this.startTime = now;
            this.lastTime = now;
            this.clicks = [];
            this.correctClicks = 0;
            this.wrongClicks = 0;
        },
        bestRoundTime() {
            return this.rounds.reduce(
                (a, b) => Math.min(a, b.duration),
                Infinity,
            );
        },
        totalTime() {
            return this.rounds.reduce((a, b) => a + b.duration, 0);
        },
    },
};

Vue.directive('focus', {
    // https://jsfiddle.net/LukaszWiktor/cap43pdn/
    inserted(el) {
        el.focus();
    },
    update(el) {
        Vue.nextTick(function () {
            el.focus();
        });
    },
});

var vueApp = new Vue({
    el: '#app',
    data: appData,
    created() {
        this.tableSize = Math.min(
            this.tableSize,
            window.innerWidth,
            window.innerHeight,
        );
        this.initGame();
        this.clickSound = new Audio('js/bop.mp3');
        const temp = localStorage.getItem(PB_KEY);
        console.log(temp);
        appData.personalBests = JSON.parse(
            localStorage.getItem(PB_KEY) ?? '{}',
        );
        this.updateColorStyles();
    },
    mounted() {
        this.execDialog('settings');
    },
    updated() {
        if (this.dialogShowed && this.mousemapTabVisible) {
            this.drawMousemap();
        }
        if (this.dialogShowed && this.statsTabVisible) {
            this.drawRoundGraph();
        }
    },
    watch: {
        flashlightMode(val) {
            if (!val) {
                for (const cell of this.cells) {
                    cell.opacity = 1;
                }
            }
        },
        gridSize(val) {
            this.setCSSVar('--grid-size', this.gridSize);

            this.initGame();
        },
        groupCount(val) {
            this.groupCount = val;
            this.initGame();
        },
        inverseCount() {
            this.initGame();
        },
        divergentCount() {
            this.initGame();
        },
        variousCounts() {
            this.initGame();
        },
        collateGroups() {
            this.initGame();
        },
        originalColors() {
            this.initGame();
        },
        clearCorrect() {
            this.initGame();
        },
        spinSymbols() {
            this.updateSymbolSpins();
        },
        turnSymbols() {
            this.updateSymbolTurns();
        },
        frenzyMode() {
            this.initGame();
        },
        blindMode() {
            this.initGame();
        },
        hideReact() {
            this.initGame();
        },
        hoverMode() {
            this.initGame();
        },
        spinTable() {
            this.initGame();
        },
        tableSize() {
            this.initGame();
        },
        fontSize() {
            this.initGame();
        },
        nOffset() {
            this.initGame();
        },
        cellFontSize(val) {
            this.setCSSVar('--cell-font-size', `${val}px`);
        },
    },
    computed: {},
    methods: {
        getCellClasses(cell, i) {
            if (!this.gameStarted) {
                return;
            }

            const classes = {};
            // apply left-right colors
            if (this.leftRightClick && !cell.traced) {
                if (cell.rightClick) {
                    classes['right-click'] = true;
                } else {
                    classes['left-click'] = true;
                }
            }

            // apply hover border
            if (this.showHover && this.hoverIndex == i) {
                classes['hovered-cell'] = true;
            }

            // apply click state
            if (this.showClickAnimation && this.clickIndex == i) {
                if (i == this.correctIndex) {
                    classes['correct-cell'] = true;
                } else if (
                    !(this.frenzyMode && this.frenzyCount == 1) &&
                    !this.hoverMode
                ) {
                    // this one also applies when the cell is react, need to fix
                    classes['wrong-cell'] = true;
                }
            }

            if (cell.isReact) {
                classes['react-cell'] = true;
            }

            // mark finished (traced) cells
            if (this.showTrace && cell.traced) {
                classes['traced-cell'] = true;
            }

            // handle animations
            if (
                this.showTransitions &&
                !this.shuffleSymbols &&
                !(this.frenzyMode && this.frenzyCount == 1) &&
                !this.leftRightClick
            ) {
                classes['transition'] = true;
            }

            return classes;
        },
        setCSSVar(name, value) {
            document.documentElement.style.setProperty(name, value);
        },
        initGame() {
            this.gameStarted = false;
            this.initTable();
            this.stats.startRound();
            this.mouseMoves.length = 0;
            this.mouseClicks.length = 0;
            this.mouseTracking = false;
            this.hasClickedYet = false;
        },
        initTable() {
            this.clearIndexes();
            this.currGroup = 0;
            this.makeGridCells();
            this.shuffleCells();
            this.updateSymbolTurns();
            this.updateSymbolSpins();
            this.updateUnderlines();
            this.tableWidth = this.tableSize;
            this.tableHeight = this.tableSize;
            this.cellFontSize =
                (this.tableSize * this.fontSize) / this.gridSize / 133;
        },
        startGame() {
            this.initGame();
            this.startMouseTracking();
            this.gameStarted = true;
        },
        breakBetweenRounds() {
            this.stats.stopTime = performance.now();
            this.stats.endRound();
            this.betweenRounds = true;
            this.stopMouseTracking();
            for (let i = 0; i < this.cells.length; i++) {
                this.cells[i].opacity = 0;
            }
        },
        killResultAnimations() {
            this.showTransitions = false;
            setTimeout(() => (this.showTransitions = true), 0);
        },
        startNextRound() {
            this.initTable();
            this.killResultAnimations();
            this.stats.startTime = performance.now();
            this.stats.lastTime = this.stats.startTime;
            this.hasClickedYet = false;
            this.betweenRounds = false;
            this.restartMouseTracking();
        },
        currentRoundNumber() {
            return this.stats.rounds.length + (this.betweenRounds ? 0 : 1);
        },
        stopGame() {
            this.clearIndexes();
            clearTimeout(this.selectedTimerId);
            this.gameStarted = false;
            this.stopMouseTracking();
        },
        updatePB() {
            const time = this.stats.totalTime();
            const category = this.category();
            const currentPB = this.personalBests[category];
            if (!currentPB || currentPB > time) {
                this.personalBests[category] = time;
                localStorage.setItem(
                    PB_KEY,
                    JSON.stringify(this.personalBests),
                );
            }
        },
        pbTimeString() {
            const pb = this.personalBests[this.category()];
            return pb ? timeString(pb) : '';
        },
        clearIndexes() {
            this.hoverIndex = -1;
            this.clickIndex = -1;
            this.correctIndex = -1;
            this.currOrderIndex = 0;
        },
        setHoveredCell(cellIdx, event) {
            this.hoverIndex = cellIdx;
            if (this.gameStarted && this.hoverMode) {
                this.clickIndex = cellIdx;
                if (this.isCellCorrect(this.clickIndex)) {
                    this.nextTurn();
                }
            }
        },
        setClickedCell(cellIdx, event) {
            if (this.leftRightClick) {
                this.lastClickButton = event.button;
            } // else if (event.button != 0) return;
            if (this.betweenRounds) return;
            if (this.gameStarted) {
                if (this.startOnClick && !this.hasClickedYet) {
                    this.stats.startTime = performance.now();
                    this.hasClickedYet = true;
                }
                this.clickIndex = cellIdx;
                if (this.showClickResult) {
                    if (this.showClickAnimation) {
                        clearTimeout(this.selectedTimerId);
                    }
                    this.showClickAnimation = true;
                    this.selectedTimerId = setTimeout(
                        this.hideSelect,
                        this.selectTimeOut,
                    );
                } else {
                    this.showClickAnimation = false;
                }

                this.appendMouseClick(event);

                this.nextTurn();
            }
        },
        nextTurn() {
            // index out of range
            if (this.clickIndex < 0 || this.clickIndex >= this.cells.length) {
                return;
            }

            let correctClick = this.isCellCorrect(this.clickIndex);
            if (this.leftRightClick) {
                if (
                    (this.cells[this.clickIndex].rightClick &&
                        this.lastClickButton != 2) ||
                    (!this.cells[this.clickIndex].rightClick &&
                        this.lastClickButton != 0)
                )
                    correctClick = false;
            }

            if (correctClick) {
                if (this.clickSound && this.useClickSound) {
                    // play click sound and copy so they can overlap
                    let newBoop = this.clickSound.cloneNode();
                    newBoop.play();
                    newBoop = null;
                }
                this.stats.correctClicks++;
                this.stats.addClick(
                    this.currGroup,
                    this.cells[this.clickIndex].number,
                    false,
                    this.groups[this.currGroup].inverted,
                    this.groups[this.currGroup].divergent,
                );
                this.cells[this.clickIndex].traced = true;
                if (this.clearCorrect) {
                    this.cells[this.clickIndex].opacity = 0;
                }
                if (this.frenzyMode) {
                    this.cells[this.clickIndex].opacity = 0;
                    if (this.frenzyCount == 1) {
                        this.cells[this.clickIndex].isReact = false;
                    }
                    for (const cell of this.cells) {
                        if (
                            cell.orderIndex ===
                            this.currOrderIndex + this.frenzyCount
                        ) {
                            if (!(this.frenzyCount == 1 && this.hideReact)) {
                                cell.opacity = 1;
                            }
                            if (this.frenzyCount == 1) {
                                cell.isReact = true;
                            }
                        }
                    }
                }
                if (this.blindMode) {
                    if (this.stats.correctClicks == 1) {
                        for (let i = 0; i < this.cells.length; i++) {
                            this.cells[i].opacity = 0;
                        }
                    }
                }
                if (this.shuffleSymbols) {
                    this.shuffleCells();
                    this.correctIndex = this.indexOfCorrectCell();
                    this.clickIndex = this.correctIndex;
                } else {
                    this.correctIndex = this.clickIndex;
                }

                if (this.stats.correctClicks === this.cells.length) {
                    if (this.currentRoundNumber() >= this.roundCount) {
                        this.stats.endRound();
                        this.stopGame();
                        this.updatePB();
                        this.execDialog('stats');
                    } else {
                        this.breakBetweenRounds();
                        if (!this.roundBreaks) {
                            this.startNextRound();
                        }
                    }
                } else {
                    this.currOrderIndex++;
                }
            } else {
                if (this.noErrors) {
                    return this.execDialog('settings');
                }
                if (
                    this.blindMode &&
                    this.stats.correctClicks >= 1 &&
                    !this.cells[this.clickIndex].traced
                ) {
                    // unclear this cell, but add 10 seconds
                    this.cells[this.clickIndex].opacity = 1;
                    this.stats.startTime -= 10000;
                }
                this.stats.wrongClicks++;
                this.stats.addClick(
                    this.currGroup,
                    this.cells[this.clickIndex].number,
                    true,
                    this.groups[this.currGroup].inverted,
                    this.groups[this.currGroup].divergent,
                );
                this.correctIndex = -1;
            }
        },
        isCellCorrect(cellIdx) {
            return this.cells[cellIdx].orderIndex === this.currOrderIndex;
        },
        indexOfCorrectCell() {
            let index = -1;
            for (let i = 0; i < this.cells.length; i++) {
                if (this.isCellCorrect(i)) {
                    index = i;
                    break;
                }
            }
            return index;
        },
        indexOfCellByNumber(number) {
            let index = -1;
            for (let i = 0; i < this.cells.length; i++) {
                if (this.cells[i].number === number) {
                    index = i;
                    break;
                }
            }
            return index;
        },
        makeGridCells() {
            this.groups.length = 0;
            const cellCount = this.gridSize * this.gridSize;

            const numsInGroup = Math.floor(cellCount / this.groupCount);
            for (let g = 0; g < this.groupCount; g++) {
                this.groups.push(
                    new Group(numsInGroup, {
                        inverted: this.inverseCount,
                        divergent: this.divergentCount,
                    }),
                );
            }
            for (let i = 0; i < cellCount % this.groupCount; i++) {
                this.groups[i].size++;
            }

            if (this.variousCounts) {
                const various = [
                    { divergent: false, inverted: false },
                    { divergent: false, inverted: true },
                    { divergent: true, inverted: false },
                    { divergent: true, inverted: true },
                ];
                for (let g = 0; g < this.groupCount; g++) {
                    this.groups[g].inverted = various[g % 4].inverted;
                    this.groups[g].divergent = various[g % 4].divergent;
                }
            }

            for (let g = 0; g < this.groupCount; g++) {
                this.groups[g].initNumbers();
            }

            const groupNumberPairs = [];
            if (this.collateGroups && this.groupCount > 1) {
                for (let i = 0; i < this.groups[0].size; i++) {
                    for (let g = 0; g < this.groupCount; g++) {
                        const number = this.groups[g].next().value;
                        if (typeof number !== 'undefined') {
                            groupNumberPairs.push([g, number]);
                        }
                    }
                }
            } else {
                for (let g = 0; g < this.groupCount; g++) {
                    for (const number of this.groups[g]) {
                        groupNumberPairs.push([g, number]);
                    }
                }
            }

            const cells = [];
            let orderIndex = 0;
            for (const [g, number] of groupNumberPairs) {
                let cell = new Cell(number, orderIndex++);
                cell.group = g;
                cell.symbol = String(number + this.nOffset);
                if (this.leftRightClick) {
                    cell.rightClick = Math.random() > 0.5;
                }
                cells.push(cell);
            }

            if (this.frenzyMode) {
                // hide all cells except those which should be shown by frenzy
                for (let i = this.frenzyCount; i < cells.length; i++) {
                    cells[i].opacity = 0;
                }
                if (this.frenzyCount == 1) {
                    cells[0].opacity = 0;
                    cells[0].isReact = true;
                }
            }

            if (this.mathMode) {
                // generate list of numbers
                let numberList = [[0, '0']];
                const integerMax = Math.floor(
                    (this.gridSize * this.gridSize) / 2,
                );
                for (let i = 1; i <= integerMax; i++) {
                    numberList.push([i, i + '']);
                    numberList.push([-i, '-' + i]);
                }
                const fractionMax = Math.max(9, 2 * this.gridSize);
                for (let i = 2; i <= fractionMax; i++) {
                    numberList.push([1 / i, '1/' + i]);
                    numberList.push([-1 / i, '-1/' + i]);
                    if (i > 2) {
                        numberList.push([1 - 1 / i, i - 1 + '/' + i]);
                        numberList.push([-1 + 1 / i, '-' + (i - 1) + '/' + i]);
                    }
                }
                for (let i = 3; i <= integerMax; i += 2) {
                    numberList.push([i / 2, i + '/2']);
                    numberList.push([-i / 2, '-' + i + '/2']);
                }
                if (this.gridSize >= 5) {
                    numberList.push([2.71828, 'e']);
                    numberList.push([-2.71828, '-e']);
                    numberList.push([3.14159, 'π']);
                    numberList.push([-3.14159, '-π']);
                    numberList.push([6.28318, '2π']);
                    numberList.push([-6.28318, '-2π']);
                }

                // choose random values
                for (let i = 0; i < numberList.length; i++) {
                    const other =
                        i + Math.floor(Math.random() * (numberList.length - i));
                    if (other != i) {
                        const temp = numberList[i];
                        numberList[i] = numberList[other];
                        numberList[other] = temp;
                    }
                }
                numberList = numberList.slice(0, this.gridSize * this.gridSize);
                function comparePairs(a, b) {
                    return a[0] - b[0];
                }
                numberList.sort(comparePairs);

                // set cells' symbols to those values
                for (let i = 0; i < cellCount; i++) {
                    cells[i].symbol = String(
                        numberList[cells[i].number - 1][1],
                    );
                }
            } else if (this.lettersMode) {
                // set cells' symbols to those values
                for (let i = 0; i < cellCount; i++) {
                    cells[i].symbol = String.fromCharCode(cells[i].number + 64);
                }
            }

            // avoids rendering before all cells are ready
            this.cells = cells;
        },
        shuffleCells() {
            for (let i = 0; i < this.cells.length; i++) {
                const other =
                    i + Math.floor(Math.random() * (this.cells.length - i));
                if (other != i) {
                    const temp = this.cells[i];
                    this.cells[i] = this.cells[other];
                    this.cells[other] = temp;
                }
            }
        },
        hideSelect() {
            this.showClickAnimation = false;
        },
        gameTimerOut() {
            this.stopGame();
            clearTimeout(this.gameTimerId);
            this.execDialog('stats');
        },
        execDialog(tabName) {
            this.stopGame();
            this.changeDialogTab(tabName);
            this.stats.stopTime = performance.now();
            this.dialogShowed = true;
            this.stopMouseTracking();
        },
        changeDialogTab(tabName) {
            this.statsTabVisible = false;
            this.settingsTabVisible = false;
            this.mousemapTabVisible = false;

            if (tabName === 'stats') {
                this.statsTabVisible = true;
            } else if (tabName === 'mousemap') {
                this.mousemapTabVisible = true; // see 'updated' section
            } else {
                this.settingsTabVisible = true;
            }
        },
        onEsc() {
            if (this.betweenRounds) {
                this.startNextRound();
            } else if (this.dialogShowed) {
                this.hideDialog();
            } else {
                this.execDialog('settings');
            }
        },
        onSpace() {
            this.dialogShowed = false;
            if (this.betweenRounds) {
                this.startNextRound();
            } else {
                this.startGame();
            }
        },
        hideDialog() {
            this.dialogShowed = false;
            if (!this.gameStarted) {
                this.startGame();
            } else {
                this.restartMouseTracking();
            }
        },
        updateSymbolSpins() {
            for (let i = 0; i < this.cells.length; i++) {
                this.cells[i].cssClasses['spin-left'] = false;
                this.cells[i].cssClasses['spin-right'] = false;
                if (this.spinSymbols) {
                    const rnd = Math.floor(Math.random() * 2);
                    if (rnd === 0) {
                        this.cells[i].cssClasses['spin-left'] = true;
                    } else {
                        this.cells[i].cssClasses['spin-right'] = true;
                    }
                }
            }
        },
        updateSymbolTurns() {
            for (let i = 0; i < this.cells.length; i++) {
                this.cells[i].cssClasses['rotate-90'] = false;
                this.cells[i].cssClasses['rotate-180'] = false;
                this.cells[i].cssClasses['rotate-270'] = false;
                if (this.turnSymbols) {
                    const rnd = Math.floor(Math.random() * 4);
                    switch (rnd) {
                        case 0:
                            this.cells[i].cssClasses['rotate-90'] = true;
                            break;
                        case 1:
                            this.cells[i].cssClasses['rotate-180'] = true;
                            break;
                        case 2:
                            this.cells[i].cssClasses['rotate-270'] = true;
                            break;
                        default:
                        // no turn
                    }
                }
            }
        },
        updateUnderlines() {
            if (!(this.turnSymbols || this.spinSymbols || this.spinTable))
                return;
            for (let i = 0; i < this.cells.length; i++) {
                const digits = Array(...String(this.cells[i].symbol));
                for (let j = 0; j < digits.length; j++) {
                    if (digits[j] === '6') {
                        digits[j] = '<u>6</u>';
                    }
                }
                this.cells[i].symbol = digits.join('');
            }
        },
        updateColorStyles() {
            if (this.originalColors) {
                this.groupColorStyles = this.originalGroupColorStyles;
            } else {
                this.groupColorStyles = this.newGroupColorStyles;
            }
        },
        category() {
            // things ignored: collate; original colors; show hover; show click result; show center dot
            let category = this.gridSize + 'x' + this.gridSize;
            if (this.roundCount > 1) {
                category += ' ' + this.roundCount + 'r';
                category += this.roundBreaks ? 'b' : '';
            }
            if (this.groupCount > 1) {
                category += ' ' + this.groupCount + 'c';
            }
            if (this.variousCounts) {
                category += ' Various';
            } else {
                if (this.inverseCount) category += ' Inverse';
                if (this.divergentCount) category += ' Divergent';
            }
            if (this.shuffleSymbols) {
                category += ' Shuffle';
            }
            if (this.spinSymbols) {
                category += ' Spin';
            } else if (this.turnSymbols) {
                category += ' Turn';
            }
            if (this.spinTable) {
                category += ' Ts';
                if (this.spinTableSpeed === 'speed1') category += 'L';
                if (this.spinTableSpeed === 'speed2') category += 'M';
                if (this.spinTableSpeed === 'speed3') category += 'H';
                if (this.spinTableSpeed === 'speed4') category += 'CL';
                if (this.spinTableSpeed === 'speed5') category += 'CM';
                if (this.spinTableSpeed === 'speed6') category += 'CH';
            }
            if (this.noErrors) {
                category += ' NE';
            }
            if (this.frenzyMode) {
                if (this.frenzyCount == 1) {
                    category += ' React';
                } else {
                    category += ' Frenzy ' + this.frenzyCount;
                }
            } else if (this.blindMode) {
                category += ' Blind';
            }
            if (this.hoverMode) {
                category += ' Hover';
            }
            if (!this.showTrace) {
                category += ' -SC';
            }
            if (!this.clearCorrect) {
                category += ' -EC';
            }
            if (this.startOnClick) {
                category += ' ST';
            }
            if (this.flashlightMode) {
                category += ' FL';
            }
            if (this.leftRightClick) {
                category += ' LR';
            }
            if (this.nOffset !== 0) {
                category += ' Offset ' + String(this.nOffset);
            }
            if (this.mathMode) {
                category += ' Math';
            }
            if (this.lettersMode) {
                category += ' Letters';
            }
            return category;
        },
        startMouseTracking() {
            this.mouseMoves.length = 0;
            this.mouseClicks.length = 0;
            this.mouseTracking = true;
        },
        restartMouseTracking() {
            this.mouseTracking = true;
        },
        stopMouseTracking() {
            this.mouseTracking = false;
        },
        appendMouseMove(event) {
            if (
                this.flashlightMode &&
                !(this.blindMode && this.stats.correctClicks >= 1)
            ) {
                const x = event.x;
                const y = event.y;
                for (let i = 0; i < this.gridSize * this.gridSize; i++) {
                    const cell = this.cells[i];
                    if (
                        this.frenzyMode &&
                        (cell.orderIndex < this.currOrderIndex ||
                            this.currOrderIndex + this.frenzyCount - 1 <
                                cell.orderIndex)
                    ) {
                        continue;
                    }
                    const elem = document.getElementById(`cell-${i}`);
                    const rect = elem.getBoundingClientRect();
                    const cellMidX = rect.x + rect.width / 2;
                    const cellMidY = rect.y + rect.height / 2;
                    const dist = Math.sqrt(
                        (cellMidX - x) * (cellMidX - x) +
                            (cellMidY - y) * (cellMidY - y),
                    );

                    let opacity =
                        (this.tableSize * 0.35 - dist) / (this.tableSize * 0.1);
                    if (opacity > 1) opacity = 1;
                    if (opacity < 0.5) opacity = 0;
                    cell.opacity = opacity;
                }
            }
            if (this.mouseTracking) {
                const shiftX = (window.innerWidth - this.tableWidth) / 2;
                const shiftY = (window.innerHeight - this.tableHeight) / 2;
                const nx = (event.clientX - shiftX) / this.tableWidth; // normalize in range [0, 1]
                const ny = (event.clientY - shiftY) / this.tableHeight; // normalize in range [0, 1]
                this.mouseMoves.push(new Point(nx, ny));
            }
        },
        appendMouseClick(event) {
            if (!this.mouseTracking) {
                return;
            }
            const shiftX = (window.innerWidth - this.tableWidth) / 2;
            const shiftY = (window.innerHeight - this.tableHeight) / 2;
            const nx = (event.clientX - shiftX) / this.tableWidth; // normalize in range [0, 1]
            const ny = (event.clientY - shiftY) / this.tableHeight; // normalize in range [0, 1]
            this.mouseClicks.push(
                new Click(nx, ny, this.isCellCorrect(this.clickIndex)),
            );
        },
        drawRoundGraph() {
            const canvas = this.$refs['roundGraphCanvas'];
            if (!canvas) {
                return;
            }
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            const { width, height } = canvas;

            const roundTimes = this.stats.rounds.map((r) => r.duration);
            const rounds = roundTimes.length;
            const min = roundTimes.reduce((r, t) => Math.min(r, t));
            const tMin = 50 * (Math.floor(min / 50) - 1);
            const max = roundTimes.reduce((r, t) => Math.max(r, t));
            const tMax = 50 * (Math.ceil(max / 50) + 1);
            const tAvg = roundTimes.reduce((a, b) => a + b) / rounds;

            const x0 = 20 + Math.max(Math.floor(Math.log10(tMax) * 4), 4);
            const y0 = 10;
            const gWidth = width - x0;
            const gHeight = height - y0 * 2;
            ctx.clearRect(0, 0, width, height);

            // axes
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'black';
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x0, y0 + gHeight);
            ctx.lineTo(x0 + gWidth, y0 + gHeight);
            ctx.stroke();

            // vertical axis labels
            const tLabels = 5;
            const tMinY = y0 + gHeight - 6;
            const tMaxY = y0 + 6;
            const dt = (tMax - tMin) / (tLabels - 1);
            const dy = (tMaxY - tMinY) / (tLabels - 1);

            ctx.textBaseline = 'middle';
            ctx.textAlign = 'end';
            for (let i = 0; i < tLabels; i++) {
                let text = (Math.floor(tMin + i * dt) / 1000).toString();
                text = text.includes('.') ? text : text + '.';
                const trailingZeros = Math.max(
                    0,
                    3 - (text.length - 1 - text.indexOf('.')),
                );
                text = text + '0'.repeat(trailingZeros);
                ctx.fillText(text, x0 - 4, tMinY + i * dy);
            }

            const yForT = (t) =>
                4 + gHeight - ((t - tMin) / (tMax - tMin)) * (tMinY - tMaxY);

            // average line
            const tAvgY = yForT(tAvg);
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(x0, tAvgY);
            ctx.lineTo(x0 + gWidth, tAvgY);
            ctx.stroke();

            // graph lines
            const px0 = x0 + 10;
            const dx = (gWidth - 20) / (rounds - 1);
            const points = [];
            ctx.setLineDash([0, 0]);
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'blue';
            ctx.fillStyle = 'blue';
            roundTimes.forEach((time, i) => {
                const x = px0 + i * dx;
                const y = yForT(time);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                points.push([x, y]);
            });
            ctx.stroke();

            // graph points
            if (points.length <= 50) {
                const r = rounds <= 10 ? 4 : 2;
                points.forEach(([x, y]) => {
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.fill();
                });
            }
        },
        drawMousemap() {
            const canvas = this.$refs['mousemap_canvas']; // if mousemapTab visible
            if (!canvas) {
                return;
            }
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // clear canvas
                const W = canvas.width;
                const H = canvas.height;
                ctx.fillStyle = 'white';
                ctx.clearRect(0, 0, W, H);

                this.drawMousemapGrid(ctx, W, H);
                this.drawMousemapMoves(ctx, W, H);
                this.drawMousemapClicks(ctx, W, H);
            }
        },
        drawMousemapGrid(ctx, W, H) {
            if (!ctx || this.gridSize < 1) {
                return;
            }

            const rowH = H / this.gridSize;
            const colW = W / this.gridSize;
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 1; i < this.gridSize; i++) {
                ctx.moveTo(i * colW, 0);
                ctx.lineTo(i * colW, H);
                ctx.moveTo(0, i * rowH);
                ctx.lineTo(W, i * rowH);
            }
            ctx.stroke();
            ctx.closePath();
        },
        drawMousemapMoves(ctx, W, H) {
            if (!ctx) {
                return;
            }

            ctx.beginPath();
            ctx.strokeStyle = '#1f6ef7'; //'#f78383';
            ctx.lineWidth = 2;
            for (let i = 0; i + 1 < this.mouseMoves.length; i++) {
                const x0 = this.mouseMoves[i].x * W;
                const y0 = this.mouseMoves[i].y * H;
                const x1 = this.mouseMoves[i + 1].x * W;
                const y1 = this.mouseMoves[i + 1].y * H;
                ctx.moveTo(x0, y0);
                ctx.lineTo(x1, y1);
            }
            ctx.stroke();
            ctx.closePath();
        },
        drawMousemapClicks(ctx, W, H) {
            if (!ctx) {
                return;
            }

            ctx.lineWidth = 2;
            const radius = 5;
            for (let i = 0; i < this.mouseClicks.length; i++) {
                const centerX = this.mouseClicks[i].x * W;
                const centerY = this.mouseClicks[i].y * H;
                ctx.beginPath();
                if (this.mouseClicks[i].correct) {
                    ctx.fillStyle = '#52a352'; //'#6ac46a';
                    ctx.strokeStyle = '#52a352';
                } else {
                    ctx.fillStyle = '#ba2a29'; //'#f44f4d';
                    ctx.strokeStyle = '#ba2a29';
                }
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.stroke();
                ctx.closePath();
            }
        },
    },
});
