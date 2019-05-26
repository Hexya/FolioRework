import {TweenMax} from "gsap";

export default class MouseWheel {

    constructor(goToIndex,index) {


        this.index = index;
        this.scrolls = [];
        this.duration = .5;
        this.delay = 0;

        this.goToIndex = goToIndex;
        this.render();
        this.addEvents();
    }

    //SCROLL
    addEvents() {
        document.querySelector('.gsap-btn').addEventListener('click',this.onNextClick.bind(this));
        document.querySelector('.gsap-btn-back').addEventListener('click',this.onPrevClick.bind(this));
        window.addEventListener('mousewheel', this.mouseWheel.bind(this));
    }

    onNextClick() {
        const index = (this.index + 1) %6;//NUMBER OF STEP
        this.goToIndex(index);
    }
    onPrevClick() {
        let index = (this.index - 1) %6;//NUMBER OF STEP
        if(index == -1) {
            index = this.index + 5;
        }
        this.goToIndex(index);
    }

    mouseWheels(e) {
        //console.log(this.timerStep)
        if(this.timerStep == 1) {
            setTimeout(()=>{
                this.timerStep = 0;
            }, 500)
        }
        if(this.timerStep == 0) {
            if ( e.deltaY > 0 ) {
                this.onNextClick()
                console.log('next')
            } else if ( e.deltaY <= 0 ) {
                this.onPrevClick()
                console.log('prev')
            }
            this.timerStep = 1
        }
    }

    next() {
        window.clearTimeout(this.carouselTimeout);

        this.animating = true;
        this.startCarouselTimeout();

        const add = Math.max(0, 1.52 - this.duration);
        const delay = this.scrolls.length > 5 ? add : this.delay; //25
        TweenMax.delayedCall(delay, () => {
            this.animating = false;
            this.scrolls = [];
        })
    }

    startCarouselTimeout() {
        this.carouselTimeout = setTimeout(() => {
            this.onNextClick()
            console.log('Next');
        }, 50)
    }

    previous() {
        window.clearTimeout(this.carouselTimeout);

        this.animating = true;
        this.backCarouselTimeout();

        const add = Math.max(0, 1.52 - this.duration);
        const delay = this.scrolls.length > 5 ? add : this.delay; //25
        TweenMax.delayedCall(delay, () => {
            this.animating = false;
            this.scrolls = [];
        })
    }

    backCarouselTimeout() {
        this.carouselTimeout = setTimeout(() => {
            this.onPrevClick()
            console.log('prev');
        }, 50)
    }

    mouseWheel(event) {
        const delta = event.deltaY

        if (!this.animating) {
            if (delta > 0) {
                this.next()
            } else if (delta < 0) {
                this.previous()
            }
        }

        this.scrolls.push(this.scrolls.length)
    }

    render() {
    }
}