const PB_KEY = 'schulte-pbs';

class Cell {
    constructor(number) {
        this.number = number;
        this.symbol = String(number);
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
        this.colorStyle = 'black';
    }
}

class Group {
    constructor(size) {
        this.size = size;
        this.currNum = 1;
        this.inverted = false;
        this.divergent = false;
    }

    firstNumber() {
        if (this.inverted && !this.divergent) {
            return this.size;
        } else if (this.divergent && !this.inverted) {
            return Math.floor(this.size / 2);
        } else {
            return 1;
        }
    }

    lastNumber() {
        if (!this.inverted) {
            return this.size;
        } else if (this.divergent) {
            return Math.floor(this.size / 2) + 1;
        } else {
            return 1;
        }
    }

    nextNumber(currNum = this.currNum) {
        if (!this.divergent && !this.inverted) {
            return currNum + 1;
        } else if (!this.divergent) {
            return currNum - 1;
        } else {
            const h = Math.floor(this.size / 2);
            if (this.inverted) {
                if (currNum <= h) {
                    return this.size - currNum + 1;
                } else {
                    // currNum > h
                    return 2 + (this.size - currNum);
                }
            } else {
                const evenSize = 2 * h;
                if (currNum == evenSize) {
                    return evenSize + 1;
                } else if (currNum <= h) {
                    return evenSize - currNum + 1;
                } else {
                    return evenSize - currNum;
                }
            }
        }
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
    const millis = Math.floor(diff % 1000);
    diff = diff / 1000;
    const seconds = Math.floor(diff % 60);
    diff = diff / 60;
    const minutes = Math.floor(diff);

    return (
        minutes +
        ':' +
        ('0' + seconds).slice(-2) +
        '.' +
        ('00' + millis).slice(-3)
    );
}

var appData = {
    maxGridSize: 30,
    maxFrenzyCount: 6,

    gridSize: 5,
    gridRange: [],
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
    timerMode: false,
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
    goalList: [[0, 1]],
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
    /** @type {Point[]} */
    mouseMoves: [],
    /** @type {Click[]} */
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
        /** @type {ClickStats[]} */
        clicks: [],
        /** @type {RoundStats[]} */
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
        roundCount(val) {
            this.roundCount = parseInt(val);
        },
        flashlightMode(val) {
            if (!val) {
                for (let i = 0; i < this.gridSize * this.gridSize; i++) {
                    const elem = document.getElementById(`cell-${i}`);
                    elem.style.opacity = "1";
                }
            }
        },
        gridSize(val) {
            if (typeof val === 'string') {
                val = parseInt(val);
            }

            this.setCSSVar('--grid-size', this.gridSize);

            this.initGame();
        },
        rounds(val) {
            if (typeof val === 'string') {
                val = parseInt(val);
            }

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
    computed: {
        clickedCell() {
            return this.clickIndex;
        },
        hoveredCell: {
            get() {
                return this.hoverIndex;
            },
            set(cellIdx) {
                this.hoverIndex = cellIdx;
            },
        },
    },
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
            if (this.showHover && this.hoveredCell == i) {
                classes['hovered-cell'] = true;
            }

            // apply click state
            if (this.showClickAnimation && this.clickedCell == i) {
                if (i == this.correctIndex) {
                    classes['correct-cell'] = true;
                } else if (!(this.frenzyMode && this.frenzyCount == 1) && !this.hoverMode) {
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
            if (this.showTransitions && !this.shuffleSymbols && !(this.frenzyMode && this.frenzyCount == 1) && !this.leftRightClick) {
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
            this.setTableMargin(50);
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
        },
        startGame() {
            this.initGame();
            if (this.timerMode) {
                clearTimeout(this.gameTimerId);
                this.gameTimerId = setTimeout(
                    this.gameTimerOut,
                    this.timerMinutes * 60 * 1000,
                );
            }
            this.startMouseTracking();
            this.gameStarted = true;
        },
        setTableMargin(margin) {
            document.getElementsByTagName('body')[0].style.margin =
                `${margin}px`;
            this.tableWidth = this.tableSize;
            this.tableHeight = this.tableSize;
            this.cellFontSize =
                (parseInt(this.tableSize) * this.fontSize) / this.gridSize / 133;
        },
        breakBetweenRounds() {
            this.stats.stopTime = performance.now();
            this.stats.endRound();
            this.betweenRounds = true;
            this.stopMouseTracking();
            for (let i = 0; i < this.cells.length; i++) {
                this.cells[i].colorStyle = 'transparent';
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
        },
        setHoveredCell(cellIdx, event) {
            this.hoveredCell = cellIdx;
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
                    this.cells[this.clickIndex].colorStyle = 'transparent';
                }
                if (this.frenzyMode) {
                    this.cells[this.clickIndex].colorStyle = 'transparent';
                    if (this.frenzyCount == 1) {
                        this.cells[this.clickIndex].isReact = false;
                    }
                    const nextGoal = Math.min(
                        this.cells.length - 1,
                        this.stats.correctClicks +
                            parseInt(this.frenzyCount) -
                            1,
                    );
                    for (let i = 0; i < this.cells.length; i++) {
                        if (
                            this.cells[i].group == this.goalList[nextGoal][0] &&
                            this.cells[i].number == this.goalList[nextGoal][1]
                        ) {
                            if (!(this.frenzyCount == 1 && this.hideReact)) {
                                this.cells[i].colorStyle =
                                    this.groupColorStyles[this.cells[i].group];
                            }
                            if (this.frenzyCount == 1) {
                                this.cells[i].isReact = true;
                            }
                        }
                    }
                }
                if (this.blindMode) {
                    if (this.stats.correctClicks == 1) {
                        for (let i = 0; i < this.cells.length; i++) {
                            this.cells[i].colorStyle = 'transparent';
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

                if (this.timerMode) {
                    if (
                        this.stats.correctClicks > 0 &&
                        this.stats.correctClicks % this.cells.length === 0
                    ) {
                        this.initTable(); // jump to next table
                    } else {
                        this.nextNum();
                    }
                } else {
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
                        this.nextNum();
                    }
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
                    this.cells[this.clickIndex].colorStyle =
                        this.groupColorStyles[
                            this.cells[this.clickIndex].group
                        ];
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
            return (
                this.cells[cellIdx].group === this.currGroup &&
                this.cells[cellIdx].number ===
                    this.groups[this.currGroup].currNum
            );
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
        nextNum() {
            const isLast =
                this.groups[this.currGroup].lastNumber() ==
                this.groups[this.currGroup].currNum;
            this.groups[this.currGroup].currNum =
                this.groups[this.currGroup].nextNumber();

            if (isLast || this.collateGroups) {
                this.nextGroup();
            }
        },
        nextGroup() {
            this.currGroup = (this.currGroup + 1) % this.groupCount; // round it
        },
        groupRange(groupIdx) {
            if (groupIdx >= 0 && groupIdx < this.groups.length) {
                if (this.groups[groupIdx].divergent) {
                    const h = Math.floor(this.groups[groupIdx].size / 2);
                    if (this.groups[groupIdx].inverted) {
                        return (
                            '1&rarr;|' + '&larr;' + this.groups[groupIdx].size
                        );
                    } else {
                        return '&larr;' + h + '|' + (h + 1) + '&rarr;';
                    }
                } else {
                    if (this.groups[groupIdx].inverted) {
                        return this.groups[groupIdx].size + '&rarr;1';
                    } else {
                        return '1&rarr;' + this.groups[groupIdx].size;
                    }
                }
            }
            return '?..?';
        },
        tracedCell(cellIdx) {
            return this.cells[cellIdx].traced;
        },
        makeRange(begin, end) {
            //range = Array.from({length: val}, (v, k) => k);
            const range = [];
            for (let i = begin; i <= end; i++) {
                range.push(i);
            }
            return range;
        },
        makeGridCells() {
            this.groups.length = 0;
            const cellCount = this.gridSize * this.gridSize;
            this.gridRange = this.makeRange(0, this.gridSize - 1);
            const numsInGroup = Math.floor(cellCount / this.groupCount);
            for (let g = 0; g < this.groupCount; g++) {
                this.groups.push(new Group(numsInGroup));
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
            } else {
                for (let g = 0; g < this.groupCount; g++) {
                    this.groups[g].divergent = this.divergentCount;
                    this.groups[g].inverted = this.inverseCount;
                }
            }
            for (let g = 0; g < this.groupCount; g++) {
                this.groups[g].currNum = this.groups[g].firstNumber();
            }

            const range = [];
            for (let g = 0; g < this.groupCount; g++) {
                for (let i = 1; i <= this.groups[g].size; i++) {
                    let cell = new Cell(i);
                    cell.group = g;
                    if (!isNaN(parseInt(this.nOffset))) {
                        cell.symbol = String(
                            cell.number + parseInt(this.nOffset),
                        );
                    }
                    cell.colorStyle = this.groupColorStyles[g];
                    if (this.leftRightClick) {
                        cell.rightClick = Math.random() > 0.5;
                    }
                    range.push(cell);
                }
            }
            this.cells = range;

            if (this.frenzyMode) {
                // generate goal list
                this.goalList = [[0, this.groups[0].currNum]];
                const groupNums = [];
                for (let g = 0; g < this.groupCount; g++) {
                    groupNums[g] = this.groups[g].currNum;
                }
                for (let i = 0; i < this.gridSize * this.gridSize - 1; i++) {
                    // code to compute next goal - taken from nextNum() and nextGroup()
                    let thisGroup = this.goalList[i][0],
                        thisNum = this.goalList[i][1];
                    const isLast =
                        this.groups[thisGroup].lastNumber() == thisNum;
                    groupNums[thisGroup] =
                        this.groups[thisGroup].nextNumber(thisNum);
                    if (isLast || this.collateGroups) {
                        thisGroup = (thisGroup + 1) % this.groupCount;
                    }
                    this.goalList.push([thisGroup, groupNums[thisGroup]]);
                }

                // hide all cells
                for (let i = 0; i < cellCount; i++) {
                    this.cells[i].colorStyle = 'transparent';
                }

                // unhide cells which should be shown
                for (let i = 0; i < this.frenzyCount; i++) {
                    for (let g = 0; g < cellCount; g++) {
                        if (
                            this.cells[g].group == this.goalList[i][0] &&
                            this.cells[g].number == this.goalList[i][1]
                        ) {
                            if (!(this.frenzyCount == 1 && this.hideReact)) {
                                this.cells[i].colorStyle =
                                    this.groupColorStyles[this.cells[i].group];
                            }
                            if (this.frenzyCount == 1) {
                                this.cells[g].isReact = true;
                            }
                        }
                    }
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
                    this.cells[i].symbol = String(
                        numberList[this.cells[i].number - 1][1],
                    );
                }
            } else if (this.lettersMode) {
                // set cells' symbols to those values
                for (let i = 0; i < cellCount; i++) {
                    this.cells[i].symbol = String.fromCharCode(
                        this.cells[i].number + 64,
                    );
                }
            }
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
        changeGridSize(event) {
            const val = parseInt(event.target.value);
            if (!isNaN(val) && val >= 2 && val <= 9) {
                this.gridSize = val;
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
            const confusing = new Set('689');
            for (let i = 0; i < this.cells.length; i++) {
                const digits = new Set(String(this.cells[i].number));
                if (digits.isSubsetOf(confusing)) {
                    this.cells[i].cssClasses['underline'] = true;
                }
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
            if (!isNaN(parseInt(this.nOffset)) && parseInt(this.nOffset) != 0) {
                category += ' Offset ' + parseInt(this.nOffset);
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
            if (this.flashlightMode) {
                const x = event.x;
                const y = event.y;
                for (let i = 0; i < this.gridSize * this.gridSize; i++) {
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
                    elem.style.opacity = String(opacity);
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
